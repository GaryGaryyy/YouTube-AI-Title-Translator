const { getBrowserDefaultLanguages, getBrowserLanguage, SUPPORTED_TARGET_LANGUAGES, SUPPORTED_UI_LANGUAGES } =
    typeof require === "function" ? require("./shared.js") : globalThis.GaryShared;
const welcomeLocalePack = typeof require === "function" ? require("./welcome-locales.js") : null;
const SAMPLE_PREVIEWS = typeof WELCOME_SAMPLE_PREVIEWS !== "undefined"
    ? WELCOME_SAMPLE_PREVIEWS
    : (welcomeLocalePack?.WELCOME_SAMPLE_PREVIEWS || globalThis.WELCOME_SAMPLE_PREVIEWS || {});

const WELCOME_UI_LANGUAGES = [
    ["zh-Hans", "简体中文"], ["en", "English"], ["ja", "日本語"], ["ko", "한국어"],
    ["th", "ไทย"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
    ["pt", "Português"], ["id", "Bahasa Indonesia"], ["vi", "Tiếng Việt"],
    ["ru", "Русский"], ["ar", "العربية"], ["hi", "हिन्दी"]
];

const WELCOME_TARGET_LANGUAGES = [
    ["zh-Hans", "简体中文"], ["zh-Hant", "繁體中文"], ["en", "English"], ["ja", "日本語"],
    ["ko", "한국어"], ["th", "ไทย"], ["es", "Español"], ["fr", "Français"],
    ["de", "Deutsch"], ["pt", "Português"], ["id", "Bahasa Indonesia"], ["vi", "Tiếng Việt"]
];

function getSampleForTarget(targetLanguage, copy) {
    const entry = SAMPLE_PREVIEWS[targetLanguage];
    if (entry) return entry;
    return {
        source: copy.exampleOriginal || "How global creators explain AI tools",
        translated: copy.exampleTranslated || "",
        channel: "Creator Lab · 1.2M views"
    };
}

function renderSampleCards(doc, targetLanguage, copy, liveTranslation) {
    const sample = getSampleForTarget(targetLanguage, copy);
    const setText = (id, text) => { const el = doc.getElementById(id); if (el) el.textContent = text; };
    setText("exampleOriginal", sample.source);
    setText("exampleOriginalAfter", sample.source);
    setText("exampleTranslated", liveTranslation || sample.translated);
    setText("exampleChannelBefore", sample.channel);
    setText("exampleChannelAfter", sample.channel);
    const badge = doc.getElementById("previewBadge");
    if (badge) {
        badge.textContent = liveTranslation ? copy.previewBadgeLive : copy.previewBadgeExample;
        badge.dataset.state = liveTranslation ? "live" : "example";
    }
    const afterCard = doc.getElementById("afterCard");
    if (afterCard) afterCard.dataset.live = liveTranslation ? "ready" : "";
}

function renderWelcome(doc, stored, locales, browserLanguage, localSupported) {
    const defaults = getBrowserDefaultLanguages(browserLanguage);
    const uiLanguage = SUPPORTED_UI_LANGUAGES.has(stored.uiLanguage) ? stored.uiLanguage : defaults.uiLanguage;
    const targetLanguage = SUPPORTED_TARGET_LANGUAGES.has(stored.targetLanguage) ? stored.targetLanguage : defaults.targetLanguage;
    const copy = locales[uiLanguage];
    doc.documentElement.lang = uiLanguage;
    doc.documentElement.dir = uiLanguage === "ar" ? "rtl" : "ltr";
    doc.title = copy.title;
    for (const key of ["title", "subtitle", "targetLabel", "localNote", "localUnsupported", "aiNote", "pinTip", "openYouTube", "privacy",
        "beforeLabel", "afterLabel", "chooseLanguage", "pinTitle", "readyTitle", "pinExtName", "pinStep1", "pinStep2",
        "compareHeading", "compareOrigLabel", "compareOrig", "compareLocalLabel", "compareLocalMeta", "compareLocalResult", "compareLocalNote",
        "compareAiLabel", "compareAiMeta", "compareAiTag", "compareAiResult", "compareAiNote"]) {
        const el = doc.getElementById(key);
        if (el) el.textContent = copy[key];
    }
    const tryBtn = doc.getElementById("tryLocalBtn");
    if (tryBtn) tryBtn.textContent = copy.tryLocal;
    doc.getElementById("localNote").hidden = !localSupported;
    doc.getElementById("localUnsupported").hidden = localSupported;

    const uiSelect = doc.getElementById("uiLanguageSelect");
    if (uiSelect) {
        uiSelect.textContent = "";
        uiSelect.setAttribute?.("aria-label", copy.uiLanguageLabel);
        uiSelect.title = copy.uiLanguageLabel;
        for (const [code, name] of WELCOME_UI_LANGUAGES) {
            const option = doc.createElement("option");
            option.value = code;
            option.textContent = name;
            uiSelect.appendChild(option);
        }
        uiSelect.value = uiLanguage;
    }

    const select = doc.getElementById("targetLanguage");
    select.textContent = "";
    for (const [code, name] of WELCOME_TARGET_LANGUAGES) {
        const option = doc.createElement("option");
        option.value = code;
        option.textContent = name;
        select.appendChild(option);
    }
    select.value = targetLanguage;
    renderSampleCards(doc, targetLanguage, copy, "");
    return { copy, uiLanguage, targetLanguage };
}

function bindLocalTrial(doc, select, getCopy, translatorApi, detectorApi) {
    const row = doc.getElementById("localTrialRow");
    const button = doc.getElementById("tryLocalBtn");
    const status = doc.getElementById("tryLocalStatus");
    const output = doc.getElementById("tryLocalOutput");
    const badge = doc.getElementById("previewBadge");
    const supported = translatorApi && detectorApi;
    let probe;
    let revision = 0;

    function syncTrialVisibility() {
        if (row) row.hidden = button.hidden && !status.textContent;
    }

    function refreshAvailability() {
        const sourceLanguage = select.value === "en" ? "ja" : "en";
        const targetLanguage = select.value === "zh-Hans" ? "zh" : select.value;
        const options = { sourceLanguage, targetLanguage };
        const current = { options, selectedTarget: select.value };
        button.hidden = true;
        syncTrialVisibility();
        if (supported) {
            current.pending = Promise.resolve().then(() => Promise.all([
                detectorApi.availability?.(), translatorApi.availability(options)
            ])).then(states => {
                current.states = states;
                if (probe === current) {
                    const needsDownload = Array.isArray(states) && !states.includes("unavailable") &&
                        states.some(state => ["downloadable", "downloading"].includes(state));
                    button.hidden = !needsDownload;
                    syncTrialVisibility();
                }
                return states;
            }, () => null);
        }
        probe = current;
    }

    refreshAvailability();
    select.addEventListener("change", () => {
        revision++;
        button.disabled = false;
        status.textContent = output.textContent = "";
        status.dataset.kind = "";
        renderSampleCards(doc, select.value, getCopy(), "");
        refreshAvailability();
    });
    button.addEventListener("click", async () => {
        if (button.disabled) return;
        const copy = getCopy();
        output.textContent = "";
        status.dataset.kind = "";
        if (!supported) {
            status.textContent = copy.tryLocalUnsupported;
            status.dataset.kind = "error";
            syncTrialVisibility();
            return;
        }
        const current = probe;
        if (current.states?.includes("unavailable")) {
            status.textContent = copy.tryLocalUnavailable;
            status.dataset.kind = "error";
            refreshAvailability();
            return;
        }

        const request = ++revision;
        const isCurrent = () => request === revision;
        const showProgress = states => {
            if (!isCurrent()) return;
            const latestCopy = getCopy();
            status.textContent = states?.some(state => ["downloadable", "downloading"].includes(state))
                ? latestCopy.tryLocalDownloading : latestCopy.tryLocalWorking;
            if (badge) {
                badge.textContent = latestCopy.previewBadgeWorking;
                badge.dataset.state = "working";
            }
            syncTrialVisibility();
        };
        button.disabled = true;
        showProgress(current.states);
        // availability() is asynchronous. Start both sessions before the first await
        // so an early click can still authorize a download while the probe is pending.
        const start = create => {
            try { return Promise.resolve(create()); }
            catch (error) { return Promise.reject(error); }
        };
        const sessions = [
            start(() => detectorApi.create()),
            start(() => translatorApi.create(current.options))
        ];
        const creation = Promise.all(sessions);
        void creation.catch(() => {});
        let succeeded = false;
        try {
            const states = current.states || await current.pending;
            if (states?.includes("unavailable")) {
                if (isCurrent()) {
                    status.textContent = getCopy().tryLocalUnavailable;
                    status.dataset.kind = "error";
                    renderSampleCards(doc, current.selectedTarget, getCopy(), "");
                    syncTrialVisibility();
                }
                return;
            }
            showProgress(states);
            const [detector, translator] = await creation;
            if (!isCurrent()) return;
            if (!detector || !translator) throw new Error("Creation failed");
            const sample = getSampleForTarget(current.selectedTarget, getCopy()).source;
            const translated = await translator.translate(sample);
            if (!translated?.trim()) throw new Error("Empty translation");
            if (!isCurrent()) return;
            succeeded = true;
            const latestCopy = getCopy();
            renderSampleCards(doc, current.selectedTarget, latestCopy, translated.trim());
            output.textContent = `${sample} → ${translated.trim()}`;
            status.textContent = latestCopy.tryLocalReady;
            status.dataset.kind = "ready";
            button.hidden = true;
            syncTrialVisibility();
        } catch (e) {
            if (isCurrent()) {
                status.textContent = getCopy().tryLocalFailed;
                status.dataset.kind = "error";
                button.hidden = false;
                renderSampleCards(doc, current.selectedTarget, getCopy(), "");
                syncTrialVisibility();
            }
        } finally {
            for (const session of sessions) session.then(instance => instance?.destroy?.()).catch(() => {});
            if (isCurrent()) {
                button.disabled = false;
                if (!succeeded) refreshAvailability();
            }
        }
    });
}

async function initWelcome(doc, chromeApi, locales, localSupported, translatorApi = globalThis.Translator,
    detectorApi = globalThis.LanguageDetector) {
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
    const browserLanguage = getBrowserLanguage(chromeApi);
    let state = renderWelcome(doc, stored, locales, browserLanguage, localSupported);
    const select = doc.getElementById("targetLanguage");
    const uiSelect = doc.getElementById("uiLanguageSelect");
    const status = doc.getElementById("saveStatus");
    bindLocalTrial(doc, select, () => state.copy, translatorApi, detectorApi);

    const persist = values => new Promise((resolve, reject) => {
        const pending = chromeApi.storage.local.set(values, () => {
            if (chromeApi.runtime && chromeApi.runtime.lastError) reject(new Error("Save failed"));
            else resolve();
        });
        if (pending && typeof pending.then === "function") pending.then(resolve, reject);
    });

    if (uiSelect) {
        uiSelect.addEventListener("change", async () => {
            if (!SUPPORTED_UI_LANGUAGES.has(uiSelect.value)) return;
            state = renderWelcome(doc, { uiLanguage: uiSelect.value, targetLanguage: select.value }, locales, browserLanguage, localSupported);
            if (!chromeApi?.storage?.local) return;
            try { await persist({ uiLanguage: uiSelect.value }); } catch (e) { /* keep rendered UI */ }
        });
    }

    select.addEventListener("change", async () => {
        state.targetLanguage = select.value;
        if (!chromeApi || !chromeApi.storage || !chromeApi.storage.local) return;
        if (!SUPPORTED_TARGET_LANGUAGES.has(select.value)) return;
        try {
            await persist({ targetLanguage: select.value });
            status.className = "";
            status.textContent = state.copy.saved;
        } catch (e) {
            status.className = "error";
            status.textContent = state.copy.saveFailed;
        }
    });
}

if (typeof document !== "undefined") {
    initWelcome(document, typeof chrome !== "undefined" ? chrome : null, WELCOME_TEXT,
        typeof Translator !== "undefined" && typeof LanguageDetector !== "undefined");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { getBrowserDefaultLanguages, getBrowserLanguage, WELCOME_TARGET_LANGUAGES, WELCOME_UI_LANGUAGES, renderWelcome, initWelcome };
}
