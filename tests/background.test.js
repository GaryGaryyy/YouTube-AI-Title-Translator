const test = require('node:test');
const assert = require('node:assert/strict');

// background.js 顶层会注册 chrome.runtime.onMessage，先打桩再 require
let messageHandler;
globalThis.chrome = { runtime: { onMessage: { addListener(handler) { messageHandler = handler; } } } };
const bg = require('../background.js');

// ---------- JSON 解析器（病态模型输出） ----------

test('parseSingleTranslationFromText: 纯 JSON 对象', () => {
    const r = bg.parseSingleTranslationFromText('{"tag":"科技","translatedTitle":"你好世界"}');
    assert.deepEqual(r, { tag: '科技', translatedTitle: '你好世界' });
});

test('parseSingleTranslationFromText: markdown 围栏', () => {
    const r = bg.parseSingleTranslationFromText('```json\n{"tag":"游戏","translatedTitle":"这个游戏太好玩了"}\n```');
    assert.equal(r.translatedTitle, '这个游戏太好玩了');
    assert.equal(r.tag, '游戏');
});

test('parseSingleTranslationFromText: 散文包围 + think 标签', () => {
    const raw = '<think>用户在测试我</think>Sure! Here you go: {"tag":"音乐","translatedTitle":"新歌发布"} Hope this helps!';
    const r = bg.parseSingleTranslationFromText(raw);
    assert.equal(r.translatedTitle, '新歌发布');
    assert.equal(r.tag, '音乐');
});

test('parseSingleTranslationFromText: 双 JSON 重复也能取到一个有效结果', () => {
    const raw = '{"tag":"科技","translatedTitle":"甲"}{"tag":"科技","translatedTitle":"甲"}';
    const r = bg.parseSingleTranslationFromText(raw);
    assert.equal(r.translatedTitle, '甲');
});

test('parseSingleTranslationFromText: 备用字段名', () => {
    assert.equal(bg.parseSingleTranslationFromText('{"translated_title":"hola","category":"影视"}').translatedTitle, 'hola');
    assert.equal(bg.parseSingleTranslationFromText('{"cn":"你好"}').translatedTitle, '你好');
});

test('parseSingleTranslationFromText: 非法 tag 归一为 其它', () => {
    const r = bg.parseSingleTranslationFromText('{"tag":"体育新闻","translatedTitle":"x"}');
    assert.equal(r.tag, '其它');
});

test('parseSingleTranslationFromText: 完全无 JSON 返回 null', () => {
    assert.equal(bg.parseSingleTranslationFromText('I cannot translate this.'), null);
});

test('parseBatchTranslationsFromText: items 包装 + 乱序按 i 对齐', () => {
    const raw = '{"items":[{"i":1,"tag":"游戏","translatedTitle":"乙"},{"i":0,"tag":"科技","translatedTitle":"甲"}]}';
    const arr = bg.parseBatchTranslationsFromText(raw, 2);
    assert.equal(bg.findBatchResult(arr, 0).translatedTitle, '甲');
    assert.equal(bg.findBatchResult(arr, 1).translatedTitle, '乙');
});

test('parseBatchTranslationsFromText: 裸数组 + 位置兜底', () => {
    const arr = bg.parseBatchTranslationsFromText('[{"translatedTitle":"甲"},{"translatedTitle":"乙"}]', 2);
    assert.equal(bg.findBatchResult(arr, 0).translatedTitle, '甲');
    assert.equal(bg.findBatchResult(arr, 1).translatedTitle, '乙');
});

test('parseBatchTranslationsFromText: 数字键对象', () => {
    const arr = bg.parseBatchTranslationsFromText('{"0":{"translatedTitle":"甲"},"1":{"translatedTitle":"乙"}}', 2);
    assert.equal(bg.findBatchResult(arr, 0).translatedTitle, '甲');
    assert.equal(bg.findBatchResult(arr, 1).translatedTitle, '乙');
});

test('parseBatchTranslationsFromText: 垃圾输入返回 null', () => {
    assert.equal(bg.parseBatchTranslationsFromText('totally broken', 2), null);
});

// ---------- 错误分类 ----------

test('classifyApiError: 状态码与正文优先级', () => {
    assert.equal(bg.classifyApiError(401, {}).type, 'auth');
    assert.equal(bg.classifyApiError(403, {}).type, 'auth');
    assert.equal(bg.classifyApiError(429, {}).type, 'quota');
    assert.equal(bg.classifyApiError(402, {}).type, 'quota');
    assert.equal(bg.classifyApiError(404, {}).type, 'model');
    assert.equal(bg.classifyApiError(500, {}).type, 'service');
    // 正文里的 "invalid api key" 优先于 400 → model 的判定
    assert.equal(bg.classifyApiError(400, { error: { message: 'invalid api key provided' } }).type, 'auth');
});

test('classifyApiError: 400 只有明确指向模型才归为模型错误', () => {
    assert.equal(bg.classifyApiError(400, { error: { message: 'Model Not Exist' } }).type, 'model');
    // 参数类 400（如 max_tokens 不被支持）不该误导成"模型名可能错误"
    assert.equal(bg.classifyApiError(400, { error: { message: 'Unsupported parameter: max_tokens' } }).type, 'parameter');
    assert.equal(bg.classifyApiError(400, { error: { message: 'This model does not support temperature' } }).type, 'parameter');
});

// ---------- 请求体构造（OpenAI 兼容性回归） ----------

test('buildChatCompletionsBody: api.openai.com 只发 max_completion_tokens，不发 max_tokens/temperature', () => {
    const body = bg.buildChatCompletionsBody(
        { apiUrl: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.5' },
        'prompt', 500, 'system'
    );
    assert.ok(body.max_completion_tokens >= 4096, '为推理和最终译文保留共同输出额度');
    assert.equal(body.reasoning_effort, 'low');
    assert.ok(!('max_tokens' in body), 'gpt-5/o 系列对 max_tokens 直接 400');
    assert.ok(!('temperature' in body), 'reasoning 模型拒绝自定义 temperature');
});

test('buildChatCompletionsBody: OpenAI 兼容服务保持 max_tokens + temperature', () => {
    const body = bg.buildChatCompletionsBody(
        { apiUrl: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
        'prompt', 500, 'system'
    );
    assert.equal(body.max_tokens, 500);
    assert.equal(body.temperature, 0.3);
    assert.ok(!('max_completion_tokens' in body));
    assert.ok(!('thinking' in body), 'V3 系列 deepseek-chat 不发思考开关');
});

test('buildChatCompletionsBody: DeepSeek V4 官方接口关闭思考模式', () => {
    const body = bg.buildChatCompletionsBody(
        { apiUrl: 'https://api.deepseek.com/chat/completions', model: 'deepseek-v4-flash' },
        'prompt', 500, 'system'
    );
    assert.deepEqual(body.thinking, { type: 'disabled' });
    assert.equal(body.max_tokens, 500);
    assert.equal(body.temperature, 0.3);
    assert.ok(!('max_completion_tokens' in body));

    // 自定义端点即使模型同名也不发未知参数，避免严格服务端 400
    const custom = bg.buildChatCompletionsBody(
        { apiUrl: 'https://example.com/v1/chat/completions', model: 'deepseek-v4-flash' },
        'prompt', 500, 'system'
    );
    assert.ok(!('thinking' in custom));
});

test('新预设的推理参数按官方服务商分别处理，不影响自定义网关', () => {
    const build = (apiUrl, model) => bg.buildChatCompletionsBody({ apiUrl, model }, 'prompt', 500, 'system');
    for (const model of ['gpt-6-luna','gpt-6.1-terra']) {
        const body=build('https://api.openai.com/v1/chat/completions',model);
        assert.equal(body.reasoning_effort,'none');
        assert.equal(body.max_completion_tokens,500);
        assert.ok(!('temperature' in body));
    }
    for (const model of ['gpt-6.1-sol', 'gpt-6-astra']) {
        const body = build('https://api.openai.com/v1/chat/completions', model);
        assert.equal(body.reasoning_effort, 'low');
        assert.ok(body.max_completion_tokens >= 4096);
    }
    assert.deepEqual(build('https://api.deepseek.com/chat/completions', 'deepseek-flash').thinking, {type:'disabled'});
    const gateway = build('https://api.openai.com.example.org/v1/chat/completions', 'gpt-6-luna');
    assert.equal(gateway.max_tokens, 500);
    assert.ok(!('reasoning_effort' in gateway));
    assert.ok(!('max_completion_tokens' in gateway));
});

test('Claude 5 不复用旧采样参数，预留推理输出预算', () => {
    for (const model of ['claude-haiku-5-5','claude-sonnet-5-5','claude-opus-5-5','claude-fable-5-1']) {
        const body = bg.buildAnthropicBody({model},'prompt',500);
        assert.deepEqual(body.thinking,{type:'adaptive'});
        assert.deepEqual(body.output_config,{effort:'low'});
        assert.ok(!('temperature' in body));
        assert.ok(body.max_tokens >= 4096);
    }
    const haiku = bg.buildAnthropicBody({model:'claude-haiku-4-5-20251001'},'prompt',500);
    assert.ok(!('thinking' in haiku));
    assert.equal(haiku.max_tokens,500);
});

test('响应解析只拼接最终文本，不把 Claude thinking 当作译文', () => {
    assert.equal(bg.extractTextFromResponse({content:[
        {type:'thinking',thinking:'reasoning'}, {type:'text',text:'{"tag":"科技",'}, {type:'text',text:'"translatedTitle":"你好"}'}
    ]},'anthropic'), '{"tag":"科技","translatedTitle":"你好"}');
});

// ---------- 并发队列 ----------

test('enqueueTranslation: 并发上限为 3 且全部 resolve', async () => {
    let running = 0;
    let maxRunning = 0;
    const tasks = Array.from({ length: 8 }, () => bg.enqueueTranslation(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise(r => setTimeout(r, 10));
        running--;
        return { ok: true };
    }));
    const replies = await Promise.all(tasks);
    assert.equal(maxRunning, 3);
    assert.ok(replies.every(r => r.ok));
});

test('enqueueTranslation: 任务抛异常也会 resolve（不会挂起队列）', async () => {
    const reply = await bg.enqueueTranslation(async () => { throw new Error('boom'); });
    assert.equal(reply.ok, false);
    assert.equal(reply.error.type, 'network');
});

// ---------- 批量翻译 + 去重（stub fetch 端到端） ----------

const TEST_CONFIG = {
    apiUrl: 'https://api.deepseek.com/chat/completions',
    apiKey: 'test-key',
    model: 'deepseek-flash',
    targetLanguage: 'zh-Hans'
};

function stubFetch(t, handler) {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        calls.push({ url, options });
        return handler(JSON.parse(options.body), calls.length);
    };
    t.after(() => { globalThis.fetch = original; });
    return calls;
}

function chatReply(content) {
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
}

test('fetchAiTranslationBatchDedup: 重复文本只发一次请求且结果对齐', async (t) => {
    const calls = stubFetch(t, () => chatReply(JSON.stringify({
        items: [
            { i: 0, tag: '科技', translatedTitle: '你好' },
            { i: 1, tag: '游戏', translatedTitle: '世界' }
        ]
    })));
    const reply = await bg.fetchAiTranslationBatchDedup(['Hello', 'Hello', 'World'], TEST_CONFIG);
    assert.equal(calls.length, 1, '重复文本应去重为一次批量请求');
    assert.equal(reply.ok, true);
    assert.deepEqual(reply.results.map(r => r && r.translatedTitle), ['你好', '你好', '世界']);
});

test('fetchAiTranslationBatchDedup: 批量缺项时单条重试补齐', async (t) => {
    const calls = stubFetch(t, (body) => {
        const prompt = body.messages[1].content;
        if (prompt.includes('Input:')) {
            // 批量只回 i:0，缺 i:1
            return chatReply(JSON.stringify({ items: [{ i: 0, tag: '科技', translatedTitle: '甲' }] }));
        }
        // 单条重试
        return chatReply(JSON.stringify({ tag: '音乐', translatedTitle: '乙' }));
    });
    const reply = await bg.fetchAiTranslationBatchDedup(['Title A', 'Title B'], TEST_CONFIG);
    assert.equal(calls.length, 2);
    assert.deepEqual(reply.results.map(r => r && r.translatedTitle), ['甲', '乙']);
    assert.equal(reply.ok, true);
});

test('fetchAiTranslationBatchDedup: 单条批量解析失败时单条重试补齐', async (t) => {
    const calls = stubFetch(t, (body) => {
        const prompt = body.messages[1].content;
        if (prompt.includes('Input:')) {
            // 批量返回垃圾文本，整体解析失败
            return chatReply('抱歉，我无法完成这个请求');
        }
        // 单条重试返回合法 JSON
        return chatReply(JSON.stringify({ tag: '科技', translatedTitle: '甲' }));
    });
    const reply = await bg.fetchAiTranslationBatchDedup(['Title A'], TEST_CONFIG);
    assert.equal(calls.length, 2, '单条批量失败后应再发起一次单条重试');
    assert.equal(reply.ok, true);
    assert.deepEqual(reply.results.map(r => r && r.translatedTitle), ['甲']);
});

test('fetchAiTranslationBatchDedup: 网络失败重试一次后报错但不挂起', async (t) => {
    const calls = stubFetch(t, () => { throw new Error('socket hangup'); });
    const reply = await bg.fetchAiTranslationBatchDedup(['Title A'], TEST_CONFIG);
    assert.equal(calls.length, 4, '批量 2 次尝试 + 单条重试 2 次尝试（fetchWithTimeout 各重试一次）');
    assert.equal(reply.ok, false);
    assert.deepEqual(reply.results, [null]);
    assert.equal(reply.error.type, 'network');
});

test('fetchAiTranslationBatchDedup: HTTP 429 归类为 quota', async (t) => {
    const calls = stubFetch(t, () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'rate limit' } }) }));
    const reply = await bg.fetchAiTranslationBatchDedup(['Title A'], TEST_CONFIG);
    assert.equal(reply.ok, false);
    assert.equal(reply.error.type, 'quota');
    assert.equal(calls.length, 1, 'quota 不可恢复，不触发单条重试');
});

test('fetchAiTranslationBatchDedup: 缺 apiKey 直接 auth 错误，不发请求', async (t) => {
    const calls = stubFetch(t, () => { throw new Error('should not be called'); });
    const reply = await bg.fetchAiTranslationBatchDedup(['Title A'], { model: 'm' });
    assert.equal(calls.length, 0);
    assert.equal(reply.error.type, 'auth');
});

test('Claude 验证和批量请求使用浏览器访问头、adaptive thinking 和独立鉴权', async (t) => {
    let count=0;
    const calls = stubFetch(t, () => ({ok:true,status:200,json:async()=>({content:[{type:'text',text:++count===2 ? 'invalid JSON' : '{"items":[{"i":0,"translatedTitle":"译文"}],"translatedTitle":"译文"}'}]})}));
    const config={apiUrl:'https://api.anthropic.com/v1/messages',apiKey:'test-only-key',model:'claude-haiku-5-5',targetLanguage:'zh-Hans'};
    const batch=await bg.fetchAiTranslationBatchDedup(['Claude request'],config);
    assert.equal(batch.results[0].translatedTitle,'译文');
    await send({type:'testTranslation',text:'Claude test',config});
    for (const call of calls) {
        assert.equal(call.options.headers['anthropic-dangerous-direct-browser-access'],'true');
        assert.equal(call.options.headers['x-api-key'],'test-only-key');
        assert.equal(JSON.parse(call.options.body).thinking.type,'adaptive');
        assert.ok(!('temperature' in JSON.parse(call.options.body)));
    }
    assert.equal(calls.length,3); // 批量验证解析失败后，单条重试路径也必须携带该头。
});

function stubSettings(t, data) {
    const original = globalThis.chrome.storage;
    globalThis.chrome.storage = { local:{ get(keys, callback) {
        callback(Object.fromEntries(keys.map(key => [key, data[key]])));
    }, set(values, callback) { Object.assign(data, values); callback?.(); } } };
    t.after(() => { globalThis.chrome.storage = original; });
}

function activeSettings() {
    return { enabled:true, translationMode:'ai', selectedProvider:'deepseek', targetLanguage:'zh-Hans',
        providerConfigs:{deepseek:{...TEST_CONFIG}} };
}

function send(message) {
    return new Promise(resolve => {
        assert.equal(messageHandler(message, {}, resolve), true);
    });
}

test('切换本机模式后，后台排队的自动翻译取消且完整回复；显式配置测试仍可调用', async (t) => {
    const settings = activeSettings();
    stubSettings(t, settings);
    const calls = stubFetch(t, () => chatReply('{"items":[{"i":0,"translatedTitle":"测试译文"}]}'));
    const releases = [];
    const blockers = Array.from({length:3}, () => bg.enqueueTranslation(() => new Promise(resolve => releases.push(resolve))));
    const pending = send({type:'translateBatch',items:['Queued title','Queued title'],config:TEST_CONFIG});
    settings.translationMode = 'local';
    releases.forEach(resolve => resolve({ok:true}));
    await Promise.all(blockers);
    const cancelled = await pending;
    assert.equal(calls.length,0);
    assert.deepEqual(cancelled.results,[null,null]);
    assert.equal(cancelled.error.type,'cancelled');
    const tested = await send({type:'testTranslation',text:'Queued title',config:TEST_CONFIG});
    assert.equal(tested.ok,true);
    assert.equal(calls.length,1);
});

test('自动翻译只使用当前启用的模型、Key 和目标语言；旧配置任务不发请求', async (t) => {
    const settings = activeSettings();
    stubSettings(t,settings);
    const calls = stubFetch(t, () => chatReply('{"items":[{"i":0,"translatedTitle":"译文"}]}'));
    assert.equal((await send({type:'translate',text:'Current config',config:TEST_CONFIG})).ok,true);
    for (const config of [{...TEST_CONFIG,apiKey:'old-test-key'}, {...TEST_CONFIG,model:'old-model'}, {...TEST_CONFIG,targetLanguage:'en'}]) {
        const reply = await bg.fetchAiTranslationBatchDedup(['Stale config'],config,true);
        assert.equal(reply.error.type,'cancelled');
    }
    settings.enabled = false;
    assert.equal((await send({type:'translate',text:'Paused',config:TEST_CONFIG})).error.type,'cancelled');
    assert.equal(calls.length,1);
});

test('测试不同 Key 的同名模型与标题必须分别发请求，不能误报新 Key 测试通过', async (t) => {
    let release;
    const gate = new Promise(resolve => { release=resolve; });
    const calls = stubFetch(t, async () => {
        await gate;
        return chatReply('{"items":[{"i":0,"translatedTitle":"译文"}]}');
    });
    const first = bg.fetchAiTranslationBatchDedup(['Same title'],TEST_CONFIG);
    const second = bg.fetchAiTranslationBatchDedup(['Same title'],{...TEST_CONFIG,apiKey:'new-test-key'});
    release();
    const replies = await Promise.all([first,second]);
    assert.ok(replies.every(reply=>reply.ok));
    assert.equal(calls.length,2);
    assert.deepEqual(calls.map(call=>call.options.headers.Authorization),['Bearer test-key','Bearer new-test-key']);
});

test('配置测试和页面自动翻译即使同文同 Key 也分别调用，验证不会借用页面结果', async (t) => {
    stubSettings(t,activeSettings());
    let release, started;
    const gate=new Promise(resolve=>{release=resolve;});
    const firstStarted=new Promise(resolve=>{started=resolve;});
    const calls=stubFetch(t,async()=>{
        started();
        await gate;
        return chatReply('{"items":[{"i":0,"translatedTitle":"译文"}]}');
    });
    const automatic=send({type:'translateBatch',items:['Same scope title'],config:TEST_CONFIG});
    await firstStarted;
    const explicit=send({type:'testTranslation',text:'Same scope title',config:TEST_CONFIG});
    release();
    const replies=await Promise.all([automatic,explicit]);
    assert.ok(replies.every(reply=>reply.ok));
    assert.equal(calls.length,2);
});

test('本机模式切换也停止网络失败后的重试与单条补齐请求', async (t) => {
    const settings=activeSettings();
    stubSettings(t,settings);
    const calls=stubFetch(t,()=>{
        settings.translationMode='local';
        throw new Error('test network failure after mode switch');
    });
    const reply=await send({type:'translateBatch',items:['Network mode switch'],config:TEST_CONFIG});
    assert.equal(reply.ok,false);
    assert.equal(calls.length,1);
});
