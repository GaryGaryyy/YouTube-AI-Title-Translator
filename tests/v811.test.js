const test = require('node:test');
const assert = require('node:assert/strict');
const { createRuntime, title, aiSettings, settle, source, plain, shardedEntries } = require('./runtime-harness');

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

const localSettings = { translationMode: 'local', targetLanguage: 'de', uiLanguage: 'en' };
const detector = language => ({ detect: async () => [{ detectedLanguage: language, confidence: 0.99 }] });
const translated = text => ({ tag: '科技', translatedTitle: text });
const chat = value => ({
    ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(value) } }] })
});
const translateRequest = (items, targetLanguage = 'es') => ({ type: 'translateBatch', items, targetLanguage });
function worker(fetch, stored = aiSettings()) {
    return createRuntime('background.js', { stored, extra: { AbortSignal, fetch } });
}
function localPage(LanguageDetector, translate = async text => 'Übersetzt: ' + text, stored = localSettings) {
    return createRuntime('content.js', {
        stored, extra: { LanguageDetector, Translator: { availability: async () => 'available', create: async () => ({ translate }) } }
    });
}
function addTitle(runtime, text) {
    const item = title(text);
    runtime.titles.push(item.el);
    return item;
}
const badge = item => item.parent.querySelectorAll()[0];
const badgeText = box => box.querySelector('.gary-cn-title').textContent;
const nextTurn = () => new Promise(resolve => setImmediate(resolve));
const notAllowed = () => Object.assign(new Error('Requires activation'), { name: 'NotAllowedError' });

for (const coldState of ['downloadable', 'downloading', 'NotAllowedError']) {
    test(`AC1 detector 冷启动 ${coldState}：同步点击创建，同屏标题自动补译`, async () => {
        let creates = 0;
        const download = deferred();
        const runtime = localPage({
            availability: async () => coldState === 'NotAllowedError' ? 'available' : coldState,
            create() {
                if (++creates === 1 && coldState === 'NotAllowedError') throw notAllowed();
                return download.promise;
            }
        });
        const items = ['First English title', 'Second English title'].map(text => addTitle(runtime, text));
        await runtime.api.process();
        await nextTurn();
        const boxes = items.map(badge);
        for (const [i, box] of boxes.entries()) {
            assert.notEqual(items[i].el.getAttribute('data-gary-done'), 'skip');
            assert.equal(box.dataset.garyState, 'download');
            assert.equal(box.dataset.garyDownloadKind, 'detector');
            assert.equal(badgeText(box), runtime.api.CONTENT_TEXT.en.downloadDetector);
        }
        const beforeClick = coldState === 'NotAllowedError' ? 1 : 0;
        assert.equal(creates, beforeClick);
        const click = boxes[0].fire('click', { metaKey: true, ctrlKey: true, shiftKey: true });
        assert.equal(creates, beforeClick + 1, 'create must run before the click handler yields');
        assert.equal(boxes[0].dataset.garyState, 'pending');
        assert.equal(await click, true);
        assert.equal(await boxes[1].fire('auxclick', { button: 1 }), true);
        assert.equal(creates, beforeClick + 1, 'download uses one detector instance');
        download.resolve(detector('en'));
        await nextTurn();
        for (const [i, box] of boxes.entries()) {
            assert.equal(box.dataset.garyState, 'done');
            assert.equal(badgeText(box), 'Übersetzt: ' + items[i].el.textContent);
        }
    });
}

test('AC1 detector 不可用引导设置；失败或返回 null 可点击重试；14 种文案皆有翻译', async () => {
    const unavailable = localPage({ availability: async () => 'unavailable', create: () => assert.fail('create called') });
    const item = addTitle(unavailable, 'English title');
    await unavailable.api.process();
    await nextTurn();
    assert.equal(badge(item), undefined);
    assert.equal(unavailable.document.body.children[0].children[0].textContent, unavailable.api.CONTENT_TEXT.en.setupUnavailable);
    assert.notEqual(item.el.getAttribute('data-gary-done'), 'skip');

    let creates = 0;
    const runtime = localPage({
        availability: async () => 'downloadable',
        async create() {
            switch (++creates) {
                case 1: throw notAllowed();
                case 2: return null;
                default: return detector('en');
            }
        }
    });
    const retry = addTitle(runtime, 'Retry English title');
    await runtime.api.process();
    await nextTurn();
    const box = badge(retry);
    for (const state of ['download', 'error', 'done']) {
        assert.equal(await box.fire('click', { shiftKey: true }), true);
        await nextTurn();
        assert.equal(box.dataset.garyState, state);
    }
    assert.equal(creates, 3);
    const packs = Object.values(runtime.api.CONTENT_TEXT);
    assert.equal(packs.length, 14);
    assert.equal(new Set(packs.map(pack => pack.downloadDetector)).size, 14);
    assert.ok(packs.every(pack => Object.hasOwn(pack, 'downloadDetector') && pack.downloadDetector.trim()));
});

test('AC2 部分批量响应只补译缺项，页面缓存与原文对应', async () => {
    const prompts = [];
    const runtime = worker(async (url, options) => {
        const prompt = JSON.parse(options.body).messages[1].content;
        prompts.push(prompt);
        if (prompt.includes('Input:')) return chat({ items: [{ i: 1, ...translated('Traducción B') }] });
        assert.match(prompt, /Original: "First title"/);
        return chat(translated('Traducción A'));
    });
    const page = createRuntime('content.js', { stored: aiSettings() });
    page.chrome.runtime.sendMessage = msg => runtime.send(msg);
    const items = ['First title', 'Second title'].map(text => addTitle(page, text));
    await page.api.process();
    await nextTurn();
    await page.api.flushCacheWrites();
    assert.equal(prompts.length, 2);
    assert.deepEqual(items.map(item => badgeText(badge(item))), ['Traducción A', 'Traducción B']);
    assert.deepEqual(shardedEntries(runtime.data).map(([key, value]) => [key.split('\n').at(-1), value.translatedTitle]),
        [['First title', 'Traducción A'], ['Second title', 'Traducción B']]);
});

test('AC2 拒绝重复、越界、非整数和冲突索引、裸数组长度不符及非法译文', async () => {
    const api = worker().api;
    const valid = { ...translated('válido') };
    assert.equal(api.findBatchResult([{ i: 1, ...valid }, valid], 0, 2), null);
    assert.equal(api.findBatchResult([{ i: 0, ...valid }, { index: 0, ...valid }], 0, 2), null);
    assert.equal(api.findBatchResult([{ i: 0, idx: 1, ...valid }], 0, 2), null);
    for (const i of [-1, 2, 0.5, '0', null]) {
        assert.equal(api.findBatchResult([{ i, ...valid }], 0, 2), null);
    }
    assert.equal(api.findBatchResult([valid], 0, 2), null);
    const conflictingKey = api.extractBatchArray({ 0: { i: 1, ...valid } }, 2);
    assert.equal(api.normalizeTranslationResult(api.findBatchResult(conflictingKey, 0, 2)), null);
    for (const value of [12, { text: 'x' }, ' \n ']) {
        assert.equal(api.normalizeTranslationResult({ translatedTitle: value }), null);
    }
    let fetches = 0;
    const runtime = worker(async () => {
        fetches++;
        return fetches === 1 ? chat([valid, valid]) : chat(translated('single'));
    });
    const result = await runtime.send(translateRequest(['Title A']));
    assert.equal(fetches, 2);
    assert.equal(result.results[0].translatedTitle, 'single');
});

test('AC3 三批各八条全部补译，27 次 HTTP 请求共用三个槽位', { timeout: 2000 }, async () => {
    let active = 0, peak = 0, batches = 0, singles = 0;
    const runtime = worker(async (url, options) => {
        active++;
        peak = Math.max(peak, active);
        await nextTurn();
        active--;
        const prompt = JSON.parse(options.body).messages[1].content;
        if (prompt.includes('Input:')) {
            batches++;
            return chat({ items: [] });
        }
        singles++;
        return chat(translated(JSON.parse(prompt.split('Original: ')[1]) + ' translated'));
    });
    const inputs = Array.from({ length: 3 }, (_, batch) =>
        Array.from({ length: 8 }, (_, index) => `Title ${batch}-${index}`));
    const replies = await Promise.all(inputs.map(items => runtime.send(translateRequest(items))));
    assert.equal(peak, 3);
    assert.equal(batches, 3);
    assert.equal(singles, 24);
    assert.deepEqual(plain(replies.map(reply => reply.results.map(item => item.translatedTitle))),
        inputs.map(items => items.map(text => text + ' translated')));
});

for (const header of ['7', new Date(Date.now() + 120000).toUTCString()]) {
    test(`AC3 429 Retry-After ${header} 生效，同主机自动请求冷却，显式验证可发请求`, async () => {
        let calls = 0;
        const runtime = worker(async () => ++calls === 1 ? {
            ok: false, status: 429, headers: { get: name => name === 'Retry-After' ? header : null },
            json: async () => ({ error: { message: 'unauthorized text can never override status 429' } })
        } : chat({ items: [{ i: 0, ...translated('Success') }] }));
        const limited = await runtime.send(translateRequest(['Title A', 'Title B']));
        const retryAfterMs = header === '7' ? 7000 : 60000;
        assert.equal(limited.error.type, 'quota');
        assert.equal(limited.error.detail.retryAfterMs, retryAfterMs);
        assert.equal(calls, 1);

        // The endpoint path can change while the hostname is still cooling down.
        runtime.data.providerConfigs.custom.apiUrl = 'https://example.test/other/path';
        const blocked = await runtime.send(translateRequest(['Title C']));
        assert.equal(blocked.error.type, 'quota');
        assert.ok(blocked.error.detail.retryAfterMs > 0 && blocked.error.detail.retryAfterMs <= retryAfterMs);
        assert.equal(calls, 1);

        const explicit = await runtime.send({ type: 'testTranslation', text: 'Title C', config: runtime.data.providerConfigs.custom });
        assert.equal(explicit.ok, true);
        assert.equal(calls, 2);
        runtime.data.providerConfigs.custom.apiUrl = 'https://other.test/chat/completions';
        assert.equal((await runtime.send(translateRequest(['Title C']))).ok, true);
        assert.equal(calls, 3);
    });
}

for (const mode of ['local', 'ai']) {
    test(`AC4 ${mode} 标题复用：旧回复不能渲染或清掉新标题的标记`, async () => {
        const old = deferred();
        const current = deferred();
        const translate = text => text === 'First video' ? old.promise : current.promise;
        const runtime = mode === 'local' ? localPage({ create: async () => detector('en') }, translate)
            : createRuntime('content.js', { stored: aiSettings() });
        if (mode === 'ai') {
            runtime.chrome.runtime.sendMessage = async msg => msg.type === 'cacheLookup' ? {ok:true,hits:[]}
                : { ok: true, results: [translated(await translate(msg.items[0]))] };
        }
        const item = addTitle(runtime, 'First video');
        await runtime.api.process();
        await nextTurn();
        const oldBox = badge(item);

        item.el.textContent = 'Second video';
        await runtime.api.process();
        await nextTurn();
        const newBox = badge(item);
        assert.notEqual(oldBox, newBox);
        assert.equal(newBox.dataset.garyState, 'pending');

        old.resolve('Old translation');
        await nextTurn();
        assert.equal(oldBox.isConnected, false);
        assert.equal(newBox.dataset.garyState, 'pending');
        assert.equal(item.el.getAttribute('data-gary-done'), 'true');
        assert.equal(item.el.dataset.garyOriginal, 'Second video');

        current.resolve('New translation');
        await nextTurn();
        assert.equal(badge(item), newBox);
        assert.equal(badgeText(newBox), 'New translation');
    });

    test(`AC4 ${mode} 旧 badge 仍连接时，晚到回复也不能渲染或清理新标记`, async () => {
        const pending = deferred();
        const runtime = mode === 'local' ? localPage({ create: async () => detector('en') }, () => pending.promise)
            : createRuntime('content.js', { stored: aiSettings() });
        if (mode === 'ai') {
            runtime.chrome.runtime.sendMessage = async msg => msg.type === 'cacheLookup' ? {ok:true,hits:[]}
                : { ok: true, results: [translated(await pending.promise)] };
        }
        const item = addTitle(runtime, 'Old video title');
        await runtime.api.process();
        await nextTurn();
        const oldBox = badge(item);
        item.el.textContent = 'New video title';
        item.el.dataset.garyOriginal = item.el.textContent;
        assert.equal(oldBox.isConnected, true);
        pending.resolve('Late translation');
        await nextTurn();
        assert.equal(oldBox.isConnected, false);
        assert.notEqual(badgeText(oldBox), 'Late translation');
        assert.equal(item.el.dataset.garyOriginal, 'New video title');
        assert.equal(item.el.getAttribute('data-gary-done'), 'true');
    });
}

test('AC4 本机检测完成前标题更新，旧检测不能挂载 badge', async () => {
    const detection = deferred();
    const runtime = localPage({ create: async () => ({ detect: () => detection.promise }) });
    const item = addTitle(runtime, 'Old video');
    await runtime.api.process();
    item.el.textContent = 'New video';
    detection.resolve([{ detectedLanguage: 'en' }]);
    await nextTurn();
    assert.equal(badge(item), undefined);
    await runtime.api.process();
    await nextTurn();
    assert.equal(badgeText(badge(item)), 'Übersetzt: New video');
});

test('AC5 区分短拉丁标题、简繁、中英混排和纯汉字日文', async () => {
    const page = createRuntime('content.js', { stored: aiSettings('en') });
    for (const text of ['Hola amigos', 'Merci beaucoup', 'Guten Tag']) {
        assert.equal(page.api.isLikelyEnglishTitle(text), false);
        assert.equal(page.api.needsAiLanguageDetection(text), true);
        addTitle(page, text);
    }
    await page.api.process();
    assert.deepEqual(page.messages.find(msg=>msg.type==='translateBatch').items, ['Hola amigos', 'Merci beaucoup', 'Guten Tag']);

    const simplified = '最新人工智能教程视频';
    const traditional = '最新人工智慧教學影片';
    page.api.applyConfigFromStorage(aiSettings('zh-Hant'));
    assert.equal(page.api.shouldTranslateTitle(simplified), false);
    assert.equal(page.api.shouldTranslateTitle(traditional), false);
    page.api.applyConfigFromStorage(aiSettings('zh-Hans'));
    assert.equal(page.api.shouldTranslateTitle(traditional), false);
    assert.equal(page.api.shouldTranslateTitle(simplified), false);
    assert.equal(page.api.shouldTranslateTitle('Apple花330億美金開發的VR銷量慘淡？Meta畫大餅的元宇宙竟翻車了？'), false);
    assert.equal(page.api.shouldTranslateTitle('哈哈😂😂，館長神模仿沈伯洋，網友快笑翻，叫你模仿，不是超越...'), false);
    assert.equal(page.api.shouldTranslateTitle('Learn 中文 in 30 Days Complete Course'), true);
    assert.equal(page.api.shouldTranslateTitle('iPhone 17 Pro 深度评测'), false);
    assert.equal(page.api.isSameLanguage('zh-CN', 'zh-Hant'), true);
    assert.equal(page.api.isSameLanguage('zh-TW', 'zh-Hans'), true);
    assert.equal(page.api.isSameLanguage('zh', 'zh-Hans', traditional), true);
    assert.equal(page.api.isSameLanguage('zh', 'zh-Hant', simplified), true);
    assert.equal(page.api.shouldTranslateTitle('教學视频'), false);

    const local = localPage({ create: async () => detector('ja') }, undefined, { ...localSettings, targetLanguage: 'zh-Hans' });
    for (const language of ['zh-Hans', 'zh-Hant']) {
        local.api.applyConfigFromStorage({ ...localSettings, targetLanguage: language });
        const japanese = addTitle(local, '東京旅行計画');
        await local.api.process();
        await nextTurn();
        assert.equal(badge(japanese).dataset.garyState, 'done');
    }

    const mixed = localPage({ create: async () => detector('zh') }, undefined, { ...localSettings, targetLanguage: 'zh-Hans' });
    mixed.context.Translator.availability = async ({ sourceLanguage }) => sourceLanguage === 'en' ? 'available' : 'unavailable';
    const english = addTitle(mixed, 'Learn 中文 in 30 Days Complete Course');
    await mixed.api.process();
    await nextTurn();
    assert.equal(badge(english).dataset.garyState, 'done');
});

function broadcastClear(runtime, page) {
    runtime.chrome.tabs.query = (_options, callback) => callback([{id:1}]);
    runtime.chrome.tabs.sendMessage = (_id, msg) => page.receive(msg);
}

for (const mode of ['local', 'ai']) {
    test(`AC6 ${mode} 在途翻译遇到 cacheClear：迟到译文不回写页面或后台`, async () => {
        let clock = 1000;
        const fakeDate = { now: () => clock };
        const started = deferred();
        const translation = deferred();
        const requestTitle = 'A video to translate';
        const runtime = createRuntime('background.js', {
            stored: aiSettings(),
            extra: { Date: fakeDate, AbortSignal, async fetch() {
                started.resolve();
                return chat({ items: [{ i: 0, ...translated(await translation.promise) }] });
            } }
        });
        const page = createRuntime('content.js', {
            stored: mode === 'ai' ? aiSettings() : localSettings,
            extra: { Date: fakeDate,
                LanguageDetector: { create: async () => detector('en') },
                Translator: { availability: async () => 'available', create: async () => ({ translate() {
                    started.resolve();
                    return translation.promise;
                } }) }
            }
        });
        broadcastClear(runtime, page);
        const requests = [];
        page.chrome.runtime.sendMessage = msg => { requests.push(msg.type); return runtime.send(msg); };
        const item = addTitle(page, requestTitle);
        await page.api.process();
        await started.promise;
        clock = 2000;
        assert.deepEqual(plain(await runtime.send({ type: 'cacheClear' })), { ok: true });
        clock = 3000;
        translation.resolve('Late translation');
        await nextTurn();
        await page.api.flushCacheWrites();
        assert.equal(badgeText(badge(item)), 'Late translation');
        assert.equal(page.api.cacheGet(requestTitle), null);
        assert.equal(requests.includes('cachePut'), false);
        assert.equal(runtime.data.translationCache, undefined);

        // Simulate a tab that has not yet received cacheCleared, after the worker has restarted.
        const restarted = createRuntime('background.js', { stored: runtime.data, extra: { Date: fakeDate } });
        const replay = [page.api.getCacheKey(requestTitle), { ...translated('Late translation'), ts: 3000, requestStartedAt: 1000 }];
        assert.equal((await restarted.send({ type: 'cachePut', entries: [replay] })).ok, true);
        assert.equal(restarted.data.translationCache, undefined);
        const newEntry = [page.api.getCacheKey('New title'), { ...translated('New translation'), ts: 3000, requestStartedAt: 3000 }];
        assert.equal((await restarted.send({ type: 'cachePut', entries: [newEntry] })).ok, true);
        assert.equal(restarted.data.translationCacheMeta.totalEntries, 1);
    });
}

test('AC6 模型和服务商切换均缓存未命中；消息与缓存键不带凭证', async () => {
    const initial = aiSettings('zh-Hans');
    const page = createRuntime('content.js', { stored: initial });
    const text = 'Model isolation video';
    const pending = [];
    page.chrome.runtime.sendMessage = async msg => {
        pending.push(plain(msg));
        if (msg.type === 'cachePut') return { ok: true };
        return { ok: true, results: [translated('Translated with ' + page.api.getActiveTranslationConfig(page.data).cacheScope)] };
    };
    for (const settings of [initial, { ...initial, customModel: 'model-b' }, { ...initial, selectedProvider: 'openai', customModel: 'model-b' }]) {
        Object.assign(page.data, settings);
        page.api.applyConfigFromStorage(settings);
        assert.equal(page.api.cacheGet(text), null);
        page.titles.length = 0;
        addTitle(page, text);
        await page.api.process();
        await settle();
        assert.ok(page.api.cacheGet(text));
    }
    await page.api.flushCacheWrites();
    assert.equal(pending.filter(msg => msg.type === 'translateBatch').length, 3);
    assert.doesNotMatch(JSON.stringify(pending), /test-key|example\.test|apiKey|apiUrl/);
    assert.deepEqual(pending.at(-1).entries.map(([key]) => key), [
        'ai\nzh-Hans\n["custom","test"]\n' + text,
        'ai\nzh-Hans\n["custom","model-b"]\n' + text,
        'ai\nzh-Hans\n["openai","model-b"]\n' + text
    ]);
});

test('AC6 后台先读到新模型时，旧页面不会用旧作用域缓存新模型译文', async () => {
    const page = createRuntime('content.js', { stored: aiSettings('zh-Hans') });
    const runtime = worker(async () => chat({ items: [{ i: 0, ...translated('新模型译文') }] }),
        { ...aiSettings('zh-Hans'), customModel: 'new-model' });
    page.chrome.runtime.sendMessage = msg => runtime.send(msg);
    const item = addTitle(page, 'Title racing the model change');
    await page.api.process();
    await nextTurn();
    assert.equal(badge(item).dataset.garyState, 'error');
    assert.equal(page.api.cacheGet(item.el.textContent), null);
    await page.api.flushCacheWrites();
    assert.equal(runtime.data.translationCache, undefined);
});

test('AC7 自定义端点说明使用 README 的稳定锚点', () => {
    const { PRESETS } = createRuntime('popup.js').api;
    assert.match(PRESETS.custom.helpUrl, /#custom-endpoint$/);
    assert.match(source('README.md'), /<a id="custom-endpoint"><\/a>\s+### .*自定义 OpenAI 兼容端点/);
});
