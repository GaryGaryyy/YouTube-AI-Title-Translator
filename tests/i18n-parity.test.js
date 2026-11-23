const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 这个测试的价值：i18n 文案分散在 content.js / popup.js 的多张表里，
// 加语言或加 key 时容易漏——这里把"所有语言的键位必须与 en 完全一致"钉死。

// content.js 需要的最小 chrome/document/window 桩
const storageData = {};
globalThis.chrome = {
    storage: {
        local: {
            get(keys, cb) { cb({}); },
            set(values, cb) { if (cb) cb(); }
        },
        onChanged: { addListener() {} }
    },
    runtime: { sendMessage() {} }
};
globalThis.document = {
    readyState: 'loading',
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; }
};
globalThis.window = { addEventListener() {}, innerHeight: 800 };

const content = require('../content.js');
// popup.js 顶层只在 DOMContentLoaded 注册回调，桩一个 addEventListener 即可
const popup = require('../popup.js');

function assertSameKeys(reference, pack, label) {
    assert.deepEqual(Object.keys(pack).sort(), Object.keys(reference).sort(), `${label} 键位与基准不一致`);
}

test('CONTENT_TEXT: 所有界面语言键位与 en 一致', () => {
    for (const [lang, pack] of Object.entries(content.CONTENT_TEXT)) {
        assertSameKeys(content.CONTENT_TEXT.en, pack, `CONTENT_TEXT.${lang}`);
    }
});

test('TARGET_STATUS_TEXT: 所有目标语言键位与 en 一致', () => {
    for (const [lang, pack] of Object.entries(content.TARGET_STATUS_TEXT)) {
        assertSameKeys(content.TARGET_STATUS_TEXT.en, pack, `TARGET_STATUS_TEXT.${lang}`);
    }
});

test('TAG_LABELS: 每个 tag 的语言集合一致', () => {
    const reference = content.TAG_LABELS["科技"];
    for (const [tag, labels] of Object.entries(content.TAG_LABELS)) {
        assertSameKeys(reference, labels, `TAG_LABELS.${tag}`);
    }
});

test('UI_TEXT: popup 所有界面语言键位与 en 一致', () => {
    for (const [lang, pack] of Object.entries(popup.UI_TEXT)) {
        assertSameKeys(popup.UI_TEXT.en, pack, `UI_TEXT.${lang}`);
        for (const [key, value] of Object.entries(pack)) {
            assert.ok(typeof value === 'string' && value.trim(), `UI_TEXT.${lang}.${key}`);
            if (lang !== 'en') assert.notEqual(value, popup.UI_TEXT.en[key], `UI_TEXT.${lang}.${key} 英文回落`);
        }
    }
});

test('_locales: 每个语言的 messages.json 可解析且包含商店三件套', () => {
    const localesDir = path.join(__dirname, '..', '_locales');
    const dirs = fs.readdirSync(localesDir)
        .filter(d => fs.existsSync(path.join(localesDir, d, 'messages.json')));
    assert.ok(dirs.length >= 13, `期望至少 13 个语言目录，实际 ${dirs.length}`);
    for (const dir of dirs) {
        const messages = JSON.parse(fs.readFileSync(path.join(localesDir, dir, 'messages.json'), 'utf8'));
        for (const key of ['extName', 'extDescription', 'actionTitle']) {
            assert.ok(messages[key] && typeof messages[key].message === 'string' && messages[key].message.length > 0,
                `_locales/${dir} 缺少 ${key}`);
        }
    }
});
