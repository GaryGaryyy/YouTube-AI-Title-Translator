const test = require('node:test');
const assert = require('node:assert/strict');
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { source, plain, Element, createRuntime, title, aiSettings } = require('./runtime-harness');
const { initWelcome } = require('../welcome.js');
const { WELCOME_TEXT } = require('../welcome-locales.js');
const POPUP_TEXT = require('../popup-locales.js');
const { buildPublicConfig, getDisplayPreferences, SUPPORTED_UI_LANGUAGES } = require('../shared.js');

const nextTurn = () => new Promise(resolve => setImmediate(resolve));
const badges = item => item.parent.querySelectorAll();
const setupBanners = page => page.document.body.children.filter(el => el.className === 'gary-setup-banner');
const localSettings = { translationMode: 'local', uiLanguage: 'en', targetLanguage: 'de' };

async function welcome(stored, translator, detector) {
    const elements = Object.fromEntries([...source('welcome.html').matchAll(/id="([^"]+)"/g)]
        .map(([, id]) => [id, new Element()]));
    const document = { documentElement: {}, createElement: tag => new Element(tag),
        getElementById: id => elements[id] };
    const chrome = { storage: { local: { get(keys, callback) { callback(stored); } } } };
    await initWelcome(document, chrome, WELCOME_TEXT, !!(detector && translator), translator, detector);
    await nextTurn();
    return elements;
}

test('2B-AC1 welcome distinguishes unsupported browser, unavailable detector and unavailable pair', async () => {
    const locale = WELCOME_TEXT['zh-Hans'];
    const stored = { uiLanguage: 'zh-Hans', targetLanguage: 'zh-Hans' };
    const unavailable = { availability: async () => 'unavailable', create: () => assert.fail('must not create') };
    const available = { ...unavailable, availability: async () => 'available' };
    for (const [translator, detector, expected] of [
        [available, undefined, locale.tryLocalUnsupported],
        [undefined, available, locale.tryLocalUnsupported],
        [available, unavailable, locale.tryLocalUnavailable],
        [unavailable, available, locale.tryLocalUnavailable]
    ]) {
        const ui = await welcome(stored, translator, detector);
        assert.equal(ui.tryLocalBtn.textContent, locale.tryLocal);
        await ui.tryLocalBtn.fire('click');
        assert.equal(ui.tryLocalStatus.textContent, expected);
        assert.equal(ui.tryLocalOutput.textContent, '');
    }
    assert.match(source('welcome.html'), /id="tryLocalStatus" role="status" aria-live="polite"/);
});

for (const state of ['downloadable', 'downloading', 'available']) {
    test(`2B-AC1 welcome ${state} starts both engines synchronously and shows the actual result`, async () => {
        const calls = [], ready = [];
        const en = state === 'available';
        const sample = en ? '東京旅行Vlog 2026 おすすめスポット' : 'How global creators explain AI tools';
        const targetLanguage = en ? 'en' : 'ja';
        const options = { sourceLanguage: en ? 'ja' : 'en', targetLanguage };
        const translator = {
            availability: async pair => { assert.deepEqual(pair, options); return state; },
            create(pair) {
                calls.push('translator');
                assert.deepEqual(pair, options);
                return new Promise(resolve => ready.push(() => resolve({
                    translate: async text => { assert.equal(text, sample); return 'Sample test result'; }
                })));
            }
        };
        const detector = {
            availability: async () => state,
            create() {
                calls.push('detector');
                return new Promise(resolve => ready.push(() => resolve({})));
            }
        };
        const ui = await welcome({ targetLanguage }, translator, detector);
        assert.equal(ui.tryLocalBtn.hidden, state === 'available');
        const click = ui.tryLocalBtn.fire('click');
        assert.deepEqual(calls, ['detector', 'translator']);
        assert.equal(ui.tryLocalStatus.textContent, en ? WELCOME_TEXT.en.tryLocalWorking : WELCOME_TEXT.en.tryLocalDownloading);
        ready.forEach(resolve => resolve());
        await click;
        assert.equal(ui.tryLocalBtn.hidden, true);
        assert.equal(ui.exampleTranslated.textContent, 'Sample test result');
        assert.equal(ui.previewBadge.textContent, WELCOME_TEXT.en.previewBadgeLive);
        assert.equal(ui.tryLocalOutput.textContent, sample + ' → Sample test result');
        assert.equal(ui.tryLocalStatus.textContent, WELCOME_TEXT.en.tryLocalReady);
    });
}

test('2B-AC1 a localized NotAllowedError can be retried', async () => {
    let attempts = 0;
    const translator = {
        availability: async () => 'downloadable',
        async create() {
            if (++attempts === 1) throw Object.assign(new Error('activation'), { name: 'NotAllowedError' });
            return { translate: async () => '翻訳しました' };
        }
    };
    const ui = await welcome({ uiLanguage: 'ja', targetLanguage: 'ja' }, translator, { create: async () => ({}) });
    await ui.tryLocalBtn.fire('click');
    assert.equal(ui.tryLocalStatus.textContent, WELCOME_TEXT.ja.tryLocalFailed);
    assert.equal(ui.tryLocalBtn.disabled, false);
    await ui.tryLocalBtn.fire('click');
    assert.match(ui.tryLocalOutput.textContent, /→ 翻訳しました$/);
});

test('2B-AC2 no engine leaves titles intact and shows one dismissible setup banner per configuration', async () => {
    for (const translationMode of ['local', 'ai']) {
        const page = createRuntime('content.js', { stored: { translationMode, uiLanguage: 'ar', targetLanguage: 'de' } });
        const items = ['How to build a desk', 'I made a chair'].map(text => title(text));
        page.titles.push(...items.map(item => item.el));
        await page.api.process();
        await page.api.process();
        assert.ok(items.every(item => badges(item).length === 0));
        assert.equal(setupBanners(page).length, 1);
        const [banner] = setupBanners(page);
        assert.equal(banner.dir, 'rtl');
        assert.equal(banner.children[0].getAttribute('role'), 'status');
        assert.equal(banner.children[1].tagName, 'BUTTON');
        await banner.children[1].fire('click');
        assert.deepEqual(page.messages.at(-1), { type: 'openSetup' });
        await banner.children[2].fire('click');
        await page.api.process();
        assert.equal(setupBanners(page).length, 0);
        page.titles.length = 0; // The test DOM returns the current titles for any query.
        page.receive({ type: 'configUpdated', config: buildPublicConfig({ translationMode }, 'en') });
        await page.api.process();
        assert.equal(setupBanners(page).length, 1);
    }
    const page = createRuntime('content.js', { stored: localSettings, extra: {
        LanguageDetector: { create: async () => ({ detect: async () => [{ detectedLanguage: 'en' }] }) },
        Translator: { availability: async () => 'unavailable', create: () => assert.fail('must not create') }
    } });
    const item = title('How to build a desk');
    page.titles.push(item.el);
    await page.api.process();
    await nextTurn();
    assert.equal(setupBanners(page).length, 1);
    assert.equal(badges(item).length, 0);
});

test('2B-AC2 worker opens the popup and falls back to welcome when the action API fails or is absent', async () => {
    const worker = createRuntime('background.js');
    let popupCalls = 0;
    worker.chrome.action = { async openPopup() { popupCalls++; } };
    assert.equal((await worker.send({ type: 'openSetup' })).ok, true);
    assert.equal(popupCalls, 1);
    assert.deepEqual(worker.opened, []);
    worker.chrome.action.openPopup = async () => { throw new Error('No popup'); };
    assert.equal((await worker.send({ type: 'openSetup' })).ok, true);
    delete worker.chrome.action;
    assert.equal((await worker.send({ type: 'openSetup' })).ok, true);
    assert.deepEqual(plain(worker.opened), Array(2).fill({ url: 'chrome-extension://test/welcome.html' }));
});

test('2B-AC2 Enter downloads a language pack, Space retries an error, and done links leave the tab order', async () => {
    let creates = 0, translates = 0;
    const page = createRuntime('content.js', { stored: { ...localSettings, showTags: false }, extra: {
        LanguageDetector: { create: async () => ({ detect: async () => [{ detectedLanguage: 'en' }] }) },
        Translator: { availability: async () => 'downloadable', async create() {
            creates++;
            return { async translate() { if (++translates === 1) throw new Error('test'); return 'Das Ergebnis'; } };
        } }
    } });
    const item = title('How to build a desk');
    page.titles.push(item.el);
    await page.api.process();
    await nextTurn();
    const [box] = badges(item);
    assert.equal(box.dataset.garyState, 'download');
    assert.ok(box.classList.contains('gary-hide-tags'));
    assert.equal(box.tabIndex, 0);
    assert.equal(box.getAttribute('role'), 'button');
    const key = box.fire('keydown', { key: 'Enter' });
    assert.equal(creates, 1);
    assert.equal(box.tabIndex, -1);
    assert.equal(box.getAttribute('role'), null);
    assert.equal(await key, true);
    await nextTurn();
    assert.equal(box.dataset.garyState, 'error');
    assert.equal(box.tabIndex, 0);
    assert.equal(box.getAttribute('role'), 'button');
    assert.equal(await box.fire('keydown', { key: ' ' }), true);
    await nextTurn();
    assert.equal(box.dataset.garyState, 'done');
    assert.equal(box.tabIndex, -1);
    assert.equal(box.getAttribute('role'), null);
    assert.deepEqual(page.messages.filter(msg => msg.type === 'recordLocalMetric'), [
        { type: 'recordLocalMetric', ok: false, errorType: 'translator' }, { type: 'recordLocalMetric', ok: true }
    ]);
});

test('2B-AC3 presentation preferences preserve originals and hide tags only on pending and done', async () => {
    assert.deepEqual(getDisplayPreferences({}), { showTags: true, bilingualOrder: 'translated-first', skipLanguages: [] });
    assert.deepEqual(getDisplayPreferences({}, 'local'), { showTags: false, bilingualOrder: 'translated-first', skipLanguages: [] });
    assert.equal(buildPublicConfig({ translationMode: 'local' }, 'zh-CN').showTags, false);
    assert.equal(buildPublicConfig({ translationMode: 'local', showTags: true }, 'zh-CN').showTags, false);
    assert.equal(buildPublicConfig({ translationMode: 'ai' }, 'zh-CN').showTags, true);
    assert.deepEqual(getDisplayPreferences({ showTags: 'false', bilingualOrder: 'reversed', skipLanguages: ['en', {}, 'en', 'xx'] }),
        { showTags: true, bilingualOrder: 'translated-first', skipLanguages: ['en'] });
    assert.deepEqual(getDisplayPreferences({ skipLanguages: ['zh-Hans'] }).skipLanguages, ['zh-Hans', 'zh-Hant']);
    assert.deepEqual(getDisplayPreferences({ skipLanguages: ['zh-Hant'] }).skipLanguages, ['zh-Hans', 'zh-Hant']);
    const page = createRuntime('content.js', { stored: { ...aiSettings('de'), showTags: false, bilingualOrder: 'original-first' } });
    const card = title('한글 제목');
    const heading = title('けんこうのために', { main: true });
    page.titles.push(card.el, heading.el);
    await page.api.process();
    await nextTurn();
    const [box] = badges(card);
    assert.deepEqual(card.parent.children, [card.el, box]);
    assert.equal(card.el.classList.contains('gary-en-sub'), false);
    const [main] = badges(heading);
    assert.ok(main.children.indexOf(main.querySelector('.gary-original-title')) < main.children.indexOf(main.querySelector('.gary-cn-title')));
    for (const badge of [box, main]) assert.ok(badge.classList.contains('gary-hide-tags'));
    const css = source('styles.css');
    assert.match(css, /\.gary-hide-tags\[data-gary-state="done"\] \.gary-tag,\s*\.gary-hide-tags\[data-gary-state="pending"\] \.gary-tag\s*\{\s*display: none;/);
    assert.doesNotMatch(css, /\.gary-hide-tags\[data-gary-state="(?:error|download)"\]/);
});

test('2B-AC3 familiar English titles skip via script, on-device detection and async AI detection', async () => {
    for (const mode of ['local', 'ai']) {
        const page = createRuntime('content.js', { stored: { ...(mode === 'local' ? localSettings : aiSettings('de')),
            skipLanguages: ['en', 'de'] }, extra: {
            LanguageDetector: { create: async () => ({ detect: async text => [{
                detectedLanguage: text === 'Tokyo Drift' ? 'en-US' : text.startsWith('한') ? 'ko' : 'ja',
                confidence: .99
            }] }) },
            Translator: { availability: async () => 'available', create: async () => ({ translate: async () => 'Übersetzung' }) }
        } });
        const items = ['How to build a desk', 'Tokyo Drift', 'けんこうのために', '한글 제목'].map(text => title(text));
        page.titles.push(...items.map(item => item.el));
        await page.api.process();
        await nextTurn();
        for (const item of items.slice(0, 2)) {
            assert.equal(item.el.getAttribute('data-gary-done'), 'skip', mode);
            assert.equal(badges(item).length, 0);
        }
        for (const item of items.slice(2)) assert.equal(badges(item)[0].dataset.garyState, 'done', mode);
    }
});

test('2B-AC3 local fallback recovers from detector error/und and turns NotAllowedError into download prompt', async () => {
    // 1. Detector throws UnknownError or returns 'und': script fallback rescues clear English titles
    const fallbackPage = createRuntime('content.js', { stored: { translationMode: 'local', uiLanguage: 'zh-Hans', targetLanguage: 'zh-Hans' }, extra: {
        LanguageDetector: { availability: async () => 'available', create: async () => ({ detect: async text => {
            if (text.includes('IRAN')) return [{ detectedLanguage: 'und', confidence: 0.2 }];
            throw Object.assign(new Error('detector failed'), { name: 'UnknownError' });
        } }) },
        Translator: { availability: async ({ sourceLanguage }) => sourceLanguage === 'en' ? 'available' : 'unavailable',
            create: async () => ({ translate: async text => '已翻译: ' + text }) }
    } });
    const engItems = ['IRAN IN 2026...', 'Alternate Picking for Beginners: Pick Angle Tip 🎸'].map(text => title(text));
    fallbackPage.titles.push(...engItems.map(i => i.el));
    await fallbackPage.api.process();
    await nextTurn();
    for (const item of engItems) assert.equal(badges(item)[0].dataset.garyState, 'done');

    // 2. Translator.create throws NotAllowedError after availability returned 'available': renders download badge, not error
    let attempts = 0;
    const gesturePage = createRuntime('content.js', { stored: { translationMode: 'local', uiLanguage: 'zh-Hans', targetLanguage: 'zh-Hans' }, extra: {
        LanguageDetector: { availability: async () => 'available', create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }] }) },
        Translator: { availability: async () => 'available', async create() {
            if (++attempts === 1) throw Object.assign(new Error('Requires user gesture'), { name: 'NotAllowedError' });
            return { translate: async () => '点击后译文' };
        } }
    } });
    const gestureItem = title('Yasuha - Friday Chinatown (guitar cover with tabs & chords)');
    gesturePage.titles.push(gestureItem.el);
    await gesturePage.api.process();
    await nextTurn();
    const [gestureBox] = badges(gestureItem);
    assert.equal(gestureBox.dataset.garyState, 'download');
    await gestureBox.fire('click');
    await nextTurn();
    assert.equal(gestureBox.dataset.garyState, 'done');

    // 3. Translator.create throws UnknownError: tooltip exposes safe error code & page shows setup banner
    const errorPage = createRuntime('content.js', { stored: { translationMode: 'local', uiLanguage: 'zh-Hans', targetLanguage: 'zh-Hans' }, extra: {
        LanguageDetector: { availability: async () => 'available', create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }] }) },
        Translator: { availability: async () => 'available', create: async () => { throw Object.assign(new Error('model broken'), { name: 'UnknownError' }); } }
    } });
    const errItem = title('How to build a desk');
    errorPage.titles.push(errItem.el);
    await errorPage.api.process();
    await nextTurn();
    const [errBox] = badges(errItem);
    assert.equal(errBox.dataset.garyState, 'error');
    assert.match(errBox.title, /\[UnknownError\]/);
    assert.equal(setupBanners(errorPage).length, 1);

    // 4. Non-Chinese target skipping zh-Hans skips both Simplified and Traditional Chinese
    const skipZhPage = createRuntime('content.js', { stored: { translationMode: 'local', uiLanguage: 'en', targetLanguage: 'en', skipLanguages: ['zh-Hans'] }, extra: {
        LanguageDetector: { availability: async () => 'available', create: async () => ({ detect: async () => [{ detectedLanguage: 'zh', confidence: 0.99 }] }) },
        Translator: { availability: async () => 'available', create: async () => ({ translate: async () => 'Translated' }) }
    } });
    const zhItems = ['最新人工智能教程视频', '最新人工智慧教學影片'].map(text => title(text));
    skipZhPage.titles.push(...zhItems.map(i => i.el));
    await skipZhPage.api.process();
    await nextTurn();
    for (const item of zhItems) {
        assert.equal(item.el.getAttribute('data-gary-done'), 'skip');
        assert.equal(badges(item).length, 0);
    }

    // 5. Romanized ja-Latn / regional en-US normalize to 'en' sharing one Translator; InvalidStateError evicts broken session
    let sessionCreates = 0;
    const romanizedPage = createRuntime('content.js', { stored: { translationMode: 'local', uiLanguage: 'zh-Hans', targetLanguage: 'zh-Hans' }, extra: {
        LanguageDetector: { availability: async () => 'available', create: async () => ({ detect: async text => text.includes('Yasuha')
            ? [{ detectedLanguage: 'ja-Latn', confidence: 0.55 }, { detectedLanguage: 'en', confidence: 0.4 }]
            : [{ detectedLanguage: 'en-US', confidence: 0.98 }] }) },
        Translator: { availability: async ({ sourceLanguage }) => sourceLanguage === 'en' ? 'available' : 'unavailable',
            create: async ({ sourceLanguage }) => {
                assert.equal(sourceLanguage, 'en');
                const id = ++sessionCreates;
                return { translate: async text => {
                    if (id === 1 && text.includes('Recoverable')) throw Object.assign(new Error('session closed'), { name: 'InvalidStateError' });
                    return '已译:' + text;
                } };
            } }
    } });
    const mixItems = ['Yasuha - Friday Chinatown (guitar cover with tabs & chords)', 'Recoverable English title'].map(text => title(text));
    romanizedPage.titles.push(...mixItems.map(i => i.el));
    await romanizedPage.api.process();
    await nextTurn();
    assert.equal(sessionCreates, 1);
    assert.equal(badges(mixItems[0])[0].dataset.garyState, 'done');
    assert.equal(badges(mixItems[1])[0].dataset.garyState, 'error');
    await badges(mixItems[1])[0].fire('click');
    await nextTurn();
    assert.equal(sessionCreates, 2);
    assert.equal(badges(mixItems[1])[0].dataset.garyState, 'done');
});

test('2B-AC3/AC4 storage changes broadcast display preferences and shortcut pause/resume to both YouTube hosts', async () => {
    let command, changed;
    const broadcast = [];
    const worker = createRuntime('background.js', { chromeOverrides(chrome) {
        chrome.commands = { onCommand: { addListener(fn) { command = fn; } } };
        const register = chrome.storage.onChanged.addListener;
        chrome.storage.onChanged.addListener = fn => { register(fn); changed = fn; };
        chrome.tabs.query = (query, reply) => {
            assert.deepEqual(plain(query.url), ['https://www.youtube.com/*', 'https://m.youtube.com/*']);
            reply([{ id: 1 }, { id: 2 }]);
        };
        chrome.tabs.sendMessage = (id, message) => broadcast.push([id, plain(message)]);
    }, setHandler(values, callback, chrome, data) {
        Object.assign(data, plain(values));
        changed(Object.fromEntries(Object.entries(values).map(([key, newValue]) => [key, { newValue }])), 'local');
        callback();
    } });
    Object.assign(worker.data, { showTags: false, bilingualOrder: 'original-first', skipLanguages: ['en'] });
    worker.change({ showTags: { newValue: false }, skipLanguages: { newValue: ['en'] } });
    await nextTurn();
    assert.equal(broadcast.length, 2);
    assert.equal(broadcast[0][1].type, 'configUpdated');
    assert.equal(broadcast[0][1].config.showTags, false);
    assert.equal(broadcast[0][1].config.bilingualOrder, 'original-first');
    assert.deepEqual(broadcast[0][1].config.skipLanguages, ['en']);
    command('other-command');
    assert.equal(worker.writes.length, 0);
    command('toggle-translation');
    await nextTurn();
    assert.equal(worker.data.enabled, false);
    assert.deepEqual(broadcast.slice(-2).map(([id, msg]) => [id, msg.config.enabled]), [[1, false], [2, false]]);
    command('toggle-translation');
    await nextTurn();
    assert.equal(worker.data.enabled, true);
    assert.deepEqual(broadcast.slice(-2).map(([id, msg]) => [id, msg.config.enabled]), [[1, true], [2, true]]);
});

test('2B-AC5 aggregated worker stats remain local, reject extra fields and omit sensitive data from diagnostics', async () => {
    const privateURL = 'https://private.example/path';
    const privateTitle = 'private-video-title';
    const stored = { ...aiSettings('de'), customModel: privateURL + '/secret-model', customApiKey: 'secret-key',
        translationCache: [['de\n' + privateTitle, { tag: '科技', cn: 'private translated title' }]],
        usageStats: {
            successCount: 49, localSuccessCount: 49,
            activeDays: Array.from({ length: 30 }, (_, day) => '2024-01-' + String(day + 1).padStart(2, '0')),
            apiKey: 'usage-private', errorCounts: { [privateTitle]: 5 }
        }
    };
    let providerFails = false;
    const worker = createRuntime('background.js', { stored, extra: { AbortSignal, fetch: async () => providerFails
        ? { ok: false, status: 401, json: async () => ({ message: privateTitle + privateURL }) } : ({
        ok: true, status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify({
            items: [{ i: 0, translatedTitle: 'Translated' }]
        }) } }] })
    }) } });
    assert.equal((await worker.send({ type: 'recordLocalMetric', ok: true, title: privateTitle })).ok, false);
    assert.equal((await worker.send({ type: 'recordLocalMetric', ok: false, errorType: privateURL })).ok, false);
    assert.equal(worker.writes.length, 0);
    const [localSuccess, localFailure, ai] = await Promise.all([
        worker.send({ type: 'recordLocalMetric', ok: true }),
        worker.send({ type: 'recordLocalMetric', ok: false, errorType: 'detector' }),
        worker.send({ type: 'translateBatch', items: [privateTitle], targetLanguage: 'de' })
    ]);
    assert.ok(localSuccess.ok && localFailure.ok && ai.ok);
    providerFails = true;
    assert.equal((await worker.send({ type: 'translateBatch', items: [privateTitle], targetLanguage: 'de' })).ok, false);
    const diagnostic = await worker.send({ type: 'getDiagnostics' });
    assert.equal(diagnostic.version, '8.2.0');
    assert.equal(diagnostic.cacheEntries, 1);
    assert.equal(diagnostic.usageStats.successCount, 51);
    assert.equal(diagnostic.usageStats.localSuccessCount, 50);
    assert.equal(diagnostic.usageStats.aiSuccessCount, 1);
    assert.equal(diagnostic.usageStats.failureCount, 2);
    assert.deepEqual(plain(diagnostic.usageStats.errorCounts), { detector: 1, auth: 1 });
    assert.ok(diagnostic.usageStats.firstSuccessAt > 0);
    assert.equal(diagnostic.usageStats.activeDays.length, 30);
    assert.equal(new Set(diagnostic.usageStats.activeDays).size, 30);
    assert.doesNotMatch(JSON.stringify(diagnostic), /apiKey|apiUrl|private|secret|https?:\/\//);
    assert.doesNotMatch(JSON.stringify(worker.data.usageStats), /apiKey|apiUrl|private|secret|https?:\/\//);
    assert.equal(await worker.send({ type: 'getDiagnostics' }, { tab: { id: 1 } }), undefined);
    assert.equal((await worker.send({ type: 'dismissReviewPrompt' })).ok, true);
    const restarted = createRuntime('background.js', { stored: worker.data });
    assert.equal((await restarted.send({ type: 'getDiagnostics' })).usageStats.reviewPromptDismissed, true);
});

test('2B-AC4/AC6 command and all four surfaces have complete localized Part B copy', () => {
    const manifest = JSON.parse(source('manifest.json'));
    assert.deepEqual(manifest.commands['toggle-translation'], {
        suggested_key: { default: 'Alt+Shift+T', mac: 'Alt+Shift+T' }, description: '__MSG_commandToggle__'
    });
    const locales = readdirSync(join(__dirname, '..', '_locales'), { withFileTypes: true }).filter(entry => entry.isDirectory());
    assert.equal(locales.length, 14);
    const catalog = Object.fromEntries(locales.map(({ name }) => [name, JSON.parse(source('_locales/' + name + '/messages.json'))]));
    for (const [name, messages] of Object.entries(catalog)) {
        assert.deepEqual(Object.keys(messages).sort(), Object.keys(catalog.en).sort(), name);
        assert.ok(messages.commandToggle.message.trim(), name);
        if (name !== 'en') assert.notEqual(messages.commandToggle.message, catalog.en.commandToggle.message, name);
    }
    const contentText = createRuntime('content.js').api.CONTENT_TEXT;
    for (const [lang, pack] of Object.entries(POPUP_TEXT)) {
        assert.deepEqual(Object.keys(pack).sort(), Object.keys(POPUP_TEXT.en).sort(), lang);
    }
    for (const [packs, keys] of [
        [WELCOME_TEXT, ['tryLocal', 'tryLocalUnsupported', 'tryLocalUnavailable', 'tryLocalDownloading',
            'tryLocalWorking', 'tryLocalReady', 'tryLocalFailed', 'previewBadgeExample', 'previewBadgeWorking',
            'previewBadgeLive', 'readyTitle', 'pinExtName', 'pinStep1', 'pinStep2', 'uiLanguageLabel',
            'compareHeading', 'compareOrigLabel', 'compareOrig', 'compareLocalLabel', 'compareLocalMeta',
            'compareLocalResult', 'compareLocalNote', 'compareAiLabel', 'compareAiMeta', 'compareAiTag',
            'compareAiResult', 'compareAiNote']],
        [POPUP_TEXT, ['showTags', 'bilingualOrder', 'translatedFirst', 'originalFirst', 'skipLanguages', 'skipLanguagesHint',
            'copyDiagnostics', 'diagnosticsCopied', 'diagnosticsCopyFailed', 'rateInStore', 'dismissReview']],
        [contentText, ['setupUnsupported', 'setupUnavailable', 'setupAi', 'openSetup', 'closeSetup']]
    ]) {
        assert.deepEqual(Object.keys(packs).sort(), [...SUPPORTED_UI_LANGUAGES].sort());
        for (const [lang, pack] of Object.entries(packs)) {
            for (const key of keys) {
                assert.ok(pack[key]?.trim(), lang + '.' + key);
                if (lang !== 'en') assert.notEqual(pack[key], packs.en[key], lang + '.' + key);
            }
        }
    }
});
