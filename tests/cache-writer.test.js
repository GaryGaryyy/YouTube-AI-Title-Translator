const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime, aiSettings, settle} = require('./runtime-harness');
const value = text => ({tag:'科技',translatedTitle:text,ts:123,extra:'discard'});
const entry = (text, mode = 'ai') => [`${mode}\nen\n${text}`,value(text)];
// 清缓存之后翻译出来的条目：时间戳晚于清除时刻（content.js 在翻译完成时打 ts）。
const freshEntry = text => [`ai\nen\n${text}`,{...value(text),ts:Date.now()}];

test('两个模拟标签页仅发送增量，后台合并后两边新增条目均保留', async () => {
    const background = createRuntime('background.js');
    const tabs = [createRuntime('content.js',{stored:aiSettings('en')}),createRuntime('content.js',{stored:aiSettings('en')})];
    for (const tab of tabs) tab.chrome.runtime.sendMessage = msg => background.send(msg);
    tabs[0].api.cacheSet('Tab A',value('A'),'en');
    await tabs[0].api.flushCacheWrites();
    tabs[1].api.cacheSet('Tab B',value('B'),'en');
    await tabs[1].api.flushCacheWrites();
    assert.deepEqual(background.data.translationCache.entries.map(([key])=>key),['ai\nen\nTab A','ai\nen\nTab B']);
    assert.equal(background.data.translationCache.v,2);
    assert.equal(tabs[0].writes.length,0); assert.equal(tabs[1].writes.length,0);
});
test('后台只加载一次并串行合并同时到达的 cachePut，单条更新移至末尾', async () => {
    let reads = 0;
    const runtime = createRuntime('background.js',{getHandler(keys,cb) { reads++; cb({}); }});
    await Promise.all([runtime.send({type:'cachePut',entries:[entry('A')]}),runtime.send({type:'cachePut',entries:[entry('B')]})]);
    await runtime.send({type:'cachePut',entries:[entry('A')]});
    assert.equal(reads,1);
    assert.deepEqual(runtime.data.translationCache.entries.map(([key])=>key),['ai\nen\nB','ai\nen\nA']);
});
test('清缓存后后台从空开始，清除前排队的 cachePut 不复活旧条目', async () => {
    const runtime = createRuntime('background.js');
    await runtime.api.cachePut([entry('old')]);
    const stale = runtime.api.cachePut([entry('queued-old')]);
    delete runtime.data.translationCache;
    runtime.change({translationCache:{oldValue:runtime.writes[0].translationCache}});
    await stale;
    await runtime.api.cachePut([freshEntry('new')]);
    assert.deepEqual(runtime.data.translationCache.entries.map(([key])=>key),['ai\nen\nnew']);
});
test('清缓存使正在等待的旧读取失效，下一次写入不会恢复旧存储', async () => {
    let finishRead;
    const runtime = createRuntime('background.js',{getHandler(keys,cb){ finishRead=cb; }});
    const pending=runtime.api.cachePut([entry('pending')]);
    await settle();
    runtime.change({translationCache:{}});
    finishRead({translationCache:[entry('old')]});
    assert.equal((await pending).ok,true);
    await runtime.api.cachePut([freshEntry('fresh')]);
    assert.deepEqual(runtime.data.translationCache.entries.map(([key])=>key),['ai\nen\nfresh']);
});
test('后台配额失败丢弃最旧的一半后立即重试，重复失败返回 false', async () => {
    let attempts=0;
    const runtime=createRuntime('background.js',{setHandler(values,cb,chrome,data){
        if (++attempts===1) chrome.runtime.lastError={message:'quota'};
        else Object.assign(data,structuredClone(values));
        cb(); chrome.runtime.lastError=null;
    }});
    assert.equal((await runtime.send({type:'cachePut',entries:['A','B','C','D'].map(x=>entry(x))})).ok,true);
    assert.equal(attempts,2);
    assert.deepEqual(runtime.data.translationCache.entries.map(([key])=>key),['ai\nen\nC','ai\nen\nD']);
    const failed=createRuntime('background.js',{setHandler(){throw Error('quota');}});
    assert.equal((await failed.send({type:'cachePut',entries:[entry('failed')]})).ok,false);
});
test('后台兼容裸数组和 v1 包装格式，旧 key 按 tag 补模式前缀并逐条过滤损坏数据', async () => {
    const entries=[['en\nlegacy',value('legacy')],['ja\nlocal',{...value('本机'),tag:'__builtin__'}],entry('modern'),['broken'],[42,null]];
    for (const raw of [entries,{v:1,entries}]) {
        const runtime=createRuntime('background.js',{stored:{translationCache:raw}});
        await runtime.api.cachePut([]);
        assert.deepEqual(runtime.data.translationCache.entries.map(([key])=>key),['ai\nen\nlegacy','local\nja\nlocal','ai\nen\nmodern']);
        assert.deepEqual(Object.keys(runtime.data.translationCache.entries[0][1]).sort(),['tag','translatedTitle','ts']);
    }
});
test('后台拒绝非法 entry，不影响合法条目；错误输入和缺失存储均完整回复', async () => {
    const runtime=createRuntime('background.js');
    const invalid=[null,{},['other\nen\nX',value('x')],[42,value('x')],['ai\n'+'x'.repeat(2000),value('x')],
        ['ai\nx',null],['ai\nx',{tag:'科技',translatedTitle:''}],['ai\nx',{tag:'科技',translatedTitle:'  '}],
        ['ai\nx',{tag:'科技',translatedTitle:'x'.repeat(1001)}],['ai\nx',{tag:5,translatedTitle:'x'}]];
    assert.equal((await runtime.send({type:'cachePut',entries:[...invalid,entry('good')]})).ok,true);
    assert.deepEqual(runtime.data.translationCache.entries.map(([key])=>key),['ai\nen\ngood']);
    assert.equal((await runtime.send({type:'cachePut',entries:null})).ok,false);
    const missing=createRuntime('background.js'); delete missing.chrome.storage;
    assert.equal((await missing.send({type:'cachePut',entries:[]})).ok,false);
});
test('后台容量为 10000，淘汰最旧条目', async () => {
    const runtime=createRuntime('background.js');
    await runtime.api.cachePut(Array.from({length:10002},(_,i)=>entry(String(i))));
    assert.equal(runtime.data.translationCache.entries.length,10000);
    assert.equal(runtime.data.translationCache.entries[0][0],'ai\nen\n2');
});
test('content onChanged 合并其他标签页条目，不覆盖本地；清缓存同时取消待发送队列', async () => {
    const runtime=createRuntime('content.js',{stored:aiSettings('en')});
    runtime.api.cacheSet('same',value('local'),'en');
    runtime.change({translationCache:{newValue:{v:2,entries:[['ai\nen\nsame',value('remote')],entry('other')]}}});
    assert.equal(runtime.api.cacheGet('same').translatedTitle,'local');
    assert.equal(runtime.api.cacheGet('other').translatedTitle,'other');
    runtime.change({translationCache:{}});
    await runtime.api.flushCacheWrites();
    assert.equal(runtime.messages.length,0);
    assert.equal(runtime.api.cacheGet('same'),null);
    assert.equal(runtime.api.cacheGet('other'),null);
    assert.equal(runtime.writes.length,0);
});
test('content 发送失败安静忽略，flush 立即发送且仅发送新增条目', async () => {
    const runtime=createRuntime('content.js',{stored:{...aiSettings('en'),translationCache:[entry('preexisting')]}});
    runtime.api.cacheSet('new',value('new'),'en');
    await runtime.api.flushCacheWrites();
    assert.deepEqual(runtime.messages.map(msg=>msg.type),['cachePut']);
    assert.deepEqual(runtime.messages[0].entries.map(([key])=>key),['ai\nen\nnew']);
    runtime.chrome.runtime.sendMessage=()=>{throw Error('Extension context invalidated');};
    runtime.api.cacheSet('throw',value('throw'),'en');
    await assert.doesNotReject(runtime.api.flushCacheWrites());
    assert.equal(runtime.writes.length,0);
});
