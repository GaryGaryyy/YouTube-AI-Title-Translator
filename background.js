// === Background Service Worker ===
// 负责发起 AI 翻译请求。content script 通过 sendMessage 把要翻译的文本和配置
// 传过来，SW 完成 HTTP 调用 + JSON 解析后回传结果。
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
const inflightTextResults = new Map();
const DEFAULT_TARGET_LANGUAGE = "en";
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

function extractJsonValueCandidates(s) {
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
async function fetchWithTimeout(url, options, canRetry) {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await fetch(url, Object.assign({}, options, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }));
        } catch (e) {
            if (attempt === 1 || (canRetry && !await canRetry())) throw e;
        }
    }
}

function getApiHost(config) {
    try { return new URL(config.apiUrl).hostname.toLowerCase(); }
    catch (e) { return ""; }
}

function getApiType(config) {
    const host = getApiHost(config);
    if (host === "generativelanguage.googleapis.com") return "google";
    if (host === "api.anthropic.com") return "anthropic";
    return "openai-compatible";
}

function extractTextFromResponse(data, apiType) {
    if (apiType === "google") {
        const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content
            ? data.candidates[0].content.parts : [];
        return (parts || []).filter(part => part && !part.thought && typeof part.text === "string")
            .map(part => part.text).join("");
    }
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
    const translatedTitle = result.translatedTitle || result.translated_title || result.targetTitle ||
        result.target_title || result.title || result.translation || result.translated || result.text ||
        result.cn || result.zh || result.chinese;
    if (!translatedTitle) return null;
    return { tag: normalizeTag(result.tag || result.category || result.type), translatedTitle: String(translatedTitle).trim() };
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
        .map(key => Object.assign({ i: Number(key) }, parsed[key]));
    if (numericEntries.length > 0) return numericEntries;

    if (expectedLength === 1 && (parsed.translatedTitle || parsed.cn || parsed.tag)) return [parsed];
    return null;
}

function findBatchResult(arr, idx) {
    return arr.find(r => r && (r.i === idx || r.index === idx || r.id === idx || r.idx === idx)) || arr[idx];
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
        const candidates = extractJsonValueCandidates(text);
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
    const raw = JSON.stringify(data || {});
    const lower = raw.toLowerCase();
    if (status === 401 || status === 403 || lower.includes("invalid api key") || lower.includes("unauthorized")) {
        return makeError("auth", "Key 无效", { status, data });
    }
    if (status === 402 || status === 429 || lower.includes("quota") || lower.includes("balance") || lower.includes("rate limit")) {
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
        config.model || "", getTargetLanguageCode(config), text]);
}

function automaticTranslationStillAllowed(config) {
    config = config || {};
    return new Promise(resolve => {
        chrome.storage.local.get(["enabled", "translationMode", "selectedProvider", "providerConfigs",
            "customApiKey", "customApiUrl", "customModel", "targetLanguage"], stored => {
            if (chrome.runtime.lastError || stored.enabled === false) { resolve(false); return; }
            let active = stored.providerConfigs && stored.providerConfigs[stored.selectedProvider];
            if (!stored.providerConfigs && stored.customApiKey) {
                active = { apiKey:stored.customApiKey, apiUrl:stored.customApiUrl, model:stored.customModel };
            }
            const mode = ["local", "ai"].includes(stored.translationMode)
                ? stored.translationMode : (active && active.apiKey ? "ai" : "local");
            resolve(mode === "ai" && !!active && !!active.apiKey &&
                ["apiKey", "apiUrl", "model"].every(key => (active[key] || "") === (config[key] || "")) &&
                getTargetLanguageCode(stored) === getTargetLanguageCode(config));
        });
    });
}

function getTargetLanguageCode(config) {
    const code = config && config.targetLanguage ? config.targetLanguage : DEFAULT_TARGET_LANGUAGE;
    return TARGET_LANGUAGE_NAMES[code] ? code : DEFAULT_TARGET_LANGUAGE;
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
        if (model === "gpt-6-luna") {
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
        if (["api.minimax.io", "api.minimaxi.com", "api.minimax.chat"].includes(host) && /^MiniMax-M[23]/.test(model)) {
            body.reasoning_split = true;
            if (model === "MiniMax-M3") {
                body.thinking = { type: "disabled" };
                body.max_completion_tokens = maxTokens;
                delete body.max_tokens;
            } else {
                body.max_tokens = reasoningBudget;
                if (model === "MiniMax-M3.1-Flash-Preview") body.reasoning_effort = "low";
            }
        }
        if (["api.z.ai", "open.bigmodel.cn"].includes(host) && /^glm-(4\.[567]|5)/.test(model)) {
            body.max_tokens = reasoningBudget;
            if (/^glm-5\.[23](?:$|-)/.test(model)) {
                body.thinking = { type: "enabled" };
                body.reasoning_effort = "low";
                body.temperature = 1;
            }
        }
        if (["api.moonshot.ai", "api.moonshot.cn"].includes(host) && /^kimi-k/.test(model)) {
            delete body.temperature;
            if (model === "kimi-k2.6") body.thinking = { type: "disabled" };
            else {
                body.max_tokens = reasoningBudget;
                if (model === "kimi-k3") body.reasoning_effort = "low";
            }
        }
    }

    return body;
}

function buildGeminiBody(config, promptText, maxTokens) {
    const generationConfig = { maxOutputTokens: maxTokens, responseMimeType: "application/json" };
    if (/^gemini-3(?:\.|-)/.test(config.model || "")) {
        generationConfig.thinkingConfig = {
            thinkingLevel: config.model === "gemini-3.5-flash-lite" ? "minimal" : "low"
        };
        generationConfig.maxOutputTokens = Math.max(4096, maxTokens + 3072);
    } else {
        generationConfig.temperature = 0.3;
    }
    return { contents: [{ parts: [{ text: promptText }] }], generationConfig };
}

function buildAnthropicBody(config, promptText, maxTokens) {
    const body = {
        model: config.model, system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: promptText }], max_tokens: maxTokens
    };
    if (/^claude-(sonnet|opus|fable)-5(?:-|$)/.test(config.model || "")) {
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
    let response;

    try {
        const apiType = getApiType(config);

        if (apiType === "google") {
            response = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
                body: JSON.stringify(buildGeminiBody(config, promptText, 500))
            }, canRetry);
        } else if (apiType === "anthropic") {
            response = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify(buildAnthropicBody(config, promptText, 500))
            }, canRetry);
        } else {
            response = await fetchWithTimeout(config.apiUrl, {
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
    let response;

    try {
        const apiType = getApiType(config);

        if (apiType === "google") {
            response = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
                body: JSON.stringify(buildGeminiBody(config, promptText, maxTokens))
            }, canRetry);
        } else if (apiType === "anthropic") {
            response = await fetchWithTimeout(config.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify(buildAnthropicBody(config, promptText, maxTokens))
            }, canRetry);
        } else {
            response = await fetchWithTimeout(config.apiUrl, {
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
            const found = findBatchResult(arr, idx);
            return normalizeTranslationResult(found);
        });
        return { ok: true, results };

    } catch (e) {
        console.error("[Gary BG] 批量翻译失败:", e, "条数:", items.length, "模型返回:", raw || "(无)");
        return { ok: false, results: items.map(() => null), error: makeError("network", "网络或服务商异常", String(e)) };
    }
}

async function fetchAiTranslationBatchDedup(items, config, automatic = false) {
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
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && (msg.type === 'translate' || msg.type === 'testTranslation')) {
        fetchAiTranslationQueued(msg.text, msg.config, msg.type !== 'testTranslation')
            .then(reply => sendResponse(reply))
            .catch(e => sendResponse({ ok: false, error: String(e) }));
        return true;
    }
    if (msg && msg.type === 'translateBatch') {
        fetchAiTranslationBatchDedup(msg.items, msg.config, true)
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
        extractJsonValueCandidates,
        parseSingleTranslationFromText,
        parseBatchTranslationsFromText,
        extractBatchArray,
        findBatchResult,
        normalizeTranslationResult,
        classifyApiError,
        buildChatCompletionsBody,
        buildGeminiBody,
        buildAnthropicBody,
        extractTextFromResponse,
        buildSinglePrompt,
        buildBatchPrompt,
        enqueueTranslation,
        fetchAiTranslationBatchDedup
    };
}
