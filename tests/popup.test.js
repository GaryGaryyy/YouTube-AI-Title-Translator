const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
const reviewedCopy = fs.readFileSync(path.join(__dirname, '..', 'popup-locales.js'), 'utf8');
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
function createPopup(initial = {}, response = { ok:true, result:{tag:'科技',translatedTitle:'示例译文'} }, browserLanguage = '') {
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
    const data = structuredClone(initial), messages = [], permissions = [];
    let setError = false, grant = true, messagingError = false, messagingThrows = false;
    const chrome = { i18n:{getUILanguage:()=>browserLanguage}, runtime:{lastError:null,getManifest(){return {version:'8.0.4'};},sendMessage(message,callback){
        messages.push(structuredClone(message));
        if (messagingThrows) throw new Error('Extension context invalidated');
        if (messagingError) {
            chrome.runtime.lastError = {message:'test communication failure'};
            callback(undefined);
            chrome.runtime.lastError = null;
            return;
        }
        if (typeof response === 'function') response(message,callback);
        else callback(structuredClone(response));
    }}, storage:{ local:{
        get(defaults,callback){ callback(Object.assign({}, defaults, structuredClone(data))); },
        set(values,callback){
            chrome.runtime.lastError = setError ? {message:'test storage failure'} : null;
            if (!setError) Object.assign(data, structuredClone(values));
            if (callback) callback();
            chrome.runtime.lastError = null;
        },
        remove(key,callback){ delete data[key]; if(callback)callback(); }
    }}, permissions:{async request(request){ permissions.push(request); return grant; }} };
    const context = vm.createContext({document,chrome,URL,Date,console,module:{exports:{}}});
    vm.runInContext(reviewedCopy,context,{filename:'popup-locales.js'});
    vm.runInContext(source,context,{filename:'popup.js'});
    onReady();
    return { elements:ids, data, messages, permissions, document, api:context.module.exports,
        failStorage(value){setError=value;}, failMessaging(value){messagingError=value;}, throwMessaging(value){messagingThrows=value;}, grantPermission(value){grant=value;} };
}
const seed = () => ({ translationMode:'ai', selectedProvider:'openai', uiLanguage:'zh-Hans', targetLanguage:'zh-Hans',
    providerConfigs:{openai:{apiKey:'saved-test-key',apiUrl:'https://api.openai.com/v1/chat/completions',model:'gpt-6-luna'}},
    customApiKey:'saved-test-key',customApiUrl:'https://api.openai.com/v1/chat/completions',customModel:'gpt-6-luna' });
async function input(ui,id,value,event='input'){ui.elements[id].value=value;await ui.elements[id].fire(event);}

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

test('旧版扁平配置与手动模型保留；默认使用已保存的云端配置', () => {
    const ui=createPopup({selectedProvider:'openai',customApiKey:'legacy-test-key',
        customApiUrl:'https://api.openai.com/v1/chat/completions',customModel:'gpt-5.5'});
    assert.equal(ui.elements.aiSettings.hidden,false);
    assert.equal(ui.elements.apiKey.value,'legacy-test-key');
    assert.equal(ui.elements.modelName.value,'gpt-5.5');
    assert.equal(ui.elements.modelSelect.value,'__custom_model__');
    assert.equal(ui.elements.manualModelSection.hidden,false);
    assert.equal(ui.elements.apiKey.type,'password');
});

test('切换服务商和模式保留未保存的 Key 与手动模型；不会提前写入配置', async () => {
    const ui=createPopup(seed());
    await input(ui,'apiKey','draft-test-key');
    await input(ui,'modelSelect','__custom_model__','change');
    await input(ui,'modelName','manual-model');
    await ui.elements['card-google'].fire('click');
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
    assert.equal(ui.messages[0].type,'testTranslation');
    assert.equal(ui.elements.aiSettings.disabled,true);
    assert.equal(ui.data.providerConfigs.openai.apiKey,'saved-test-key');
    await ui.elements['card-google'].fire('click');
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
    assert.equal(ui.messages.length,0);
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
    assert.equal(ui.messages.length,0);
    assert.equal(ui.permissions.length,0);
    await input(ui,'apiUrl','https://example.com/v1/chat/completions');
    ui.grantPermission(false);
    await ui.elements.testBtn.fire('click');
    assert.equal(ui.permissions.length,1);
    assert.equal(ui.messages.length,0);
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
