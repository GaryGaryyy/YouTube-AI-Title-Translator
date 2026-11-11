const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime,title,aiSettings,settle} = require('./runtime-harness');
const spanish = 'Cómo preparar deliciosas recetas caseras';
const builtin = (detectedLanguage='es',confidence=0.99) => ({create:async()=>({detect:async()=>[{detectedLanguage,confidence}]})});
const requests = runtime => runtime.messages.filter(msg=>msg.type==='translateBatch');
function candidate(runtime,text=spanish) {
    const item=title(text); runtime.titles.push(item.el); return item;
}
test('AI 目标 es + 内置检测 es 时跳过，不渲染 badge、不发送请求', async () => {
    const runtime=createRuntime('content.js',{stored:aiSettings(),extra:{LanguageDetector:builtin('es',0.6)}});
    let fallback=0; runtime.chrome.i18n.detectLanguage=()=>{fallback++;};
    const item=candidate(runtime);
    await runtime.api.process();
    assert.equal(item.el.getAttribute('data-gary-done'),'skip');
    assert.equal(item.parent.querySelectorAll().length,0); assert.equal(requests(runtime).length,0);
    assert.equal(fallback,0);
});
test('AI Chrome i18n 检测可靠且第一名至少 80% 时跳过', async () => {
    const runtime=createRuntime('content.js',{stored:aiSettings()});
    runtime.chrome.i18n.detectLanguage=(text,cb)=>cb({isReliable:true,languages:[{language:'es',percentage:80}]});
    const item=candidate(runtime); await runtime.api.process();
    assert.equal(item.el.getAttribute('data-gary-done'),'skip'); assert.equal(requests(runtime).length,0);
});
test('AI 检测缺失、不可信或失败时继续翻译；可由 i18n 接替低置信度内置检测', async () => {
    for (const mode of ['missing','lowBuiltin','unreliable','lowPercent','throw','different']) {
        const runtime=createRuntime('content.js',{stored:aiSettings(),extra:mode==='lowBuiltin'?{LanguageDetector:builtin('es',0.59)}:{}});
        if (mode==='unreliable')runtime.chrome.i18n.detectLanguage=(text,cb)=>cb({isReliable:false,languages:[{language:'es',percentage:99}]});
        if (mode==='lowPercent')runtime.chrome.i18n.detectLanguage=(text,cb)=>cb({isReliable:true,languages:[{language:'es',percentage:79}]});
        if (mode==='throw')runtime.chrome.i18n.detectLanguage=()=>{throw Error('unavailable');};
        if (mode==='different')runtime.chrome.i18n.detectLanguage=(text,cb)=>cb({isReliable:true,languages:[{language:'fr',percentage:100}]});
        const item=candidate(runtime); await runtime.api.process(); await settle();
        assert.equal(requests(runtime).length,1,mode); assert.equal(item.parent.querySelectorAll().length,1,mode);
    }
    const runtime=createRuntime('content.js',{stored:aiSettings(),extra:{LanguageDetector:builtin('fr',0.3)}});
    runtime.chrome.i18n.detectLanguage=(text,cb)=>cb({isReliable:true,languages:[{language:'es',percentage:99}]});
    const item=candidate(runtime); await runtime.api.process();
    assert.equal(item.el.getAttribute('data-gary-done'),'skip');
});
test('AI 目标 en 的无英文标记词长标题也检测并跳过', async () => {
    const runtime=createRuntime('content.js',{stored:aiSettings('en'),extra:{LanguageDetector:builtin('en')}});
    const item=candidate(runtime,'Quantum entanglement experiments reveal surprising microscopic patterns');
    assert.equal(runtime.api.shouldTranslateTitle(item.el.textContent),true);
    await runtime.api.process();
    assert.equal(item.el.getAttribute('data-gary-done'),'skip'); assert.equal(requests(runtime).length,0);
});
test('AI 等待检测时配置变化、关闭、移出文档或标题变化都会放弃并清理处理标记', async () => {
    for (const mode of ['config','disabled','detached','text']) {
        let complete;
        const runtime=createRuntime('content.js',{stored:aiSettings()});
        runtime.chrome.i18n.detectLanguage=(text,cb)=>{complete=cb;};
        const item=candidate(runtime); const processing=runtime.api.process();
        assert.equal(item.el.getAttribute('data-gary-done'),'true');
        if(mode==='config')runtime.api.applyConfigFromStorage(aiSettings('de'));
        if(mode==='disabled')runtime.api.applyConfigFromStorage({...aiSettings(),enabled:false});
        if(mode==='detached')item.el.isConnected=false;
        if(mode==='text')item.el.textContent='A different title';
        complete({isReliable:true,languages:[{language:'es',percentage:99}]});
        await processing;
        assert.equal(item.el.getAttribute('data-gary-done'),null,mode);
        assert.equal(item.el.dataset.garyOriginal,undefined,mode);
        assert.equal(requests(runtime).length,0,mode); assert.equal(item.parent.querySelectorAll().length,0,mode);
    }
});
test('慢拉丁检测不阻塞非拉丁请求和缓存命中标题，也不额外检测它们', async () => {
    let complete, detected=[];
    const runtime=createRuntime('content.js',{stored:aiSettings()});
    runtime.chrome.i18n.detectLanguage=(text,cb)=>{detected.push(text);complete=cb;};
    candidate(runtime);
    const nonLatin=candidate(runtime,'こんにちは世界');
    const cached=candidate(runtime,'Recetas caseras fáciles para principiantes');
    runtime.api.cacheSet(cached.el.textContent,{tag:'科技',translatedTitle:'Cached translation'},'es');
    const pending=runtime.api.process();
    assert.equal(requests(runtime).length,1);
    assert.deepEqual(requests(runtime)[0].items,[nonLatin.el.textContent]);
    assert.equal(cached.parent.querySelectorAll().length,1);
    assert.deepEqual(detected,[spanish]);
    complete({isReliable:true,languages:[{language:'es',percentage:99}]});
    await pending;
});
test('AI 原样译文折叠空白且忽略大小写后 skip，移除 badge、恢复样式，同时缓存', async () => {
    for (const main of [false,true]) {
        const runtime=createRuntime('content.js',{stored:aiSettings('zh-Hans')});
        const item=title('Hello WORLD',{main});
        const box=runtime.api.createSafeBadge('x','pending',main,item.el.textContent,'','pending',item.targetElement);
        runtime.api.attachTitleBadge(item.el,item.targetElement,main,box,item.el.textContent);
        runtime.chrome.runtime.sendMessage=async()=>({ok:true,results:[{tag:'科技',translatedTitle:'  hello \n world  '}]});
        await runtime.api.translateChunk([{text:item.el.textContent,box,el:item.el,targetElement:item.targetElement}]);
        assert.equal(box.isConnected,false);
        assert.equal(item.el.getAttribute('data-gary-done'),'skip');
        assert.equal(item.el.classList.contains('gary-en-sub'),false);
        assert.equal(item.targetElement.classList.contains('gary-original-source-hidden'),false);
        assert.equal(runtime.api.cacheGet(item.el.textContent).translatedTitle,'  hello \n world  ');
        await runtime.api.flushCacheWrites();
    }
});
test('AI 原样译文缓存命中直接 skip，不调用检测器或渲染；旧 {text,box} 调用仍可用', async () => {
    const runtime=createRuntime('content.js',{stored:aiSettings()});
    runtime.chrome.i18n.detectLanguage=()=>{throw Error('cached titles must not be detected');};
    const item=candidate(runtime);
    runtime.api.cacheSet(spanish,{tag:'科技',translatedTitle:'  '+spanish.toUpperCase()+'  '},'es');
    await runtime.api.process();
    assert.equal(item.el.getAttribute('data-gary-done'),'skip'); assert.equal(item.parent.querySelectorAll().length,0);
    assert.equal(requests(runtime).length,0);
    const box=runtime.api.createSafeBadge('x','y');
    runtime.chrome.runtime.sendMessage=async()=>({ok:true,results:[{tag:'科技',translatedTitle:'plain title'}]});
    await runtime.api.translateChunk([{text:'Plain Title',box}]);
    assert.equal(box.isConnected,false); assert.equal(runtime.api.cacheGet('Plain Title').translatedTitle,'plain title');
});


test('较早完成的检测在等待其它标题期间配置变化，旧候选也不会以新配置入队', async () => {
    const runtime=createRuntime('content.js',{stored:aiSettings()});
    const completions=[];
    runtime.chrome.i18n.detectLanguage=(text,cb)=>completions.push(cb);
    const first=candidate(runtime);
    const second=candidate(runtime,'Explorando lugares maravillosos cerca de casa');
    const processing=runtime.api.process();
    completions[0]({isReliable:false,languages:[]});
    await settle();
    assert.equal(first.parent.querySelectorAll().length,1);
    runtime.api.applyConfigFromStorage(aiSettings('de'));
    completions[1]({isReliable:false,languages:[]});
    await processing;
    assert.equal(requests(runtime).length,0);
    assert.equal(first.parent.querySelectorAll().length,0);
    assert.equal(first.el.getAttribute('data-gary-done'),null);
    assert.equal(second.el.getAttribute('data-gary-done'),null);
});
