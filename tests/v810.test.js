const test = require('node:test');
const assert = require('node:assert/strict');
const { createRuntime, title, aiSettings, settle, source, plain } = require('./runtime-harness');

test('普通外语标题均会进入翻译，消息只包含标题与目标语言，配置只保留布尔和批量大小', async () => {
    const runtime = createRuntime('content.js', {stored:aiSettings('zh-Hans')});
    runtime.titles.push(...['Xi Jinping speech highlights', 'Human Rights news', 'Democracy explained'].map(text => title(text).el));
    await runtime.api.process();
    const requests = runtime.messages.filter(msg => msg.type === 'translateBatch');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].items.length, 3);
    assert.deepEqual(Object.keys(requests[0]).sort(), ['items','targetLanguage','type']);
    assert.deepEqual(Object.keys(runtime.api.getActiveTranslationConfig(aiSettings()).config).sort(), ['batchSize','configured']);
    assert.doesNotMatch(JSON.stringify(requests), /test-key|example\.test/);
});

function localRuntime(availability, create) {
    let detections = 0;
    const runtime = createRuntime('content.js', {stored:{translationMode:'local',targetLanguage:'de',uiLanguage:'en'}, extra:{
        LanguageDetector:{async create(){return {async detect(text){detections++; return [{detectedLanguage:text.includes('Spanish') ? 'es' : 'en'}];}};}},
        Translator:{availability,create}
    }});
    return Object.assign(runtime,{detections:()=>detections});
}
async function localBadge(runtime, text) {
    const entry = title(text);
    await runtime.api.processBuiltinCandidate({text,...entry});
    return entry.parent.children[0];
}

test('downloadable/downloading 不自动创建翻译器，使用界面语言显示源语言并提供 download 状态', async () => {
    for (const availability of ['downloadable','downloading']) {
        let calls=0;
        const runtime=localRuntime(async()=>availability,()=>{calls++;});
        const box=await localBadge(runtime,'English title');
        assert.equal(calls,0);
        assert.equal(box.dataset.garyState,'download');
        assert.equal(box.dataset.garySource,'en');
        assert.match(box.querySelector('.gary-cn-title').textContent,/English/);
        for (const child of box.children) assert.equal(child.classList.contains('gary-error'),false);
        assert.equal(runtime.messages.filter(msg=>msg.type==='translateBatch').length,0);
    }
});

test('下载点击立即 create，成功后自动重试同语言对、清 availability 缓存，其他语言对不动', async () => {
    let creates=0, available=0, release;
    const gate=new Promise(resolve=>{release=resolve;});
    const runtime=localRuntime(async()=>{available++;return 'downloadable';}, options=>{
        creates++; assert.equal(options.sourceLanguage,'en'); return gate;
    });
    const first=await localBadge(runtime,'First English title');
    const same=await localBadge(runtime,'Second English title');
    const different=await localBadge(runtime,'Spanish title');
    const detections=runtime.detections();
    assert.equal(await first.fire('click'),true);
    assert.equal(creates,1);
    assert.equal(runtime.detections(),detections);
    assert.equal(first.dataset.garyState,'pending');
    release({translate:async text=>'Übersetzt '+text});
    await settle();
    assert.equal(first.dataset.garyState,'done');
    assert.equal(same.dataset.garyState,'done');
    assert.equal(different.dataset.garyState,'download');
    assert.equal(creates,1);
    assert.equal(available,2);
    await localBadge(runtime,'Another English title');
    assert.equal(available,3);
});

test('创建失败恢复 download，Cmd 和中键阻止视频跳转并可再次点击', async () => {
    let calls=0;
    const runtime=localRuntime(async()=>'downloadable',()=>{
        calls++;
        if (calls===1) return Promise.reject(new Error('Download interrupted'));
        if (calls===2) throw new Error('Download unavailable');
        return Promise.resolve({translate:async()=>'Übersetzt'});
    });
    const box=await localBadge(runtime,'Download retry title');
    assert.equal(await box.fire('click',{metaKey:true}),true);
    await settle(); assert.equal(box.dataset.garyState,'download');
    assert.equal(await box.fire('auxclick',{button:1}),true);
    await settle(); assert.equal(box.dataset.garyState,'download');
    assert.equal(box.querySelector('.gary-cn-title').classList.contains('gary-error'),false);
    await box.fire('click'); await settle();
    assert.equal(box.dataset.garyState,'done'); assert.equal(calls,3);
});

test('已创建翻译器的真正翻译失败仍显示 error；不支持 DisplayNames 时回落语言代码', async () => {
    const runtime=localRuntime(async()=>'downloadable',async()=>({translate:async()=>{throw new Error('Translation failed');}}));
    runtime.context.Intl={DisplayNames:class {constructor(){throw new Error('unsupported');}}};
    const box=await localBadge(runtime,'English failure title');
    assert.match(box.querySelector('.gary-cn-title').textContent,/\ben\b/);
    await box.fire('click'); await settle();
    assert.equal(box.dataset.garyState,'error');
});

const activeSettings = () => ({enabled:true,translationMode:'ai',selectedProvider:'custom',targetLanguage:'es',
    providerConfigs:{custom:{apiKey:'first-key',apiUrl:'https://first.test/v1/chat/completions',model:'first-model'}}});
function backgroundRuntime(stored, fetch) {
    return createRuntime('background.js',{stored,extra:{AbortSignal,fetch}});
}
const reply = () => ({ok:true,status:200,json:async()=>({choices:[{message:{content:'{"items":[{"i":0,"translatedTitle":"Traducido"}]}'}}]})});
test('后台忽略页面传入凭证，每次读 storage；Key、端点、模型变化及 SW 重启均生效', async () => {
    const calls=[];
    const fetch=async(url,options)=>{calls.push({url,...options,body:JSON.parse(options.body)}); return reply();};
    const runtime=backgroundRuntime(activeSettings(),fetch);
    const message={type:'translateBatch',items:['Current title'],targetLanguage:'es',config:{apiKey:'injected-key',apiUrl:'https://injected.test',model:'injected-model'}};
    assert.equal((await runtime.send(message)).ok,true);
    const next={apiKey:'second-key',apiUrl:'https://second.test/v1/chat/completions',model:'second-model'};
    runtime.data.providerConfigs.custom=next;
    runtime.change({providerConfigs:{newValue:runtime.data.providerConfigs}});
    assert.equal((await runtime.send(message)).ok,true);
    assert.deepEqual(calls.map(call=>[call.url,call.headers.Authorization,call.body.model]),[
        ['https://first.test/v1/chat/completions','Bearer first-key','first-model'],
        ['https://second.test/v1/chat/completions','Bearer second-key','second-model']]);
    const restarted=backgroundRuntime(runtime.data,fetch);
    assert.equal((await restarted.send(message)).ok,true);
    assert.equal(calls[2].headers.Authorization,'Bearer second-key');
});

test('迁移后待确认期间不自动翻译，走现有错误路径，不产生未处理异常', async () => {
    const runtime=backgroundRuntime({translationMode:'ai',targetLanguage:'es',selectedProvider:'minimax',
        providerConfigs:{minimax:{apiKey:'saved-key',apiUrl:'https://api.minimax.io/v1/chat/completions',model:'saved-model'}}},
        async()=>{throw new TypeError('Failed to fetch');});
    const result=await runtime.send({type:'translateBatch',items:['Old provider title'],targetLanguage:'es'});
    assert.equal(result.ok,false); assert.equal(result.error.type,'cancelled');   // 迁移待确认：不发请求
    assert.equal(runtime.data.selectedProvider,'custom');
    assert.equal(runtime.data.providerMigrationPending,true);
    assert.deepEqual(plain(runtime.data.providerConfigs.custom),{apiKey:'saved-key',apiUrl:'https://api.minimax.io/v1/chat/completions',model:'saved-model'});
});

test('四家服务商列表、8.1.0 版本和精确域名权限一致，不注入其他 YouTube 子域', () => {
    const manifest=JSON.parse(source('manifest.json'));
    assert.equal(manifest.version,'8.1.0');
    assert.equal(JSON.parse(source('package.json')).version,'8.1.0');
    assert.match(source('content.js'),/v8\.1\.0/);
    assert.deepEqual(manifest.content_scripts[0].matches,['https://www.youtube.com/*','https://m.youtube.com/*']);
    assert.deepEqual(manifest.host_permissions,[...manifest.content_scripts[0].matches,
        'https://api.deepseek.com/*','https://api.openai.com/*','https://api.anthropic.com/*']);
    assert.deepEqual(manifest.optional_host_permissions,['https://*/*','http://*/*']);
    const api=createRuntime('popup.js').api;
    assert.deepEqual(Object.keys(api.PRESETS),['openai','anthropic','deepseek','custom']);
    assert.equal((source('popup.html').match(/class="provider-card"/g)||[]).length,4);
    assert.match(source('popup.html'),/grid-template-columns:repeat\(4,/);
    assert.match(source('popup.html'),/GaryGaryyy\/YouTube-AI-Title-Translator\/issues/);
});

test('旧预设没有可用 URL 时，content 仍请求后台迁移；回复不泄露配置且重复读取不再写入', async () => {
    const stored={translationMode:'ai',selectedProvider:'google',providerConfigs:{google:{apiKey:'legacy-key',apiUrl:'https://old.test/{MODEL}',model:'old-model'}}};
    const page=createRuntime('content.js',{stored});
    assert.equal(page.messages.some(msg=>msg.type==='migrateSettings'),true);
    assert.equal(page.api.getActiveTranslationConfig(stored).config.configured,false);
    const worker=backgroundRuntime(stored,async()=>{throw new Error('No network expected');});
    assert.deepEqual(plain(await worker.send({type:'migrateSettings'})),{ok:true});
    assert.equal(worker.data.providerConfigs.custom.apiUrl,'');
    const writes=worker.writes.length;
    assert.deepEqual(plain(await worker.send({type:'migrateSettings'})),{ok:true});
    assert.equal(worker.writes.length,writes);
});

test('发布文档包含精确权限、服务商和初次引导说明，当前 README 不保留过时服务商', () => {
    const fs=require('node:fs');
    const readmes=fs.readdirSync(require('node:path').join(__dirname,'..')).filter(name=>/^README(?:\.[a-z]+)?\.md$/.test(name));
    assert.equal(readmes.length,14);
    for (const file of [...readmes,'PRIVACY.md','CHROME_STORE_LISTING.md','CHROME_WEB_STORE_PRIVACY_FORM.md']) {
        const text=source(file);
        for (const domain of ['www.youtube.com','m.youtube.com','api.openai.com','api.anthropic.com','api.deepseek.com']) assert.ok(text.includes(domain),file+' '+domain);
        for (const provider of ['OpenAI','Claude','DeepSeek']) assert.ok(text.includes(provider),file+' '+provider);
    }
    assert.match(source('RELEASE_NOTES_v8.1.0.md'),/OpenAI \/ Claude 的新模型参数未用真实 Key 实测，仅 DeepSeek 实测/);
    assert.match(source('RELEASE_NOTES_v8.1.0.md'),/## English/);
});

// 对抗式 review 补的三处
test('已有 custom 配置时迁移：下线服务商的 Key 归档保留，确认前不向 custom 发请求', async () => {
    let calls=0;
    const runtime=backgroundRuntime({translationMode:'ai',targetLanguage:'es',selectedProvider:'kimi',
        providerConfigs:{kimi:{apiKey:'kimi-key',apiUrl:'https://api.moonshot.ai/v1/chat/completions',model:'kimi-k3'},
            minimax:{apiKey:'mm-key',apiUrl:'u',model:'m'},
            custom:{apiKey:'custom-key',apiUrl:'https://api.openai.com/v1/chat/completions',model:'x'}}},
        async()=>{calls++; throw new TypeError('should not be called');});
    const result=await runtime.send({type:'translateBatch',items:['Title'],targetLanguage:'es'});
    assert.equal(result.ok,false); assert.equal(calls,0);
    assert.equal(runtime.data.retiredProviderConfigs.kimi.apiKey,'kimi-key');
    assert.equal(runtime.data.retiredProviderConfigs.minimax.apiKey,'mm-key');
    assert.equal(runtime.data.providerConfigs.custom.apiKey,'custom-key');
    assert.equal(runtime.data.providerConfigs.kimi,undefined);
    await runtime.send({type:'translateBatch',items:['Title'],targetLanguage:'es'});   // 再读一次：归档不被清空
    assert.equal(runtime.data.retiredProviderConfigs.kimi.apiKey,'kimi-key');
});
test('手动填写的非预设模型不会被后台读取改回默认值', async () => {
    const runtime=backgroundRuntime({translationMode:'ai',targetLanguage:'es',selectedProvider:'openai',
        providerConfigs:{openai:{apiKey:'k',apiUrl:'https://api.openai.com/v1/chat/completions',model:'my-finetune',testedAt:5}}},
        async()=>{throw new TypeError('Failed to fetch');});
    await runtime.send({type:'translateBatch',items:['Title'],targetLanguage:'es'});
    assert.equal(runtime.data.providerConfigs.openai.model,'my-finetune');
    assert.equal(runtime.data.providerConfigs.openai.testedAt,5);
});
test('下载完成与扫描交错：拿着旧 availability 晚到的新标题也会自动补译，不停在 download', async () => {
    const runtime=localRuntime(async()=>'downloadable', async()=>({translate:async text=>'Übersetzt '+text}));
    const first=await localBadge(runtime,'First English title');
    await first.fire('click'); await settle();
    assert.equal(first.dataset.garyState,'done');
    // 模拟扫描在下载完成前就取到了 downloadable，渲染却发生在完成之后
    const late=title('Late English title');
    const box=runtime.context.createSafeBadge('x','x',false,late.el.textContent,'','pending',late.el);
    runtime.context.attachTitleBadge(late.el,late.el,false,box,late.el.textContent);
    runtime.context.renderDownload(box,'en','de');
    await settle(); await settle();
    assert.equal(box.dataset.garyState,'done');
});
