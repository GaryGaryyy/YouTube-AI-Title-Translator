const test = require('node:test');
const assert = require('node:assert/strict');
const {source} = require('./runtime-harness');

test('页面译文继承字体、使用逻辑边距，并支持浅暗色下载提示与非淡化悬停', () => {
    const css=source('styles.css');
    assert.doesNotMatch(css,/PingFang|Microsoft YaHei|margin-right|prefers-color-scheme/);
    assert.match(css,/font-family:\s*inherit/);
    assert.match(css,/margin-inline-end:/);
    assert.match(css,/\.gary-cn-box\[data-gary-state="download"\]\s*\{[^}]*cursor:\s*pointer/);
    assert.match(css,/html\[dark\] \.gary-cn-box\[data-gary-state="download"\] \.gary-tag\s*\{/);
    assert.match(css,/html\[dark\] \.gary-cn-box\[data-gary-state="download"\] \.gary-cn-title\s*\{[^}]*color:\s*#aaa/);
    assert.match(css,/\.gary-cn-title\.gary-error,[^{]+\{[^}]*font-size:\s*1\.3rem;[^}]*font-weight:\s*400;[^}]*color:\s*#606060;[^}]*-webkit-line-clamp:\s*2;[^}]*overflow:\s*hidden;/);
    const hoverRules=[...css.matchAll(/([^{}]*\.gary-cn-box[^{}]*:hover[^{}]*)\{([^{}]*)\}/g)];
    assert.ok(hoverRules.length>0);
    for (const [,selector,body] of hoverRules) assert.doesNotMatch(body,/opacity\s*:/,selector);
    assert.match(css,/\.gary-cn-box:not\(\.gary-main-title-box\):hover \.gary-cn-title\s*\{[^}]*text-decoration:\s*underline/);
});
