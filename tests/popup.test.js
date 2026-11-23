const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
const reviewedCopy = fs.readFileSync(path.join(__dirname, '..', 'popup-locales.js'), 'utf8');
const {source: readSource, createRuntime} = require('./runtime-harness');
const html = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');

// 运行真实弹窗脚本，以轻量 DOM 和 Chrome API 桩验证事件、保存和异步竞态；不调用付费 API。
class Element {
    constructor(tag, attrs = {}) {
        this.tagName = tag.toUpperCase(); this.attrs = {...attrs}; this.dataset = {};
        this.children = []; this.listeners = {}; this._value = ''; this._type = attrs.type || '';
        this.hidden = 'hidden' in attrs; this.disabled = false; this.checked = 'checked' in attrs;
        this.textContent = ''; this.selected = false;
        for (const [key,value] of Object.entries(attrs)) if (key.startsWith('data-')) {
            this.dataset[key.slice(5).replace(/-([a-z])/g, (_,c) => c.toUpperCase())] = value;
        }
        const classes = new Set((attrs.class || '').split(/\s+/));
        this.classList = { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }, contains(name) { return classes.has(name); } };
    }
    get value() {
        if (this.tagName !== 'SELECT') return this._value;
        return (this.children.find(option => option.selected) || this.children[0] || {})._value || '';
    }
    set value(value) {
        this._value = String(value);
        if (this.tagName === 'SELECT') this.children.forEach(option => { option.selected = option.value === this._value; });
    }
    get type() { return this._type; }
    set type(value) { this._type = value; }
    set innerHTML(value) { if (value === '') this.replaceChildren(); }
    appendChild(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; this._value = ''; }
    addEventListener(event, handler) { (this.listeners[event] ||= []).push(handler); }
    setAttribute(key,value) { this.attrs[key] = String(value); }
    getAttribute(key) { return this.attrs[key]; }
    focus() { this.focused = true; }
    async fire(event) { for (const handler of this.listeners[event] || []) await handler({key:'',preventDefault(){}}); }
}
function createPopup(initial = {}, response = { ok:true, result:{tag:'科技',translatedTitle:'示例译文'} }, browserLanguage = '', browserAPIs = {}) {
    const elements = [], ids = {};
    for (const [,tag,raw] of html.matchAll(/<([a-z][a-z0-9-]*)([^<>]*?)>/gi)) {
        const attrs = {};
        for (const [,key,value] of raw.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[key] = value;
        if (/\bhidden\b/.test(raw)) attrs.hidden = '';
        if (/\bchecked\b/.test(raw)) attrs.checked = '';
        const element = new Element(tag,attrs);
        elements.push(element);
        if (attrs.id) ids[attrs.id] = element;
    }
    let onReady;
    const document = { documentElement:{}, addEventListener(event,handler) { if (event === 'DOMContentLoaded') onReady=handler; },
        getElementById(id) { assert.ok(ids[id], 'HTML 缺少 ' + id); return ids[id]; },
        createElement(tag) { return new Element(tag); },
        querySelectorAll(selector) {
            if (selector === '[data-i18n]') return elements.filter(e => e.dataset.i18n);
            if (selector === '[data-i18n-attr]') return elements.filter(e => e.dataset.i18nAttr);
            if (selector === '.privacy-note') return elements.filter(e => e.classList.contains('privacy-note'));
            throw new Error('Unexpected DOM query: '+selector);
        }
    };
    const data = structuredClone(initial), messages = [], permissions = [], reads = [];
    let setError = false, grant = true, messagingError = false, messagingThrows = false;
    const chrome = { i18n:{getUILanguage:()=>browserLanguage}, runtime:{lastError:null,getManifest(){return {version:'8.2.0'};},sendMessage(message,callback){
        messages.push(structuredClone(message));
        if (messagingThrows) throw new Error('Extension context invalidated');
        if (messagingError) {
            chrome.runtime.lastError = {message:'test communication failure'};
            callback(undefined);
            chrome.runtime.lastError = null;
            return;
        }
        if (message.type === 'migrateSettings') { callback({ok:false}); return; }
        if (message.type === 'getCacheStats') { callback(initial.workerStats); return; }
        if (typeof response === 'function') response(message,callback);
        else callback(structuredClone(response));
    }}, storage:{ local:{
        get(defaults,callback){
            reads.push(defaults);
            callback(Array.isArray(defaults) ? Object.fromEntries(defaults.filter(key=>Object.hasOwn(data,key)).map(key=>[key,structuredClone(data[key])]))
                : Object.assign({}, defaults, structuredClone(data)));
        },
        set(values,callback){
            chrome.runtime.lastError = setError ? {message:'test storage failure'} : null;
            if (!setError) Object.assign(data, structuredClone(values));
            if (callback) callback();
            chrome.runtime.lastError = null;
        },
        remove(key,callback){ delete data[key]; if(callback)queueMicrotask(callback); }
    }}, permissions:{async request(request){ permissions.push(request); return grant; }} };
    const context = vm.createContext({document,chrome,URL,Date,console,module:{exports:{}}, ...browserAPIs});
    vm.runInContext(readSource('shared.js'),context,{filename:'shared.js'});
    context.GaryShared = context.module.exports;
    context.module.exports = {};
    vm.runInContext(reviewedCopy,context,{filename:'popup-locales.js'});
    vm.runInContext(source,context,{filename:'popup.js'});
    onReady();
    return { elements:ids, data, messages, permissions, reads, document, api:context.module.exports,
        failStorage(value){setError=value;}, failMessaging(value){messagingError=value;}, throwMessaging(value){messagingThrows=value;}, grantPermission(value){grant=value;} };
}

test('2B-AC3 advanced popup controls save changes without verifying the provider', async () => {
    const popup = createPopup({ translationMode: 'ai', targetLanguage: 'zh-Hans', showTags: false, bilingualOrder: 'original-first', skipLanguages: ['en', 'xx'] });
    const { showTagsToggle, bilingualOrderSelect, skipLanguageChoices, modeLocal, modeAi } = popup.elements;
    const labels = skipLanguageChoices.children;
    const inputs = labels.map(label => label.children[0]);
    assert.equal(showTagsToggle.checked, false);
    assert.equal(bilingualOrderSelect.value, 'original-first');
    assert.equal(inputs.length, 12);
    // When target is zh-Hans or zh-Hant, both Chinese variants are auto-skipped and hidden.
    assert.equal(labels.find(l => l.children[0].value === 'zh-Hans').hidden, true);
    assert.equal(labels.find(l => l.children[0].value === 'zh-Hant').hidden, true);
    assert.deepEqual(inputs.filter(el => el.checked).map(el => el.value), ['en']);
    showTagsToggle.checked = true;
    await showTagsToggle.fire('change');
    bilingualOrderSelect.value = 'translated-first';
    await bilingualOrderSelect.fire('change');
    const japanese = inputs.find(input => input.value === 'ja');
    japanese.checked = true;
    await japanese.fire('change');
    assert.equal(popup.data.showTags, true);
    assert.equal(popup.data.bilingualOrder, 'translated-first');
    assert.deepEqual(popup.data.skipLanguages, ['en', 'ja']);
    assert.ok(!popup.messages.some(message => message.type === 'testTranslation'));

    // Switching target to English reveals both Chinese variants and links them together.
    popup.elements.targetLanguageSelect.value = 'en';
    await popup.elements.targetLanguageSelect.fire('change');
    assert.equal(labels.find(l => l.children[0].value === 'zh-Hans').hidden, false);
    assert.equal(labels.find(l => l.children[0].value === 'zh-Hant').hidden, false);
    const zhHans = inputs.find(input => input.value === 'zh-Hans');
    const zhHant = inputs.find(input => input.value === 'zh-Hant');
    zhHans.checked = true;
    await zhHans.fire('change');
    assert.equal(zhHant.checked, true);
    assert.deepEqual(popup.data.skipLanguages, ['ja', 'zh-Hans', 'zh-Hant']);

    // Switching to local mode completely hides the category tags toggle row; AI mode restores it.
    await modeLocal.fire('click');
    assert.equal(popup.elements.showTagsRow.hidden, true);
    await modeAi.fire('click');
    assert.equal(popup.elements.showTagsRow.hidden, false);
    assert.equal(showTagsToggle.checked, true);

    // Segmented bilingual order buttons stay synced with bilingualOrderSelect and storage.
    await popup.elements.orderOriginalBtn.fire('click');
    assert.equal(popup.data.bilingualOrder, 'original-first');
    assert.equal(bilingualOrderSelect.value, 'original-first');
    assert.equal(popup.elements.orderOriginalBtn.getAttribute('aria-pressed'), 'true');
    assert.equal(popup.elements.orderTranslatedBtn.getAttribute('aria-pressed'), 'false');

    popup.failStorage(true);
    showTagsToggle.checked = false;
    await showTagsToggle.fire('change');
    assert.equal(showTagsToggle.checked, true);
    assert.equal(popup.elements.status.textContent, popup.api.UI_TEXT.en.saveFailed);
});

test('2B-AC5 review visibility requires both thresholds and dismissal persists in the worker', async () => {
    const activeDays = ['2026-11-20', '2026-11-21', '2026-11-22'];
    for (const usageStats of [{ successCount: 49, activeDays }, { successCount: 50, activeDays: activeDays.slice(0, 2) }]) {
        assert.equal(createPopup({ usageStats }).elements.reviewPrompt.hidden, true);
    }
    const worker = createRuntime('background.js', { stored: { usageStats: { successCount: 50, activeDays } } });
    const popup = createPopup(worker.data, (message, callback) => worker.send(message).then(callback));
    assert.equal(popup.elements.reviewPrompt.hidden, false);
    assert.match(html, /href="https:\/\/chromewebstore\.google\.com\/detail\/bhajnflcikmidmdalnjhknillnkaojhk\/reviews"/);
    await popup.elements.dismissReviewBtn.fire('click');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(popup.elements.reviewPrompt.hidden, true);
    assert.equal(worker.data.usageStats.reviewPromptDismissed, true);
    assert.equal(createPopup(worker.data).elements.reviewPrompt.hidden, true);
});

test('2B-AC5 copy writes a redacted diagnostic JSON and shows clipboard feedback', async () => {
    const worker = createRuntime('background.js', { stored: {
        ...seed(), uiLanguage: 'en', customApiKey: 'private-key', customApiUrl: 'https://private-url.example',
        providerConfigs: { openai: { model: 'https://private-model.example', apiKey: 'private-key', apiUrl: 'https://private-url.example' } },
        translationCache: [['en\nprivate-video-title', { tag: '科技', cn: 'private translation' }]]
    } });
    let clipboard, copyError = false;
    const popup = createPopup(worker.data, (message, callback) => worker.send(message).then(callback), 'en', {
        Translator: {}, LanguageDetector: {}, navigator: { clipboard: { async writeText(value) {
            if (copyError) throw new Error('Clipboard denied');
            clipboard = value;
        } } }
    });
    await popup.elements.copyDiagnosticsBtn.fire('click');
    assert.doesNotMatch(clipboard, /apiKey|apiUrl|private|https?:\/\//);
    const result = JSON.parse(clipboard);
    assert.deepEqual(Object.keys(result), ['version', 'config', 'cacheEntries', 'usageStats', 'localApiSupported']);
    assert.equal(result.localApiSupported, true);
    assert.equal(result.cacheEntries, 1);
    assert.equal(popup.elements.status.textContent, popup.api.UI_TEXT.en.diagnosticsCopied);
    copyError = true;
    await popup.elements.copyDiagnosticsBtn.fire('click');
    assert.equal(popup.elements.status.textContent, popup.api.UI_TEXT.en.diagnosticsCopyFailed);
});
const seed = () => ({ translationMode:'ai', selectedProvider:'openai', uiLanguage:'zh-Hans', targetLanguage:'zh-Hans',
    providerConfigs:{openai:{apiKey:'saved-test-key',apiUrl:'https://api.openai.com/v1/chat/completions',model:'gpt-6-luna'}},
    customApiKey:'saved-test-key',customApiUrl:'https://api.openai.com/v1/chat/completions',customModel:'gpt-6-luna' });
async function input(ui,id,value,event='input'){ui.elements[id].value=value;await ui.elements[id].fire(event);}

test('清缓存由后台串行处理，通信失败保留计数并显示错误', async () => {
    const seedCache = { translationCache: { v: 2, entries: [['title', {}]] } };
    const handled = createPopup(seedCache, { ok: true });
    await handled.elements.clearCacheBtn.fire('click');
    assert.deepEqual(handled.messages.map(msg => msg.type), ['migrateSettings','getCacheStats','cacheClear']);
    assert.ok(handled.data.translationCache, 'worker success does not also remove storage in the popup');
    assert.match(handled.elements.clearCacheBtn.textContent, /\(0\)$/);

    const failures = [createPopup(seedCache, { ok: false }), createPopup(seedCache), createPopup(seedCache)];
    failures[1].failMessaging(true);
    failures[2].throwMessaging(true);
    for (const ui of failures) {
        await ui.elements.clearCacheBtn.fire('click');
        assert.equal(ui.messages.at(-1).type, 'cacheClear');
        assert.deepEqual(ui.data.translationCache, seedCache.translationCache);
        assert.match(ui.elements.clearCacheBtn.textContent, /\(1\)$/);
        assert.equal(ui.elements.status.textContent, ui.api.UI_TEXT.en.saveFailed);
    }
});

test('弹窗计数优先读取 SW，仅在不可用时依次回退元信息和旧缓存', () => {
    const seedCache = { translationCache: { v: 2, entries: [['title', {}]] } };
    const primary = createPopup({...seedCache, workerStats:{ok:true,totalEntries:27}});
    const meta = createPopup({...seedCache, translationCacheMeta:{v:3,totalEntries:21}});
    const legacy = createPopup(seedCache);
    assert.match(primary.elements.clearCacheBtn.textContent, /\(27\)$/);
    assert.match(meta.elements.clearCacheBtn.textContent, /\(21\)$/);
    assert.match(legacy.elements.clearCacheBtn.textContent, /\(1\)$/);
    assert.equal(primary.reads.some(keys => [].concat(Array.isArray(keys) ? keys : Object.keys(keys)).includes('translationCache')), false);
    assert.deepEqual(Array.from(meta.reads[1]), ['translationCacheMeta']);
    assert.deepEqual(Array.from(legacy.reads[2]), ['translationCache']);
});

test('model presets: 每家最多四个，推荐项唯一且排第一，所有新文案有本地化', () => {
    const ui=createPopup();
    for(const [provider,preset] of Object.entries(ui.api.PRESETS)){
        if(provider==='custom')continue;
        assert.ok(preset.models.length>0 && preset.models.length<=4);
        assert.equal(preset.models[0].tier,'tierRecommended');
        assert.equal(preset.models.filter(m=>m.tier==='tierRecommended').length,1);
        assert.ok(preset.models.every(m=>m.name && m.id));
    }
    for(const [lang,pack] of Object.entries(ui.api.UI_TEXT)){
        for(const key of ui.api.SETTINGS_TEXT_KEYS) assert.ok(typeof pack[key]==='string' && pack[key].length,lang+'.'+key);
        for(const key of ['customModelOption','testFailAuth','testFailModel','testFailQuota','clearCache','getApiKey']) {
            assert.ok(typeof pack[key]==='string' && pack[key].length,lang+'.'+key);
            if(lang!=='en') assert.notEqual(pack[key],ui.api.UI_TEXT.en[key],lang+'.'+key+' 不应回落到英文');
        }
    }
});

test('旧版扁平配置保留 Key，未知模型按手动模型保留', () => {
    const ui=createPopup({selectedProvider:'openai',customApiKey:'legacy-test-key',
        customApiUrl:'https://api.openai.com/v1/chat/completions',customModel:'gpt-5.5'});
    assert.equal(ui.elements.aiSettings.hidden,false);
    assert.equal(ui.elements.apiKey.value,'legacy-test-key');
    // 不在预设里、也不是明确下线的 ID：按手动模型原样保留（与 8.0.4 行为一致），不悄悄改写。
    assert.equal(ui.elements.modelName.value,'gpt-5.5');
    assert.equal(ui.elements.manualModelSection.hidden,false);
    assert.equal(ui.elements.apiKey.type,'password');
});

test('切换服务商和模式保留未保存的 Key 与手动模型；不会提前写入配置', async () => {
    const ui=createPopup(seed());
    await input(ui,'apiKey','draft-test-key');
    await input(ui,'modelSelect','__custom_model__','change');
    await input(ui,'modelName','manual-model');
    await ui.elements['card-anthropic'].fire('click');
    assert.equal(ui.elements.apiKey.value,'');
    await ui.elements['card-openai'].fire('click');
    assert.equal(ui.elements.apiKey.value,'draft-test-key');
    assert.equal(ui.elements.modelName.value,'manual-model');
    assert.equal(ui.elements.modelSelect.value,'__custom_model__');
    assert.equal(ui.elements['card-openai'].classList.contains('provider-draft'),true);
    await ui.elements.modeLocal.fire('click');
    assert.equal(ui.elements.aiSettings.hidden,true);
    await ui.elements.modeAi.fire('click');
    assert.equal(ui.elements.apiKey.value,'draft-test-key');
    assert.equal(ui.data.providerConfigs.openai.apiKey,'saved-test-key');
});

test('测试失败不保存；错误不会因语言设置保存而消失', async () => {
    const ui=createPopup(seed(),{ok:false,error:{type:'auth'}});
    await input(ui,'apiKey','bad-test-key');
    await ui.elements.testBtn.fire('click');
    assert.equal(ui.data.providerConfigs.openai.apiKey,'saved-test-key');
    assert.equal(ui.elements.status.dataset.kind,'error');
    assert.match(ui.elements.status.textContent,/Key/);
    await input(ui,'targetLanguageSelect','ja','change');
    assert.equal(ui.elements.status.hidden,false);
    assert.equal(ui.elements.status.dataset.kind,'error');
    assert.equal(ui.elements.testBtn.disabled,false);
});

test('测试中锁定配置；成功后保存并标记通过；修改 Key 后仅保存会清除验证状态', async () => {
    let finish;
    const ui=createPopup(seed(),(message,callback)=>{finish=callback;});
    await input(ui,'apiKey','new-test-key');
    const pending=ui.elements.testBtn.fire('click');
    assert.equal(ui.messages.find(msg=>msg.type==='testTranslation').type,'testTranslation');
    assert.equal(ui.elements.aiSettings.disabled,true);
    assert.equal(ui.data.providerConfigs.openai.apiKey,'saved-test-key');
    await ui.elements['card-anthropic'].fire('click');
    assert.equal(ui.elements['card-openai'].getAttribute('aria-pressed'),'true');
    finish({ok:true,result:{tag:'科技',translatedTitle:'新的译文'}});
    await pending;
    assert.equal(ui.data.providerConfigs.openai.apiKey,'new-test-key');
    assert.ok(ui.data.providerConfigs.openai.testedAt>0);
    assert.equal(ui.elements.configState.textContent,'OpenAI · 已验证');
    assert.match(ui.elements.status.textContent,/新的译文/);
    assert.equal(ui.elements.aiSettings.disabled,false);
    await input(ui,'apiKey','changed-test-key');
    await ui.elements.saveBtn.fire('click');
    assert.equal(ui.data.providerConfigs.openai.testedAt,undefined);
    assert.equal(ui.elements.configState.textContent,'OpenAI · Key 已保存');
});

test('本机模式可无 Key 保存、不发送测试请求，并保留所有服务商 Key', async () => {
    const ui=createPopup(seed());
    await ui.elements.modeLocal.fire('click');
    await ui.elements.testBtn.fire('click');
    assert.equal(ui.data.translationMode,'local');
    assert.equal(ui.data.customApiKey,'');
    assert.equal(ui.data.providerConfigs.openai.apiKey,'saved-test-key');
    assert.equal(ui.messages.filter(msg=>msg.type==='testTranslation').length,0);
    await ui.elements.modeAi.fire('click');
    assert.equal(ui.elements.apiKey.value,'saved-test-key');
});

test('保存失败保留草稿和旧配置，不显示测试通过', async () => {
    const ui=createPopup(seed());
    await input(ui,'apiKey','draft-test-key');
    ui.failStorage(true);
    await ui.elements.testBtn.fire('click');
    assert.equal(ui.data.providerConfigs.openai.apiKey,'saved-test-key');
    assert.equal(ui.elements.apiKey.value,'draft-test-key');
    assert.equal(ui.elements.status.dataset.kind,'error');
    assert.equal(ui.elements.configState.textContent,'OpenAI · 有未保存更改');
});

test('自定义端点先校验和授权，拒绝时不测试或保存', async () => {
    const ui=createPopup(seed());
    await ui.elements['card-custom'].fire('click');
    await input(ui,'apiKey','custom-test-key');
    await input(ui,'modelName','manual-model');
    await input(ui,'apiUrl','http://example.com/v1/chat/completions');
    await ui.elements.testBtn.fire('click');
    assert.equal(ui.messages.filter(msg=>msg.type==='testTranslation').length,0);
    assert.equal(ui.permissions.length,0);
    await input(ui,'apiUrl','https://example.com/v1/chat/completions');
    ui.grantPermission(false);
    await ui.elements.testBtn.fire('click');
    assert.equal(ui.permissions.length,1);
    assert.equal(ui.messages.filter(msg=>msg.type==='testTranslation').length,0);
    assert.equal(ui.data.selectedProvider,'openai');
    assert.equal(ui.elements.status.dataset.kind,'error');
});

test('旧后台不处理测试消息时明确提示扩展通信问题，保留旧配置', async () => {
    for (const failure of ['undefined','runtime','invalidated']) {
        const ui=createPopup(seed(),(_message,callback)=>callback(undefined));
        ui.failMessaging(failure==='runtime');
        ui.throwMessaging(failure==='invalidated');
        await input(ui,'apiKey','new-draft-test-key');
        await ui.elements.testBtn.fire('click');
        assert.match(ui.elements.status.textContent,/扩展后台/);
        assert.match(ui.elements.status.textContent,/原设置仍在使用/);
        assert.doesNotMatch(ui.elements.status.textContent,/网络或服务商异常/);
        assert.equal(ui.data.providerConfigs.openai.apiKey,'saved-test-key');
        assert.equal(ui.elements.testBtn.disabled,false);
    }
});

test('诊断详情只呈现安全类型与 HTTP 状态，不显示服务商返回体或凭证', async () => {
    const secret='sensitive-key-must-not-be-rendered';
    const ui=createPopup(seed(),{ok:false,error:{type:'quota',message:secret,
        detail:{status:429,data:{error:secret},Authorization:secret}}});
    await ui.elements.testBtn.fire('click');
    assert.equal(ui.elements.diagnosticType.textContent,'quota');
    assert.equal(ui.elements.diagnosticHttp.textContent,'429');
    assert.equal(ui.elements.statusDetails.hidden,false);
    assert.doesNotMatch(ui.elements.status.textContent, new RegExp(secret));
    assert.doesNotMatch(ui.elements.diagnosticType.textContent, new RegExp(secret));
});

test('全部界面语言使用新增本地化文案，切换文字不修改标题目标或凭证草稿', async () => {
    const ui=createPopup(seed());
    await input(ui,'apiKey','unsaved-draft-key');
    const required=['uiLanguageLabel','targetLanguageHint','testAndSave','saveOnly','saveOnlyHint',
        'privacyNote','privacyLocalNote','privacyTitle','privacyDetailsAi','privacyDetailsLocal',
        'testFailExtension','testFailEmpty','testFailResponse','testFailService','changesNotSaved',
        'diagnosticLabel','diagnosticTypeLabel','diagnosticHttpLabel'];
    for(const language of ui.api.UI_LANGUAGES){
        const pack=ui.api.UI_TEXT[language.code];
        for(const key of required){
            assert.ok(typeof pack[key]==='string' && pack[key].length,language.code+'.'+key);
            // French "Type" is also the correct native label; matching English is not always a fallback.
            if(language.code!=='en' && !(language.code==='fr' && key==='diagnosticTypeLabel')) {
                assert.notEqual(pack[key],ui.api.UI_TEXT.en[key],language.code+'.'+key+' 英文回退');
            }
        }
        await input(ui,'uiLanguageSelect',language.code,'change');
        assert.equal(ui.document.documentElement.dir,language.dir);
        assert.equal(ui.elements.apiKey.value,'unsaved-draft-key');
        assert.equal(ui.elements.targetLanguageSelect.value,'zh-Hans');
        assert.equal(ui.data.targetLanguage,'zh-Hans');
        assert.equal(ui.elements.testBtn.textContent,pack.testAndSave);
        assert.equal(ui.elements.uiLanguageSelect.getAttribute('aria-label'),pack.uiLanguageLabel);
    }
});

test('中文浏览器的 popup 默认中文，显式保存 en 时保持英文', () => {
    const fresh = createPopup({}, undefined, 'zh-CN');
    assert.equal(fresh.elements.uiLanguageSelect.value,'zh-Hans');
    assert.equal(fresh.elements.targetLanguageSelect.value,'zh-Hans');
    assert.equal(Object.keys(fresh.data).length,0,'打开弹窗不应保存默认值');
    const saved = createPopup({uiLanguage:'en',targetLanguage:'en'}, undefined, 'zh-CN');
    assert.equal(saved.elements.uiLanguageSelect.value,'en');
    assert.equal(saved.elements.targetLanguageSelect.value,'en');
});

test('下线预设读取时迁移为 custom，保留凭证、清理旧项，提示重新授权且只迁移一次', async () => {
    for (const provider of ['google','minimax','zhipu','kimi']) {
        const cfg={apiKey:'retired-key',apiUrl:'https://old-provider.test/v1/chat/completions',model:'retired-model'};
        const worker = createRuntime('background.js', {stored:{selectedProvider:provider,translationMode:'ai',providerConfigs:{[provider]:cfg}}});
        assert.equal((await worker.send({type:'migrateSettings'})).ok,true);
        const ui=createPopup(worker.data);
        assert.equal(ui.data.selectedProvider,'custom');
        assert.deepEqual(ui.data.providerConfigs.custom,{...cfg,apiUrl:provider==='google'?'':cfg.apiUrl});
        assert.equal(ui.data.providerConfigs[provider],undefined);
        assert.equal(ui.data.providerMigrationPending,true);
        assert.equal(ui.elements.status.textContent,ui.api.UI_TEXT.en.providerRetired);
        await worker.send({type:'migrateSettings'});
        assert.equal(worker.writes.length,1);
        assert.equal(Object.keys(ui.api.migrateProviderSettings(ui.data).updates).length,0);
        if (provider==='google') {
            assert.equal(ui.elements.apiUrl.value,'');
            assert.equal(ui.elements.configState.textContent,'Custom · '+ui.api.UI_TEXT.en.unconfiguredStatus);
            assert.equal(ui.elements['card-custom'].classList.contains('provider-configured'),false);
            assert.equal(require('./runtime-harness').createRuntime('content.js',{stored:ui.data}).api.getActiveTranslationConfig(ui.data).config.configured,false);
            await input(ui,'apiUrl','https://replacement.test/v1/chat/completions');
        }
        await ui.elements.saveBtn.fire('click');
        assert.equal(ui.permissions.length,1);
        assert.equal(ui.data.providerMigrationPending,false);
    }
});

test('迁移不覆盖已存在的 custom，包括空配置；旧扁平下线配置同样迁移', () => {
    for (const custom of [{},{apiKey:'existing-key',apiUrl:'https://existing.test/v1/chat/completions',model:'existing-model',testedAt:123}]) {
        const initial={selectedProvider:'kimi',providerConfigs:{custom,kimi:{apiKey:'retired-key',model:'retired-model',apiUrl:'https://old.test'}}};
        const ui=createPopup(initial);
        assert.deepEqual(ui.data.providerConfigs.custom,custom);
        assert.deepEqual(ui.data.providerConfigs.kimi,initial.providerConfigs.kimi);
        assert.equal(ui.elements.apiKey.value,custom.apiKey || '');
    }
    const ui=createPopup({selectedProvider:'zhipu',customApiKey:'legacy-key',customApiUrl:'https://legacy.test',customModel:'legacy-model'});
    assert.equal(ui.data.providerConfigs,undefined);
    assert.equal(ui.elements.apiKey.value,'legacy-key');
    assert.equal(ui.elements.apiUrl.value,'https://legacy.test');
    assert.equal(ui.elements.modelName.value,'legacy-model');
});

test('SW 不可用时只读显示待迁移服务商，保存不会覆盖未归档凭证', async () => {
    const initial = {selectedProvider:'kimi', translationMode:'ai',
        providerConfigs:{kimi:{apiKey:'legacy-key',apiUrl:'https://legacy.test/chat/completions',model:'legacy-model'}}};
    const ui = createPopup(initial);
    assert.equal(ui.elements.apiKey.value,'legacy-key');
    await ui.elements.saveBtn.fire('click');
    assert.deepEqual(ui.data,initial);
    assert.equal(ui.elements.status.textContent,ui.api.UI_TEXT.en.saveFailed);
});

test('旧模型由 SW 持久回落推荐项，弹窗预览只归一化显示', async () => {
    const configs={openai:{apiKey:'key',model:'gpt-6-astra',testedAt:123},anthropic:{apiKey:'claude-key',model:'claude-fable-5-1'},deepseek:{apiKey:'deep-key',model:'old-model'},custom:{apiKey:'custom-key',model:'keep-model'}};
    const worker = createRuntime('background.js', {stored:{selectedProvider:'anthropic',providerConfigs:configs}});
    await worker.send({type:'migrateSettings'});
    const ui=createPopup(worker.data);
    assert.equal(ui.data.providerConfigs.openai.model,'gpt-6-luna');
    assert.equal(ui.data.providerConfigs.anthropic.model,'claude-haiku-5-5');
    assert.equal(ui.data.providerConfigs.deepseek.model,'old-model');   // 手动填写的模型名不改写
    assert.equal(ui.data.providerConfigs.custom.model,'keep-model');
    assert.equal(ui.data.providerConfigs.openai.testedAt,undefined);
    assert.equal(ui.data.providerConfigs.openai.apiKey,'key');
    assert.equal(ui.elements.modelName.value,'claude-haiku-5-5');
    const oldHaiku=createPopup({selectedProvider:'anthropic',providerConfigs:{anthropic:{apiKey:'key',model:'claude-haiku-4-5-20251001'}}});
    assert.equal(oldHaiku.data.providerConfigs.anthropic.model,'claude-haiku-4-5-20251001');
    assert.equal(oldHaiku.elements.modelName.value,'claude-haiku-5-5');
    for (const selectedProvider of ['google','minimax','zhipu','kimi','openai','anthropic']) {
        const initial={selectedProvider,providerConfigs:configs,customApiKey:'legacy-key'};
        assert.equal(JSON.stringify(worker.api.migrateProviderSettings(initial)),JSON.stringify(ui.api.migrateProviderSettings(initial)));
    }
    for (const [provider,ids] of Object.entries({openai:['gpt-6-luna','gpt-6.1-terra','gpt-6.1-sol'],anthropic:['claude-haiku-5-5','claude-sonnet-5-5','claude-opus-5-5'],deepseek:['deepseek-flash','deepseek-v4-pro']})) {
        assert.deepEqual(Array.from(ui.api.PRESETS[provider].models,m=>m.id),ids);
    }
});

test('下线提示与精简保存说明覆盖全部 14 种语言', () => {
    const ui=createPopup();
    assert.equal(Object.keys(ui.api.UI_TEXT).length,14);
    for (const [lang,pack] of Object.entries(ui.api.UI_TEXT)) {
        assert.ok(pack.providerRetired);
        if (lang!=='en') assert.notEqual(pack.providerRetired,ui.api.UI_TEXT.en.providerRetired);
        assert.ok(pack.saveOnlyHint.length < 130,lang+' 保存说明应精简');
    }
});

test('已保存的手动模型重开弹窗后原样显示，不被换成推荐模型', () => {
    const ui=createPopup({selectedProvider:'openai',translationMode:'ai',providerConfigs:{openai:{apiKey:'k',
        apiUrl:'https://api.openai.com/v1/chat/completions',model:'my-finetune',testedAt:5}}});
    assert.equal(ui.elements.modelName.value,'my-finetune');
    assert.equal(ui.elements.manualModelSection.hidden,false);
    assert.equal(ui.data.providerConfigs.openai.model,'my-finetune');
});
