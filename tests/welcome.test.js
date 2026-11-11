const test = require('node:test');
const assert = require('node:assert/strict');
const {Element,source} = require('./runtime-harness');
const {WELCOME_TEXT} = require('../welcome-locales.js');
const {initWelcome,WELCOME_TARGET_LANGUAGES} = require('../welcome.js');
function makeDoc() {
    const ids={};
    for (const id of ['title','subtitle','targetLabel','localNote','localUnsupported','aiNote','pinTip','openYouTube','privacy','targetLanguage','saveStatus',
        'beforeLabel','afterLabel','exampleOriginal','exampleTranslated','exampleOriginalAfter','chooseLanguage','pinTitle']) ids[id]=new Element(id==='targetLanguage'?'select':'p');
    return {documentElement:{},ids,getElementById:id=>ids[id],createElement:tag=>new Element(tag)};
}
function makeChrome(stored={},language='zh-CN') {
    const writes=[];
    const chrome={i18n:{getUILanguage:()=>language},runtime:{},storage:{local:{get(keys,cb){cb(stored);},set(value,cb){writes.push(value);cb();}}}};
    return {chrome,writes};
}
test('welcome 14 种文案键位齐全，无空串、无英文回落', () => {
    assert.deepEqual(Object.keys(WELCOME_TEXT).sort(),['zh-Hans','en','ja','ko','th','es','fr','de','pt','id','vi','ru','ar','hi'].sort());
    for (const [language,copy] of Object.entries(WELCOME_TEXT)) {
        for (const key of ['beforeLabel','afterLabel','exampleOriginal','exampleTranslated','chooseLanguage','pinTitle']) {
            assert.ok(typeof copy[key]==='string' && copy[key].trim(),`${language}.${key}`);
        }
        assert.deepEqual(Object.keys(copy).sort(),Object.keys(WELCOME_TEXT.en).sort());
        for (const [key,text] of Object.entries(copy)) {
            assert.ok(typeof text==='string' && text.trim(),`${language}.${key}`);
            if(language!=='en')assert.notEqual(text,WELCOME_TEXT.en[key],`${language}.${key}`);
        }
    }
});
test('welcome 14 种界面均渲染前后示例和三步文案，译文与原文不同', async () => {
    const html=source('welcome.html');
    const steps=html.match(/<ol class="steps"[^>]*>([\s\S]*?)<\/ol>/)[1];
    assert.equal([...steps.matchAll(/<li>/g)].length,3);
    assert.match(steps,/<li>\s*<h2 id="chooseLanguage"[\s\S]*?<li>\s*<a id="openYouTube"[\s\S]*?<li>\s*<h2 id="pinTitle"/);
    assert.equal([...html.matchAll(/class="thumbnail" aria-hidden="true"/g)].length,2);
    assert.match(html,/id="exampleTranslated"[\s\S]*?id="exampleOriginalAfter"/);
    for (const [language,copy] of Object.entries(WELCOME_TEXT)) {
        const doc=makeDoc(),{chrome}=makeChrome({uiLanguage:language});
        await initWelcome(doc,chrome,WELCOME_TEXT,true);
        for (const id of ['beforeLabel','afterLabel','exampleOriginal','exampleTranslated','chooseLanguage','openYouTube','pinTitle']) {
            assert.match(html,new RegExp(`id="${id}"`));
            assert.equal(doc.ids[id].textContent,copy[id],`${language}.${id}`);
        }
        assert.notEqual(copy.exampleOriginal,copy.exampleTranslated,language);
        assert.equal(doc.ids.exampleOriginalAfter.textContent,copy.exampleOriginal);
        assert.equal(doc.documentElement.dir,language==='ar'?'rtl':'ltr');
    }
});
test('welcome 渲染浏览器默认值和 12 种原生语言名，加载不写存储；改动仅保存目标语言', async () => {
    const doc=makeDoc(), {chrome,writes}=makeChrome();
    await initWelcome(doc,chrome,WELCOME_TEXT,true);
    assert.equal(doc.documentElement.lang,'zh-Hans'); assert.equal(doc.documentElement.dir,'ltr');
    assert.equal(doc.ids.targetLanguage.value,'zh-Hans');
    assert.deepEqual(doc.ids.targetLanguage.children.map(option=>[option.value,option.textContent]),WELCOME_TARGET_LANGUAGES);
    assert.equal(doc.ids.title.textContent,WELCOME_TEXT['zh-Hans'].title);
    assert.equal(doc.ids.localNote.hidden,false); assert.equal(doc.ids.localUnsupported.hidden,true);
    assert.equal(writes.length,0);
    doc.ids.targetLanguage.value='ja'; await doc.ids.targetLanguage.fire('change');
    assert.deepEqual(writes,[{targetLanguage:'ja'}]);
    assert.equal(doc.ids.saveStatus.textContent,WELCOME_TEXT['zh-Hans'].saved);
});
test('welcome 保存的英文优先；ar 设置 lang 和 rtl；不支持本机翻译仅显示醒目说明', async () => {
    for (const lang of ['en','ar']) {
        const doc=makeDoc(),{chrome}=makeChrome({uiLanguage:lang,targetLanguage:'en'});
        await initWelcome(doc,chrome,WELCOME_TEXT,false);
        assert.equal(doc.documentElement.lang,lang); assert.equal(doc.documentElement.dir,lang==='ar'?'rtl':'ltr');
        assert.equal(doc.ids.targetLanguage.value,'en');
        assert.equal(doc.ids.localNote.hidden,true); assert.equal(doc.ids.localUnsupported.hidden,false);
        assert.equal(doc.ids.localUnsupported.textContent,WELCOME_TEXT[lang].localUnsupported);
    }
});
test('welcome 无 chrome 的静态预览正常渲染，变更不抛错、不保存', async () => {
    const doc=makeDoc();
    await initWelcome(doc,null,WELCOME_TEXT,false);
    assert.equal(doc.documentElement.lang,'en'); assert.equal(doc.ids.targetLanguage.value,'en');
    await doc.ids.targetLanguage.fire('change');
    assert.equal(doc.ids.saveStatus.textContent,'');
});
test('welcome 保存 callback 失败、同步异常、Promise 拒绝显示当前语言失败文案', async () => {
    for (const mode of ['callback','throw','promise']) {
        const doc=makeDoc(),{chrome}=makeChrome();
        chrome.storage.local.set=(values,cb)=>{
            if (mode==='throw') throw Error('fail');
            if (mode==='promise') return Promise.reject(Error('fail'));
            chrome.runtime.lastError={message:'fail'}; cb(); chrome.runtime.lastError=null;
        };
        await initWelcome(doc,chrome,WELCOME_TEXT,true);
        doc.ids.targetLanguage.value='de'; await doc.ids.targetLanguage.fire('change');
        assert.equal(doc.ids.saveStatus.textContent,WELCOME_TEXT['zh-Hans'].saveFailed);
        assert.equal(doc.ids.saveStatus.className,'error');
    }
});
test('welcome HTML 使用本地外部脚本、指定 YouTube 链接和无障碍主题样式', () => {
    const html=source('welcome.html');
    assert.equal([...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].length,2);
    for (const [,body] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) assert.equal(body.trim(),'');
    assert.match(html,/href="https:\/\/www.youtube.com\/" target="_blank" rel="noopener"/);
    assert.match(html,/prefers-color-scheme:dark/); assert.match(html,/:focus-visible/);
    assert.match(html,/icon\/icon128.png/); assert.match(html,/--accent:#d9153c/);
    assert.doesNotMatch(source('welcome.js'),/innerHTML/);
});
test('welcome 仅主链接使用按钮样式，资源均本地加载且保留窄屏布局', () => {
    const html=source('welcome.html');
    for (const [,src] of html.matchAll(/\bsrc="([^"]+)"/g)) {
        assert.doesNotMatch(src,/^(?:[a-z]+:|\/\/)/i);
    }
    assert.doesNotMatch(html,/<link\b|@import|url\s*\(/i);
    const links=html.match(/(?:^|\n)\s*a\s*\{([^}]+)\}/)[1];
    assert.doesNotMatch(links,/background|padding|border-radius|display/);
    assert.match(html,/#openYouTube\s*\{[^}]*background:var\(--accent\)/);
    assert.match(html,/@media \(max-width:600px\)/);
    assert.match(html,/\[dir="rtl"\] \.preview-arrow::before/);
});
