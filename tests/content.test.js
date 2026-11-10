const test = require('node:test');
const assert = require('node:assert/strict');

// content.js 顶层会读 chrome.storage、注册 DOMContentLoaded，先打桩再 require。
// readyState 固定为 'loading'，startObserver 永远不会真正执行。
const fakeTitles = [];
const onChangedListeners = [];
const storageData = {
    // 预置旧版（裸数组）缓存，混入两条损坏数据，验证加载时的逐条自愈过滤
    translationCache: [
        ["en\nHello legacy", { tag: "科技", translatedTitle: "旧缓存" }],
        ["broken-entry"],
        [42, null]
    ]
};
globalThis.chrome = {
    storage: {
        local: {
            get(keys, cb) {
                const result = {};
                (Array.isArray(keys) ? keys : []).forEach(k => {
                    if (Object.prototype.hasOwnProperty.call(storageData, k)) result[k] = storageData[k];
                });
                cb(result);
            },
            set(values, cb) { Object.assign(storageData, values); if (cb) cb(); }
        },
        onChanged: { addListener(fn) { onChangedListeners.push(fn); } }
    },
    runtime: { sendMessage() {} }
};
globalThis.document = {
    readyState: 'loading',
    addEventListener() {},
    querySelectorAll() { return fakeTitles; },
    querySelector() { return null; }
};
globalThis.window = { addEventListener() {}, innerHeight: 800 };

const content = require('../content.js');

// ---------- 语言检测 ----------

test('getDetectedLanguages: 各语系字符集', () => {
    assert.ok(content.getDetectedLanguages('Hello world').has('en'));
    assert.ok(content.getDetectedLanguages('你好世界').has('zh'));
    assert.ok(content.getDetectedLanguages('こんにちは').has('ja'));
    assert.ok(content.getDetectedLanguages('안녕하세요').has('ko'));
    assert.ok(content.getDetectedLanguages('สวัสดี').has('th'));
    const mixed = content.getDetectedLanguages('Hello 你好');
    assert.ok(mixed.has('en') && mixed.has('zh'));
});

test('isLikelyEnglishTitle: 英文启发式', () => {
    assert.equal(content.isLikelyEnglishTitle('I built a PC'), true);
    assert.equal(content.isLikelyEnglishTitle('NEW VIDEO'), true);
    // 带重音符号的拉丁文字不判为英文（法语/西语等）
    assert.equal(content.isLikelyEnglishTitle('¿Cómo estás?'), false);
});

// ---------- 是否需要翻译 ----------

test('shouldTranslateTitle: 已是目标语言则跳过', () => {
    content.applyConfigFromStorage({ targetLanguage: 'en' });
    assert.equal(content.shouldTranslateTitle('Hello world'), false);
    assert.equal(content.shouldTranslateTitle('你好世界'), true);
});

test('shouldTranslateTitle: 中文目标语言跳过中文标题', () => {
    content.applyConfigFromStorage({ targetLanguage: 'zh-Hans' });
    assert.equal(content.shouldTranslateTitle('你好世界'), false);
    assert.equal(content.shouldTranslateTitle('こんにちは世界'), true);
});

test('shouldBlockChineseTranslation: 仅中文目标时生效', () => {
    content.applyConfigFromStorage({ targetLanguage: 'zh-Hans' });
    assert.equal(content.shouldBlockChineseTranslation('Xi Jinping speech highlights'), true);
    assert.equal(content.shouldBlockChineseTranslation('How to cook pasta'), false);
    content.applyConfigFromStorage({ targetLanguage: 'en' });
    assert.equal(content.shouldBlockChineseTranslation('Xi Jinping speech highlights'), false);
});

// ---------- 动态批量大小 ----------

test('getDynamicBatchSize: 按模型名分档', () => {
    const withModel = (model) => content.applyConfigFromStorage({
        selectedProvider: 'test',
        providerConfigs: { test: { apiKey: 'k', apiUrl: 'https://example.com', model } }
    });

    withModel('kimi-k2.6-thinking');
    assert.equal(content.getDynamicBatchSize(), 4);
    withModel('MiniMax-M2.7');
    assert.equal(content.getDynamicBatchSize(), 4);
    withModel('deepseek-chat');
    assert.equal(content.getDynamicBatchSize(), 8);
    withModel('MiniMax-M2.7-highspeed');
    assert.equal(content.getDynamicBatchSize(), 8);
    withModel('gpt-5.5');
    assert.equal(content.getDynamicBatchSize(), 6);

    content.applyConfigFromStorage({ selectedProvider: 'test', providerConfigs: {} });
    assert.equal(content.getDynamicBatchSize(), 6);
});

// ---------- 缓存按语言隔离（缓存污染回归） ----------

test('cacheSet 显式语言参数：切换目标语言后读不到旧语言缓存', () => {
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'zh-Hans' });
    content.cacheSet('Hello', { tag: '科技', translatedTitle: '你好' }, 'zh-Hans');

    // 模拟用户在翻译途中切换到日语：旧语言的结果绝不能落到新语言 key 下
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'ja' });
    assert.equal(content.cacheGet('Hello'), null);

    // 切回中文仍在
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'zh-Hans' });
    assert.equal(content.cacheGet('Hello').translatedTitle, '你好');
});

// ---------- 缓存加载：旧版迁移 + 损坏自愈 ----------

test('loadCache: 旧版裸数组迁移并过滤损坏条目', () => {
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'en' });
    // require 时已加载预置数据：好条目可读，坏条目被丢弃且未导致崩溃
    assert.equal(content.cacheGet('Hello legacy').translatedTitle, '旧缓存');
});

test('loadCache: v1 包装格式可读，彻底损坏的数据不抛错', () => {
    storageData.translationCache = { v: 1, entries: [["en\nWrapped title", { tag: '游戏', translatedTitle: '包装格式' }]] };
    content.loadCache();
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'en' });
    assert.equal(content.cacheGet('Wrapped title').translatedTitle, '包装格式');

    storageData.translationCache = 'totally corrupt';
    content.loadCache(); // 不应抛错
});

// ---------- onChanged: 缓存清除同步 ----------

test('onChanged: popup 清除缓存时同步清空内存，自身落盘不清空', () => {
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'en' });
    content.cacheSet('To be cleared', { tag: '科技', translatedTitle: '待清除' }, 'en');
    assert.ok(content.cacheGet('To be cleared'));

    // 自己 debounce 落盘触发的 onChanged（newValue 存在）不应清空内存
    onChangedListeners.forEach(fn => fn({ translationCache: { oldValue: null, newValue: { v: 1, entries: [] } } }, 'local'));
    assert.ok(content.cacheGet('To be cleared'));

    // popup 点"清除缓存"（storage.remove → newValue 为 undefined）→ 内存同步清空
    onChangedListeners.forEach(fn => fn({ translationCache: { oldValue: null } }, 'local'));
    assert.equal(content.cacheGet('To be cleared'), null);
});

// ---------- process: 跳过打标 ----------

test('process: 已是目标语言的标题打 skip 标记，不再每轮重算', async () => {
    content.applyConfigFromStorage({ targetLanguage: 'en' });
    const attrs = {};
    const fakeEl = {
        textContent: 'This is a great video about everything',
        dataset: {},
        closest() { return null; },
        matches() { return false; },
        getAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null; },
        setAttribute(name, value) { attrs[name] = String(value); },
        getBoundingClientRect() { return { width: 200, height: 24, top: 100, bottom: 124 }; },
        parentElement: { querySelectorAll() { return []; } }
    };
    fakeTitles.push(fakeEl);
    try {
        await content.process();
        assert.equal(attrs['data-gary-done'], 'skip');
        assert.equal(fakeEl.dataset.garyOriginal, fakeEl.textContent);
    } finally {
        fakeTitles.length = 0;
    }
});

// ---------- translateChunk: 渲染状态机（重试交互依赖） ----------

function makeFakeBox() {
    const mkSpan = () => ({ classList: { add() {}, remove() {} }, textContent: "", style: {} });
    const spans = { '.gary-tag': mkSpan(), '.gary-cn-title': mkSpan() };
    return {
        isConnected: true,
        dataset: {},
        title: "",
        querySelector(sel) { return spans[sel] || null; },
        spans
    };
}

test('translateChunk: 成功 → done 状态 + 渲染译文 + 写缓存', async (t) => {
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'zh-Hans' });
    const original = globalThis.chrome.runtime.sendMessage;
    globalThis.chrome.runtime.sendMessage = async () => ({
        ok: true,
        results: [{ tag: '科技', translatedTitle: '你好世界' }],
        errors: [null]
    });
    t.after(() => { globalThis.chrome.runtime.sendMessage = original; });

    const box = makeFakeBox();
    await content.translateChunk([{ text: 'Hello world', box }]);

    assert.equal(box.dataset.garyState, 'done');
    assert.equal(box.spans['.gary-tag'].textContent, '科技');
    assert.equal(box.spans['.gary-cn-title'].textContent, '你好世界');
    assert.equal(content.cacheGet('Hello world').translatedTitle, '你好世界');
});

test('translateChunk: 失败 → error 状态（点击重试的前提）+ tooltip 含重试提示', async (t) => {
    content.applyConfigFromStorage({ translationMode: 'ai', customApiKey: 'test-key', customApiUrl: 'https://api.deepseek.com/chat/completions', customModel: 'deepseek-flash', targetLanguage: 'zh-Hans' });
    const original = globalThis.chrome.runtime.sendMessage;
    globalThis.chrome.runtime.sendMessage = async () => ({
        ok: false,
        results: [null],
        errors: [{ type: 'quota', message: '余额不足或被限流' }],
        error: { type: 'quota', message: '余额不足或被限流' }
    });
    t.after(() => { globalThis.chrome.runtime.sendMessage = original; });

    const box = makeFakeBox();
    await content.translateChunk([{ text: 'Failing title', box }]);

    assert.equal(box.dataset.garyState, 'error');
    assert.equal(box.spans['.gary-tag'].textContent, '❌');
    assert.ok(box.spans['.gary-cn-title'].textContent.includes('翻译失败'));
    // 重试提示走 UI 语言（测试里 UI_LANGUAGE=en），失败原因走目标语言
    assert.ok(box.title.includes('Click to retry'));
});

// ---------- 内置翻译兜底（Chrome Translator API） ----------

test('内置翻译: 无 API 环境 → builtinApiExists false', () => {
    assert.equal(content.builtinApiExists(), false);
});

test('isSameLanguage: 源语言与目标语言判定', () => {
    assert.equal(content.isSameLanguage('en', 'en'), true);
    assert.equal(content.isSameLanguage('zh', 'zh-Hans'), true);
    assert.equal(content.isSameLanguage('zh-Hant', 'zh-Hant'), true);
    assert.equal(content.isSameLanguage('en', 'zh-Hans'), false);
    assert.equal(content.isSameLanguage('ja', 'zh-Hans'), false);
    assert.equal(content.isSameLanguage(null, 'en'), false);
});

test('内置翻译: 正常翻译（stub Translator/LanguageDetector）', async (t) => {
    globalThis.LanguageDetector = {
        create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }] })
    };
    globalThis.Translator = {
        availability: async () => 'available',
        create: async () => ({ translate: async (text) => '译:' + text })
    };
    t.after(() => { delete globalThis.LanguageDetector; delete globalThis.Translator; });

    assert.equal(content.builtinApiExists(), true);
    assert.equal(await content.detectSourceLanguage('Hello'), 'en');
    assert.equal(await content.getBuiltinPairAvailability('en', 'zh-Hans'), 'available');
    assert.equal(await content.translateBuiltin('Hello', 'zh-Hans'), '译:Hello');
});

test('内置翻译: 语言对不支持 → 安静落空', async (t) => {
    globalThis.LanguageDetector = {
        create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }] })
    };
    globalThis.Translator = {
        availability: async () => 'unavailable',
        create: async () => { throw new Error('unsupported pair'); }
    };
    t.after(() => { delete globalThis.LanguageDetector; delete globalThis.Translator; });

    // 注意换一对语言对，避开上个测试的实例缓存
    assert.equal(await content.getBuiltinPairAvailability('xx', 'yy'), 'unavailable');
    assert.equal(await content.translateBuiltin('Hello', 'ja'), null);
});

test('本机语言包需要点击触发时提示本机原因，重试成功后移除错误并缓存', async (t) => {
    let attempts = 0;
    globalThis.LanguageDetector = {
        create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }] })
    };
    globalThis.Translator = {
        create: async () => {
            attempts++;
            if (attempts === 1) {
                const error = new Error('Requires a user gesture when availability is downloadable');
                error.name = 'NotAllowedError';
                throw error;
            }
            return { translate: async () => 'Lokale Übersetzung' };
        }
    };
    t.after(() => { delete globalThis.LanguageDetector; delete globalThis.Translator; });
    content.applyConfigFromStorage({ translationMode: 'local', targetLanguage: 'de', uiLanguage: 'en' });
    const box = makeFakeBox();

    await content.translateBuiltinIntoBox('Local language pack test', box, 'de');
    assert.equal(box.dataset.garyState, 'error');
    assert.match(box.spans['.gary-cn-title'].textContent, /Lokale Übersetzung/);
    assert.doesNotMatch(box.spans['.gary-cn-title'].textContent, /Anbieter|provider/);
    assert.match(box.title, /Click to retry/);
    assert.equal(content.cacheGet('Local language pack test'), null);

    await content.translateBuiltinIntoBox('Local language pack test', box, 'de');
    assert.equal(attempts, 2);
    assert.equal(box.dataset.garyState, 'done');
    assert.equal(box.spans['.gary-cn-title'].textContent, 'Lokale Übersetzung');
    assert.equal(content.cacheGet('Local language pack test').translatedTitle, 'Lokale Übersetzung');
});

test('本机模式忽略现有云端 Key；现代配置不会意外回退到旧版 Key', () => {
    const stored = {translationMode:'local', selectedProvider:'openai', customApiKey:'legacy-test-key',
        providerConfigs:{openai:{apiKey:'saved-test-key',apiUrl:'https://api.openai.com/v1/chat/completions',model:'gpt-6-luna'}}};
    const active = content.getActiveTranslationConfig(stored);
    assert.equal(active.mode,'local');
    assert.equal(active.config.apiKey,'');
    assert.equal(stored.providerConfigs.openai.apiKey,'saved-test-key');
    const missing = content.getActiveTranslationConfig({selectedProvider:'google',providerConfigs:{},customApiKey:'legacy-test-key'});
    assert.equal(missing.mode,'local');
    assert.equal(missing.config.apiKey,'');
    const legacy = content.getActiveTranslationConfig({customApiKey:'legacy-test-key',customApiUrl:'https://example.com',customModel:'manual'});
    assert.equal(legacy.mode,'ai');
    assert.equal(legacy.config.apiKey,'legacy-test-key');
});

test('本机与云端缓存互不覆盖，旧本机缓存迁移后仍可读', () => {
    content.applyConfigFromStorage({translationMode:'ai',targetLanguage:'en'});
    content.cacheSet('Mode title',{tag:'科技',translatedTitle:'AI result'},'en');
    content.cacheSet('Mode title',{tag:'__builtin__',translatedTitle:'Local result'},'en');
    assert.equal(content.cacheGet('Mode title').translatedTitle,'AI result');
    content.applyConfigFromStorage({translationMode:'local',targetLanguage:'en'});
    assert.equal(content.cacheGet('Mode title').translatedTitle,'Local result');
    storageData.translationCache = {v:1,entries:[['en\nLegacy local',{tag:'__builtin__',translatedTitle:'Migrated local'}]]};
    content.loadCache();
    assert.equal(content.cacheGet('Legacy local').translatedTitle,'Migrated local');
    content.applyConfigFromStorage({translationMode:'ai',targetLanguage:'en'});
    assert.equal(content.cacheGet('Legacy local'),null);
});

test('切换本机模式后不发送云端请求，旧云端回复不会重新渲染', async (t) => {
    content.applyConfigFromStorage({translationMode:'ai',targetLanguage:'en',customApiKey:'test-key',
        customApiUrl:'https://api.openai.com/v1/chat/completions',customModel:'gpt-6-luna'});
    let complete, calls=0;
    const original=globalThis.chrome.runtime.sendMessage;
    globalThis.chrome.runtime.sendMessage=()=>{calls++;return new Promise(resolve=>{complete=resolve;});};
    t.after(()=>{globalThis.chrome.runtime.sendMessage=original;});
    const oldBox=makeFakeBox();
    const pending=content.translateChunk([{text:'Old request',box:oldBox}]);
    content.applyConfigFromStorage({translationMode:'local',targetLanguage:'en'});
    await content.translateChunk([{text:'New local title',box:makeFakeBox()}]);
    assert.equal(calls,1);
    complete({ok:true,results:[{tag:'科技',translatedTitle:'Old AI result'}]});
    await pending;
    assert.notEqual(oldBox.dataset.garyState,'done');
    assert.equal(content.cacheGet('Old request'),null);
    content.applyConfigFromStorage({translationMode:'ai',targetLanguage:'en'});
    assert.equal(content.cacheGet('Old request').translatedTitle,'Old AI result');
});

test('仅验证元数据发生变化时也作废旧回复，避免标题重建后挂回旧 badge', async (t) => {
    const previous=structuredClone(storageData);
    const settings={translationMode:'ai',selectedProvider:'openai',targetLanguage:'en',uiLanguage:'en',
        providerConfigs:{openai:{apiKey:'test-key',apiUrl:'https://api.openai.com/v1/chat/completions',model:'gpt-6-luna'}}};
    Object.assign(storageData,settings);
    content.applyConfigFromStorage(settings);
    let complete;
    const original=globalThis.chrome.runtime.sendMessage;
    globalThis.chrome.runtime.sendMessage=()=>new Promise(resolve=>{complete=resolve;});
    t.after(()=>{
        globalThis.chrome.runtime.sendMessage=original;
        Object.keys(storageData).forEach(key=>delete storageData[key]);
        Object.assign(storageData,previous);
    });
    const box=makeFakeBox();
    const pending=content.translateChunk([{text:'Metadata change',box}]);
    storageData.providerConfigs={openai:{...settings.providerConfigs.openai,testedAt:123}};
    onChangedListeners.forEach(listener=>listener({providerConfigs:{
        oldValue:settings.providerConfigs,newValue:storageData.providerConfigs
    }},'local'));
    complete({ok:true,results:[{tag:'科技',translatedTitle:'Old reply'}]});
    await pending;
    assert.notEqual(box.dataset.garyState,'done');
});
