if (typeof importScripts === "function") importScripts("shared.js");

const { getBrowserDefaultLanguages, getBrowserLanguage, migrateProviderSettings, buildPublicConfig } =
    typeof require === "function" ? require("./shared.js") : globalThis.GaryShared;

try {
    chrome.storage?.local?.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" })?.catch?.(() => {});
} catch (e) { /* 兼容旧版 Chrome */ }

// === Background Service Worker ===
// 负责发起 AI 翻译请求。content script 通过 sendMessage 把要翻译的文本
// 传过来，配置由后台从 storage 读取，SW 完成 HTTP 调用 + JSON 解析后回传结果。
//
// 为什么挪到 SW：
// 1) MV3 推荐做法，避免被 YouTube 页面 CSP 拦截 fetch
// 2) 所有 tab 共享一个翻译入口，方便后续做并发限制和重试
// 3) Network panel 里的请求归属为扩展，不污染 youtube.com 的网络面板

const TAG_ENUM = ["科技", "游戏", "音乐", "教程", "搞笑", "新闻", "财经", "生活", "体育", "影视", "美食", "其它"];
const TAG_GUIDE = [
    "科技: gadgets, AI, software, engineering, science, product launches",
    "游戏: video games, game streamers, esports, game reviews",
    "音乐: songs, albums, concerts, instruments, music creators",
    "教程: how-to, step-by-step guides, courses, explainers with a teaching intent",
    "搞笑: comedy, pranks, memes, humorous clips",
    "新闻: current events, politics, public affairs, major global or local updates",
    "财经: business, economy, investing, markets, companies, money",
    "生活: travel, family, relationships, daily routines, personal stories, general lifestyle",
    "体育: sports matches, athletes, fitness competitions, sports analysis",
    "影视: movies, TV, anime, trailers, actors, film criticism",
    "美食: cooking, restaurants, recipes, food reviews",
    "其它: unclear, mixed, or none of the above"
].join("; ");
const SYSTEM_PROMPT = "You are a precise YouTube title translator. Reply with exactly one JSON object and nothing else.";
const MAX_CONCURRENT_TRANSLATIONS = 3;
const translationQueue = [];
let activeTranslations = 0;
// 批量任务与补译走独立的 HTTP 队列，响应到达后释放槽位。
const fetchQueue = [];
let activeFetches = 0;
const hostCooldowns = new Map();
const inflightTextResults = new Map();
const DEFAULT_TARGET_LANGUAGE = getBrowserDefaultLanguages(getBrowserLanguage()).targetLanguage;
const TARGET_LANGUAGE_NAMES = {
    "zh-Hans": "Simplified Chinese",
    "zh-Hant": "Traditional Chinese",
    en: "English",
    ja: "Japanese",
    ko: "Korean",
    th: "Thai",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    id: "Indonesian",
    vi: "Vietnamese"
};

function extractJsonValueCandidates(s, topLevelOnly = false) {
    const candidates = [];
    for (let start = 0; start < s.length; start++) {
        if (s[start] !== "{" && s[start] !== "[") continue;
        const open = s[start];
        const close = open === "{" ? "}" : "]";
        let depth = 0, inStr = false, escape = false;
        for (let i = start; i < s.length; i++) {
            const c = s[i];
            if (escape) { escape = false; continue; }
            if (c === '\\') { escape = true; continue; }
            if (c === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (c === open) depth++;
            else if (c === close) {
                depth--;
                if (depth === 0) {
                    candidates.push(s.slice(start, i + 1));
                    if (topLevelOnly) start = i;
                    break;
                }
            }
        }
    }
    return candidates;
}

// 所有 AI 请求统一走这里：30s 超时 + 网络层失败（含超时）重试一次。
// 没有超时兜底的话，一个挂死的连接会永久占住并发槽（MAX_CONCURRENT_TRANSLATIONS），
// 整支队列停摆，页面 badge 永远停在"翻译中"。
const FETCH_TIMEOUT_MS = 30000;
const MAX_RETRY_AFTER_MS = 60000;

function drainFetchQueue() {
    while (activeFetches < MAX_CONCURRENT_TRANSLATIONS && fetchQueue.length) {
        const { work, resolve, reject } = fetchQueue.shift();
        activeFetches++;
        work().then(resolve, reject).finally(() => {
            activeFetches--;
            drainFetchQueue();
        });
    }
}

function limitFetch(work) {
    return new Promise((resolve, reject) => {
        fetchQueue.push({ work, resolve, reject });
        drainFetchQueue();
    });
}

function getRetryAfterMs(response) {
    const value = response.headers?.get?.("Retry-After")?.trim();
    if (!value) return 0;
    const delay = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - Date.now();
    return Number.isNaN(delay) ? 0 : Math.max(0, Math.min(delay, MAX_RETRY_AFTER_MS));
}

function quotaError(retryAfterMs) {
    return makeError("quota", "余额不足或被限流", { status: 429, retryAfterMs });
}

function getHostCooldown(host) {
    const remaining = (hostCooldowns.get(host) || 0) - Date.now();
    if (remaining > 0) return quotaError(remaining);
    hostCooldowns.delete(host);
    return null;
}

async function fetchWithTimeout(url, options, canRetry) {
    const host = getApiHost({ apiUrl: url });
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await limitFetch(async () => {
                if (canRetry) {
                    if (!await canRetry()) return { error: makeError("cancelled", "翻译设置已变更") };
                    const error = getHostCooldown(host);
                    if (error) return { error };
                }
                const response = await fetch(url, Object.assign({}, options, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }));
                if (response.status !== 429) return { response };
                const retryAfterMs = getRetryAfterMs(response);
                if (retryAfterMs > 0) {
                    hostCooldowns.set(host, Math.max(hostCooldowns.get(host) || 0, Date.now() + retryAfterMs));
                }
                return { error: quotaError(retryAfterMs) };
            });
        } catch (e) {
            if (attempt === 1) throw e;
        }
    }
}

function getApiHost(config) {
    try { return new URL(config.apiUrl).hostname.toLowerCase(); }
    catch (e) { return ""; }
}

function getApiType(config) {
    const host = getApiHost(config);
    if (host === "api.anthropic.com") return "anthropic";
    return "openai-compatible";
}

function extractTextFromResponse(data, apiType) {
    if (apiType === "anthropic") {
        return data && Array.isArray(data.content)
            ? data.content.filter(part => part && part.type === "text" && part.text).map(part => part.text).join("")
            : "";
    }
    return data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : "";
}

function normalizeTag(tag) {
    return TAG_ENUM.includes(tag) ? tag : "其它";
}

function normalizeTranslationResult(result) {
    if (!result) return null;
    const translatedTitle = result.translatedTitle ?? result.translated_title ?? result.targetTitle ??
        result.target_title ?? result.title ?? result.translation ?? result.translated ?? result.text ??
        result.cn ?? result.zh ?? result.chinese;
    if (typeof translatedTitle !== "string" || !translatedTitle.trim()) return null;
    return { tag: normalizeTag(result.tag || result.category || result.type), translatedTitle: translatedTitle.trim() };
}

function extractBatchArray(parsed, expectedLength) {
    if (Array.isArray(parsed)) return parsed;
    if (!parsed || typeof parsed !== "object") return null;

    const directArray = parsed.items || parsed.results || parsed.translations || parsed.data;
    if (Array.isArray(directArray)) return directArray;

    if (parsed.item && typeof parsed.item === "object") return [parsed.item];
    if (parsed.result && typeof parsed.result === "object" && !Array.isArray(parsed.result)) return [parsed.result];
    if (parsed.translation && typeof parsed.translation === "object") return [parsed.translation];

    const numericEntries = Object.keys(parsed)
        .filter(key => /^\d+$/.test(key) && parsed[key] && typeof parsed[key] === "object")
        .sort((a, b) => Number(a) - Number(b))
        .map(key => {
            const i = Number(key);
            const item = parsed[key];
            return Object.hasOwn(item, "i") && item.i !== i ? { i } : { ...item, i };
        });
    if (numericEntries.length > 0) return numericEntries;

    if (expectedLength === 1 && normalizeTranslationResult(parsed)) return [parsed];
    return null;
}

function findBatchResult(arr, idx, expectedLength = arr.length) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= expectedLength) return null;
    const fields = ["i", "index", "id", "idx"];
    let indexed = false;
    let match = null;
    for (const item of arr) {
        if (!item || typeof item !== "object") continue;
        const indexes = fields.filter(field => Object.hasOwn(item, field)).map(field => item[field]);
        if (!indexes.length) continue;
        indexed = true;
        if (!indexes.includes(idx)) continue;
        if (match || indexes.some(index => index !== idx)) return null;
        match = item;
    }
    return indexed ? match : (arr.length === expectedLength ? arr[idx] ?? null : null);
}

function parseSingleTranslationFromText(raw) {
    const cleaned = raw
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/```json|```/g, "");
    const searchTexts = [cleaned, raw];

    for (const text of searchTexts) {
        const candidates = extractJsonValueCandidates(text);
        for (let i = candidates.length - 1; i >= 0; i--) {
            try {
                const parsed = JSON.parse(candidates[i]);
                const result = normalizeTranslationResult(Array.isArray(parsed) ? parsed[0] : parsed);
                if (result) return result;
            } catch (e) {}
        }
    }
    return null;
}

function parseBatchTranslationsFromText(raw, expectedLength) {
    const cleaned = raw
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/```json|```/g, "");
    const searchTexts = [cleaned, raw];

    for (const text of searchTexts) {
        const candidates = extractJsonValueCandidates(text, true);
        for (let i = candidates.length - 1; i >= 0; i--) {
            try {
                const parsed = JSON.parse(candidates[i]);
                const arr = extractBatchArray(parsed, expectedLength);
                if (Array.isArray(arr)) {
                    return arr;
                }
            } catch (e) {}
        }
    }
    return null;
}

function makeError(type, message, detail) {
    return { type, message, detail };
}

function classifyApiError(status, data) {
    if (status === 429) return makeError("quota", "余额不足或被限流", { status, data });
    const raw = JSON.stringify(data || {});
    const lower = raw.toLowerCase();
    if (status === 401 || status === 403 || lower.includes("invalid api key") || lower.includes("unauthorized")) {
        return makeError("auth", "Key 无效", { status, data });
    }
    if (status === 402 || lower.includes("quota") || lower.includes("balance") || lower.includes("rate limit")) {
        return makeError("quota", "余额不足或被限流", { status, data });
    }
    // 明确提到"模型不存在"才归为模型名错误；普通 400（参数错误等）落到 service，
    // 避免把我们自己的请求体问题误导成"模型名可能错误"
    if (status === 404 || lower.includes("model_not_found") ||
        /model[^"\n]*(?:not found|not exist|does not exist|unavailable)/.test(lower)) {
        return makeError("model", "模型名可能错误", { status, data });
    }
    if (status === 400 && /parameter|temperature|max_tokens|max_completion_tokens|thinking|reasoning/.test(lower)) {
        return makeError("parameter", "模型不接受此请求配置", { status, data });
    }
    return makeError("service", "网络或服务商异常", { status, data });
}

function getFallbackErrorForMissingItem(batchReply) {
    return batchReply && batchReply.error
        ? batchReply.error
        : makeError("parse", "模型返回格式异常");
}

function enqueueTranslation(work) {
    return new Promise((resolve) => {
        translationQueue.push({ work, resolve });
        drainTranslationQueue();
    });
}

function drainTranslationQueue() {
    while (activeTranslations < MAX_CONCURRENT_TRANSLATIONS && translationQueue.length > 0) {
        const task = translationQueue.shift();
        activeTranslations++;
        task.work()
            .then(task.resolve)
            .catch(error => task.resolve({ ok: false, error: makeError("network", "网络或服务商异常", String(error)) }))
            .finally(() => {
                activeTranslations--;
                drainTranslationQueue();
            });
    }
}

function getRequestKey(text, config, automatic) {
    config = config || {};
    // 测试新 Key 必须实际使用新凭证；测试请求也不能复用页面上的自动翻译。
    // 该身份只用于内存中的进行中请求，不会记录或持久化。
    return JSON.stringify([automatic ? "automatic" : "test", config.apiUrl || "", config.apiKey || "",
        config.model || "", config.cacheScope || "", getTargetLanguageCode(config), text]);
}

const CONFIG_STORAGE_KEYS = ["enabled", "translationMode", "selectedProvider", "providerConfigs",
    "customApiKey", "customApiUrl", "customModel", "targetLanguage", "uiLanguage", "providerMigrationPending",
    "retiredProviderConfigs", "showTags", "bilingualOrder", "skipLanguages"];
let settingsChain = Promise.resolve();

// 每次自动翻译和重试都重读设置；同一个 worker 内的迁移串行执行。
function readTranslationSettings() {
    const operation = settingsChain.then(async () => {
        const result = await storageCall("get", CONFIG_STORAGE_KEYS);
        const { stored, updates } = migrateProviderSettings(result || {});
        if (Object.keys(updates).length) await storageCall("set", updates);
        return stored;
    });
    settingsChain = operation.catch(() => {});
    return operation;
}

function activeTranslationConfig(stored) {
    const provider = stored.selectedProvider || "deepseek";
    const active = stored.providerConfigs && stored.providerConfigs[provider];
    const mode = ["local", "ai"].includes(stored.translationMode) ? stored.translationMode : (active && active.apiKey ? "ai" : "local");
    // 迁移待确认时不自动翻译：用户保存确认前，不把标题发给他原本没选中的服务。
    if (stored.providerMigrationPending) return null;
    if (stored.enabled === false || mode !== "ai" || !active || !active.apiKey || !active.apiUrl || !active.model) return null;
    return Object.assign({}, active, {
        targetLanguage: getTargetLanguageCode(stored), cacheScope: JSON.stringify([provider, active.model])
    });
}

async function automaticTranslationStillAllowed(config) {
    try {
        const active = activeTranslationConfig(await readTranslationSettings());
        return !!active && (!config.cacheScope || active.cacheScope === config.cacheScope) &&
            ["apiKey", "apiUrl", "model", "targetLanguage"].every(key => (active[key] || "") === (config[key] || ""));
    } catch (e) { return false; }
}

async function translateFromStorage(items, targetLanguage) {
    try {
        const config = activeTranslationConfig(await readTranslationSettings());
        if (!config || (targetLanguage && targetLanguage !== config.targetLanguage)) {
            return { ok:false, results:items.map(() => null), error:makeError("cancelled", "翻译设置已变更") };
        }
        const reply = await fetchAiTranslationBatchDedup(items, config, true);
        return { ...reply, cacheScope: config.cacheScope };
    } catch (e) {
        return { ok:false, results:items.map(() => null), error:makeError("network", "网络或服务商异常") };
    }
}

function getTargetLanguageCode(config) {
    const code = config && config.targetLanguage ? config.targetLanguage : DEFAULT_TARGET_LANGUAGE;
    return Object.prototype.hasOwnProperty.call(TARGET_LANGUAGE_NAMES, code) ? code : DEFAULT_TARGET_LANGUAGE;
}

function getTargetLanguageName(config) {
    return TARGET_LANGUAGE_NAMES[getTargetLanguageCode(config)];
}

function buildSinglePrompt(text, config) {
    const targetLanguage = getTargetLanguageName(config);
    return `Translate this YouTube title into ${targetLanguage}. Keep it natural, accurate, and readable as a YouTube title in the target language.
Return EXACTLY ONE JSON object, no markdown, no prose, no repetition: {"tag":"<one of: ${TAG_ENUM.join("/")}>","translatedTitle":"<translated title in ${targetLanguage}>"}.
Tag rules: ${TAG_GUIDE}.
Choose the core topic of the title. Do not classify by a single incidental word. If uncertain or mixed, use 生活 or 其它.
Original: ${JSON.stringify(text)}`;
}

function buildBatchPrompt(numbered, config) {
    const targetLanguage = getTargetLanguageName(config);
    return `Translate each YouTube title below into ${targetLanguage}. Keep titles natural, accurate, and readable as YouTube titles in the target language.
Return EXACTLY ONE JSON object: {"items":[{"i":<index>,"tag":"<category>","translatedTitle":"<translated title in ${targetLanguage}>"},...]}
The "tag" of each item MUST be one of: ${TAG_ENUM.join("/")}.
Tag rules: ${TAG_GUIDE}.
Choose each title's core topic. Do not classify by a single incidental word. If uncertain or mixed, use 生活 or 其它.
The output array length MUST equal input length, and "i" MUST match input "i".
No markdown fence, no prose, no repetition.
Input: ${JSON.stringify(numbered)}`;
}

function buildChatCompletionsBody(config, promptText, maxTokens, systemPrompt) {
    const body = {
        model: config.model,
        messages: [{
            role: "system",
            content: systemPrompt
        }, {
            role: "user",
            content: promptText
        }]
    };

    const host = getApiHost(config);
    const model = config.model || "";
    // 推理 token 和最终译文共享输出额度。能关闭推理的短标题请求直接回答；
    // 强制推理的模型使用 low，并给最终 JSON 留出余量。
    const reasoningBudget = Math.max(4096, maxTokens + 3072);
    if (host === "api.openai.com") {
        body.max_completion_tokens = maxTokens;
        if (["gpt-6-luna", "gpt-6.1-terra"].includes(model)) {
            body.reasoning_effort = "none";
        } else if (/^(gpt-[56]|o[134])/.test(model)) {
            body.reasoning_effort = "low";
            body.max_completion_tokens = reasoningBudget;
        }
    } else {
        body.temperature = 0.3;
        body.max_tokens = maxTokens;
        // 只向准确匹配的官方域名发送专属参数；自定义兼容接口保持通用请求体。
        if (host === "api.deepseek.com" && /^deepseek-(v4|flash(?:$|-))/.test(model)) {
            body.thinking = { type: "disabled" };
        }
    }

    return body;
}

function buildAnthropicBody(config, promptText, maxTokens) {
    const body = {
        model: config.model, system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: promptText }], max_tokens: maxTokens
    };
    if (/^claude-(haiku|sonnet|opus|fable)-5(?:-|$)/.test(config.model || "")) {
        body.thinking = { type: "adaptive" };
        body.output_config = { effort: "low" };
        body.max_tokens = Math.max(4096, maxTokens + 3072);
    } else if (!/^claude-opus-4-[78]/.test(config.model || "")) {
        body.temperature = 0.3;
    }
    return body;
}

async function readJsonResponse(response) {
    try {
        return await response.json();
    } catch (e) {
        return { error: { message: "Response is not valid JSON" } };
    }
}

async function fetchAiTranslation(text, config, canRetry) {
    if (!config || !config.apiKey) {
        return { ok: false, error: makeError("auth", "Key 无效") };
    }

    const promptText = buildSinglePrompt(text, config);

    let raw = "";
    let request;

    try {
        const apiType = getApiType(config);

        if (apiType === "anthropic") {
            request = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.apiKey,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true"
                },
                body: JSON.stringify(buildAnthropicBody(config, promptText, 500))
            }, canRetry);
        } else {
            request = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(buildChatCompletionsBody(
                    config,
                    promptText,
                    500,
                    SYSTEM_PROMPT
                ))
            }, canRetry);
        }

        const { response, error: requestError } = request;
        if (requestError) return { ok: false, error: requestError };
        const data = await readJsonResponse(response);
        if (!response.ok) {
            console.error("[Gary BG] API 返回错误", response.status, data);
            return { ok: false, error: classifyApiError(response.status, data) };
        }

        raw = extractTextFromResponse(data, apiType);

        if (!raw) {
            console.error("[Gary BG] 模型返回空内容", data);
            return { ok: false, error: makeError("empty", "网络或服务商异常", data) };
        }

        const result = parseSingleTranslationFromText(raw);
        if (!result) {
            console.error("[Gary BG] 响应里找不到 JSON 对象。原文:", text, "模型返回:", raw);
            return { ok: false, error: makeError("parse", "网络或服务商异常", raw) };
        }
        return { ok: true, result };

    } catch (e) {
        console.error("[Gary BG] 翻译失败:", e, "原文:", text, "模型返回:", raw || "(无)");
    }
    return { ok: false, error: makeError("network", "网络或服务商异常") };
}

// === 批量翻译：一次 prompt 翻多条，节省调用数和握手开销 ===
// 让模型返回 {"items":[{"i":0,"tag":"..","translatedTitle":".."}, ...]}，按 i 字段对齐回原数组。
// 这种"包一层 object"的设计比裸数组更稳健；解析器也兼容模型偶尔返回裸数组。
async function fetchAiTranslationBatch(items, config, canRetry) {
    if (!config || !config.apiKey) {
        return { ok: false, results: items.map(() => null), error: makeError("auth", "Key 无效") };
    }
    if (items.length === 0) return { ok: true, results: [] };

    const numbered = items.map((t, i) => ({ i, t }));
    const maxTokens = Math.min(1200, 180 + items.length * 90);
    const promptText = buildBatchPrompt(numbered, config);

    let raw = "";
    let request;

    try {
        const apiType = getApiType(config);

        if (apiType === "anthropic") {
            request = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.apiKey,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true"
                },
                body: JSON.stringify(buildAnthropicBody(config, promptText, maxTokens))
            }, canRetry);
        } else {
            request = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(buildChatCompletionsBody(
                    config,
                    promptText,
                    maxTokens,
                    SYSTEM_PROMPT
                ))
            }, canRetry);
        }

        const { response, error: requestError } = request;
        if (requestError) return { ok: false, results: items.map(() => null), error: requestError };
        const data = await readJsonResponse(response);
        if (!response.ok) {
            console.error("[Gary BG] 批量 API 错误", response.status, data);
            const error = classifyApiError(response.status, data);
            return { ok: false, results: items.map(() => null), error };
        }

        raw = extractTextFromResponse(data, apiType);
        if (!raw) {
            console.error("[Gary BG] 批量返回空内容", data);
            return { ok: false, results: items.map(() => null), error: makeError("empty", "网络或服务商异常", data) };
        }

        const arr = parseBatchTranslationsFromText(raw, items.length);
        if (!Array.isArray(arr)) {
            console.error("[Gary BG] 批量响应没找到 JSON 对象。模型返回:", raw);
            return { ok: false, results: items.map(() => null), error: makeError("parse", "网络或服务商异常", raw) };
        }

        // 按 i 对齐：模型返回顺序不一定保证，用索引匹配；缺失项 → null（会渲染 ❌）
        const results = items.map((_, idx) => {
            const found = findBatchResult(arr, idx, items.length);
            return normalizeTranslationResult(found);
        });
        return { ok: true, results };

    } catch (e) {
        console.error("[Gary BG] 批量翻译失败:", e, "条数:", items.length, "模型返回:", raw || "(无)");
        return { ok: false, results: items.map(() => null), error: makeError("network", "网络或服务商异常", String(e)) };
    }
}

async function fetchAiTranslationBatchDedup(items, config, automatic = false) {
    const cooldown = automatic && getHostCooldown(getApiHost(config));
    if (cooldown) return { ok: false, results: items.map(() => null), error: cooldown };
    const promises = [];
    const uniqueItems = [];
    const uniqueKeys = [];
    const localSeen = new Map();

    items.forEach((text, index) => {
        const key = getRequestKey(text, config, automatic);
        if (localSeen.has(key)) {
            promises[index] = localSeen.get(key);
            return;
        }
        if (inflightTextResults.has(key)) {
            const promise = inflightTextResults.get(key);
            localSeen.set(key, promise);
            promises[index] = promise;
            return;
        }
        let resolveDeferred;
        const promise = new Promise(resolve => { resolveDeferred = resolve; });
        inflightTextResults.set(key, promise);
        localSeen.set(key, promise);
        promises[index] = promise;
        uniqueItems.push(text);
        uniqueKeys.push({ key, resolve: resolveDeferred });
    });

    if (uniqueItems.length > 0) {
        enqueueTranslation(async () => {
            try {
                // 已发出的请求可以完成；尚未发出的任务需服从最新模式和配置。
                if (automatic && !await automaticTranslationStillAllowed(config)) {
                    const error = makeError("cancelled", "翻译设置已变更");
                    uniqueKeys.forEach(entry => {
                        entry.resolve({ result:null, error });
                        inflightTextResults.delete(entry.key);
                    });
                    return { ok:false, error };
                }
                const canRetry = automatic ? () => automaticTranslationStillAllowed(config) : null;
                const batchReply = await fetchAiTranslationBatch(uniqueItems, config, canRetry);
                const resolvedItems = batchReply.results ? batchReply.results.slice() : uniqueItems.map(() => null);
                const itemErrors = uniqueItems.map((_, i) => {
                    return resolvedItems[i] ? null : getFallbackErrorForMissingItem(batchReply);
                });

                const missingIndexes = resolvedItems
                    .map((result, i) => result ? -1 : i)
                    .filter(i => i >= 0);

                // 瞬时错误（parse/empty/network）单条重试一次，单条批量也享受这次机会；
                // auth/quota/model 重试也是白调，直接沿用原错误
                const batchErrorType = batchReply.error && batchReply.error.type;
                let retryable = !batchReply.error || ["parse", "empty", "network"].includes(batchErrorType);
                if (missingIndexes.length > 0 && retryable && automatic) {
                    retryable = await automaticTranslationStillAllowed(config);
                }
                if (missingIndexes.length > 0 && retryable) {
                    await Promise.all(missingIndexes.map(async (i) => {
                        const retry = await fetchAiTranslation(uniqueItems[i], config, canRetry);
                        if (retry && retry.ok && retry.result) {
                            resolvedItems[i] = retry.result;
                            itemErrors[i] = null;
                        } else {
                            itemErrors[i] = retry && retry.error ? retry.error : itemErrors[i];
                        }
                    }));
                }

                if (automatic) await recordUsage("ai", resolvedItems.map((result, i) => ({
                    ok: !!result, errorType: itemErrors[i]?.type
                })).filter(metric => metric.errorType !== "cancelled")).catch(() => {});
                uniqueKeys.forEach((entry, i) => {
                    const result = resolvedItems[i] || null;
                    const itemError = result ? null : itemErrors[i];
                    entry.resolve({ result, error: itemError });
                    inflightTextResults.delete(entry.key);
                });
                return {
                    ok: resolvedItems.some(Boolean),
                    results: resolvedItems,
                    errors: itemErrors,
                    error: itemErrors.find(Boolean) || null
                };
            } catch (e) {
                // 兜底：任务中途抛任何异常都必须 resolve 所有 deferred，
                // 否则 content 侧的 sendMessage 永远等不到回复，badge 卡在"翻译中"
                const error = makeError("network", "网络或服务商异常", String(e));
                if (automatic) await recordUsage("ai", uniqueKeys.map(() => ({
                    ok: false, errorType: "network"
                }))).catch(() => {});
                uniqueKeys.forEach(entry => {
                    entry.resolve({ result: null, error });
                    inflightTextResults.delete(entry.key);
                });
                return {
                    ok: false,
                    results: uniqueItems.map(() => null),
                    errors: uniqueItems.map(() => error),
                    error
                };
            }
        });
    }

    const settled = await Promise.all(promises);
    const results = settled.map(item => item && item.result ? item.result : null);
    const errors = settled.map(item => item && item.error ? item.error : null);
    const firstError = settled.find(item => item && item.error);
    return {
        ok: results.some(Boolean),
        results,
        errors,
        error: firstError ? firstError.error : null
    };
}

async function fetchAiTranslationQueued(text, config, automatic) {
    const reply = await fetchAiTranslationBatchDedup([text], config, automatic);
    return {
        ok: !!(reply.results && reply.results[0]),
        result: reply.results ? reply.results[0] : null,
        error: reply.error
    };
}

// === Message handler ===
// 缓存只由 SW 写入；读取、合并和落盘共享同一条串行链。
const CACHE_LIMIT = 10000;
const CACHE_BUCKET_KEYS = Array.from({ length: 16 }, (_, index) => `translationCache_b${index}`);
const CACHE_META_KEY = "translationCacheMeta";
const CACHE_CLEAR_KEY = "translationCacheClearedAt";
const LEGACY_CACHE_KEY = "translationCache";
const CACHE_LOOKUP_LIMIT = 200;
const backgroundCache = new Map();
const cacheBuckets = CACHE_BUCKET_KEYS.map(() => new Map());
const dirtyCacheBuckets = new Set();
let cacheOrder = 0;
let cacheLoaded = false;
let legacyCacheNeedsRemoval = false;
let legacyCacheNeedsWrite = false;
let cacheClearedAt = 0;
let cacheChain = Promise.resolve();

function storageCall(method, value) {
    return new Promise((resolve, reject) => {
        try {
            const local = chrome.storage && chrome.storage.local;
            if (!local || typeof local[method] !== "function") { reject(new Error("Storage unavailable")); return; }
            const pending = local[method](value, result => {
                if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                else resolve(result);
            });
            if (pending && typeof pending.then === "function") pending.then(resolve, reject);
        } catch (e) { reject(e); }
    });
}

const LOCAL_METRIC_ERRORS = ["local", "detector", "translator", "notAllowed"];
const METRIC_ERRORS = [...LOCAL_METRIC_ERRORS, "auth", "quota", "model", "parameter", "service", "empty", "parse", "network", "unknown"];
const USAGE_COUNT_KEYS = ["successCount", "failureCount", "localSuccessCount", "aiSuccessCount"];
let usageChain = Promise.resolve();

function sanitizeUsageStats(stored = {}) {
    const count = value => Number.isSafeInteger(value) && value > 0 ? value : 0;
    const activeDays = Array.isArray(stored.activeDays)
        ? stored.activeDays.filter(day => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day)) : [];
    return {
        ...Object.fromEntries(USAGE_COUNT_KEYS.map(key => [key, count(stored[key])])),
        errorCounts: Object.fromEntries(METRIC_ERRORS.filter(key => count(stored.errorCounts?.[key]))
            .map(key => [key, stored.errorCounts[key]])),
        activeDays: [...new Set(activeDays)].sort().slice(-30),
        firstSuccessAt: count(stored.firstSuccessAt) || null,
        reviewPromptDismissed: stored.reviewPromptDismissed === true
    };
}

function updateUsageStats(update) {
    const operation = usageChain.then(async () => {
        const { usageStats } = await storageCall("get", ["usageStats"]);
        const stats = sanitizeUsageStats(usageStats || {});
        update(stats);
        await storageCall("set", { usageStats: stats });
    });
    usageChain = operation.catch(() => {});
    return operation;
}

function recordUsage(engine, metrics) {
    if (!metrics.length) return Promise.resolve();
    return updateUsageStats(stats => {
        const now = new Date();
        for (const { ok, errorType } of metrics) {
            if (ok) {
                stats.successCount++;
                stats[engine === "ai" ? "aiSuccessCount" : "localSuccessCount"]++;
                stats.firstSuccessAt ??= now.getTime();
            } else {
                const key = METRIC_ERRORS.includes(errorType) ? errorType : "unknown";
                stats.failureCount++;
                stats.errorCounts[key] = (stats.errorCounts[key] || 0) + 1;
            }
        }
        const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
            .map(part => String(part).padStart(2, "0")).join("-");
        stats.activeDays = [...new Set([...stats.activeDays, day])].sort().slice(-30);
    });
}

function validLocalMetric(msg) {
    return typeof msg.ok === "boolean" &&
        Object.keys(msg).every(key => ["type", "ok", "errorType"].includes(key)) &&
        (!Object.hasOwn(msg, "errorType") || (!msg.ok && LOCAL_METRIC_ERRORS.includes(msg.errorType)));
}

async function getDiagnostics() {
    const [stored, cache, { usageStats }] = await Promise.all([
        readTranslationSettings(), cacheStats(),
        usageChain.then(() => storageCall("get", ["usageStats"]))
    ]);
    // cacheScope contains a user-entered model ID, which may contain arbitrary text.
    const { cacheScope, ...config } = buildPublicConfig(stored, getBrowserLanguage());
    return { ok: true, version: chrome.runtime.getManifest?.()?.version || "",
        config, cacheEntries: cache.totalEntries, usageStats: sanitizeUsageStats(usageStats || {}) };
}

async function openSetup() {
    if (typeof chrome.action?.openPopup === "function") {
        try { await chrome.action.openPopup(); return; }
        catch (e) { /* The popup may be unavailable from this window or Chrome version. */ }
    }
    await chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
}

function validCacheEntry(entry, migrate = false) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string") return null;
    let [key, value] = entry;
    if (migrate && value && typeof value === "object") {
        value = { ...value, translatedTitle: value.translatedTitle || value.cn, tag: value.tag || "其它" };
    }
    if (!value || typeof value !== "object" || typeof value.translatedTitle !== "string" ||
        !value.translatedTitle.trim() || value.translatedTitle.length > 1000 || typeof value.tag !== "string") return null;
    if (migrate && !/^(ai|local)\n/.test(key)) key = (value.tag === "__builtin__" ? "local\n" : "ai\n") + key;
    if (!/^(ai|local)\n/.test(key) || key.length > 2000) return null;
    return [key, { tag: value.tag, translatedTitle: value.translatedTitle,
        ts: Number.isFinite(value.ts) ? value.ts : Date.now() }];
}

function cacheBucketIndex(key) {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
    return hash & (CACHE_BUCKET_KEYS.length - 1);
}

function rememberCacheEntry(key, value, order = cacheOrder + 1) {
    const index = cacheBucketIndex(key);
    cacheOrder = Math.max(cacheOrder, order);
    const record = { value, order };
    backgroundCache.delete(key);
    backgroundCache.set(key, record);
    cacheBuckets[index].set(key, record);
    dirtyCacheBuckets.add(index);
}

function touchCacheEntry(key) {
    const record = backgroundCache.get(key);
    if (!record) return null;
    record.order = ++cacheOrder;
    backgroundCache.delete(key);
    backgroundCache.set(key, record);
    return record.value;
}

function trimBackgroundCache(limit) {
    while (backgroundCache.size > limit) {
        const key = backgroundCache.keys().next().value;
        const index = cacheBucketIndex(key);
        backgroundCache.delete(key);
        cacheBuckets[index].delete(key);
        dirtyCacheBuckets.add(index);
    }
}

function readClearMarker(stored) {
    return Math.max(cacheClearedAt, stored?.[CACHE_CLEAR_KEY] || 0, stored?.[CACHE_META_KEY]?.clearedAt || 0);
}

function queueCacheOperation(work) {
    const operation = cacheChain.then(work).catch(() => ({ ok: false }));
    cacheChain = operation;
    return operation;
}

async function persistCache() {
    const values = {
        [CACHE_META_KEY]: { v: 3, totalEntries: backgroundCache.size, clearedAt: cacheClearedAt }
    };
    // 同一次 set 释放旧值占用的配额，并提交完整的分片迁移。
    if (legacyCacheNeedsWrite) values[LEGACY_CACHE_KEY] = null;
    for (const index of dirtyCacheBuckets) {
        values[CACHE_BUCKET_KEYS[index]] = Array.from(cacheBuckets[index], ([key, { value, order }]) => [key, value, order]);
    }
    await storageCall("set", values);
    dirtyCacheBuckets.clear();
    legacyCacheNeedsWrite = false;
}

async function persistCacheWithRetry() {
    try { await persistCache(); }
    catch (e) {
        if (!/quota/i.test(e.message)) throw e;
        trimBackgroundCache(Math.floor(backgroundCache.size / 2));
        await persistCache();
    }
}

async function loadCache() {
    if (!cacheLoaded) {
        const stored = await storageCall("get", [CACHE_CLEAR_KEY, CACHE_META_KEY, LEGACY_CACHE_KEY, ...CACHE_BUCKET_KEYS]);
        cacheClearedAt = readClearMarker(stored);
        const raw = stored[LEGACY_CACHE_KEY];
        const isSharded = stored[CACHE_META_KEY]?.v === 3;
        const legacy = Array.isArray(raw) ? raw : raw?.entries;
        const entries = isSharded
            ? CACHE_BUCKET_KEYS.flatMap(key => Array.isArray(stored[key]) ? stored[key] : [])
                .sort((a, b) => (a?.[2] || 0) - (b?.[2] || 0))
            : Array.isArray(legacy) ? legacy : [];
        for (const entry of entries) {
            const valid = validCacheEntry(entry, !isSharded);
            if (!valid || (cacheClearedAt && !(entry[1].ts > cacheClearedAt))) continue;
            const order = isSharded && Number.isSafeInteger(entry[2]) && entry[2] > 0 ? entry[2] : undefined;
            rememberCacheEntry(valid[0], valid[1], order);
        }
        dirtyCacheBuckets.clear();
        legacyCacheNeedsRemoval = Object.hasOwn(stored, LEGACY_CACHE_KEY);
        legacyCacheNeedsWrite = !isSharded && legacyCacheNeedsRemoval;
        if (legacyCacheNeedsWrite) {
            cacheBuckets.forEach((bucket, index) => { if (bucket.size) dirtyCacheBuckets.add(index); });
        }
        trimBackgroundCache(CACHE_LIMIT);
        cacheLoaded = true;
    }
    if (legacyCacheNeedsRemoval) {
        // 只有分片和元信息已落盘后才删除旧键。失败时留到下次操作重试。
        if (legacyCacheNeedsWrite) await persistCacheWithRetry();
        await storageCall("remove", LEGACY_CACHE_KEY);
        legacyCacheNeedsRemoval = false;
    }
}

function cacheClear() {
    return queueCacheOperation(async () => {
        const stored = await storageCall("get", [CACHE_CLEAR_KEY, CACHE_META_KEY]);
        const clearedAt = Math.max(Date.now(), readClearMarker(stored) + 1);
        // 先记录清除时间，worker 即使在移除分片前重启也不会恢复旧条目。
        await storageCall("set", { [CACHE_CLEAR_KEY]: clearedAt });
        cacheClearedAt = clearedAt;
        backgroundCache.clear();
        cacheBuckets.forEach(bucket => bucket.clear());
        dirtyCacheBuckets.clear();
        cacheOrder = 0;
        cacheLoaded = true;
        legacyCacheNeedsRemoval = false;
        legacyCacheNeedsWrite = false;
        try {
            await storageCall("remove", [LEGACY_CACHE_KEY, CACHE_META_KEY, ...CACHE_BUCKET_KEYS]);
        } finally {
            broadcastToYouTube({ type: "cacheCleared", clearedAt });
        }
        return { ok: true };
    });
}

function cachePut(entries, touched) {
    return queueCacheOperation(async () => {
        if (!Array.isArray(entries)) return { ok: false };
        await loadCache();
        if (Array.isArray(touched)) {
            for (const key of touched.slice(0, 300)) {
                if (touchCacheEntry(key)) dirtyCacheBuckets.add(cacheBucketIndex(key));
            }
        }
        for (const entry of entries) {
            const valid = validCacheEntry(entry);
            if (!valid) continue;
            const startedAt = entry[1].requestStartedAt;
            if (startedAt !== undefined && (!Number.isFinite(startedAt) || startedAt <= cacheClearedAt)) continue;
            if (cacheClearedAt && !(entry[1].ts > cacheClearedAt)) continue;
            rememberCacheEntry(...valid);
        }
        trimBackgroundCache(CACHE_LIMIT);
        if (dirtyCacheBuckets.size) await persistCacheWithRetry();
        return { ok: true };
    });
}

function cacheLookup(keys) {
    return queueCacheOperation(async () => {
        if (!Array.isArray(keys)) return { ok: false };
        await loadCache();
        const hits = [];
        for (const key of new Set(keys.slice(0, CACHE_LOOKUP_LIMIT))) {
            const value = touchCacheEntry(key);
            if (value) hits.push([key, value]);
        }
        return { ok: true, hits };
    });
}

function cacheStats() {
    return queueCacheOperation(async () => {
        if (!cacheLoaded) {
            const stored = await storageCall("get", [CACHE_CLEAR_KEY, CACHE_META_KEY]);
            const meta = stored[CACHE_META_KEY];
            if (meta?.v === 3 && meta.clearedAt === readClearMarker(stored) && Number.isInteger(meta.totalEntries)) {
                return { ok: true, totalEntries: meta.totalEntries };
            }
        }
        await loadCache();
        return { ok: true, totalEntries: backgroundCache.size };
    });
}

function broadcastToYouTube(message, isCurrent = () => true) {
    const sendToTabs = tabs => {
        if (!isCurrent()) return;
        for (const { id } of tabs || []) {
            if (!Number.isInteger(id)) continue;
            try {
                chrome.tabs.sendMessage(id, message, () => { void chrome.runtime.lastError; })?.catch?.(() => {});
            } catch (e) { /* 标签页可能已关闭 */ }
        }
    };
    try {
        chrome.tabs?.query({ url: ["https://www.youtube.com/*", "https://m.youtube.com/*"] }, tabs => {
            if (!chrome.runtime.lastError) sendToTabs(tabs);
        })?.then?.(sendToTabs, () => {});
    } catch (e) { /* 扩展上下文可能已失效 */ }
}

async function getPageBootstrap() {
    const [stored, cacheState] = await Promise.all([
        readTranslationSettings(),
        storageCall("get", [CACHE_CLEAR_KEY, CACHE_META_KEY])
    ]);
    return { ok: true, config: buildPublicConfig(stored, getBrowserLanguage()), cacheClearedAt: readClearMarker(cacheState) };
}

let configBroadcastVersion = 0;
chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area !== "local" || !CONFIG_STORAGE_KEYS.some(key => Object.hasOwn(changes, key))) return;
    const version = ++configBroadcastVersion;
    const isCurrent = () => version === configBroadcastVersion;
    readTranslationSettings().then(stored => {
        if (isCurrent()) {
            broadcastToYouTube({ type: "configUpdated", config: buildPublicConfig(stored, getBrowserLanguage()) }, isCurrent);
        }
    }).catch(() => {});
});

chrome.commands?.onCommand?.addListener(command => {
    if (command !== "toggle-translation") return;
    settingsChain = settingsChain.then(async () => {
        const { enabled } = await storageCall("get", ["enabled"]);
        await storageCall("set", { enabled: enabled === false });
    }).catch(() => {});
});

if (chrome.runtime.onInstalled && chrome.runtime.onInstalled.addListener) {
    chrome.runtime.onInstalled.addListener(details => {
        if (details.reason === "install" && chrome.tabs && chrome.tabs.create && chrome.runtime.getURL) {
            chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
        }
    });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "openSetup") {
        openSetup().then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
        return true;
    }
    if (msg?.type === "recordLocalMetric") {
        const operation = validLocalMetric(msg) ? recordUsage("local", [{ ok: msg.ok, errorType: msg.errorType }])
            : Promise.reject(new Error("Invalid local metric"));
        operation.then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
        return true;
    }
    if (!sender?.tab && msg?.type === "getDiagnostics") {
        getDiagnostics().then(sendResponse, () => sendResponse({ ok: false }));
        return true;
    }
    if (!sender?.tab && msg?.type === "dismissReviewPrompt") {
        updateUsageStats(stats => { stats.reviewPromptDismissed = true; })
            .then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
        return true;
    }
    if (msg && msg.type === 'getPageBootstrap') {
        getPageBootstrap().then(sendResponse, () => sendResponse({ ok: false }));
        return true;
    }
    if (msg && msg.type === 'cacheLookup') {
        cacheLookup(msg.keys).then(sendResponse);
        return true;
    }
    if (msg && msg.type === 'getCacheStats') {
        cacheStats().then(sendResponse);
        return true;
    }
    if (msg && msg.type === 'migrateSettings') {
        readTranslationSettings().then(() => sendResponse({ ok:true }), () => sendResponse({ ok:false }));
        return true;
    }
    if (msg && msg.type === 'cachePut') {
        cachePut(msg.entries, msg.touched).then(sendResponse, () => sendResponse({ ok: false }));
        return true;
    }
    if (msg && msg.type === 'cacheClear') {
        cacheClear().then(sendResponse, () => sendResponse({ ok: false }));
        return true;
    }
    if (msg && msg.type === 'testTranslation') {
        fetchAiTranslationQueued(msg.text, msg.config, false)
            .then(reply => sendResponse(reply))
            .catch(e => sendResponse({ ok: false, error: String(e) }));
        return true;
    }
    if (msg && (msg.type === 'translateBatch' || msg.type === 'translate')) {
        translateFromStorage(msg.type === 'translate' ? [msg.text] : msg.items, msg.targetLanguage || (msg.config && msg.config.targetLanguage))
            .then(reply => msg.type === 'translate' ? { ok:reply.ok, result:reply.results[0], error:reply.error } : reply)
            .then(reply => sendResponse(reply))
            .catch(e => sendResponse({ ok: false, error: String(e) }));
        return true;
    }
});

console.log("🚀 Gary BG SW 启动");

// === 单测导出 ===
// 仅供 node:test 引用；扩展运行时没有 module 对象，这段不会执行
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        migrateProviderSettings, readTranslationSettings,
        getBrowserDefaultLanguages, getBrowserLanguage, getTargetLanguageCode, automaticTranslationStillAllowed, cachePut,
        extractJsonValueCandidates,
        parseSingleTranslationFromText,
        parseBatchTranslationsFromText,
        extractBatchArray,
        findBatchResult,
        normalizeTranslationResult,
        classifyApiError,
        buildChatCompletionsBody,
        buildAnthropicBody,
        extractTextFromResponse,
        buildSinglePrompt,
        buildBatchPrompt,
        enqueueTranslation,
        fetchAiTranslationBatchDedup
    };
}
