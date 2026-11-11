// 用户从未保存过语言时，跟随浏览器界面语言；识别不了的语言回落英文。
function getBrowserDefaultLanguages(browserLanguage) {
    const raw = String(browserLanguage || "").toLowerCase().replace(/_/g, "-");
    const base = raw.split("-")[0];
    if (base === "zh") {
        return { uiLanguage: "zh-Hans", targetLanguage: /-(hant|tw|hk|mo)(-|$)/.test(raw) ? "zh-Hant" : "zh-Hans" };
    }
    const targets = ["en", "ja", "ko", "th", "es", "fr", "de", "pt", "id", "vi"];
    return {
        uiLanguage: targets.concat(["ru", "ar", "hi"]).includes(base) ? base : "en",
        targetLanguage: targets.includes(base) ? base : "en"
    };
}

function getBrowserLanguage() {
    try { return chrome.i18n.getUILanguage(); } catch (e) { return ""; }
}

const WELCOME_TARGET_LANGUAGES = [
    ["zh-Hans", "简体中文"], ["zh-Hant", "繁體中文"], ["en", "English"], ["ja", "日本語"],
    ["ko", "한국어"], ["th", "ไทย"], ["es", "Español"], ["fr", "Français"],
    ["de", "Deutsch"], ["pt", "Português"], ["id", "Bahasa Indonesia"], ["vi", "Tiếng Việt"]
];

function renderWelcome(doc, stored, locales, browserLanguage, localSupported) {
    const defaults = getBrowserDefaultLanguages(browserLanguage);
    const uiLanguage = Object.prototype.hasOwnProperty.call(locales, stored.uiLanguage) ? stored.uiLanguage : defaults.uiLanguage;
    const targetLanguage = WELCOME_TARGET_LANGUAGES.some(([code]) => code === stored.targetLanguage) ? stored.targetLanguage : defaults.targetLanguage;
    const copy = locales[uiLanguage];
    doc.documentElement.lang = uiLanguage;
    doc.documentElement.dir = uiLanguage === "ar" ? "rtl" : "ltr";
    doc.title = copy.title;
    for (const key of ["title", "subtitle", "targetLabel", "localNote", "localUnsupported", "aiNote", "pinTip", "openYouTube", "privacy",
        "beforeLabel", "afterLabel", "exampleOriginal", "exampleTranslated", "chooseLanguage", "pinTitle"]) {
        doc.getElementById(key).textContent = copy[key];
    }
    doc.getElementById("exampleOriginalAfter").textContent = copy.exampleOriginal;
    doc.getElementById("localNote").hidden = !localSupported;
    doc.getElementById("localUnsupported").hidden = localSupported;
    const select = doc.getElementById("targetLanguage");
    select.textContent = "";
    for (const [code, name] of WELCOME_TARGET_LANGUAGES) {
        const option = doc.createElement("option");
        option.value = code;
        option.textContent = name;
        select.appendChild(option);
    }
    select.value = targetLanguage;
    return copy;
}

async function initWelcome(doc, chromeApi, locales, localSupported) {
    let stored = {};
    if (chromeApi && chromeApi.storage && chromeApi.storage.local) {
        stored = await new Promise(resolve => {
            try {
                const pending = chromeApi.storage.local.get(["uiLanguage", "targetLanguage"], result => {
                    resolve(chromeApi.runtime && chromeApi.runtime.lastError ? {} : result || {});
                });
                if (pending && typeof pending.then === "function") pending.then(result => resolve(result || {}), () => resolve({}));
            } catch (e) { resolve({}); }
        });
    }
    let browserLanguage = "";
    try { browserLanguage = chromeApi.i18n.getUILanguage(); } catch (e) { /* 静态预览使用默认值 */ }
    const copy = renderWelcome(doc, stored, locales, browserLanguage, localSupported);
    const select = doc.getElementById("targetLanguage");
    const status = doc.getElementById("saveStatus");
    select.addEventListener("change", async () => {
        if (!chromeApi || !chromeApi.storage || !chromeApi.storage.local) return;
        if (!WELCOME_TARGET_LANGUAGES.some(([code]) => code === select.value)) return;
        try {
            await new Promise((resolve, reject) => {
                const pending = chromeApi.storage.local.set({ targetLanguage: select.value }, () => {
                    if (chromeApi.runtime && chromeApi.runtime.lastError) reject(new Error("Save failed"));
                    else resolve();
                });
                if (pending && typeof pending.then === "function") pending.then(resolve, reject);
            });
            status.className = "";
            status.textContent = copy.saved;
        } catch (e) {
            status.className = "error";
            status.textContent = copy.saveFailed;
        }
    });
}

if (typeof document !== "undefined") {
    initWelcome(document, typeof chrome !== "undefined" ? chrome : null, WELCOME_TEXT,
        typeof Translator !== "undefined" && typeof LanguageDetector !== "undefined");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { getBrowserDefaultLanguages, getBrowserLanguage, WELCOME_TARGET_LANGUAGES, renderWelcome, initWelcome };
}
