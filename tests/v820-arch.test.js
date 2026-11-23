const test = require('node:test');
const assert = require('node:assert/strict');
const { createRuntime, title, aiSettings, settle, plain, source, Element } = require('./runtime-harness');

const tabURLs = ['https://www.youtube.com/*', 'https://m.youtube.com/*'];
const publicFields = ['batchSize', 'bilingualOrder', 'cacheScope', 'configured', 'enabled', 'showTags', 'skipLanguages',
    'targetLanguage', 'translationMode', 'uiLanguage'];
const cacheKey = text => 'ai\nen\n' + text;
const cacheValue = (text, ts = 100) => ({ tag: '科技', translatedTitle: text, ts });
const cacheEntry = text => [cacheKey(text), cacheValue(text)];

function assertPublic(config) {
    assert.deepEqual(Object.keys(config).sort(), publicFields);
    assert.doesNotMatch(JSON.stringify(config), /apiKey|apiUrl|providerConfigs|retiredProviderConfigs|secret-key|private\.test/);
}

test('2A-AC1 多个并发入口只触发一次 SW 迁移，公开配置保持待确认状态', async () => {
    const worker = createRuntime('background.js', { stored: {
        selectedProvider: 'google', translationMode: 'ai',
        providerConfigs: { google: { model: 'retired', apiKey: 'secret-key', apiUrl: 'https://private.test' } }
    } });
    const [popup, page, duplicate] = await Promise.all([
        worker.send({ type: 'migrateSettings' }),
        worker.send({ type: 'getPageBootstrap' }),
        worker.send({ type: 'migrateSettings' })
    ]);
    assert.deepEqual(plain(popup), { ok: true });
    assert.deepEqual(plain(duplicate), { ok: true });
    assert.equal(worker.writes.length, 1);
    assert.equal(worker.data.selectedProvider, 'custom');
    assert.equal(worker.data.providerMigrationPending, true);
    assert.equal(worker.data.retiredProviderConfigs.google.apiKey, 'secret-key');
    assertPublic(page.config);
    assert.equal(page.config.configured, false);
    assert.equal(page.config.cacheScope, '');
});

test('2A-AC2 WORKER 配置 TRUSTED_CONTEXTS，页面仅用公开 bootstrap 和两种域名的配置推送', async () => {
    const model = 'reasoning-model';
    const worker = createRuntime('background.js', { language: 'ja', stored: {
        ...aiSettings('es'),
        providerConfigs: { custom: { model, apiKey: 'secret-key', apiUrl: 'https://private.test' } },
        retiredProviderConfigs: { google: { apiUrl: 'https://private.test', apiKey: 'secret-key' } }
    } });
    assert.deepEqual(worker.accessLevels, [{ accessLevel: 'TRUSTED_CONTEXTS' }]);
    let bootstrapped;
    const ready = new Promise(resolve => { bootstrapped = resolve; });
    const content = createRuntime('content.js', { bootstrap(callback) {
        worker.send({ type: 'getPageBootstrap' }).then(reply => { callback(reply); bootstrapped(reply); });
    } });
    const bootstrap = await ready;
    assertPublic(bootstrap.config);
    assert.equal(bootstrap.cacheClearedAt, 0);
    assert.equal(content.api.getDynamicBatchSize(), 4);
    assert.equal(content.api.getCacheKey('title'), 'ai\nes\n["custom","reasoning-model"]\ntitle');
    assert.deepEqual(plain(content.api.getConfig()), { targetLanguage: 'es', uiLanguage: 'en' });
    assert.deepEqual(content.messages, [{ type: 'getPageBootstrap' }]);
    assert.deepEqual(content.storageReads, []);
    assert.doesNotMatch(source('content.js'), /chrome\.storage/);

    const sent = [];
    worker.chrome.tabs.query = (query, callback) => {
        assert.deepEqual(plain(query.url), tabURLs);
        callback([{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }]);
    };
    worker.chrome.tabs.sendMessage = (id, message) => {
        sent.push([id, plain(message)]);
        if (id === 10) return Promise.reject(new Error('Tab unloaded'));
        if (id === 12) throw new Error('Tab closed');
        if (id === 11) content.receive(message);
    };
    Object.assign(worker.data, { enabled: false, targetLanguage: 'ja', uiLanguage: 'fr' });
    worker.change({ enabled: { newValue: false }, targetLanguage: { newValue: 'ja' }, uiLanguage: { newValue: 'fr' } });
    await settle();
    assert.deepEqual(sent.map(([id]) => id), [10, 11, 12, 13]);
    for (const [, message] of sent) {
        assert.equal(message.type, 'configUpdated');
        assertPublic(message.config);
    }
    assert.deepEqual(plain(content.api.getConfig()), { targetLanguage: 'ja', uiLanguage: 'fr' });
    assert.deepEqual(content.storageReads, []);
    const item = title('A title that would be translated');
    content.titles.push(item.el);
    await content.api.process();
    assert.equal(item.parent.querySelectorAll().length, 0);
});

test('2A-AC2 较晚到达的 bootstrap 与旧标签页查询不会覆盖最新配置', async () => {
    const worker = createRuntime('background.js', { stored: aiSettings('en') });
    const original = await worker.send({ type: 'getPageBootstrap' });
    const pendingQueries = [];
    let finishBootstrap;
    const content = createRuntime('content.js', { bootstrap(callback) { finishBootstrap = callback; } });
    worker.chrome.tabs.query = (_query, callback) => { pendingQueries.push(callback); };
    worker.chrome.tabs.sendMessage = (_id, message) => content.receive(message);
    for (const lang of ['fr', 'ja']) {
        worker.data.targetLanguage = lang;
        worker.change({ targetLanguage: { newValue: lang } });
        await settle();
    }
    assert.equal(pendingQueries.length, 2);
    pendingQueries[1]([{ id: 1 }]);
    pendingQueries[0]([{ id: 1 }]);
    finishBootstrap(original);
    assert.equal(content.api.getConfig().targetLanguage, 'ja');
});

test('2A-AC3 追加单条只写一个分片与 meta，冷启动只读元信息即可统计', async () => {
    const worker = createRuntime('background.js');
    const entries = Array.from({ length: 100 }, (_, i) => cacheEntry('Video ' + i));
    assert.equal((await worker.send({ type: 'cachePut', entries })).ok, true);
    assert.equal(Object.keys(worker.writes[0]).filter(key => key.startsWith('translationCache_b')).length, 16);
    const before = structuredClone(worker.data);
    const fresh = cacheEntry('New release');
    assert.equal((await worker.send({ type: 'cachePut', entries: [fresh] })).ok, true);
    const write = worker.writes[1];
    const [bucket] = Object.keys(write).filter(key => key.startsWith('translationCache_b'));
    assert.match(bucket, /^translationCache_b(?:[0-9]|1[0-5])$/);
    assert.deepEqual(Object.keys(write).sort(), [bucket, 'translationCacheMeta'].sort());
    assert.deepEqual(write.translationCacheMeta, { v: 3, totalEntries: 101, clearedAt: 0 });
    for (const key of Object.keys(before).filter(key => key.startsWith('translationCache_b') && key !== bucket)) {
        assert.deepEqual(worker.data[key], before[key], key);
    }

    const restarted = createRuntime('background.js', { stored: worker.data });
    assert.deepEqual(plain(await restarted.send({ type: 'getCacheStats' })), { ok: true, totalEntries: 101 });
    assert.deepEqual(restarted.storageReads, [['translationCacheClearedAt', 'translationCacheMeta']]);
    assert.deepEqual(plain(await restarted.send({ type: 'cacheLookup', keys: [entries[0][0], fresh[0]] })),
        { ok: true, hits: [entries[0], fresh] });
    assert.equal(restarted.writes.length, 0);
});

test('2A-AC3 裸数组、v1、v2 均迁移，旧模式前缀与 cn 字段恢复原译文', async () => {
    const entries = [
        ['en\nBefore modes', { tag: '科技', cn: '旧译文', ts: 100 }],
        ['en\nBuilt-in translation', { tag: '__builtin__', translatedTitle: '本机译文', ts: 101 }],
        cacheEntry('V2 title')
    ];
    const keys = [cacheKey('Before modes'), 'local\nen\nBuilt-in translation', cacheKey('V2 title')];
    for (const raw of [entries, { v: 1, entries }, { v: 2, entries }]) {
        const worker = createRuntime('background.js', { stored: { translationCache: raw } });
        const result = await worker.send({ type: 'cacheLookup', keys });
        assert.deepEqual(plain(result.hits), [[keys[0], cacheValue('旧译文')], [keys[1], entries[1][1]], entries[2]]);
        assert.equal(worker.data.translationCache, undefined);
        assert.deepEqual(worker.data.translationCacheMeta, { v: 3, totalEntries: 3, clearedAt: 0 });
        assert.equal(worker.writes.length, 1);
    }
});

test('2A-AC3 lookup 限制 200 key，更新全局 LRU 并让被淘汰的最旧分片落盘', async () => {
    const worker = createRuntime('background.js');
    const entries = Array.from({ length: 10000 }, (_, index) => cacheEntry(String(index)));
    await worker.send({ type: 'cachePut', entries });
    const keys = [entries[0][0], ...entries.slice(2, 202).map(([key]) => key)];
    const lookup = await worker.send({ type: 'cacheLookup', keys });
    assert.equal(lookup.hits.length, 200);
    assert.equal(lookup.hits.at(-1)[0], entries[200][0]);
    assert.equal(worker.writes.length, 1);
    await worker.send({ type: 'cachePut', entries: [cacheEntry('new')] });
    const restarted = createRuntime('background.js', { stored: worker.data });
    assert.deepEqual(plain(await restarted.send({ type: 'getCacheStats' })), { ok: true, totalEntries: 10000 });
    const result = await restarted.send({ type: 'cacheLookup', keys: [entries[0][0], entries[1][0]] });
    assert.deepEqual(plain(result.hits), [entries[0]]);
});

test('2A-AC3 cacheClear 完成后广播并移除所有键，重启后拒绝旧结果', async () => {
    let now = 100;
    const extra = { Date: { now: () => now } };
    const worker = createRuntime('background.js', {extra});
    const page = createRuntime('content.js', {stored:aiSettings('en'), extra});
    const entries = Array.from({ length: 100 }, (_, i) => cacheEntry('Video ' + i));
    await worker.send({ type: 'cachePut', entries });
    worker.data.translationCache = { v: 2, entries };
    page.api.cacheSet('Pending page title', cacheValue('Old'), 'en');
    worker.chrome.tabs.query = (query, callback) => {
        assert.deepEqual(plain(query.url), tabURLs);
        callback([{ id: 1 }]);
    };
    const broadcasts = [];
    worker.chrome.tabs.sendMessage = (_id, message) => {
        assert.deepEqual(Object.keys(worker.data), ['translationCacheClearedAt']);
        broadcasts.push(plain(message));
        page.receive(message);
    };
    now = 200;
    assert.deepEqual(plain(await worker.send({ type: 'cacheClear' })), { ok: true });
    assert.deepEqual(broadcasts, [{ type: 'cacheCleared', clearedAt: 200 }]);
    assert.equal(page.api.cacheGet('Pending page title'), null);
    await page.api.flushCacheWrites();
    assert.deepEqual(page.messages.map(msg => msg.type), ['getPageBootstrap']);

    const restarted = createRuntime('background.js', { stored:worker.data, extra });
    const late = [cacheKey('Late translation'), { ...cacheValue('old', 201), requestStartedAt: 100 }];
    const fresh = [cacheKey('Fresh translation'), { ...cacheValue('fresh', 201), requestStartedAt: 201 }];
    await restarted.send({ type: 'cachePut', entries: [late, fresh] });
    assert.deepEqual(plain((await restarted.send({ type: 'cacheLookup', keys: [late[0], fresh[0]] })).hits),
        [[fresh[0], cacheValue('fresh', 201)]]);
});

test('2A-AC3 页面批量查询冷标题，兼容旧 key、只翻译未命中项和复用热缓存', async () => {
    const page = createRuntime('content.js', { stored: aiSettings('en') });
    const oldText = '古い動画タイトル';
    const scopedText = '新しい動画タイトル';
    const missingText = '翻訳する動画タイトル';
    const worker = createRuntime('background.js', {stored:{translationCache:{v:2,entries:[
        [cacheKey(oldText), cacheValue('Old cached result')],
        [page.api.getCacheKey(scopedText), cacheValue('Scoped cached result')]
    ]}}});
    const defaultSend = page.chrome.runtime.sendMessage;
    const lookups = [];
    page.chrome.runtime.sendMessage = msg => {
        if (msg.type !== 'cacheLookup') return defaultSend(msg);
        lookups.push(plain(msg.keys));
        return worker.send(msg);
    };
    const items = [oldText, oldText, scopedText, missingText].map(text => title(text));
    page.titles.push(...items.map(item => item.el));
    await page.api.process();
    await settle();
    assert.equal(lookups.length, 1);
    assert.equal(lookups[0].length, 6);
    assert.ok(lookups[0].includes(cacheKey(oldText)));
    assert.deepEqual(page.messages.filter(msg => msg.type === 'translateBatch').map(msg => msg.items), [[missingText]]);
    assert.deepEqual(items.map(item => item.parent.querySelectorAll()[0].querySelector('.gary-cn-title').textContent),
        ['Old cached result', 'Old cached result', 'Scoped cached result', 'Translated result']);
    page.titles.push(title(scopedText).el);
    await page.api.process();
    assert.equal(lookups.length, 1);
    assert.deepEqual(page.storageReads, []);
});

function append(parent, tagName, { id, className, href, text } = {}) {
    const el = new Element(tagName);
    if (id) el.setAttribute('id', id);
    if (className) el.className = className;
    if (href) {
        el.setAttribute('href', href);
        el.href = new URL(href, 'https://www.youtube.com').href;
    }
    if (text) el.textContent = text;
    parent.appendChild(el);
    return el;
}

test('2A-AC4 桌面与移动标题、Shorts、去重和非视频过滤由真实选择器命中', async () => {
    const page = createRuntime('content.js', {stored:aiSettings('en')});
    const root = new Element('body');
    const desktopCard = append(root, 'ytd-rich-grid-media');
    const desktopWrapper = append(desktopCard, 'h3', {id:'video-title',text:'桌面首頁影片'});
    const desktopLink = append(desktopWrapper, 'a', {id:'video-title-link',href:'/watch?v=desk',text:'桌面首頁影片'});
    append(desktopLink, 'span', {id:'video-title',text:'桌面首頁影片'});
    const desktopWatch = append(root, 'ytd-watch-metadata');
    const desktopHeading = append(desktopWatch, 'h1');
    append(desktopHeading, 'yt-formatted-string', {text:'桌面觀看影片'});

    const shortHeadings = ['yt-lockup-view-model', 'ytm-shorts-lockup-view-model-v2', 'ytm-shorts-lockup-view-model'].map((tag, i) => {
        const heading = append(append(root, tag), 'h3');
        append(heading, 'a', {href:'/shorts/' + i,text:'短片標題 ' + i});
        return heading;
    });
    const mobileWatch = append(root, 'ytm-slim-video-metadata-section-renderer');
    const mobileHeading = append(mobileWatch, 'h2', {className:'slim-video-information-title',text:'手機觀看影片'});
    const mobileCard = append(root, 'ytm-video-with-context-renderer');
    const mobileLink = append(mobileCard, 'a', {id:'video-title-link',className:'media-item-metadata',href:'/watch?v=phone',text:'手機清單影片'});
    const mobileListTitle = append(mobileLink, 'h3', {className:'media-item-headline',text:'手機清單影片'});
    const live = append(root, 'h3');
    append(live, 'a', {href:'/live/video-id',text:'直播影片標題'});
    const excluded = ['/channel/xyz', '/about', 'https://example.test/watch?v=123'].map((href, index) =>
        append(append(root, 'h3'), 'a', {href,text:'無需翻譯項目 ' + index}));
    const comments = append(root, 'ytm-comment-thread-renderer');
    excluded.push(append(append(comments, 'h3'), 'a', {href:'/watch?v=comment',text:'評論影片連結'}));

    function findMatches(node, selector) {
        return node.children.flatMap(child => [
            ...(child.matches(selector) ? [child] : []), ...findMatches(child, selector)
        ]);
    }
    page.document.querySelectorAll = selector => findMatches(root, selector);
    await page.api.process();
    await settle();
    await page.api.process();
    await settle();

    const badges = findMatches(root, '.gary-cn-box');
    assert.equal(badges.length, 8);
    assert.equal(desktopWrapper.querySelectorAll().length, 1);
    assert.equal(desktopWatch.querySelectorAll()[0].classList.contains('gary-main-title-box'), true);
    assert.equal(desktopHeading.classList.contains('gary-original-source-hidden'), true);
    assert.equal(mobileWatch.querySelectorAll()[0].classList.contains('gary-main-title-box'), true);
    assert.equal(mobileHeading.classList.contains('gary-original-source-hidden'), true);
    assert.equal(mobileCard.querySelectorAll().length, 0);
    assert.equal(mobileListTitle.getAttribute('data-gary-done'), 'true');
    assert.equal(mobileLink.getAttribute('data-gary-done'), null);
    const [mobileBadge] = mobileLink.querySelectorAll();
    assert.equal(mobileLink.querySelectorAll().length, 1);
    assert.equal(mobileBadge.tagName, 'DIV');
    assert.equal(await mobileBadge.fire('click'), true);
    assert.equal(mobileLink.clicks, 1);
    for (const heading of [...shortHeadings, live]) assert.equal(heading.querySelectorAll()[0].tagName, 'A');
    for (const el of excluded) assert.equal(el.getAttribute('data-gary-done'), null);
});

test('2A-AC3 重启后递增写入的 LRU 顺序晚于其它分片的高序号', async () => {
    const first = createRuntime('background.js');
    const [entryA, entryB, entryC] = ['A','B','C'].map(cacheEntry);
    const bucketFor = (storage, [key]) => Object.keys(storage).find(bucket =>
        bucket.startsWith('translationCache_b') && storage[bucket].some(([storedKey]) => storedKey === key));
    await first.send({type:'cachePut', entries:[entryA,entryB]});
    for (let i = 0; i < 5; i++) await first.send({type:'cacheLookup', keys:[entryA[0]]});
    await first.send({type:'cachePut', entries:[entryA]});
    const bucketA = bucketFor(first.data, entryA);

    const restarted = createRuntime('background.js', {stored:first.data});
    await restarted.send({type:'cachePut', entries:[entryC]});
    const bucketC = bucketFor(restarted.data, entryC);
    assert.notEqual(bucketA,bucketC);
    assert.deepEqual(restarted.data[bucketA],first.data[bucketA]);
    const getOrder = (bucket, [key]) => restarted.data[bucket].find(([storedKey]) => storedKey === key)[2];
    assert.ok(getOrder(bucketC,entryC) > getOrder(bucketA,entryA));
});

test('2A-AC3 页面热缓存以每批最多 200 个 key 查询并保留最近 2,000 条', async () => {
    const page = createRuntime('content.js', {stored:aiSettings('en')});
    const entries = Array.from({length:2001}, (_, index) => {
        const text = 'Title ' + index;
        return [page.api.getCacheKey(text), cacheValue(text)];
    });
    const lookupSizes = [];
    const all = new Map(entries);
    page.chrome.runtime.sendMessage = async msg => {
        assert.equal(msg.type,'cacheLookup');
        lookupSizes.push(msg.keys.length);
        return {ok:true,hits:msg.keys.map(key => [key,all.get(key)])};
    };
    assert.equal((await page.api.lookupCache(entries.map(([key]) => key))).size,2001);
    assert.deepEqual(lookupSizes,[...Array(10).fill(200),1]);
    assert.equal(page.api.cacheGet('Title 0'),null);
    assert.equal(page.api.cacheGet('Title 1').translatedTitle,'Title 1');
    assert.equal(page.api.cacheGet('Title 2000').translatedTitle,'Title 2000');
});
