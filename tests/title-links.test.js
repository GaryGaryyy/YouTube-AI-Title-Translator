const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime,title,aiSettings,settle,source} = require('./runtime-harness');
function badge(runtime,options={}) {
    const item=title('Hello world',options);
    const box=runtime.api.createSafeBadge('x','y',item.isMainTitle,item.el.textContent,'','done',item.targetElement);
    assert.equal(runtime.api.attachTitleBadge(item.el,item.targetElement,item.isMainTitle,box,item.el.textContent),true);
    return {...item,box};
}
test('可链接 badge 为 a，包含 href 与 tabindex=-1；主标题、无链接、嵌套链接保持 div', () => {
    const runtime=createRuntime('content.js');
    const linked=badge(runtime);
    assert.equal(linked.box.tagName,'A'); assert.equal(linked.box.href,linked.targetElement.href); assert.equal(linked.box.tabIndex,-1);
    for(const options of [{main:true},{linked:false},{nested:true}]) assert.equal(badge(runtime,options).box.tagName,'DIV');
});
test('普通左键 preventDefault 并调用 YouTube 链接 click，修饰键与中键放行', async () => {
    const runtime=createRuntime('content.js');
    const {box,targetElement}=badge(runtime);
    assert.equal(await box.fire('click'),true); assert.equal(targetElement.clicks,1);
    for(const data of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{button:2}]) {
        assert.equal(await box.fire('click',data),false); assert.equal(targetElement.clicks,1);
    }
    assert.equal(await box.fire('auxclick',{button:1}),false);
    assert.equal(await box.fire('contextmenu',{button:2}),false);
});
test('error 状态即使有修饰键或中键也阻止导航并重试', async () => {
    const runtime=createRuntime('content.js',{stored:aiSettings('zh-Hans')});
    const {box,targetElement}=badge(runtime);
    for(const data of [{},{ctrlKey:true},{metaKey:true},{button:1}]) {
        box.dataset.garyState='error';
        assert.equal(await box.fire('click',data),true);
        await settle();
    }
    box.dataset.garyState='error';
    assert.equal(await box.fire('auxclick',{button:1}),true);
    await settle();
    assert.equal(runtime.messages.filter(msg=>msg.type==='translateBatch').length,5);
    assert.equal(targetElement.clicks,0);
});
test('pointerdown、mousedown、auxclick 和 contextmenu 刷新复用节点的 href', async () => {
    const runtime=createRuntime('content.js');
    const {box,targetElement}=badge(runtime);
    for(const event of ['pointerdown','mousedown','auxclick','contextmenu']) {
        targetElement.href='https://www.youtube.com/watch?v='+event;
        assert.equal(await box.fire(event,{button:1}),false);
        assert.equal(box.href,targetElement.href);
    }
});
test('div 主标题仍保留原点击行为，链接样式继承颜色且无下划线', async () => {
    const runtime=createRuntime('content.js');
    const {box,el}=badge(runtime,{main:true});
    assert.equal(await box.fire('click'),true); assert.equal(el.clicks,1);
    const css=source('styles.css');
    assert.match(css,/\.gary-cn-box\s*\{[^}]*text-decoration:\s*none/);
    assert.match(css,/\.gary-cn-box\s*\{[^}]*color:\s*inherit/);
    assert.match(css,/\.gary-cn-box:hover\s*\{[^}]*text-decoration:\s*none/);
});
