const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const migration = require('../migration/notice.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'migration', 'notice.js'), 'utf8');

class Element {
    constructor(tag) { this.tagName=tag.toUpperCase(); this.children=[]; this.attrs={}; this.listeners={}; this.textContent=''; this.hidden=false; }
    setAttribute(key,value) { this.attrs[key]=String(value); }
    appendChild(child) { child.parent=this; this.children.push(child); return child; }
    append(...children) { children.forEach(child=>this.appendChild(child)); }
    prepend(child) { child.parent=this; this.children.unshift(child); }
    remove() { if(this.parent) this.parent.children=this.parent.children.filter(child=>child!==this); this.parent=null; }
    attachShadow() { this.testShadow=new Element('shadow-root'); return this.testShadow; }
    addEventListener(event,handler) { (this.listeners[event] ||= []).push(handler); }
    fire(event) { for(const handler of this.listeners[event] || []) handler(); }
}
function walk(root, predicate) {
    if(predicate(root)) return root;
    for(const child of root.children || []) { const found=walk(child,predicate); if(found) return found; }
    return null;
}
function fixture({id=migration.LEGACY_ID,popup=false,initial={},readFails=false,writeFails=false,loading=false}={}) {
    const data={customApiKey:'private-test-key',providerConfigs:{deepseek:{apiKey:'private-provider-key'}},...initial};
    const reads=[],writes=[],storageListeners=[],documentListeners={};
    const body=new Element('body'), main=new Element('main'); body.appendChild(main);
    const document={body,readyState:loading?'loading':'complete',fullscreenElement:null,
        createElement(tag) {return new Element(tag);},
        getElementById(id) {return walk(body,node=>node.id===id);},
        querySelector(selector) {assert.equal(selector,'.app-shell main'); return main;},
        addEventListener(event,handler) {(documentListeners[event] ||= []).push(handler);}
    };
    const chrome={runtime:{id,lastError:null},i18n:{getUILanguage(){return 'en-US';}},storage:{
        onChanged:{addListener(handler){storageListeners.push(handler);}},local:{
            get(keys,callback){reads.push([...keys]); chrome.runtime.lastError=readFails?{message:'read failed'}:null;
                callback(Object.fromEntries(keys.map(key=>[key,data[key]]))); chrome.runtime.lastError=null;},
            set(values,callback){writes.push(values); chrome.runtime.lastError=writeFails?{message:'write failed'}:null;
                if(!writeFails) Object.assign(data,values); callback(); chrome.runtime.lastError=null;}
        }
    },tabs:{create(){throw new Error('No automatic tabs');}}};
    const now=1700000000000;
    const env={document,chrome,Date:{now(){return now;}},navigator:{language:'en-US'},
        location:{protocol:popup?'chrome-extension:':'https:',pathname:popup?'/popup.html':'/'},
        fetch(){throw new Error('No network request');},open(){throw new Error('No automatic navigation');}
    };
    return {env,data,reads,writes,now,main,
        launch(){return migration.start(env);},
        host(){return document.getElementById('ytatt-legacy-migration-notice');},
        find(tag){const host=this.host(); return host && walk(host.testShadow,node=>node.tagName===tag.toUpperCase());},
        change(changes,area='local'){storageListeners.forEach(handler=>handler(changes,area));},
        documentEvent(event){(documentListeners[event] || []).forEach(handler=>handler());}
    };
}

test('migration: 只在指定旧 ID 运行，正式条目与普通网页不显示提醒或访问存储',()=>{
    for(const id of [migration.OFFICIAL_ID,'',undefined,'another-extension-id']) {
        const ui=fixture({id:id ?? ''}); assert.equal(ui.launch(),null); assert.equal(ui.host(),null); assert.deepEqual(ui.reads,[]);
    }
});
test('migration: 页面提醒与正式版按钮真实渲染，不自动打开页面，也不读取 Key',()=>{
    const ui=fixture({initial:{uiLanguage:'zh-Hans'}}); ui.launch();
    assert.equal(ui.find('h2').textContent,'请切换到正式版');
    const link=ui.find('a'); assert.equal(link.textContent,'前往正式版');
    assert.equal(link.href,'https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk');
    assert.equal(link.target,'_blank'); assert.equal(link.rel,'noopener noreferrer');
    assert.deepEqual(ui.reads,[['uiLanguage',migration.SNOOZE_KEY]]);
    assert.deepEqual(ui.writes,[]); assert.equal(ui.data.customApiKey,'private-test-key');
    assert.equal(ui.host().attrs['data-context'],'page');
});
test('migration: 稍后提醒只写入七天时间，不覆盖旧配置',()=>{
    const ui=fixture(); ui.launch(); const before=structuredClone(ui.data);
    ui.find('button').fire('click');
    assert.deepEqual(ui.writes,[{[migration.SNOOZE_KEY]:ui.now+migration.SNOOZE_MS}]);
    assert.equal(ui.host(),null);
    assert.deepEqual(ui.data,{...before,[migration.SNOOZE_KEY]:ui.now+migration.SNOOZE_MS});
});
test('migration: 七天内页面不重复提醒，弹窗一直保留正式版入口，过期恢复页面提醒',()=>{
    const until=1700000000000+migration.SNOOZE_MS;
    const page=fixture({initial:{[migration.SNOOZE_KEY]:until}}); page.launch(); assert.equal(page.host(),null);
    const popup=fixture({popup:true,initial:{[migration.SNOOZE_KEY]:until}}); popup.launch();
    assert.ok(popup.host()); assert.equal(popup.main.children[0],popup.host()); assert.equal(popup.find('button'),null);
    const expired=fixture({initial:{[migration.SNOOZE_KEY]:1700000000000-1}}); expired.launch(); assert.ok(expired.host());
});
test('migration: 提醒时间异常不会永久隐藏迁移入口',()=>{
    const now=1700000000000;
    for(const value of [NaN,Infinity,'9999999999999',now+migration.SNOOZE_MS+1,null]) assert.equal(migration.isSnoozed(value,now),false);
    assert.equal(migration.isSnoozed(now+1,now),true);
    assert.equal(migration.isSnoozed(now,now),false);
});
test('migration: 跨标签页同步稍后提醒，不隐藏插件弹窗入口',()=>{
    const page=fixture(),popup=fixture({popup:true}); page.launch(); popup.launch();
    const changes={[migration.SNOOZE_KEY]:{newValue:page.now+migration.SNOOZE_MS}};
    page.change(changes); popup.change(changes);
    assert.equal(page.host(),null); assert.ok(popup.host());
    page.change({[migration.SNOOZE_KEY]:{newValue:0}}); assert.ok(page.host());
});
test('migration: 保存稍后提醒失败时保持入口、显示本地化错误并允许重试',()=>{
    const ui=fixture({writeFails:true,initial:{uiLanguage:'zh-Hans'}}); ui.launch();
    const button=ui.find('button'); button.fire('click'); assert.ok(ui.host()); assert.equal(button.disabled,false);
    const error=walk(ui.host().testShadow,node=>node.className==='error');
    assert.equal(error.textContent,'无法保存提醒时间，请重试。'); assert.equal(ui.data[migration.SNOOZE_KEY],undefined);
});
test('migration: 存储读取失败仍显示提醒，界面文字变化及时更新且不混用翻译目标',()=>{
    const ui=fixture({readFails:true,initial:{uiLanguage:'zh-Hans',targetLanguage:'ja'}}); ui.launch();
    assert.equal(ui.find('h2').textContent,migration.COPY.en[0]);
    ui.change({uiLanguage:{newValue:'ar'}}); assert.equal(ui.host().attrs.dir,'rtl');
    assert.equal(ui.find('a').textContent,migration.COPY.ar[2]);
    ui.change({uiLanguage:{newValue:'zh-Hans'}},'sync'); assert.equal(ui.host().attrs.dir,'rtl');
    ui.change({targetLanguage:{newValue:'ja'}}); assert.equal(ui.find('a').textContent,migration.COPY.ar[2]);
});
test('migration: 全屏视频中隐藏页面提醒，退出全屏恢复',()=>{
    const ui=fixture(); ui.launch(); assert.equal(ui.host().hidden,false);
    ui.env.document.fullscreenElement={}; ui.documentEvent('fullscreenchange'); assert.equal(ui.host().hidden,true);
    ui.env.document.fullscreenElement=null; ui.documentEvent('fullscreenchange'); assert.equal(ui.host().hidden,false);
});
test('migration: 等待 DOM 后只插入一份提醒，支持真实浏览器脚本入口',()=>{
    const ui=fixture({loading:true}); vm.runInNewContext(source,ui.env);
    assert.equal(ui.host(),null); ui.documentEvent('DOMContentLoaded'); assert.ok(ui.host());
    ui.env.document.readyState='complete';
    ui.launch(); assert.equal(ui.env.document.body.children.filter(node=>node.id==='ytatt-legacy-migration-notice').length,1);
});
test('migration: 14 种现有界面及繁体中文有完整通知文案与正确方向',()=>{
    assert.equal(Object.keys(migration.COPY).length,15);
    for(const [language,copy] of Object.entries(migration.COPY)) {
        assert.equal(copy.length,6); assert.ok(copy.every(text=>typeof text==='string' && text.trim()));
        const ui=fixture({initial:{uiLanguage:language}}); ui.launch();
        assert.equal(ui.find('a').textContent,copy[2]);
        assert.equal(ui.host().attrs.dir,language==='ar'?'rtl':'ltr');
        assert.equal(ui.find('section').attrs['aria-label'],copy[0]);
    }
    assert.equal(migration.resolveLanguage('zh_CN'),'zh-Hans');
    assert.equal(migration.resolveLanguage('zh-TW'),'zh-Hant');
    assert.equal(migration.resolveLanguage('de-DE'),'de');
    assert.equal(migration.resolveLanguage('unknown'),'en');
});
