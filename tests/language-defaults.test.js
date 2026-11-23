const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime, source, plain, aiSettings} = require('./runtime-harness');
const welcome = require('../welcome.js');

const rows = [
    ['zh-CN','zh-Hans','zh-Hans'], ['zh_CN','zh-Hans','zh-Hans'], ['zh-TW','zh-Hans','zh-Hant'],
    ['zh-HK','zh-Hans','zh-Hant'], ['zh-Hant-TW','zh-Hans','zh-Hant'], ['en-US','en','en'],
    ['pt-BR','pt','pt'], ['es-419','es','es'], ['ja','ja','ja'], ['ru','ru','en'], ['ar','ar','en'],
    ['hi','hi','en'], ['nb','en','en'], ['','en','en'], [undefined,'en','en']
];
test('四个运行入口复用共享语言实现，全部语言映射与未知值一致', () => {
    const files = ['content.js','background.js','popup.js','welcome.js'];
    for (const file of files) {
        assert.match(source(file), /require\("\.\/shared\.js"\)/);
        assert.doesNotMatch(source(file), /function getBrowserDefaultLanguages\(/);
    }
    const apis = files.slice(0, 3).map(file => createRuntime(file).api).concat(welcome);
    for (const api of apis) for (const [input, uiLanguage, targetLanguage] of rows) {
        assert.deepEqual(plain(api.getBrowserDefaultLanguages(input)), {uiLanguage,targetLanguage});
    }
});
test('content 默认跟随中文浏览器，非法值跟随默认，显式英文保留', () => {
    const {api} = createRuntime('content.js', {language:'zh-CN'});
    assert.deepEqual(plain(api.getConfig()),{uiLanguage:'zh-Hans',targetLanguage:'zh-Hans'});
    api.applyConfigFromStorage({targetLanguage:'invalid',uiLanguage:'invalid'});
    assert.deepEqual(plain(api.getConfig()),{uiLanguage:'zh-Hans',targetLanguage:'zh-Hans'});
    api.applyConfigFromStorage({targetLanguage:'en',uiLanguage:'en'});
    assert.deepEqual(plain(api.getConfig()),{uiLanguage:'en',targetLanguage:'en'});
});
test('background 无存储目标时使用浏览器默认，不取消一致的自动翻译', async () => {
    const settings = aiSettings(); delete settings.targetLanguage;
    const {api} = createRuntime('background.js',{language:'zh-CN',stored:settings});
    assert.equal(api.getTargetLanguageCode({}), 'zh-Hans');
    assert.equal(api.getTargetLanguageCode({targetLanguage:'en'}), 'en');
    assert.equal(api.getTargetLanguageCode({targetLanguage:'toString'}), 'zh-Hans');
    assert.equal(await api.automaticTranslationStillAllowed({apiKey:settings.customApiKey,
        apiUrl:settings.customApiUrl,model:settings.customModel,targetLanguage:'zh-Hans'}),true);
});
test('getBrowserLanguage 只读 Chrome，不使用 navigator.language', () => {
    for (const file of ['content.js','background.js','popup.js']) {
        const runtime = createRuntime(file, {extra:{navigator:{language:'zh-CN'}}});
        delete runtime.chrome.i18n;
        assert.equal(runtime.api.getBrowserLanguage(), '');
    }
    assert.equal(welcome.getBrowserLanguage(), '');
});
test('onInstalled 仅 install 打开引导页，update 不打开', () => {
    const runtime = createRuntime('background.js');
    runtime.install('update'); assert.equal(runtime.opened.length,0);
    runtime.install('install');
    assert.deepEqual(plain(runtime.opened),[{url:'chrome-extension://test/welcome.html'}]);
});
