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

// ================= 配置区 =================
let USER_CONFIG = { configured: false, batchSize: 6 };
const RETIRED_PROVIDERS = ["google", "minimax", "zhipu", "kimi"]; // Storage migration compatibility.
let TARGET_LANGUAGE = "en";
let UI_LANGUAGE = "en";
let CONFIG_READY = false;
let TRANSLATION_MODE = "local";
let translationGeneration = 0;

const SUPPORTED_TARGET_LANGUAGES = new Set([
    "zh-Hans", "zh-Hant", "en", "ja", "ko", "th", "es", "fr", "de", "pt", "id", "vi"
]);
const SUPPORTED_UI_LANGUAGES = new Set([
    "zh-Hans", "en", "ja", "ko", "th", "es", "fr", "de", "pt", "id", "vi", "ru", "ar", "hi"
]);

const CONTENT_TEXT = {
    en: {
        original: "Original",
        status: "Status",
        unconfiguredTag: "Setup",
        unconfiguredTitle: "Configure the extension",
        unconfiguredStatus: "Not configured",
        queuedTag: "Queue",
        queuedTitle: "Queued...",
        queuedStatus: "Queued",
        translatingTag: "AI",
        translatingTitle: "Translating...",
        translatingStatus: "Translating",
        completedStatus: "Done",
        cachedStatus: "Cached",
        failedPrefix: "Translation failed",
        retryHint: "Click to retry",
        extension: "Extension updated. Refresh the page.",
        auth: "Invalid key",
        quota: "Quota or rate limit",
        model: "Model may be wrong",
        parse: "Unexpected model response",
        network: "Network or provider error"
    },
    "zh-Hans": {
        original: "原标题",
        status: "状态",
        unconfiguredTag: "未配置",
        unconfiguredTitle: "请配置插件",
        unconfiguredStatus: "未配置",
        queuedTag: "队列",
        queuedTitle: "排队中...",
        queuedStatus: "排队中",
        translatingTag: "AI",
        translatingTitle: "翻译中...",
        translatingStatus: "翻译中",
        completedStatus: "已完成",
        cachedStatus: "已缓存",
        failedPrefix: "翻译失败",
        retryHint: "点击重试",
        extension: "插件已更新，请刷新页面",
        auth: "Key 无效",
        quota: "余额不足或被限流",
        model: "模型名可能错误",
        parse: "模型返回格式异常",
        network: "网络或服务商异常"
    }
};

const TARGET_STATUS_TEXT = {
    en: {
        failedPrefix: "Translation failed",
        extension: "Extension updated. Refresh the page.",
        auth: "Invalid key",
        quota: "Quota or rate limit",
        model: "Model may be wrong",
        parse: "Unexpected model response",
        network: "Network or provider error"
    },
    "zh-Hans": {
        failedPrefix: "翻译失败",
        extension: "插件已更新，请刷新页面",
        auth: "Key 无效",
        quota: "余额不足或被限流",
        model: "模型名可能错误",
        parse: "模型返回格式异常",
        network: "网络或服务商异常"
    },
    "zh-Hant": {
        failedPrefix: "翻譯失敗",
        extension: "擴充功能已更新，請重新整理頁面",
        auth: "Key 無效",
        quota: "額度不足或被限流",
        model: "模型名稱可能錯誤",
        parse: "模型回傳格式異常",
        network: "網路或服務商異常"
    },
    ja: {
        failedPrefix: "翻訳失敗",
        extension: "拡張機能が更新されました。ページを再読み込みしてください。",
        auth: "キーが無効です",
        quota: "残高不足またはレート制限",
        model: "モデル名が間違っている可能性があります",
        parse: "モデルの応答形式が異常です",
        network: "ネットワークまたはプロバイダーのエラー"
    },
    ko: {
        failedPrefix: "번역 실패",
        extension: "확장 프로그램이 업데이트되었습니다. 페이지를 새로고침하세요.",
        auth: "Key가 유효하지 않습니다",
        quota: "잔액 부족 또는 속도 제한",
        model: "모델 이름이 잘못되었을 수 있습니다",
        parse: "모델 응답 형식 오류",
        network: "네트워크 또는 제공업체 오류"
    },
    th: {
        failedPrefix: "แปลล้มเหลว",
        extension: "ส่วนขยายอัปเดตแล้ว โปรดรีเฟรชหน้า",
        auth: "Key ไม่ถูกต้อง",
        quota: "โควตาไม่พอหรือถูกจำกัดความเร็ว",
        model: "ชื่อโมเดลอาจไม่ถูกต้อง",
        parse: "รูปแบบคำตอบของโมเดลผิดปกติ",
        network: "เครือข่ายหรือผู้ให้บริการผิดพลาด"
    },
    es: {
        failedPrefix: "Error de traducción",
        extension: "Extensión actualizada. Recarga la página.",
        auth: "Key no válida",
        quota: "Sin cuota o límite de velocidad",
        model: "El modelo puede ser incorrecto",
        parse: "Formato de respuesta inesperado",
        network: "Error de red o proveedor"
    },
    fr: {
        failedPrefix: "Échec de traduction",
        extension: "Extension mise à jour. Actualisez la page.",
        auth: "Clé invalide",
        quota: "Quota insuffisant ou limite atteinte",
        model: "Le nom du modèle est peut-être incorrect",
        parse: "Format de réponse inattendu",
        network: "Erreur réseau ou fournisseur"
    },
    de: {
        failedPrefix: "Übersetzung fehlgeschlagen",
        extension: "Erweiterung aktualisiert. Seite neu laden.",
        auth: "Ungültiger Key",
        quota: "Kein Kontingent oder Ratenlimit",
        model: "Modellname möglicherweise falsch",
        parse: "Unerwartetes Antwortformat",
        network: "Netzwerk- oder Anbieterfehler"
    },
    pt: {
        failedPrefix: "Falha na tradução",
        extension: "Extensão atualizada. Atualize a página.",
        auth: "Key inválida",
        quota: "Sem cota ou limite de taxa",
        model: "O nome do modelo pode estar errado",
        parse: "Formato de resposta inesperado",
        network: "Erro de rede ou provedor"
    },
    id: {
        failedPrefix: "Terjemahan gagal",
        extension: "Ekstensi diperbarui. Segarkan halaman.",
        auth: "Key tidak valid",
        quota: "Kuota habis atau dibatasi",
        model: "Nama model mungkin salah",
        parse: "Format respons model tidak sesuai",
        network: "Kesalahan jaringan atau penyedia"
    },
    vi: {
        failedPrefix: "Dịch thất bại",
        extension: "Tiện ích đã cập nhật. Hãy tải lại trang.",
        auth: "Key không hợp lệ",
        quota: "Hết hạn mức hoặc bị giới hạn tốc độ",
        model: "Tên mô hình có thể sai",
        parse: "Định dạng phản hồi không hợp lệ",
        network: "Lỗi mạng hoặc nhà cung cấp"
    }
};

// Local failures never involve an AI provider. Chrome may require a page click
// before it can download a missing language pack; the badge already retries on click.
Object.entries({
    en: "On-device translation unavailable. Click to retry; Chrome may need a language pack.",
    "zh-Hans": "本机翻译暂不可用，请点击重试；可能需要下载语言包",
    "zh-Hant": "本機翻譯暫時無法使用，請點擊重試；可能需要下載語言套件",
    ja: "端末内の翻訳を利用できません。クリックして再試行してください。言語パックが必要な場合があります。",
    ko: "기기 내 번역을 사용할 수 없습니다. 클릭하여 다시 시도하세요. 언어 팩이 필요할 수 있습니다.",
    th: "ยังใช้การแปลบนอุปกรณ์ไม่ได้ คลิกเพื่อลองอีกครั้ง อาจต้องดาวน์โหลดชุดภาษา",
    es: "La traducción en el dispositivo no está disponible. Haz clic para reintentar; puede faltar un paquete de idioma.",
    fr: "La traduction sur l’appareil est indisponible. Cliquez pour réessayer ; un pack de langue peut être nécessaire.",
    de: "Lokale Übersetzung nicht verfügbar. Zum Wiederholen klicken; eventuell fehlt ein Sprachpaket.",
    pt: "A tradução no dispositivo está indisponível. Clique para tentar novamente; pode ser necessário um pacote de idioma.",
    id: "Terjemahan di perangkat belum tersedia. Klik untuk mencoba lagi; paket bahasa mungkin perlu diunduh.",
    vi: "Chưa thể dịch trên thiết bị. Nhấp để thử lại; có thể cần tải gói ngôn ngữ."
}).forEach(([code, local]) => { TARGET_STATUS_TEXT[code].local = local; });

[
    ["ja", "元のタイトル", "状態", "設定", "拡張機能を設定してください", "キュー", "待機中...", "翻訳中...", "完了", "キャッシュ済み", "翻訳失敗"],
    ["ko", "원본 제목", "상태", "설정", "확장 프로그램을 설정하세요", "대기", "대기 중...", "번역 중...", "완료", "캐시됨", "번역 실패"],
    ["th", "ชื่อเดิม", "สถานะ", "ตั้งค่า", "โปรดตั้งค่าส่วนขยาย", "คิว", "กำลังรอ...", "กำลังแปล...", "เสร็จแล้ว", "แคชแล้ว", "แปลล้มเหลว"],
    ["es", "Original", "Estado", "Config", "Configura la extensión", "Cola", "En cola...", "Traduciendo...", "Listo", "En caché", "Error de traducción"],
    ["fr", "Original", "État", "Config", "Configurez l'extension", "File", "En attente...", "Traduction...", "Terminé", "En cache", "Échec de traduction"],
    ["de", "Original", "Status", "Setup", "Erweiterung konfigurieren", "Warteschlange", "Wartet...", "Übersetzt...", "Fertig", "Cache", "Übersetzung fehlgeschlagen"],
    ["pt", "Original", "Status", "Config", "Configure a extensão", "Fila", "Na fila...", "Traduzindo...", "Concluído", "Em cache", "Falha na tradução"],
    ["id", "Asli", "Status", "Atur", "Konfigurasikan ekstensi", "Antrean", "Mengantre...", "Menerjemahkan...", "Selesai", "Cache", "Terjemahan gagal"],
    ["vi", "Gốc", "Trạng thái", "Cài đặt", "Hãy cấu hình tiện ích", "Hàng đợi", "Đang chờ...", "Đang dịch...", "Xong", "Đã lưu đệm", "Dịch thất bại"],
    ["ru", "Оригинал", "Статус", "Настр.", "Настройте расширение", "Очередь", "В очереди...", "Перевод...", "Готово", "Из кэша", "Ошибка перевода"],
    ["ar", "الأصل", "الحالة", "إعداد", "يرجى إعداد الإضافة", "قائمة", "في الانتظار...", "جار الترجمة...", "تم", "مخزن", "فشل الترجمة"],
    ["hi", "मूल", "स्थिति", "सेटअप", "एक्सटेंशन कॉन्फ़िगर करें", "कतार", "कतार में...", "अनुवाद हो रहा...", "पूर्ण", "कैश", "अनुवाद विफल"]
].forEach(([code, original, status, unconfiguredTag, unconfiguredTitle, queuedTag, queuedTitle, translatingTitle, completedStatus, cachedStatus, failedPrefix]) => {
    CONTENT_TEXT[code] = Object.assign({}, CONTENT_TEXT.en, {
        original,
        status,
        unconfiguredTag,
        unconfiguredTitle,
        unconfiguredStatus: unconfiguredTitle,
        queuedTag,
        queuedTitle,
        queuedStatus: queuedTitle,
        translatingTitle,
        translatingStatus: translatingTitle,
        completedStatus,
        cachedStatus,
        failedPrefix
    });
});

Object.entries({
    "en": "Click to download the {language} language pack",
    "zh-Hans": "点击下载{language}语言包",
    "ja": "クリックして{language}の言語パックをダウンロード",
    "ko": "클릭하여 {language} 언어 팩 다운로드",
    "th": "คลิกเพื่อดาวน์โหลดชุดภาษา{language}",
    "es": "Haz clic para descargar el paquete de {language}",
    "fr": "Cliquez pour télécharger le pack de langue {language}",
    "de": "Klicken, um das Sprachpaket für {language} herunterzuladen",
    "pt": "Clique para baixar o pacote de idioma {language}",
    "id": "Klik untuk mengunduh paket bahasa {language}",
    "vi": "Nhấp để tải gói ngôn ngữ {language}",
    "ru": "Нажмите, чтобы скачать языковой пакет: {language}",
    "ar": "انقر لتنزيل حزمة اللغة {language}",
    "hi": "{language} भाषा पैक डाउनलोड करने के लिए क्लिक करें"
}).forEach(([code, text]) => { CONTENT_TEXT[code].downloadLanguagePack = text; });

const TAG_LABELS = {
    "科技": { en: "Tech", "zh-Hans": "科技", "zh-Hant": "科技", ja: "テック", ko: "기술", th: "เทค", es: "Tecnología", fr: "Tech", de: "Tech", pt: "Tecnologia", id: "Teknologi", vi: "Công nghệ", ru: "Техно", ar: "تقنية", hi: "टेक" },
    "__builtin__": { en: "On-device", "zh-Hans": "本机", "zh-Hant": "本機", ja: "端末内", ko: "기기 내", th: "บนอุปกรณ์", es: "En el dispositivo", fr: "Sur l'appareil", de: "Lokal", pt: "No dispositivo", id: "Di perangkat", vi: "Trên thiết bị", ru: "Локально", ar: "على الجهاز", hi: "डिवाइस पर" },
    "游戏": { en: "Gaming", "zh-Hans": "游戏", "zh-Hant": "遊戲", ja: "ゲーム", ko: "게임", th: "เกม", es: "Juegos", fr: "Jeux", de: "Gaming", pt: "Jogos", id: "Game", vi: "Game", ru: "Игры", ar: "ألعاب", hi: "गेम" },
    "音乐": { en: "Music", "zh-Hans": "音乐", "zh-Hant": "音樂", ja: "音楽", ko: "음악", th: "เพลง", es: "Música", fr: "Musique", de: "Musik", pt: "Música", id: "Musik", vi: "Âm nhạc", ru: "Музыка", ar: "موسيقى", hi: "संगीत" },
    "教程": { en: "Tutorial", "zh-Hans": "教程", "zh-Hant": "教學", ja: "解説", ko: "튜토리얼", th: "สอน", es: "Tutorial", fr: "Tuto", de: "Tutorial", pt: "Tutorial", id: "Tutorial", vi: "Hướng dẫn", ru: "Обучение", ar: "شرح", hi: "ट्यूटोरियल" },
    "搞笑": { en: "Comedy", "zh-Hans": "搞笑", "zh-Hant": "搞笑", ja: "コメディ", ko: "코미디", th: "ตลก", es: "Comedia", fr: "Humour", de: "Comedy", pt: "Comédia", id: "Komedi", vi: "Hài", ru: "Юмор", ar: "كوميديا", hi: "कॉमेडी" },
    "新闻": { en: "News", "zh-Hans": "新闻", "zh-Hant": "新聞", ja: "ニュース", ko: "뉴스", th: "ข่าว", es: "Noticias", fr: "Actu", de: "News", pt: "Notícias", id: "Berita", vi: "Tin tức", ru: "Новости", ar: "أخبار", hi: "समाचार" },
    "财经": { en: "Finance", "zh-Hans": "财经", "zh-Hant": "財經", ja: "金融", ko: "금융", th: "การเงิน", es: "Finanzas", fr: "Finance", de: "Finanzen", pt: "Finanças", id: "Finansial", vi: "Tài chính", ru: "Финансы", ar: "مال", hi: "वित्त" },
    "生活": { en: "Life", "zh-Hans": "生活", "zh-Hant": "生活", ja: "生活", ko: "생활", th: "ไลฟ์", es: "Vida", fr: "Vie", de: "Leben", pt: "Vida", id: "Hidup", vi: "Đời sống", ru: "Жизнь", ar: "حياة", hi: "जीवन" },
    "体育": { en: "Sports", "zh-Hans": "体育", "zh-Hant": "體育", ja: "スポーツ", ko: "스포츠", th: "กีฬา", es: "Deportes", fr: "Sport", de: "Sport", pt: "Esporte", id: "Olahraga", vi: "Thể thao", ru: "Спорт", ar: "رياضة", hi: "खेल" },
    "影视": { en: "Film", "zh-Hans": "影视", "zh-Hant": "影視", ja: "映像", ko: "영상", th: "หนัง", es: "Cine", fr: "Cinéma", de: "Film", pt: "Cinema", id: "Film", vi: "Phim", ru: "Кино", ar: "أفلام", hi: "फिल्म" },
    "美食": { en: "Food", "zh-Hans": "美食", "zh-Hant": "美食", ja: "料理", ko: "음식", th: "อาหาร", es: "Comida", fr: "Cuisine", de: "Essen", pt: "Comida", id: "Makanan", vi: "Ẩm thực", ru: "Еда", ar: "طعام", hi: "भोजन" },
    "其它": { en: "Other", "zh-Hans": "其它", "zh-Hant": "其他", ja: "その他", ko: "기타", th: "อื่นๆ", es: "Otro", fr: "Autre", de: "Sonstiges", pt: "Outro", id: "Lainnya", vi: "Khác", ru: "Другое", ar: "أخرى", hi: "अन्य" }
};

function getText(key) {
    const pack = CONTENT_TEXT[UI_LANGUAGE] || CONTENT_TEXT.en;
    return pack[key] || CONTENT_TEXT.en[key] || key;
}

function getTargetText(key) {
    const pack = TARGET_STATUS_TEXT[TARGET_LANGUAGE] || TARGET_STATUS_TEXT.en;
    return pack[key] || TARGET_STATUS_TEXT.en[key] || getText(key);
}

function localizeTag(tag) {
    const labels = TAG_LABELS[tag] || TAG_LABELS["其它"];
    return labels[TARGET_LANGUAGE] || labels[UI_LANGUAGE] || labels.en;
}

console.log("🚀 Gary插件 v8.1.0 已启动");

// ================= 持久化翻译缓存 =================
// 设计：目标语言 + 原文 → {tag, translatedTitle, ts} 的 Map，启动时一次从 chrome.storage 加载，
// 命中直接渲染（0 token、0 网络）；增量 debounce 500ms 后交给后台落盘。
// LRU：插入时如已存在先 delete 再 set，把最近用的放到 Map 末尾；
// 超过 10000 条时弹出最早的 entry。
const CACHE_LIMIT = 10000;
const translationCache = new Map();
let cacheSaveTimer = null;
const pendingCacheEntries = new Map();
// 命中过的 key：随下一次写入一并告诉后台，让后台按“最近使用”而不是“最早写入”淘汰。
const touchedCacheKeys = new Set();
let cacheClearedAt = 0;   // 本页最近一次收到“清缓存”的时刻；更早的条目不再合并、不再重发
let cacheReadyResolve;
const cacheReady = new Promise(resolve => { cacheReadyResolve = resolve; });

function loadCache() {
    chrome.storage.local.get(['translationCache'], (result) => {
        if (chrome.runtime.lastError) {
            console.warn("[Gary] 缓存读取失败:", chrome.runtime.lastError.message);
        } else {
            // v8.0.3 起存 {v, entries}；兼容旧版裸数组；损坏的条目逐条丢弃（自愈）
            const raw = result.translationCache;
            const arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.entries) ? raw.entries : null);
            if (arr) {
                let loaded = 0;
                arr.forEach(entry => {
                    if (Array.isArray(entry) && typeof entry[0] === 'string' && entry[1] && typeof entry[1] === 'object') {
                        const mode = entry[1].tag === "__builtin__" ? "local" : "ai";
                        const key = /^(ai|local)\n/.test(entry[0]) ? entry[0] : mode + "\n" + entry[0];
                        translationCache.set(key, entry[1]);
                        loaded++;
                    }
                });
                console.log(`💾 缓存已加载 ${loaded} 条`);
            }
        }
        // 无论成败都要放行首次扫描
        cacheReadyResolve();
    });
}

function getCacheKey(text, lang, mode) {
    return `${mode || TRANSLATION_MODE}\n${lang || TARGET_LANGUAGE}\n${text}`;
}

function normalizeCachedResult(value) {
    if (!value) return null;
    const translatedTitle = value.translatedTitle || value.cn;
    if (!translatedTitle) return null;
    return { tag: value.tag || "其它", translatedTitle };
}

function cacheGet(text) {
    const key = getCacheKey(text);
    const v = normalizeCachedResult(translationCache.get(key));
    if (v) {
        // LRU touch：移到末尾
        translationCache.delete(key);
        translationCache.set(key, v);
        touchedCacheKeys.add(key);
    }
    return v;
}

function cacheSet(text, result, lang) {
    // 根据实际结果而非当前模式写入，避免切换模式后旧请求污染新模式的缓存。
    const key = getCacheKey(text, lang, result.tag === "__builtin__" ? "local" : "ai");
    translationCache.delete(key);
    translationCache.set(key, { tag: result.tag, translatedTitle: result.translatedTitle, ts: Date.now() });
    while (translationCache.size > CACHE_LIMIT) {
        const oldest = translationCache.keys().next().value;
        translationCache.delete(oldest);
    }
    pendingCacheEntries.set(key, translationCache.get(key));
    scheduleCacheSave();
}

async function flushCacheWrites() {
    if (cacheSaveTimer) clearTimeout(cacheSaveTimer);
    cacheSaveTimer = null;
    if (!pendingCacheEntries.size) return;
    // 命中记录只搭这次写入的便车，不单独触发落盘；排在新条目之前，新条目仍是最近使用。
    // 只发 key：后台据此调整已有条目的顺序，不会凭它新建条目（否则清缓存后可能把旧译文带回来）。
    const touched = [...touchedCacheKeys].filter(key => !pendingCacheEntries.has(key)).slice(0, 300);
    touchedCacheKeys.clear();
    const fresh = Array.from(pendingCacheEntries);
    pendingCacheEntries.clear();
    let reply = null;
    try { reply = await chrome.runtime.sendMessage({ type: "cachePut", entries: fresh, touched }); } catch (e) { /* 上下文失效 */ }
    if (reply && reply.ok) return;
    // 后台没确认落盘：留到下一次写入时一起重发。不单独起定时器，避免后台持续失败时空转；
    // 期间被清掉的缓存不重发，积压上限 500 条。
    for (const [key, value] of fresh) {
        if (value.ts >= cacheClearedAt && !pendingCacheEntries.has(key)) pendingCacheEntries.set(key, value);
    }
    while (pendingCacheEntries.size > 500) pendingCacheEntries.delete(pendingCacheEntries.keys().next().value);
}

function scheduleCacheSave() {
    if (cacheSaveTimer) clearTimeout(cacheSaveTimer);
    cacheSaveTimer = setTimeout(flushCacheWrites, 500);
}

function mergeCache(raw) {
    const entries = Array.isArray(raw) ? raw : raw && raw.entries;
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
        if (!Array.isArray(entry) || typeof entry[0] !== "string" || !entry[1] || typeof entry[1] !== "object") continue;
        // 用户清过缓存后，清除前的条目可能随一次迟到的写入再广播过来，不能合并回内存。
        if (cacheClearedAt && !(entry[1].ts >= cacheClearedAt)) continue;
        const key = /^(ai|local)\n/.test(entry[0]) ? entry[0]
            : (entry[1].tag === "__builtin__" ? "local\n" : "ai\n") + entry[0];
        if (!translationCache.has(key)) translationCache.set(key, entry[1]);
    }
    while (translationCache.size > CACHE_LIMIT) translationCache.delete(translationCache.keys().next().value);
}

loadCache();
// =================================================

// --- 初始化配置 ---
// v6.2 起每个 provider 单独存配置：providerConfigs[provider] = {apiKey, apiUrl, model}
// 同时兼容 v6.0/6.1 的旧扁平结构 (customApiKey/Url/Model)
// 主开关状态（默认开启）
let ENABLED = true;

function getActiveTranslationConfig(result) {
    const provider = RETIRED_PROVIDERS.includes(result.selectedProvider) && result.providerConfigs && result.providerConfigs.custom
        ? "custom" : result.selectedProvider;
    let cfg = result.providerConfigs && provider ? result.providerConfigs[provider] : null;
    if (!result.providerConfigs && result.customApiKey) {
        cfg = { apiKey: result.customApiKey, apiUrl: result.customApiUrl, model: result.customModel };
    }
    if (result.selectedProvider === "google" && provider !== "custom" && cfg) cfg = Object.assign({}, cfg, { apiUrl:"" });
    const mode = ["local", "ai"].includes(result.translationMode)
        ? result.translationMode : (cfg && cfg.apiKey ? "ai" : "local");
    const pending = !!result.providerMigrationPending || RETIRED_PROVIDERS.includes(result.selectedProvider);
    return { mode, config: { configured: !!(mode === "ai" && !pending && cfg && cfg.apiKey && cfg.apiUrl && cfg.model),
        batchSize: getModelBatchSize(cfg && cfg.model) } };
}

function applyConfigFromStorage(result) {
    const previous = JSON.stringify([ENABLED, TARGET_LANGUAGE, TRANSLATION_MODE, USER_CONFIG]);
    ENABLED = result.enabled !== false;   // undefined 视为开启
    const defaults = getBrowserDefaultLanguages(getBrowserLanguage());
    TARGET_LANGUAGE = SUPPORTED_TARGET_LANGUAGES.has(result.targetLanguage) ? result.targetLanguage : defaults.targetLanguage;
    UI_LANGUAGE = SUPPORTED_UI_LANGUAGES.has(result.uiLanguage) ? result.uiLanguage : defaults.uiLanguage;

    const active = getActiveTranslationConfig(result);
    TRANSLATION_MODE = active.mode;
    USER_CONFIG = active.config;
    if (RETIRED_PROVIDERS.includes(result.selectedProvider)) {
        // The worker owns migration writes, including users whose old endpoint is now unconfigured.
        try { chrome.runtime.sendMessage({ type:"migrateSettings" })?.catch(() => {}); } catch (e) {}
    }
    if (previous !== JSON.stringify([ENABLED, TARGET_LANGUAGE, TRANSLATION_MODE, USER_CONFIG])) translationGeneration++;
}

const CONFIG_STORAGE_KEYS = ['enabled', 'translationMode', 'providerConfigs', 'selectedProvider', 'customApiUrl', 'customApiKey', 'customModel', 'targetLanguage', 'uiLanguage', 'providerMigrationPending'];

function initConfig() {
    chrome.storage.local.get(CONFIG_STORAGE_KEYS, (result) => {
        applyConfigFromStorage(result);
        CONFIG_READY = true;
        // 等缓存加载完再首次扫描，避免冷启动对可视区标题重复发起 API 请求
        cacheReady.then(() => scheduleProcess());
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local') return;
        // popup 清除缓存：同步清空内存并取消待落盘，否则 debounce 保存会把旧缓存写回去
        if (changes.translationCache && changes.translationCache.newValue === undefined) {
            translationCache.clear();
            pendingCacheEntries.clear();
            touchedCacheKeys.clear();
            cacheClearedAt = Date.now();
            if (cacheSaveTimer) { clearTimeout(cacheSaveTimer); cacheSaveTimer = null; }
        }
        if (changes.translationCache && changes.translationCache.newValue !== undefined) mergeCache(changes.translationCache.newValue);
        // 缓存落盘等无关 key 不触发重读
        if (!Object.keys(changes).some(key => CONFIG_STORAGE_KEYS.includes(key))) return;
        const shouldResetRenderedTitles = Object.keys(changes).some(key => key !== "enabled" && CONFIG_STORAGE_KEYS.includes(key));
        const wasEnabled = ENABLED;
        // 配置类 key 变化时，整体重读，简单稳妥
        chrome.storage.local.get(CONFIG_STORAGE_KEYS, (result) => {
            applyConfigFromStorage(result);
            if (shouldResetRenderedTitles) {
                // UI 语言或验证时间等元数据也会重建标题，旧异步任务不能再挂回 badge。
                translationGeneration++;
                resetAllRenderedTranslations();
                if (ENABLED) scheduleProcess();
            } else if (!wasEnabled && ENABLED) {
                // 暂停 → 开启：主动补一次扫描，不用等下一次 DOM 变化
                scheduleProcess();
            } else if (wasEnabled && !ENABLED) {
                // 开启 → 暂停：移除已渲染的翻译 badge，页面恢复原样
                resetAllRenderedTranslations();
            }
        });
    });
}
// 注意：initConfig() 的调用在文件末尾，等所有声明完成后再执行

// --- UI 创建函数 ---
function buildTooltip(originalText, statusText) {
    return `${getText("original")}：${originalText}${statusText ? `\n${getText("status")}：${statusText}` : ""}`;
}

function setBoxTooltip(box, originalText, statusText) {
    box.title = buildTooltip(originalText, statusText);
}

function createSafeBadge(tagText, translatedText, isMainTitle = false, originalText = "", statusText = "", state = "", targetElement = null) {
    const linked = !isMainTitle && targetElement && targetElement.tagName === "A" && targetElement.hasAttribute("href") &&
        targetElement.parentElement && !targetElement.parentElement.closest("a");
    const container = document.createElement(linked ? "a" : "div");
    if (linked) { container.href = targetElement.href; container.tabIndex = -1; }
    container.className = 'gary-cn-box';
    container.dataset.garyRole = "translation";
    // pending / done / error / download：驱动翻译、重试与语言包下载。
    container.dataset.garyState = state;
    if (isMainTitle) container.classList.add('gary-main-title-box');
    setBoxTooltip(container, originalText, statusText);

    const tagSpan = document.createElement('span');
    tagSpan.className = 'gary-tag';
    tagSpan.textContent = tagText;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'gary-cn-title';
    titleSpan.textContent = translatedText;

    if (tagText === getText("unconfiguredTag")) titleSpan.style.color = "#d32f2f";

    container.appendChild(tagSpan);
    container.appendChild(titleSpan);

    if (isMainTitle) {
        const originalLine = document.createElement('div');
        originalLine.className = 'gary-original-title';
        originalLine.textContent = originalText;
        container.appendChild(originalLine);
    }

    return container;
}

// 渲染辅助函数（批量翻译走相同的成功/失败渲染路径）
// dataset.garyState：pending（排队/翻译中）、done、error、download。
function renderStatus(box, tagText, translatedText, statusText) {
    box.dataset.garyState = "pending";
    const tag = box.querySelector('.gary-tag');
    const title = box.querySelector('.gary-cn-title');
    if (tag) {
        tag.classList.remove('gary-error');
        tag.textContent = tagText;
    }
    if (title) {
        title.classList.remove('gary-error');
        title.textContent = translatedText;
        title.style.color = "";
    }
    setBoxTooltip(box, box.dataset.garyOriginal || "", statusText);
}

function renderSuccess(box, result) {
    renderStatus(box, localizeTag(result.tag), result.translatedTitle, getText("completedStatus"));
    box.dataset.garyState = "done";
}

function getFriendlyErrorText(error) {
    const type = error && error.type ? error.type : "";
    if (type === "extension") return getTargetText("extension");
    if (type === "auth") return getTargetText("auth");
    if (type === "quota") return getTargetText("quota");
    if (type === "model") return getTargetText("model");
    if (type === "parse" || type === "empty") return getTargetText("parse");
    if (type === "local") return getTargetText("local");
    return getTargetText("network");
}

function makeRuntimeError(error) {
    const message = error && error.message ? error.message : String(error || "");
    if (message.includes("Extension context invalidated")) {
        return { type: "extension", message };
    }
    return { type: "network", message };
}

function renderError(box, error) {
    box.dataset.garyState = "error";
    const tag = box.querySelector('.gary-tag');
    const title = box.querySelector('.gary-cn-title');
    const reason = getFriendlyErrorText(error);
    const failedPrefix = getTargetText("failedPrefix");
    if (tag)   { tag.classList.add('gary-error');   tag.textContent = "❌"; }
    if (title) { title.classList.add('gary-error'); title.textContent = `${failedPrefix}: ${reason}`; }
    setBoxTooltip(box, box.dataset.garyOriginal || "", `${failedPrefix}: ${reason}\n${getText("retryHint")}`);
}

// --- 内置翻译兜底（Chrome 138+ Translator / LanguageDetector，设备端、无需 Key） ---
// 在本机模式启用：用 LanguageDetector 判源语言，Translator 按语言对翻译。
// 没有分类能力，tag 统一用 "__builtin__"（TAG_LABELS 里有对应本地化标签"本机/On-device"）。
const BUILTIN_TAG = "__builtin__";
let builtinDetectorPromise = null;
const builtinTranslators = new Map();
const builtinPairAvailability = new Map();
const builtinDownloadBoxes = new Set();

function builtinApiExists() {
    return typeof Translator !== "undefined" && typeof LanguageDetector !== "undefined";
}

function getBuiltinDetector() {
    if (!builtinDetectorPromise) {
        builtinDetectorPromise = LanguageDetector.create().catch(e => {
            console.warn("[Gary] LanguageDetector 创建失败:", e);
            builtinDetectorPromise = null;
            return null;
        });
    }
    return builtinDetectorPromise;
}

async function detectSourceLanguage(text) {
    const detector = await getBuiltinDetector();
    if (!detector) return null;
    try {
        const results = await detector.detect(text);
        return results && results[0] && results[0].detectedLanguage ? results[0].detectedLanguage : null;
    } catch (e) {
        return null;
    }
}

function getBuiltinPairAvailability(source, target) {
    const key = `${source}→${target}`;
    if (!builtinPairAvailability.has(key)) {
        builtinPairAvailability.set(key, Translator.availability({ sourceLanguage: source, targetLanguage: target }).catch(() => "unavailable"));
    }
    return builtinPairAvailability.get(key);
}

function getBuiltinTranslator(source, target) {
    const key = `${source}→${target}`;
    if (!builtinTranslators.has(key)) {
        let creation;
        try { creation = Translator.create({ sourceLanguage: source, targetLanguage: target }); }
        catch (e) { return Promise.resolve(null); }
        builtinTranslators.set(key, creation.then(translator => {
            builtinPairAvailability.delete(key);
            for (const box of builtinDownloadBoxes) {
                if (!box.isConnected || box.garyGeneration !== translationGeneration) { builtinDownloadBoxes.delete(box); continue; }
                if (box.dataset.garyState === "download" && box.dataset.garySource === source && box.dataset.garyTarget === target) {
                    translateBuiltinIntoBox(box.dataset.garyOriginal, box, target, source, true);
                }
            }
            return translator;
        }).catch(e => {
            console.warn("[Gary] Translator 创建失败:", e);
            builtinTranslators.delete(key);
            return null;
        }));
    }
    return builtinTranslators.get(key);
}

// 语言是否相同：source 是检测器给的 BCP47（如 en/zh），target 是我们的目标码（如 zh-Hans）
function isSameLanguage(source, target) {
    if (!source) return false;
    const s = source.toLowerCase();
    const t = target.toLowerCase();
    if (s === t) return true;
    if (["zh", "zh-hans", "zh-hant", "zh-cn", "zh-tw"].includes(s)) return t.startsWith("zh");
    return t.startsWith(s + "-");
}

async function translateBuiltin(text, targetLanguage) {
    try {
        const source = await detectSourceLanguage(text);
        if (!source) return null;
        const translator = await getBuiltinTranslator(source, targetLanguage);
        if (!translator) return null;
        return await translator.translate(text);
    } catch (e) {
        console.warn("[Gary] 内置翻译失败:", e);
        return null;
    }
}

// 渲染并挂载一个标题 badge；返回是否成功挂载
function attachTitleBadge(el, targetElement, isMainTitle, box, text) {
    box.dataset.garyOriginal = text;
    box.dataset.garyNodeId = ensureTitleNodeId(el);
    const parent = targetElement.parentElement;
    if (!parent) return false;
    try {
        parent.insertBefore(box, targetElement);
        if (isMainTitle) targetElement.classList.add('gary-original-source-hidden');
        else el.classList.add('gary-en-sub');
    } catch (e) { return false; }

    if (box.tagName === "A") {
        const refreshHref = () => { box.href = targetElement.href; };
        for (const event of ["pointerdown", "mousedown", "auxclick", "contextmenu"]) box.addEventListener(event, refreshHref);
    }
    box.onclick = (e) => {
        // 失败状态：点击 = 重试翻译（灰色的原文链接仍可正常点击跳转）
        if (["error", "download"].includes(box.dataset.garyState)) {
            e.preventDefault();
            if (USER_CONFIG.configured) translateChunk([{ text, box, el, targetElement }]);
            else translateBuiltinIntoBox(text, box, box.dataset.garyTarget || TARGET_LANGUAGE, box.dataset.garySource, box.dataset.garyState === "download");
            return;
        }
        if (box.tagName === 'A' && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || (e.button != null && e.button !== 0))) return;
        e.preventDefault();
        if (!isMainTitle && targetElement.tagName === 'A') targetElement.click();
        else el.click();
    };
    if (box.tagName === "A") box.addEventListener("auxclick", e => {
        if (["error", "download"].includes(box.dataset.garyState)) box.onclick(e);
    });
    return true;
}

function renderDownload(box, source, target) {
    box.dataset.garySource = source;
    box.dataset.garyTarget = target;
    box.garyGeneration = translationGeneration;
    let language = source;
    try { language = new Intl.DisplayNames([UI_LANGUAGE], { type:"language" }).of(source) || source; } catch (e) {}
    const title = getText("downloadLanguagePack").replace("{language}", language);
    renderStatus(box, localizeTag(BUILTIN_TAG), title, title);
    box.dataset.garyState = "download";
    builtinDownloadBoxes.add(box);
}

async function translateBuiltinIntoBox(text, box, requestLanguage, source, downloading = false) {
    const generation = translationGeneration;
    renderStatus(box, localizeTag(BUILTIN_TAG), getText("translatingTitle"), getText("translatingStatus"));
    let translatedTitle;
    try {
        // Download clicks already know the source. Call create before any awaited detection.
        source = source || await detectSourceLanguage(text);
        const translator = source && await getBuiltinTranslator(source, requestLanguage);
        if (!translator) {
            if (generation === translationGeneration && ENABLED && box.isConnected) {
                if (downloading) renderDownload(box, source, requestLanguage);
                else renderError(box, { type:"local" });
            }
            return;
        }
        builtinDownloadBoxes.delete(box);
        translatedTitle = await translator.translate(text);
    } catch (e) {
        if (generation === translationGeneration && ENABLED && box.isConnected) {
            if (downloading && e.name === "NotAllowedError") renderDownload(box, source, requestLanguage);
            else renderError(box, { type:"local" });
        }
        return;
    }
    if (translatedTitle) {
        if (generation === translationGeneration && ENABLED && box.isConnected) renderSuccess(box, { tag: BUILTIN_TAG, translatedTitle });
        cacheSet(text, { tag: BUILTIN_TAG, translatedTitle }, requestLanguage);
    } else if (generation === translationGeneration && ENABLED && box.isConnected) renderError(box, { type:"local" });
}

// 无 Key 用户的内置翻译流程：先判源语言和语言对可用性，再决定渲染哪种 badge
async function processBuiltinCandidate({ text, el, targetElement, isMainTitle }) {
    const requestLanguage = TARGET_LANGUAGE;
    const generation = translationGeneration;
    const source = await detectSourceLanguage(text);
    if (generation !== translationGeneration || !ENABLED) return;
    if (!source || isSameLanguage(source, requestLanguage)) {
        el.setAttribute('data-gary-done', 'skip');
        return;
    }
    const availability = await getBuiltinPairAvailability(source, requestLanguage);
    if (generation !== translationGeneration || !ENABLED) return;
    if (availability === "unavailable") {
        // 设备端不支持该语言对：回落到"请配置插件"引导
        const box = createSafeBadge(getText("unconfiguredTag"), getText("unconfiguredTitle"), isMainTitle, text, getText("unconfiguredStatus"), "", targetElement);
        attachTitleBadge(el, targetElement, isMainTitle, box, text);
        return;
    }
    const box = createSafeBadge(localizeTag(BUILTIN_TAG), getText("translatingTitle"), isMainTitle, text, getText("translatingStatus"), "pending", targetElement);
    if (!attachTitleBadge(el, targetElement, isMainTitle, box, text)) return;
    box.dataset.garySource = source;
    box.dataset.garyTarget = requestLanguage;
    if (["downloadable", "downloading"].includes(availability)) renderDownload(box, source, requestLanguage);
    else translateBuiltinIntoBox(text, box, requestLanguage, source);
}

// --- 页面扫描 + 批量翻译 ---
const PRIORITY_VIEWPORT_MARGIN = 320;
let titleNodeIdCounter = 0;

function isNearViewport(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    return rect.bottom >= -PRIORITY_VIEWPORT_MARGIN &&
        rect.top <= window.innerHeight + PRIORITY_VIEWPORT_MARGIN;
}

function getDynamicBatchSize() {
    return USER_CONFIG.batchSize;
}

function getModelBatchSize(modelId) {
    const model = (modelId || "").toLowerCase();
    if ((model.includes("m2.7") && !model.includes("highspeed")) ||
        model.includes("thinking") || model.includes("reason")) return 4;
    if (["flash", "highspeed", "turbo", "haiku", "deepseek"].some(part => model.includes(part))) return 8;
    return 6;
}

function getTitleText(el) {
    return (el.textContent || el.innerText || "").trim();
}

function getTitleTarget(el) {
    if (el.matches('ytd-watch-metadata h1 yt-formatted-string')) {
        const heading = el.closest('h1') || el;
        return { targetElement: heading, isMainTitle: true };
    }
    const link = el.closest('a');
    return { targetElement: link || el, isMainTitle: false };
}

function ensureTitleNodeId(el) {
    if (!el.dataset.garyNodeId) {
        titleNodeIdCounter++;
        el.dataset.garyNodeId = String(titleNodeIdCounter);
    }
    return el.dataset.garyNodeId;
}

function removeTranslationBoxesForTitle(el, targetElement) {
    const parent = targetElement && targetElement.parentElement;
    if (!parent) return;

    const nodeId = el.dataset.garyNodeId;
    parent.querySelectorAll('.gary-cn-box[data-gary-role="translation"]').forEach(box => {
        if ((nodeId && box.dataset.garyNodeId === nodeId) || box.nextElementSibling === targetElement) {
            box.remove();
        }
    });
}

function resetTitleProcessingState(el, targetElement) {
    removeTranslationBoxesForTitle(el, targetElement);
    el.removeAttribute('data-gary-done');
    el.removeAttribute('data-gary-original');
    el.classList.remove('gary-en-sub');
    targetElement.classList.remove('gary-original-source-hidden');
}

function resetAllRenderedTranslations() {
    builtinDownloadBoxes.clear();
    document.querySelectorAll('.gary-cn-box[data-gary-role="translation"]').forEach(box => box.remove());
    document.querySelectorAll('[data-gary-done], [data-gary-original], .gary-en-sub, .gary-original-source-hidden').forEach(el => {
        el.removeAttribute('data-gary-done');
        el.removeAttribute('data-gary-original');
        el.classList.remove('gary-en-sub');
        el.classList.remove('gary-original-source-hidden');
    });
}

function getDetectedLanguages(text) {
    const languages = new Set();
    if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(text)) languages.add("ja");
    if (/[\uac00-\ud7af]/.test(text)) languages.add("ko");
    if (/[\u0e00-\u0e7f]/.test(text)) languages.add("th");
    if (/[\u4e00-\u9fff]/.test(text)) languages.add("zh");
    if (/[a-zA-ZÀ-ž]/.test(text)) {
        if (isLikelyEnglishTitle(text)) languages.add("en");
        else languages.add("latin");
    }
    if (/[\u0400-\u04ff]/.test(text)) languages.add("ru");
    if (/[\u0600-\u06ff]/.test(text)) languages.add("ar");
    if (/[\u0900-\u097f]/.test(text)) languages.add("hi");
    return languages;
}

function isLikelyEnglishTitle(text) {
    const latinText = text.replace(/https?:\/\/\S+/g, " ");
    if (!/[a-zA-Z]/.test(latinText)) return false;
    if (/[À-ž]/.test(latinText)) return false;

    const words = latinText.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
    if (words.length === 0) return false;
    const englishMarkers = new Set([
        "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "did", "do", "does",
        "for", "from", "get", "go", "has", "have", "how", "i", "in", "is", "it", "its", "me",
        "my", "new", "not", "of", "on", "or", "our", "out", "that", "the", "this", "to", "up",
        "we", "what", "when", "where", "why", "with", "you", "your",
        "about", "after", "all", "before", "best", "build", "builds", "built", "change", "changed",
        "changing", "everything", "first", "inside", "into", "just", "last", "made", "make", "makes",
        "more", "most", "news", "over", "review", "use", "used", "using", "video", "without", "work"
    ]);
    return words.length <= 3 || words.some(word => englishMarkers.has(word));
}

function shouldTranslateTitle(text) {
    const languages = getDetectedLanguages(text);
    if (languages.size === 0) return false;

    if ((TARGET_LANGUAGE === "zh-Hans" || TARGET_LANGUAGE === "zh-Hant") &&
        isChineseTitleForTarget(languages)) {
        return false;
    }
    if (languages.size > 1) return true;
    if (languages.has(TARGET_LANGUAGE)) return false;
    return true;
}

function isChineseTitleForTarget(languages) {
    return languages.has("zh") &&
        !languages.has("ja") &&
        !languages.has("ko") &&
        !languages.has("th") &&
        !languages.has("ru") &&
        !languages.has("ar") &&
        !languages.has("hi");
}

function needsAiLanguageDetection(text) {
    const languages = getDetectedLanguages(text);
    return ["en", "es", "fr", "de", "pt", "id", "vi"].includes(TARGET_LANGUAGE) &&
        languages.size > 0 && [...languages].every(code => code === "en" || code === "latin");
}

async function detectAiSourceLanguage(text) {
    try {
        if (typeof LanguageDetector !== "undefined") {
            const detector = await getBuiltinDetector();
            const results = detector && await detector.detect(text);
            if (results && results[0] && results[0].confidence >= 0.6) return results[0].detectedLanguage;
        }
    } catch (e) { /* 尝试 Chrome i18n 检测 */ }
    try {
        if (typeof chrome.i18n?.detectLanguage !== "function") return null;
        return await new Promise(resolve => {
            chrome.i18n.detectLanguage(text, result => {
                if (chrome.runtime.lastError) { resolve(null); return; }
                const first = result && result.languages && result.languages[0];
                resolve(result && result.isReliable && first && first.percentage >= 80 ? first.language : null);
            });
        });
    } catch (e) { return null; }
}

// 检测只是省 token 的优化：超时就当作未知、照常翻译，不能让它拖住页面扫描
// （LanguageDetector 首次创建可能要等模型下载）。
const AI_LANGUAGE_DETECTION_TIMEOUT_MS = 800;
function detectAiSourceLanguageWithTimeout(text) {
    return new Promise(resolve => {
        const timer = setTimeout(() => resolve(null), AI_LANGUAGE_DETECTION_TIMEOUT_MS);
        detectAiSourceLanguage(text).then(source => { clearTimeout(timer); resolve(source); });
    });
}

function isUnchangedTranslation(original, translated) {
    const normalize = value => String(value).trim().replace(/\s+/g, " ").toLowerCase();
    return normalize(original) === normalize(translated);
}

function skipDuplicateTranslation({ box, el, targetElement }) {
    if (box) box.remove();
    if (el) {
        el.classList.remove("gary-en-sub");
        el.setAttribute("data-gary-done", "skip");
    }
    if (targetElement) targetElement.classList.remove("gary-original-source-hidden");
}

async function process() {
    if (!CONFIG_READY || !ENABLED) return;
    const titles = document.querySelectorAll('#video-title, #video-title-link, h3 a, ytd-watch-metadata h1 yt-formatted-string');

    const pendingBatch = [];        // 缓存未命中、需要发 API 的项 [{text, box}]
    const aiDetections = [];
    const builtinCandidates = [];   // 未配置 Key 且浏览器支持内置翻译的项

    for (const el of titles) {
        // 译文 badge 自己是 <a>，会命中上面的 h3 a 选择器；不排除就会把译文当成新标题再翻一遍。
        if (el.dataset.garyRole === "translation" || el.closest('.gary-cn-box')) continue;
        if (el.closest('ytd-comments') || el.closest('ytd-comment-renderer') || el.closest('#comments')) continue;

        const text = getTitleText(el);
        if (!text || text.length < 3) continue;

        const { targetElement, isMainTitle } = getTitleTarget(el);
        const parent = targetElement.parentElement;
        if (!parent) continue;

        if (!el.getAttribute('data-gary-done') && !isNearViewport(targetElement)) continue;

        if (el.getAttribute('data-gary-done')) {
            if (el.dataset.garyOriginal === text) continue;
            resetTitleProcessingState(el, targetElement);
        }

        if (!shouldTranslateTitle(text)) {
            // 已是目标语言（或无法识别）：打标跳过，后续扫描靠 data-gary-done 直接放行，
            // 不再每次重复跑语言检测正则
            el.setAttribute('data-gary-done', 'skip');
            el.dataset.garyOriginal = text;
            continue;
        }

        el.setAttribute('data-gary-done', 'true');
        el.dataset.garyOriginal = text;

        let cached = cacheGet(text);

        // 未配置 Key 但浏览器有内置翻译能力：先不渲染，异步判定语言对后再决定
        if (!cached && TRANSLATION_MODE === "local" && builtinApiExists()) {
            builtinCandidates.push({ text, el, targetElement, isMainTitle });
            continue;
        }

        const renderCandidate = () => {
            if (cached && TRANSLATION_MODE === "ai" && isUnchangedTranslation(text, cached.translatedTitle)) {
                skipDuplicateTranslation({ el, targetElement });
                return;
            }
            let tag = getText("unconfiguredTag");
            let translatedText = getText("unconfiguredTitle");
            let statusText = getText("unconfiguredStatus");
            let state = "";
            if (cached) {
                tag = localizeTag(cached.tag);
                translatedText = cached.translatedTitle;
                statusText = getText("cachedStatus");
                state = "done";
            } else if (USER_CONFIG.configured) {
                tag = getText("queuedTag");
                translatedText = getText("queuedTitle");
                statusText = getText("queuedStatus");
                state = "pending";
            }

            const box = createSafeBadge(tag, translatedText, isMainTitle, text, statusText, state, targetElement);
            if (!attachTitleBadge(el, targetElement, isMainTitle, box, text)) return;

            if (cached) return;                  // 命中缓存：已渲染好
            if (!USER_CONFIG.configured) return;     // 没配置 Key 且无内置翻译：渲染"未配置"badge 后停下

            pendingBatch.push({ text, box, el, targetElement, generation: translationGeneration });
        };
        if (!cached && TRANSLATION_MODE === "ai" && needsAiLanguageDetection(text)) {
            const generation = translationGeneration;
            const target = TARGET_LANGUAGE;
            aiDetections.push((async () => {
                const source = await detectAiSourceLanguageWithTimeout(text);
                if (generation !== translationGeneration || !ENABLED || !el.isConnected || getTitleText(el) !== text) {
                    el.removeAttribute("data-gary-done");
                    delete el.dataset.garyOriginal;
                    return;
                }
                // 这里的目标语言都是不带地区的拉丁语种，检测结果带地区（如 pt-BR）时按主语言比较。
                if (source && isSameLanguage(String(source).split("-")[0], target)) {
                    el.setAttribute("data-gary-done", "skip");
                    return;
                }
                // 等待检测期间，别的标签页可能已经翻好同一标题并广播了缓存：重新查一次，命中就不再请求。
                cached = cacheGet(text);
                renderCandidate();
            })());
        } else renderCandidate();
    }

    builtinCandidates.forEach(processBuiltinCandidate);

    const dispatchPending = () => {
        const batchSize = getDynamicBatchSize();
        const ready = pendingBatch.splice(0).filter(item => {
            // 其它标题的检测尚未结束时，较早完成的候选也可能已因配置变化失效。
            if (item.generation === translationGeneration && ENABLED && item.box.isConnected &&
                item.el.isConnected && getTitleText(item.el) === item.text) {
                // 排队等其它标题检测的这段时间里，别的标签页可能已翻好这一条：命中缓存就直接用，不再请求。
                const hit = cacheGet(item.text);
                if (!hit) return true;
                if (isUnchangedTranslation(item.text, hit.translatedTitle)) skipDuplicateTranslation(item);
                else renderSuccess(item.box, hit);
                return false;
            }
            // 不管卡片此刻在不在文档里都要复位：YouTube 会把节点移出再插回，留着标记会永久卡在“排队中”。
            item.box.remove();
            item.el.removeAttribute("data-gary-done");
            delete item.el.dataset.garyOriginal;
            item.el.classList.remove("gary-en-sub");
            item.targetElement.classList.remove("gary-original-source-hidden");
            return false;
        });
        for (let i = 0; i < ready.length; i += batchSize) translateChunk(ready.slice(i, i + batchSize));
    };
    // 非拉丁和缓存命中的标题先处理，不等待异步语言检测。
    dispatchPending();
    await Promise.all(aiDetections);
    dispatchPending();
}

// --- 🤖 AI 调用：通过 background SW ---
// v7.0 起 fetch 逻辑挪到 background.js，content script 只发消息：
// 避免 YouTube 页面 CSP 拦截、所有 tab 共享一个翻译入口、并发限流和重试集中在 SW 里。
async function translateChunk(chunk) {
    if (TRANSLATION_MODE !== "ai" || !USER_CONFIG.configured || !ENABLED) return;
    // 捕获发送时的目标语言：回复是异步的，到达时用户可能已切换语言。
    // 写缓存必须用发送时的语言，否则旧语言译文会被存进新语言的 key（缓存污染）。
    const requestLanguage = TARGET_LANGUAGE;
    const generation = translationGeneration;
    let reply;
    chunk.forEach(p => {
        if (p.box.isConnected) renderStatus(p.box, getText("translatingTag"), getText("translatingTitle"), getText("translatingStatus"));
    });
    try {
        reply = await chrome.runtime.sendMessage({
            type: 'translateBatch',
            items: chunk.map(p => p.text),
            targetLanguage: requestLanguage
        });
    } catch (e) {
        console.error("[Gary] SW 通信失败:", e);
        const runtimeError = makeRuntimeError(e);
        chunk.forEach(p => {
            if (generation === translationGeneration && ENABLED && p.box.isConnected) renderError(p.box, runtimeError);
        });
        return;
    }

    if (!reply || !Array.isArray(reply.results)) {
        chunk.forEach(p => {
            if (generation === translationGeneration && ENABLED && p.box.isConnected) renderError(p.box, reply && reply.error);
        });
        return;
    }

    chunk.forEach((p, i) => {
        const result = reply.results[i];
        if (result && result.tag && result.translatedTitle) {
            if (generation === translationGeneration && ENABLED && p.box.isConnected) {
                if (isUnchangedTranslation(p.text, result.translatedTitle)) skipDuplicateTranslation(p);
                else renderSuccess(p.box, result);
            }
            cacheSet(p.text, result, requestLanguage);
        } else {
            const itemError = Array.isArray(reply.errors) ? reply.errors[i] : null;
            if (generation === translationGeneration && ENABLED && p.box.isConnected) renderError(p.box, itemError || reply.error);
        }
    });
}

// === 触发策略 ===
// 旧版本用 setInterval(process, 1000) 每秒强扫整个 DOM——CPU 浪费 + 易竞态。
// v7.0 改为 MutationObserver 监听 <ytd-app> 子树变化，200ms debounce 后执行 process。
// 这样：(1) 只在真有新视频卡片插入时才触发；(2) 触发更快，不用等下一次 1 秒轮询。
let processScheduled = false;
let processInFlight = false;
let processRerunRequested = false;
function scheduleProcess() {
    // process() 现在会等待语言检测；期间到来的滚动/DOM 变化不能丢，记下来等它结束后补扫一次。
    if (processInFlight) { processRerunRequested = true; return; }
    if (processScheduled) return;
    processScheduled = true;
    setTimeout(async () => {
        processScheduled = false;
        processInFlight = true;
        try { await process(); }
        finally {
            processInFlight = false;
            if (processRerunRequested) {
                processRerunRequested = false;
                scheduleProcess();
            }
        }
    }, 200);
}

function startObserver() {
    const root = document.querySelector('ytd-app') || document.body;
    if (!root) {
        // YouTube SPA 还没装载好，重试
        setTimeout(startObserver, 200);
        return;
    }
    const observer = new MutationObserver(() => scheduleProcess());
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('scroll', scheduleProcess, { passive: true });
    window.addEventListener('resize', scheduleProcess, { passive: true });
    console.log("👁  MutationObserver 已挂载");
    // 首次扫描（处理 observer 挂载之前已经存在的标题）
    scheduleProcess();
}

// 启动：先完成上方所有声明，再初始化配置（其回调会调 scheduleProcess，存在 TDZ 风险）
initConfig();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
} else {
    startObserver();
}

// === 单测导出 ===
// 仅供 node:test 引用；扩展运行时没有 module 对象，这段不会执行
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        getBrowserDefaultLanguages, getBrowserLanguage, flushCacheWrites, mergeCache,
        createSafeBadge, attachTitleBadge, detectAiSourceLanguage, needsAiLanguageDetection, isUnchangedTranslation,
        getConfig: () => ({ targetLanguage: TARGET_LANGUAGE, uiLanguage: UI_LANGUAGE }),
        getDetectedLanguages,
        isLikelyEnglishTitle,
        shouldTranslateTitle,
        getDynamicBatchSize,
        getCacheKey,
        cacheGet,
        cacheSet,
        applyConfigFromStorage,
        getActiveTranslationConfig,
        loadCache,
        process,
        translateChunk,
        CONTENT_TEXT,
        TARGET_STATUS_TEXT,
        TAG_LABELS,
        BUILTIN_TAG,
        builtinApiExists,
        isSameLanguage,
        detectSourceLanguage,
        getBuiltinPairAvailability,
        translateBuiltin,
        translateBuiltinIntoBox, processBuiltinCandidate
    };
}
