(function (root, factory) {
    const shared = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = shared;
    else root.GaryShared = shared;
})(globalThis, function () {
    const SUPPORTED_TARGET_LANGUAGES = new Set([
        "zh-Hans", "zh-Hant", "en", "ja", "ko", "th", "es", "fr", "de", "pt", "id", "vi"
    ]);
    const SUPPORTED_UI_LANGUAGES = new Set([
        "zh-Hans", "en", "ja", "ko", "th", "es", "fr", "de", "pt", "id", "vi", "ru", "ar", "hi"
    ]);

    const RETIRED_PROVIDERS = ["google", "minimax", "zhipu", "kimi"];

    // 用户从未保存过语言时，跟随浏览器界面语言；识别不了的语言回落英文。
    function getBrowserDefaultLanguages(browserLanguage) {
        const raw = String(browserLanguage || "").toLowerCase().replace(/_/g, "-");
        const base = raw.split("-")[0];
        if (base === "zh") {
            return { uiLanguage: "zh-Hans", targetLanguage: /-(hant|tw|hk|mo)(-|$)/.test(raw) ? "zh-Hant" : "zh-Hans" };
        }
        return {
            uiLanguage: SUPPORTED_UI_LANGUAGES.has(base) ? base : "en",
            targetLanguage: SUPPORTED_TARGET_LANGUAGES.has(base) ? base : "en"
        };
    }

    function getBrowserLanguage(chromeApi = globalThis.chrome) {
        try { return chromeApi?.i18n?.getUILanguage() || ""; } catch (e) { return ""; }
    }

    function migrateProviderSettings(result) {
        // 只改写明确下线的旧预设 ID；用户手动填写的模型名原样保留。
        const removedModels = {
            openai: { "gpt-6-astra": "gpt-6-luna" },
            anthropic: { "claude-haiku-4-5-20251001": "claude-haiku-5-5", "claude-fable-5-1": "claude-haiku-5-5" }
        };
        const stored = Object.assign({}, result);
        const configs = Object.fromEntries(Object.entries(result.providerConfigs || {}).map(([id, cfg]) => [id, Object.assign({}, cfg)]));
        let provider = result.selectedProvider || "deepseek";
        if (!result.providerConfigs && result.customApiKey) {
            configs[provider] = { apiKey:result.customApiKey, apiUrl:result.customApiUrl, model:result.customModel };
        }
        const updates = {};
        if (RETIRED_PROVIDERS.includes(provider)) {
            if (!Object.prototype.hasOwnProperty.call(configs, "custom")) {
                const old = configs[provider] || {};
                configs.custom = { apiKey:old.apiKey || "", apiUrl:provider === "google" ? "" : old.apiUrl || "", model:old.model || "" };
            }
            provider = "custom";
            Object.assign(updates, { selectedProvider:provider, providerMigrationPending:true,
                customApiKey:configs.custom.apiKey || "", customApiUrl:configs.custom.apiUrl || "", customModel:configs.custom.model || "" });
        }
        // 下线服务商的配置（含 Key）归档保留，不参与翻译，也不丢弃。
        const archived = Object.assign({}, result.retiredProviderConfigs || {});
        let archivedChanged = false;
        for (const id of RETIRED_PROVIDERS) {
            if (configs[id]) { archived[id] = configs[id]; archivedChanged = true; }
            delete configs[id];
        }
        if (archivedChanged) updates.retiredProviderConfigs = archived;
        for (const [id, map] of Object.entries(removedModels)) {
            const next = configs[id] && Object.prototype.hasOwnProperty.call(map, configs[id].model) ? map[configs[id].model] : null;
            if (next) {
                configs[id].model = next;
                delete configs[id].testedAt;
                if (id === provider) updates.customModel = next;
            }
        }
        if (JSON.stringify(configs) !== JSON.stringify(result.providerConfigs || {}) || updates.selectedProvider) updates.providerConfigs = configs;
        Object.assign(stored, updates);
        return { stored, updates };
    }

    function getModelBatchSize(modelId) {
        const model = String(modelId || "").toLowerCase();
        if ((model.includes("m2.7") && !model.includes("highspeed")) ||
            model.includes("thinking") || model.includes("reason")) return 4;
        if (["flash", "highspeed", "turbo", "haiku", "deepseek"].some(part => model.includes(part))) return 8;
        return 6;
    }

    function isChineseLanguage(code) {
        return code === "zh-Hans" || code === "zh-Hant";
    }

    function normalizeSkipLanguages(skipLanguages) {
        if (!Array.isArray(skipLanguages)) return [];
        const codes = new Set(skipLanguages.filter(code => SUPPORTED_TARGET_LANGUAGES.has(code)));
        if (codes.has("zh-Hans") || codes.has("zh-Hant")) {
            codes.add("zh-Hans");
            codes.add("zh-Hant");
        }
        return [...codes].sort();
    }

    function getDisplayPreferences(stored, translationMode) {
        const showTags = translationMode === "local" ? false : stored.showTags !== false;
        return {
            showTags,
            bilingualOrder: stored.bilingualOrder === "original-first" ? "original-first" : "translated-first",
            skipLanguages: normalizeSkipLanguages(stored.skipLanguages)
        };
    }

    function buildPublicConfig(stored, browserLanguage) {
        const normalized = migrateProviderSettings(stored).stored;
        const provider = normalized.selectedProvider || "deepseek";
        const active = normalized.providerConfigs?.[provider];
        const translationMode = ["local", "ai"].includes(normalized.translationMode)
            ? normalized.translationMode : (active?.apiKey ? "ai" : "local");
        const configured = translationMode === "ai" && !normalized.providerMigrationPending &&
            !!(active?.apiKey && active.apiUrl && active.model);
        const defaults = getBrowserDefaultLanguages(browserLanguage);
        return {
            enabled: normalized.enabled !== false,
            translationMode,
            configured,
            batchSize: getModelBatchSize(active?.model),
            cacheScope: configured ? JSON.stringify([provider, active.model]) : "",
            targetLanguage: SUPPORTED_TARGET_LANGUAGES.has(stored.targetLanguage) ? stored.targetLanguage : defaults.targetLanguage,
            uiLanguage: SUPPORTED_UI_LANGUAGES.has(stored.uiLanguage) ? stored.uiLanguage : defaults.uiLanguage,
            ...getDisplayPreferences(stored, translationMode)
        };
    }

    return {
        SUPPORTED_TARGET_LANGUAGES, SUPPORTED_UI_LANGUAGES, RETIRED_PROVIDERS,
        isChineseLanguage, normalizeSkipLanguages,
        getBrowserDefaultLanguages, getBrowserLanguage, migrateProviderSettings, getModelBatchSize, getDisplayPreferences, buildPublicConfig
    };
});
