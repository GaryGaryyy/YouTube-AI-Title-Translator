const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime, title, aiSettings, settle} = require('./runtime-harness');

// 审查时补的三处：语言检测不能拖住页面扫描、扫描期间的触发不能丢、清缓存不能被在途写入复活。
const spanish = 'Cómo preparar deliciosas recetas caseras';
const hangingDetector = { create: () => new Promise(() => {}) };
const requests = runtime => runtime.messages.filter(msg => msg.type === 'translateBatch');
const badges = item => item.parent.querySelectorAll().length;
function addTitle(runtime, text) {
    const item = title(text); runtime.titles.push(item.el); return item;
}
// 测试脚手架把定时器收集起来不自动执行，这里手动触发当前已登记的全部定时器。
function runTimers(runtime) {
    const pending = [...runtime.timers.values()];
    runtime.timers.clear();
    pending.forEach(fn => fn());
}

test('语言检测一直不返回时，超时后照常翻译，不卡住这一轮扫描', async () => {
    const runtime = createRuntime('content.js', {stored: aiSettings(), extra: {LanguageDetector: hangingDetector}});
    const item = addTitle(runtime, spanish);
    const scan = runtime.api.process();
    await settle();
    assert.equal(requests(runtime).length, 0);
    runTimers(runtime);
    await scan; await settle();
    assert.equal(requests(runtime).length, 1);
    assert.equal(badges(item), 1);
});

test('扫描等待语言检测期间到来的触发会在结束后补扫，新标题不会被漏掉', async () => {
    const runtime = createRuntime('content.js', {stored: aiSettings(), extra: {LanguageDetector: hangingDetector}});
    await settle();
    addTitle(runtime, spanish);
    runTimers(runtime);                      // 首次扫描开始，停在语言检测上
    await settle();
    const late = addTitle(runtime, '美味しい家庭料理の作り方');
    runtime.context.scheduleProcess();       // 扫描进行中又来了一次滚动 / DOM 变化
    assert.equal(badges(late), 0);
    runTimers(runtime);                      // 检测超时，首次扫描结束
    await settle(); await settle();
    runTimers(runtime);                      // 结束后应已登记补扫
    await settle(); await settle();
    assert.equal(badges(late), 1);
});

test('检测结果带地区码（pt-BR）时按主语言判断为同语言', async () => {
    const detector = {create: async () => ({detect: async () => [{detectedLanguage: 'pt-BR', confidence: 0.95}]})};
    const runtime = createRuntime('content.js', {stored: aiSettings('pt'), extra: {LanguageDetector: detector}});
    const item = addTitle(runtime, 'Receita de bolo simples e deliciosa para fazer em casa');
    await runtime.api.process();
    assert.equal(item.el.getAttribute('data-gary-done'), 'skip');
    assert.equal(requests(runtime).length, 0);
});

const cacheEntry = (text, ts) => ['ai\nen\n' + text, {tag: '科技', translatedTitle: text, ...(ts ? {ts} : {})}];
const storedKeys = runtime => runtime.data.translationCache.entries.map(([key]) => key);
const userClear = runtime => runtime.change({translationCache: {oldValue: {v: 2, entries: []}}});

test('落盘途中清缓存：晚到的写入不让旧条目复活，清除后排队的新条目照常落盘', async () => {
    let finishFirstSet;
    const runtime = createRuntime('background.js', {setHandler(values, cb, chrome, data) {
        const apply = () => { Object.assign(data, structuredClone(values)); cb(); };
        if (finishFirstSet === undefined) finishFirstSet = apply; else apply();
    }});
    const stale = runtime.api.cachePut([cacheEntry('old')]);
    await settle();
    userClear(runtime);                                        // 用户清缓存先到
    const fresh = runtime.api.cachePut([cacheEntry('new')]);   // 清除后排队的新条目
    finishFirstSet();                                          // 在途的旧写入后到，把旧条目写回
    assert.equal((await stale).ok, true);
    assert.equal((await fresh).ok, true);
    assert.deepEqual(storedKeys(runtime), ['ai\nen\nnew']);
});

test('清缓存之前翻译、之后才送达的条目被拒收，之后翻译的照收', async () => {
    const runtime = createRuntime('background.js');
    await runtime.api.cachePut([cacheEntry('before')]);
    delete runtime.data.translationCache;
    userClear(runtime);
    await runtime.api.cachePut([cacheEntry('late-old', Date.now() - 60000), cacheEntry('after', Date.now() + 1000)]);
    assert.deepEqual(storedKeys(runtime), ['ai\nen\nafter']);
});

test('译文 badge 是链接，会被标题选择器再次选中：不能把它当成新标题重复翻译', async () => {
    const runtime = createRuntime('content.js', {stored: aiSettings('zh-Hans')});
    const item = addTitle(runtime, 'How to build a tiny house from scratch');
    await runtime.api.process(); await settle();
    const [badge] = item.parent.querySelectorAll();
    assert.equal(badge.tagName, 'A');
    for (let round = 0; round < 3; round++) {
        runtime.titles.push(...item.parent.querySelectorAll());   // 真实页面里 h3 a 会选中 badge
        await runtime.api.process(); await settle();
    }
    assert.equal(badges(item), 1);
    assert.equal(requests(runtime).length, 1);
});

test('清缓存后，迟到广播里的旧条目不会合并回页面内存；清除后的新条目照常合并', async () => {
    const runtime = createRuntime('content.js', {stored: aiSettings('en')});
    runtime.api.cacheSet('Old title', {tag: '科技', translatedTitle: '旧译文'}, 'en');
    runtime.change({translationCache: {oldValue: {v: 2, entries: []}}});
    assert.equal(runtime.api.cacheGet('Old title'), null);
    runtime.change({translationCache: {newValue: {v: 2, entries: [
        cacheEntry('Old title', Date.now() - 60000), cacheEntry('New title', Date.now() + 1000)]}}});
    assert.equal(runtime.api.cacheGet('Old title'), null);
    assert.equal(runtime.api.cacheGet('New title').translatedTitle, 'New title');
});

test('后台没确认落盘的增量会随下一次写入重发，不会悄悄丢掉', async () => {
    const runtime = createRuntime('content.js', {stored: aiSettings('en')});
    const sent = [];
    let ok = false;
    runtime.chrome.runtime.sendMessage = async msg => { sent.push(msg.entries.map(([key]) => key)); return {ok}; };
    runtime.api.cacheSet('First', {tag: '科技', translatedTitle: '第一条'}, 'en');
    await runtime.api.flushCacheWrites();
    ok = true;
    runtime.api.cacheSet('Second', {tag: '科技', translatedTitle: '第二条'}, 'en');
    await runtime.api.flushCacheWrites();
    await runtime.api.flushCacheWrites();
    assert.equal(sent.length, 2);
    assert.deepEqual([...sent[1]].sort(), ['ai\nen\nFirst', 'ai\nen\nSecond']);
});

test('等待语言检测期间别的标签页已翻好同一标题：检测结束后用缓存渲染，不重复请求', async () => {
    const runtime = createRuntime('content.js', {stored: aiSettings(), extra: {LanguageDetector: hangingDetector}});
    const item = addTitle(runtime, spanish);
    const scan = runtime.api.process();
    await settle();
    runtime.change({translationCache: {newValue: {v: 2, entries: [
        ['ai\nes\n' + spanish, {tag: '美食', translatedTitle: 'Otra pestaña ya lo tradujo', ts: Date.now()}]]}}});
    runTimers(runtime);
    await scan; await settle();
    assert.equal(requests(runtime).length, 0);
    assert.equal(badges(item), 1);
});

test('同一轮里先排好队的标题，在等其它标题检测期间被别的标签页翻好：派发前用缓存，不重复请求', async () => {
    // 第一条的检测立刻返回“不同语言”并排队，第二条的检测一直挂起，直到超时。
    let calls = 0;
    const detector = {create: async () => ({detect: () => (++calls === 1
        ? Promise.resolve([{detectedLanguage: 'fr', confidence: 0.99}]) : new Promise(() => {}))})};
    const runtime = createRuntime('content.js', {stored: aiSettings(), extra: {LanguageDetector: detector}});
    const first = addTitle(runtime, 'Comment faire du pain maison facilement');
    const second = addTitle(runtime, spanish);
    const scan = runtime.api.process();
    await settle();
    runtime.change({translationCache: {newValue: {v: 2, entries: [
        ['ai\nes\n' + first.el.textContent, {tag: '美食', translatedTitle: 'Cómo hacer pan casero', ts: Date.now()}]]}}});
    runTimers(runtime);
    await scan; await settle();
    const sentTexts = requests(runtime).flatMap(msg => msg.items);
    assert.deepEqual(sentTexts, [spanish]);
    assert.equal(badges(first), 1);
    assert.equal(first.parent.querySelectorAll()[0].dataset.garyState, 'done');
    assert.equal(badges(second), 1);
});

test('排队等待期间整张卡片被移出再插回：不会永久停在排队中，重新扫描后照常翻译', async () => {
    let calls = 0;
    const detector = {create: async () => ({detect: () => (++calls === 1
        ? Promise.resolve([{detectedLanguage: 'fr', confidence: 0.99}]) : new Promise(() => {}))})};
    const runtime = createRuntime('content.js', {stored: aiSettings(), extra: {LanguageDetector: detector}});
    const first = addTitle(runtime, 'Comment faire du pain maison facilement');
    addTitle(runtime, spanish);
    const scan = runtime.api.process();
    await settle();
    const [queued] = first.parent.querySelectorAll();
    first.el.isConnected = false; queued.isConnected = false;     // YouTube 把整张卡片移出文档
    runTimers(runtime);
    await scan; await settle();
    assert.equal(first.el.getAttribute('data-gary-done'), null);
    assert.equal(badges(first), 0);
    first.el.isConnected = true;                                   // 卡片插回
    const rescan = runtime.api.process();
    await settle();
    runTimers(runtime);                                            // 这次检测同样挂起，靠超时放行
    await rescan; await settle();
    assert.equal(badges(first), 1);
    assert.ok(requests(runtime).flatMap(msg => msg.items).includes(first.el.textContent));
});

test('命中过的旧条目随下一次写入告知后台，缓存满时按最近使用淘汰', async () => {
    const background = createRuntime('background.js', {stored: {translationCache: {v: 2, entries: [
        cacheEntry('oldest', 1), cacheEntry('second', 2)]}}});
    const tab = createRuntime('content.js', {stored: {...aiSettings('en'), translationCache: {v: 2, entries: [
        cacheEntry('oldest', 1), cacheEntry('second', 2)]}}});
    tab.chrome.runtime.sendMessage = msg => background.send(msg);
    assert.equal(tab.api.cacheGet('oldest').translatedTitle, 'oldest');     // 页面命中最旧的一条
    await tab.api.flushCacheWrites();
    assert.equal(background.writes.length, 0);                              // 只命中不写盘
    tab.api.cacheSet('newest', {tag: '科技', translatedTitle: 'newest'}, 'en');
    await tab.api.flushCacheWrites();
    assert.deepEqual(storedKeys(background), ['ai\nen\nsecond', 'ai\nen\noldest', 'ai\nen\nnewest']);
});

test('清缓存后才送达的命中记录只是 key：不会把已清除的旧条目带回来', async () => {
    const runtime = createRuntime('background.js');
    await runtime.api.cachePut([cacheEntry('hit-before-clear')]);
    delete runtime.data.translationCache;
    userClear(runtime);
    await runtime.send({type: 'cachePut', touched: ['ai\nen\nhit-before-clear', 42, 'ai\nen\nnever-existed'],
        entries: [cacheEntry('after-clear', Date.now() + 1000)]});
    assert.deepEqual(storedKeys(runtime), ['ai\nen\nafter-clear']);
});
