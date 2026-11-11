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

if (!globalThis.chrome || !globalThis.chrome.storage || !globalThis.chrome.storage.local) {
    const previewStore = {};
    globalThis.chrome = {
        storage: {
            local: {
                get(keys, callback) {
                    const result = {};
                    if (Array.isArray(keys)) {
                        keys.forEach(key => {
                            if (Object.prototype.hasOwnProperty.call(previewStore, key)) result[key] = previewStore[key];
                        });
                    } else if (keys && typeof keys === "object") {
                        Object.keys(keys).forEach(key => {
                            result[key] = Object.prototype.hasOwnProperty.call(previewStore, key)
                                ? previewStore[key]
                                : keys[key];
                        });
                    }
                    callback(result);
                },
                set(values, callback) {
                    Object.assign(previewStore, values);
                    if (callback) callback();
                },
                remove(keys, callback) {
                    (Array.isArray(keys) ? keys : [keys]).forEach(key => { delete previewStore[key]; });
                    if (callback) callback();
                }
            }
        },
        permissions: {
            request() {
                return Promise.resolve(true);
            }
        },
        runtime: {
            lastError: null,
            sendMessage(message, callback) {
                if (callback) callback({ ok: false, errorCode: "preview" });
            }
        }
    };
}

const CUSTOM_MODEL_VALUE = "__custom_model__";
const DEFAULT_UI_LANGUAGE = getBrowserDefaultLanguages(getBrowserLanguage()).uiLanguage;
const DEFAULT_TARGET_LANGUAGE = getBrowserDefaultLanguages(getBrowserLanguage()).targetLanguage;

const UI_LANGUAGES = [
    { code: "zh-Hans", nativeName: "简体中文", shortName: "ZH", htmlLang: "zh-CN", dir: "ltr" },
    { code: "en", nativeName: "English", shortName: "EN", htmlLang: "en", dir: "ltr" },
    { code: "ja", nativeName: "日本語", shortName: "JA", htmlLang: "ja", dir: "ltr" },
    { code: "ko", nativeName: "한국어", shortName: "KO", htmlLang: "ko", dir: "ltr" },
    { code: "th", nativeName: "ไทย", shortName: "TH", htmlLang: "th", dir: "ltr" },
    { code: "es", nativeName: "Español", shortName: "ES", htmlLang: "es", dir: "ltr" },
    { code: "fr", nativeName: "Français", shortName: "FR", htmlLang: "fr", dir: "ltr" },
    { code: "de", nativeName: "Deutsch", shortName: "DE", htmlLang: "de", dir: "ltr" },
    { code: "pt", nativeName: "Português", shortName: "PT", htmlLang: "pt", dir: "ltr" },
    { code: "id", nativeName: "Bahasa Indonesia", shortName: "ID", htmlLang: "id", dir: "ltr" },
    { code: "vi", nativeName: "Tiếng Việt", shortName: "VI", htmlLang: "vi", dir: "ltr" },
    { code: "ru", nativeName: "Русский", shortName: "RU", htmlLang: "ru", dir: "ltr" },
    { code: "ar", nativeName: "العربية", shortName: "AR", htmlLang: "ar", dir: "rtl" },
    { code: "hi", nativeName: "हिन्दी", shortName: "HI", htmlLang: "hi", dir: "ltr" }
];

const TARGET_LANGUAGES = [
    { code: "zh-Hans", nativeName: "简体中文", englishName: "Simplified Chinese" },
    { code: "zh-Hant", nativeName: "繁體中文", englishName: "Traditional Chinese" },
    { code: "en", nativeName: "English", englishName: "English" },
    { code: "ja", nativeName: "日本語", englishName: "Japanese" },
    { code: "ko", nativeName: "한국어", englishName: "Korean" },
    { code: "th", nativeName: "ไทย", englishName: "Thai" },
    { code: "es", nativeName: "Español", englishName: "Spanish" },
    { code: "fr", nativeName: "Français", englishName: "French" },
    { code: "de", nativeName: "Deutsch", englishName: "German" },
    { code: "pt", nativeName: "Português", englishName: "Portuguese" },
    { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian" },
    { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese" }
];

const UI_TEXT = {
    en: {
        appTitle: "AI Title Translator",
        brandSubtitle: "AI model settings",
        quickActions: "Quick actions",
        openDocs: "Open project docs",
        masterLabel: "Translation",
        masterDesc: "Automatically translate YouTube video titles",
        languageTitle: "1. Translation language",
        uiLanguageLabel: "Interface language",
        targetLanguageLabel: "Translate titles into",
        providerTitle: "2. Choose AI provider",
        modelTitle: "3. Model settings",
        modelVersionLabel: "Model version",
        providerCustom: "Custom",
        customEndpointLabel: "Custom endpoint",
        apiEndpointLabel: "API endpoint",
        modelNameLabel: "Model name",
        apiKeyPlaceholder: "Paste your API key...",
        toggleKey: "Show or hide API Key",
        saveSettings: "Save settings",
        testConfig: "Test configuration",
        testingConfig: "Testing current configuration...",
        testPassed: "Configuration works. Sample translation received.",
        testFailed: "Test failed. Check the key, model, endpoint, or provider quota.",
        testFailAuth: "Invalid API key",
        testFailQuota: "Quota exhausted or rate limited",
        testFailModel: "Model name may be wrong",
        testFailNetwork: "Network or provider error",
        previewTestUnavailable: "Configuration test only works from the installed extension popup, not a file preview.",
        saved: "Saved",
        feedback: "Feedback",
        supportDeveloper: "Support developer",
        localKeyChip: "API Key stays local",
        originalChip: "Original title preserved",
        customAiChip: "Custom AI setup",
        deepseekRecommended: "REC",
        privacyNote: "Stored only in this browser. No data is uploaded to the developer.",
        noKey: "No key?",
        helpOpenAI: "Get one from OpenAI",
        helpAnthropic: "Get one from Claude Console",
        helpDeepSeek: "Get one from DeepSeek API Platform",
        helpCustom: "View custom endpoint guide",
        enabled: "Translation is on. Refresh YouTube to apply.",
        paused: "Translation paused",
        switchedSaved: "Switched to {provider}. Saved key loaded.",
        switchedNoKey: "Switched to {provider}. No key configured yet.",
        manualModelHint: "Enter a model ID supported by this provider",
        customModelOption: "Other model (enter manually)",
        customModelEmpty: "(enter custom model name)",
        customModelSuffix: "custom",
        endpointInvalid: "API endpoint format is invalid",
        endpointHttps: "Custom endpoints must use HTTPS. Localhost debugging may use HTTP.",
        customRequired: "Custom endpoint needs URL and model name",
        permissionDenied: "Host permission was not granted",
        keyRequired: "API Key is required",
        modelRequired: "Choose a model version or enter a model name",
        savedRefresh: "Saved. Refresh YouTube to apply.",
        languageSaved: "Interface language saved",
        apiUrlPlaceholder: "Example: https://openrouter.ai/api/v1/chat/completions",
        customModelPlaceholder: "Example: openai/gpt-6-luna or anthropic/claude-sonnet-5-5",
        manualModelPlaceholder: "Enter a supported model ID",
        tierFlagship: "flagship",
        tierRecommended: "recommended",
        tierStable: "stable",
        tierFast: "fast",
        tierStrong: "stronger",
        tierCheapFast: "recommended, low cost and fast",
        tierReasoning: "reasoning model, slower but more accurate",
        tierCompatible: "compatible",
        clearCache: "Clear translation cache",
        cacheCleared: "Cache cleared",
        configuredProvider: "Key configured"
    },
    "zh-Hans": {
        appTitle: "YouTube 标题翻译",
        brandSubtitle: "AI 模型配置中心",
        quickActions: "快捷操作",
        openDocs: "打开项目说明",
        masterLabel: "翻译开关",
        masterDesc: "在 YouTube 页面上自动翻译视频标题",
        languageTitle: "1. 翻译语言",
        uiLanguageLabel: "界面语言",
        targetLanguageLabel: "将标题翻译成",
        providerTitle: "2. 选择 AI 服务商",
        modelTitle: "3. 模型配置",
        modelVersionLabel: "模型版本",
        providerCustom: "自定义",
        customEndpointLabel: "自定义接口",
        apiEndpointLabel: "API 接口地址",
        modelNameLabel: "模型名称",
        apiKeyPlaceholder: "粘贴你的密钥...",
        toggleKey: "显示或隐藏 API Key",
        saveSettings: "保存设置",
        testConfig: "测试配置",
        testingConfig: "正在测试当前配置...",
        testPassed: "配置可用，已收到示例翻译结果",
        testFailed: "测试失败，请检查 Key、模型、接口地址或服务商额度",
        testFailAuth: "Key 无效，请检查 API Key",
        testFailQuota: "余额不足或被限流",
        testFailModel: "模型名可能错误，请检查模型版本",
        testFailNetwork: "网络或服务商异常，请稍后重试",
        previewTestUnavailable: "配置测试只能在已安装扩展的弹窗中运行，不能在 file 预览页中运行。",
        saved: "已保存",
        feedback: "反馈建议",
        supportDeveloper: "支持开发者",
        localKeyChip: "API Key 本地保存",
        originalChip: "原始标题保留",
        customAiChip: "可自定义 AI 配置",
        deepseekRecommended: "推荐",
        privacyNote: "仅在当前浏览器本地存储，不会上传任何数据。",
        noKey: "没有 Key?",
        helpOpenAI: "去 OpenAI 官网申请",
        helpAnthropic: "去 Claude Console 申请",
        helpDeepSeek: "去 DeepSeek API 平台申请",
        helpCustom: "查看自定义端点说明",
        enabled: "翻译已开启，刷新 YouTube 后生效",
        paused: "翻译已暂停",
        switchedSaved: "已切换为 {provider}，已读取保存的 Key",
        switchedNoKey: "已切换为 {provider}，还未配置 Key",
        manualModelHint: "请输入该服务商支持的模型 ID",
        customModelOption: "其他（手动输入模型名）",
        customModelEmpty: "（请填写自定义模型名）",
        customModelSuffix: "自定义",
        endpointInvalid: "API Endpoint 格式不正确",
        endpointHttps: "自定义端点必须使用 HTTPS；本机 localhost 调试可使用 HTTP",
        customRequired: "自定义端点需要填写 URL 和模型名",
        permissionDenied: "未授予该域名访问权限，无法调用",
        keyRequired: "必须填写 API Key",
        modelRequired: "请填写模型名称，或从模型版本中选择一个预设",
        savedRefresh: "保存成功，请刷新 YouTube 页面",
        languageSaved: "界面语言已保存",
        apiUrlPlaceholder: "例如：https://openrouter.ai/api/v1/chat/completions",
        customModelPlaceholder: "例如：openai/gpt-6-luna、anthropic/claude-sonnet-5-5",
        manualModelPlaceholder: "填写服务商支持的模型 ID",
        tierFlagship: "旗舰",
        tierRecommended: "推荐",
        tierStable: "稳定",
        tierFast: "快",
        tierStrong: "更强",
        tierCheapFast: "推荐，便宜快",
        tierReasoning: "推理模型，慢但更准",
        tierCompatible: "兼容旧 Key",
        clearCache: "清除翻译缓存",
        cacheCleared: "缓存已清除",
        configuredProvider: "已配置 Key"
    }
};

[
    ["ja", "AI タイトル翻訳", "AI モデル設定", "インターフェース言語", "タイトルの翻訳先", "保存", "保存しました"],
    ["ko", "AI 제목 번역", "AI 모델 설정", "인터페이스 언어", "제목 번역 대상", "저장", "저장됨"],
    ["th", "แปลชื่อด้วย AI", "การตั้งค่าโมเดล AI", "ภาษาของส่วนขยาย", "แปลชื่อเป็น", "บันทึก", "บันทึกแล้ว"],
    ["es", "Traductor de títulos con IA", "Configuración del modelo de IA", "Idioma de la interfaz", "Traducir títulos a", "Guardar", "Guardado"],
    ["fr", "Traducteur de titres IA", "Paramètres du modèle IA", "Langue de l'interface", "Traduire les titres en", "Enregistrer", "Enregistré"],
    ["de", "KI-Titelübersetzer", "KI-Modell-Einstellungen", "Sprache der Oberfläche", "Titel übersetzen in", "Speichern", "Gespeichert"],
    ["pt", "Tradutor de títulos com IA", "Configurações do modelo de IA", "Idioma da interface", "Traduzir títulos para", "Salvar", "Salvo"],
    ["id", "Penerjemah Judul AI", "Pengaturan model AI", "Bahasa antarmuka", "Terjemahkan judul ke", "Simpan", "Tersimpan"],
    ["vi", "Dịch tiêu đề AI", "Cài đặt mô hình AI", "Ngôn ngữ giao diện", "Dịch tiêu đề sang", "Lưu", "Đã lưu"],
    ["ru", "AI-переводчик заголовков", "Настройки модели AI", "Язык интерфейса", "Переводить заголовки на", "Сохранить", "Сохранено"],
    ["ar", "مترجم العناوين بالذكاء الاصطناعي", "إعدادات نموذج الذكاء الاصطناعي", "لغة الواجهة", "ترجمة العناوين إلى", "حفظ", "تم الحفظ"],
    ["hi", "AI शीर्षक अनुवादक", "AI मॉडल सेटिंग", "इंटरफ़ेस भाषा", "शीर्षक का अनुवाद", "सहेजें", "सहेजा गया"]
].forEach(([code, appTitle, brandSubtitle, uiLanguageLabel, targetLanguageLabel, saveSettings, saved]) => {
    UI_TEXT[code] = Object.assign({}, UI_TEXT.en, {
        appTitle,
        brandSubtitle,
        uiLanguageLabel,
        targetLanguageLabel,
        saveSettings,
        saved
    });
});

Object.assign(UI_TEXT.ja, {
    masterLabel: "翻訳", masterDesc: "YouTube 動画タイトルを自動翻訳", languageTitle: "1. 翻訳言語",
    providerTitle: "2. AI プロバイダーを選択", modelTitle: "3. モデル設定", modelVersionLabel: "モデルバージョン",
    providerCustom: "カスタム", customEndpointLabel: "カスタムエンドポイント", apiEndpointLabel: "API エンドポイント",
    modelNameLabel: "モデル名", apiKeyPlaceholder: "API キーを貼り付け...", feedback: "フィードバック",
    supportDeveloper: "開発者を支援", privacyNote: "このブラウザ内にのみ保存され、開発者へデータは送信されません。",
    noKey: "キーがありませんか?", languageSaved: "言語設定を保存しました", savedRefresh: "保存しました。YouTube を更新してください。"
});
Object.assign(UI_TEXT.ko, {
    masterLabel: "번역", masterDesc: "YouTube 동영상 제목 자동 번역", languageTitle: "1. 번역 언어",
    providerTitle: "2. AI 제공업체 선택", modelTitle: "3. 모델 설정", modelVersionLabel: "모델 버전",
    providerCustom: "사용자 지정", customEndpointLabel: "사용자 지정 엔드포인트", apiEndpointLabel: "API 엔드포인트",
    modelNameLabel: "모델 이름", apiKeyPlaceholder: "API 키 붙여넣기...", feedback: "피드백",
    supportDeveloper: "개발자 지원", privacyNote: "이 브라우저에만 저장되며 개발자에게 데이터가 업로드되지 않습니다.",
    noKey: "키가 없나요?", languageSaved: "언어 설정 저장됨", savedRefresh: "저장됨. YouTube를 새로고침하세요."
});
Object.assign(UI_TEXT.th, {
    masterLabel: "การแปล", masterDesc: "แปลชื่อวิดีโอ YouTube อัตโนมัติ", languageTitle: "1. ภาษาแปล",
    providerTitle: "2. เลือกผู้ให้บริการ AI", modelTitle: "3. ตั้งค่าโมเดล", modelVersionLabel: "เวอร์ชันโมเดล",
    providerCustom: "กำหนดเอง", customEndpointLabel: "เอนด์พอยต์กำหนดเอง", apiEndpointLabel: "เอนด์พอยต์ API",
    modelNameLabel: "ชื่อโมเดล", apiKeyPlaceholder: "วาง API Key...", feedback: "ข้อเสนอแนะ",
    supportDeveloper: "สนับสนุนนักพัฒนา", privacyNote: "บันทึกเฉพาะในเบราว์เซอร์นี้ ไม่มีการอัปโหลดข้อมูลให้ผู้พัฒนา",
    noKey: "ยังไม่มี Key?", languageSaved: "บันทึกภาษาสำเร็จ", savedRefresh: "บันทึกแล้ว โปรดรีเฟรช YouTube"
});
Object.assign(UI_TEXT.es, {
    masterLabel: "Traducción", masterDesc: "Traduce automáticamente títulos de YouTube", languageTitle: "1. Idioma de traducción",
    providerTitle: "2. Elegir proveedor de IA", modelTitle: "3. Ajustes del modelo", modelVersionLabel: "Versión del modelo",
    providerCustom: "Personalizado", customEndpointLabel: "Endpoint personalizado", apiEndpointLabel: "Endpoint API",
    modelNameLabel: "Nombre del modelo", apiKeyPlaceholder: "Pega tu API Key...", feedback: "Comentarios",
    supportDeveloper: "Apoyar al desarrollador", privacyNote: "Se guarda solo en este navegador. No se suben datos al desarrollador.",
    noKey: "¿No tienes key?", languageSaved: "Idioma guardado", savedRefresh: "Guardado. Actualiza YouTube para aplicar."
});
Object.assign(UI_TEXT.fr, {
    masterLabel: "Traduction", masterDesc: "Traduit automatiquement les titres YouTube", languageTitle: "1. Langue de traduction",
    providerTitle: "2. Choisir le fournisseur IA", modelTitle: "3. Paramètres du modèle", modelVersionLabel: "Version du modèle",
    providerCustom: "Personnalisé", customEndpointLabel: "Endpoint personnalisé", apiEndpointLabel: "Endpoint API",
    modelNameLabel: "Nom du modèle", apiKeyPlaceholder: "Collez votre clé API...", feedback: "Retour",
    supportDeveloper: "Soutenir le développeur", privacyNote: "Stocké uniquement dans ce navigateur. Aucune donnée n'est envoyée au développeur.",
    noKey: "Pas de clé?", languageSaved: "Langue enregistrée", savedRefresh: "Enregistré. Actualisez YouTube."
});
Object.assign(UI_TEXT.de, {
    masterLabel: "Übersetzung", masterDesc: "YouTube-Videotitel automatisch übersetzen", languageTitle: "1. Übersetzungssprache",
    providerTitle: "2. KI-Anbieter wählen", modelTitle: "3. Modelleinstellungen", modelVersionLabel: "Modellversion",
    providerCustom: "Benutzerdefiniert", customEndpointLabel: "Eigener Endpunkt", apiEndpointLabel: "API-Endpunkt",
    modelNameLabel: "Modellname", apiKeyPlaceholder: "API Key einfügen...", feedback: "Feedback",
    supportDeveloper: "Entwickler unterstützen", privacyNote: "Nur in diesem Browser gespeichert. Keine Daten werden an den Entwickler hochgeladen.",
    noKey: "Kein Key?", languageSaved: "Sprache gespeichert", savedRefresh: "Gespeichert. YouTube aktualisieren."
});
Object.assign(UI_TEXT.pt, {
    masterLabel: "Tradução", masterDesc: "Traduz automaticamente títulos do YouTube", languageTitle: "1. Idioma de tradução",
    providerTitle: "2. Escolher provedor de IA", modelTitle: "3. Configurações do modelo", modelVersionLabel: "Versão do modelo",
    providerCustom: "Personalizado", customEndpointLabel: "Endpoint personalizado", apiEndpointLabel: "Endpoint da API",
    modelNameLabel: "Nome do modelo", apiKeyPlaceholder: "Cole sua API Key...", feedback: "Feedback",
    supportDeveloper: "Apoiar desenvolvedor", privacyNote: "Salvo apenas neste navegador. Nenhum dado é enviado ao desenvolvedor.",
    noKey: "Sem key?", languageSaved: "Idioma salvo", savedRefresh: "Salvo. Atualize o YouTube."
});
Object.assign(UI_TEXT.id, {
    masterLabel: "Terjemahan", masterDesc: "Terjemahkan judul video YouTube otomatis", languageTitle: "1. Bahasa terjemahan",
    providerTitle: "2. Pilih penyedia AI", modelTitle: "3. Pengaturan model", modelVersionLabel: "Versi model",
    providerCustom: "Kustom", customEndpointLabel: "Endpoint kustom", apiEndpointLabel: "Endpoint API",
    modelNameLabel: "Nama model", apiKeyPlaceholder: "Tempel API Key...", feedback: "Masukan",
    supportDeveloper: "Dukung pengembang", privacyNote: "Hanya disimpan di browser ini. Tidak ada data yang diunggah ke pengembang.",
    noKey: "Belum punya key?", languageSaved: "Bahasa disimpan", savedRefresh: "Tersimpan. Segarkan YouTube."
});
Object.assign(UI_TEXT.vi, {
    masterLabel: "Dịch", masterDesc: "Tự động dịch tiêu đề video YouTube", languageTitle: "1. Ngôn ngữ dịch",
    providerTitle: "2. Chọn nhà cung cấp AI", modelTitle: "3. Cài đặt mô hình", modelVersionLabel: "Phiên bản mô hình",
    providerCustom: "Tùy chỉnh", customEndpointLabel: "Endpoint tùy chỉnh", apiEndpointLabel: "Endpoint API",
    modelNameLabel: "Tên mô hình", apiKeyPlaceholder: "Dán API Key...", feedback: "Phản hồi",
    supportDeveloper: "Ủng hộ nhà phát triển", privacyNote: "Chỉ lưu trong trình duyệt này. Không tải dữ liệu lên nhà phát triển.",
    noKey: "Chưa có key?", languageSaved: "Đã lưu ngôn ngữ", savedRefresh: "Đã lưu. Hãy làm mới YouTube."
});
Object.assign(UI_TEXT.ru, {
    masterLabel: "Перевод", masterDesc: "Автоматически переводить заголовки YouTube", languageTitle: "1. Язык перевода",
    providerTitle: "2. Выберите AI-провайдера", modelTitle: "3. Настройки модели", modelVersionLabel: "Версия модели",
    providerCustom: "Свой", customEndpointLabel: "Свой endpoint", apiEndpointLabel: "API endpoint",
    modelNameLabel: "Имя модели", apiKeyPlaceholder: "Вставьте API Key...", feedback: "Обратная связь",
    supportDeveloper: "Поддержать разработчика", privacyNote: "Хранится только в этом браузере. Данные не отправляются разработчику.",
    noKey: "Нет key?", languageSaved: "Язык сохранен", savedRefresh: "Сохранено. Обновите YouTube."
});
Object.assign(UI_TEXT.ar, {
    masterLabel: "الترجمة", masterDesc: "ترجمة عناوين YouTube تلقائيا", languageTitle: "1. لغة الترجمة",
    providerTitle: "2. اختر مزود الذكاء الاصطناعي", modelTitle: "3. إعدادات النموذج", modelVersionLabel: "إصدار النموذج",
    providerCustom: "مخصص", customEndpointLabel: "نقطة نهاية مخصصة", apiEndpointLabel: "نقطة نهاية API",
    modelNameLabel: "اسم النموذج", apiKeyPlaceholder: "الصق API Key...", feedback: "ملاحظات",
    supportDeveloper: "دعم المطور", privacyNote: "يتم الحفظ في هذا المتصفح فقط. لا يتم رفع أي بيانات إلى المطور.",
    noKey: "لا تملك Key؟", languageSaved: "تم حفظ اللغة", savedRefresh: "تم الحفظ. حدّث YouTube."
});
Object.assign(UI_TEXT.hi, {
    masterLabel: "अनुवाद", masterDesc: "YouTube वीडियो शीर्षक अपने आप अनुवाद करें", languageTitle: "1. अनुवाद भाषा",
    providerTitle: "2. AI प्रदाता चुनें", modelTitle: "3. मॉडल सेटिंग", modelVersionLabel: "मॉडल संस्करण",
    providerCustom: "कस्टम", customEndpointLabel: "कस्टम endpoint", apiEndpointLabel: "API endpoint",
    modelNameLabel: "मॉडल नाम", apiKeyPlaceholder: "API Key पेस्ट करें...", feedback: "फ़ीडबैक",
    supportDeveloper: "डेवलपर का समर्थन करें", privacyNote: "केवल इसी ब्राउज़र में संग्रहीत। डेवलपर को कोई डेटा अपलोड नहीं होता।",
    noKey: "Key नहीं है?", languageSaved: "भाषा सेटिंग सहेजी गई", savedRefresh: "सहेजा गया। YouTube रीफ़्रेश करें।"
});

const SETTINGS_TEXT_KEYS = [
    "modeTitle", "modeLocal", "modeLocalDesc", "modeAi", "modeAiDesc", "localNotice",
    "moreSettings", "testAndSave", "saveOnly", "draftStatus", "savedStatus", "verifiedStatus",
    "unconfiguredStatus", "verifiedProvider", "savingSettings", "saveFailed", "testFailParameter",
    "testFailResponse", "tierPreview", "tierFree", "privacyNote", "modelIdLabel", "brandSubtitle",
    "providerTitle", "modelVersionLabel", "savedRefresh"
];
const SETTINGS_TEXT = {
    en: ["Translation mode", "On-device", "Free · no API key", "AI translation", "Context-aware · API key", "Uses Chrome’s on-device translator. A supported browser and language pair are required; the first use may download language packs.", "More settings", "Test & save", "Save only", "Unsaved changes", "Key saved", "Test passed", "No key saved", "Last test passed: {date}", "Saving…", "Could not save settings. Please try again.", "The model rejected this request configuration. Try another model or check your custom endpoint.", "No usable translation received. Try a recommended model.", "preview", "free", "Keys are stored in this browser. Cloud translation sends title text directly to your chosen provider. No data is sent to the developer.", "API model ID", "Translation settings", "AI provider", "Model", "Saved. Settings apply to open YouTube pages."],
    "zh-Hans": ["翻译方式", "本机翻译", "免费 · 无需 Key", "AI 翻译", "理解语境 · 需要 Key", "使用 Chrome 内置设备端翻译，需要受支持的浏览器和语言对；首次使用可能下载语言包。", "更多设置", "测试并保存", "仅保存", "有未保存更改", "Key 已保存", "测试通过", "尚未保存 Key", "上次测试通过：{date}", "正在保存…", "保存失败，请重试。", "模型不接受此请求配置，请切换模型或检查自定义接口。", "未收到可用译文，请尝试推荐模型。", "预览", "免费", "Key 保存在当前浏览器；云端翻译会将标题直接发送给所选服务商，开发者不会收到数据。", "API 模型 ID", "翻译设置", "AI 服务商", "模型", "已保存，设置会应用到已打开的 YouTube 页面。"],
    ja: ["翻訳方式", "端末内翻訳", "無料 · キー不要", "AI 翻訳", "文脈を理解 · キー必要", "Chrome の端末内翻訳を使用します。対応ブラウザーと言語ペアが必要です。初回は言語パックをダウンロードする場合があります。", "その他の設定", "テストして保存", "保存のみ", "未保存の変更", "キー保存済み", "テスト成功", "キー未保存", "前回のテスト成功：{date}", "保存中…", "保存できませんでした。再試行してください。", "モデルがこの設定を受け付けません。別のモデルやカスタム接続先を確認してください。", "有効な翻訳を受信できませんでした。推奨モデルをお試しください。", "プレビュー", "無料", "キーはこのブラウザーに保存されます。クラウド翻訳ではタイトルを選択したプロバイダーに直接送信します。開発者には送信されません。", "API モデル ID", "翻訳設定", "AI プロバイダー", "モデル", "保存しました。開いている YouTube ページに適用されます。"],
    ko: ["번역 방식", "기기 내 번역", "무료 · 키 불필요", "AI 번역", "문맥 이해 · 키 필요", "Chrome의 기기 내 번역을 사용합니다. 지원 브라우저와 언어 조합이 필요하며, 처음 사용 시 언어 팩을 다운로드할 수 있습니다.", "추가 설정", "테스트 후 저장", "저장만 하기", "저장하지 않은 변경", "키 저장됨", "테스트 통과", "저장된 키 없음", "마지막 테스트 통과: {date}", "저장 중…", "저장하지 못했습니다. 다시 시도하세요.", "모델이 이 요청 설정을 거부했습니다. 다른 모델이나 사용자 지정 엔드포인트를 확인하세요.", "사용 가능한 번역을 받지 못했습니다. 권장 모델을 사용해 보세요.", "미리보기", "무료", "키는 이 브라우저에 저장됩니다. 클라우드 번역은 제목을 선택한 제공업체로 직접 전송하며, 개발자에게 데이터를 보내지 않습니다.", "API 모델 ID", "번역 설정", "AI 제공업체", "모델", "저장됨. 열려 있는 YouTube 페이지에 적용됩니다."],
    th: ["วิธีแปล", "แปลบนอุปกรณ์", "ฟรี · ไม่ต้องใช้คีย์", "แปลด้วย AI", "เข้าใจบริบท · ต้องใช้คีย์", "ใช้ระบบแปลบนอุปกรณ์ของ Chrome ต้องมีเบราว์เซอร์และคู่ภาษาที่รองรับ การใช้งานครั้งแรกอาจดาวน์โหลดชุดภาษา", "การตั้งค่าเพิ่มเติม", "ทดสอบและบันทึก", "บันทึกเท่านั้น", "มีการเปลี่ยนแปลงที่ยังไม่บันทึก", "บันทึกคีย์แล้ว", "ทดสอบผ่าน", "ยังไม่มีคีย์ที่บันทึก", "ทดสอบผ่านครั้งล่าสุด: {date}", "กำลังบันทึก…", "บันทึกไม่สำเร็จ โปรดลองอีกครั้ง", "โมเดลปฏิเสธการตั้งค่านี้ โปรดลองโมเดลอื่นหรือตรวจสอบปลายทางที่กำหนดเอง", "ไม่ได้รับคำแปลที่ใช้งานได้ โปรดลองโมเดลที่แนะนำ", "พรีวิว", "ฟรี", "คีย์ถูกเก็บในเบราว์เซอร์นี้ การแปลบนคลาวด์จะส่งชื่อวิดีโอโดยตรงไปยังผู้ให้บริการที่เลือก ไม่ส่งข้อมูลให้ผู้พัฒนา", "ID โมเดล API", "การตั้งค่าการแปล", "ผู้ให้บริการ AI", "โมเดล", "บันทึกแล้ว การตั้งค่าจะใช้กับหน้า YouTube ที่เปิดอยู่"],
    es: ["Modo de traducción", "En el dispositivo", "Gratis · sin clave", "Traducción con IA", "Entiende el contexto · requiere clave", "Usa el traductor local de Chrome. Se necesitan un navegador y un par de idiomas compatibles; el primer uso puede descargar paquetes de idiomas.", "Más ajustes", "Probar y guardar", "Solo guardar", "Cambios sin guardar", "Clave guardada", "Prueba superada", "Sin clave guardada", "Última prueba superada: {date}", "Guardando…", "No se pudo guardar. Inténtalo de nuevo.", "El modelo rechazó esta configuración. Prueba otro modelo o revisa el endpoint personalizado.", "No se recibió una traducción válida. Prueba un modelo recomendado.", "vista previa", "gratis", "Las claves se guardan en este navegador. La traducción en la nube envía los títulos directamente al proveedor elegido. No se envían datos al desarrollador.", "ID del modelo API", "Ajustes de traducción", "Proveedor de IA", "Modelo", "Guardado. Los ajustes se aplican a las páginas de YouTube abiertas."],
    fr: ["Mode de traduction", "Sur l’appareil", "Gratuit · sans clé", "Traduction IA", "Comprend le contexte · clé requise", "Utilise la traduction locale de Chrome. Un navigateur et une paire de langues compatibles sont nécessaires ; des packs linguistiques peuvent être téléchargés à la première utilisation.", "Plus de paramètres", "Tester et enregistrer", "Enregistrer seulement", "Modifications non enregistrées", "Clé enregistrée", "Test réussi", "Aucune clé enregistrée", "Dernier test réussi : {date}", "Enregistrement…", "Échec de l’enregistrement. Réessayez.", "Le modèle a refusé cette configuration. Essayez un autre modèle ou vérifiez votre point de terminaison personnalisé.", "Aucune traduction exploitable reçue. Essayez un modèle recommandé.", "aperçu", "gratuit", "Les clés sont stockées dans ce navigateur. La traduction cloud envoie les titres directement au fournisseur choisi. Aucune donnée n’est envoyée au développeur.", "ID du modèle API", "Paramètres de traduction", "Fournisseur IA", "Modèle", "Enregistré. Les paramètres s’appliquent aux pages YouTube ouvertes."],
    de: ["Übersetzungsmodus", "Auf dem Gerät", "Kostenlos · ohne Schlüssel", "KI-Übersetzung", "Versteht Kontext · Schlüssel nötig", "Nutzt Chromes lokale Übersetzung. Ein unterstützter Browser und ein verfügbares Sprachpaar sind nötig; beim ersten Einsatz können Sprachpakete heruntergeladen werden.", "Weitere Einstellungen", "Testen und speichern", "Nur speichern", "Ungespeicherte Änderungen", "Schlüssel gespeichert", "Test bestanden", "Kein Schlüssel gespeichert", "Letzter erfolgreicher Test: {date}", "Wird gespeichert…", "Speichern fehlgeschlagen. Bitte erneut versuchen.", "Das Modell hat diese Konfiguration abgelehnt. Anderes Modell ausprobieren oder eigenen Endpunkt prüfen.", "Keine nutzbare Übersetzung erhalten. Bitte ein empfohlenes Modell versuchen.", "Vorschau", "kostenlos", "Schlüssel werden in diesem Browser gespeichert. Cloud-Übersetzung sendet Titel direkt an den gewählten Anbieter. Der Entwickler erhält keine Daten.", "API-Modell-ID", "Übersetzungseinstellungen", "KI-Anbieter", "Modell", "Gespeichert. Die Einstellungen gelten für offene YouTube-Seiten."],
    pt: ["Modo de tradução", "No dispositivo", "Grátis · sem chave", "Tradução com IA", "Entende o contexto · exige chave", "Usa a tradução local do Chrome. É necessário um navegador e um par de idiomas compatíveis; o primeiro uso pode baixar pacotes de idiomas.", "Mais configurações", "Testar e salvar", "Apenas salvar", "Alterações não salvas", "Chave salva", "Teste aprovado", "Nenhuma chave salva", "Último teste aprovado: {date}", "Salvando…", "Não foi possível salvar. Tente novamente.", "O modelo recusou esta configuração. Tente outro modelo ou verifique o endpoint personalizado.", "Nenhuma tradução válida recebida. Tente um modelo recomendado.", "prévia", "grátis", "As chaves ficam neste navegador. A tradução na nuvem envia os títulos diretamente ao provedor escolhido. Nenhum dado é enviado ao desenvolvedor.", "ID do modelo API", "Configurações de tradução", "Provedor de IA", "Modelo", "Salvo. As configurações se aplicam às páginas do YouTube abertas."],
    id: ["Mode terjemahan", "Di perangkat", "Gratis · tanpa kunci", "Terjemahan AI", "Memahami konteks · perlu kunci", "Menggunakan penerjemah lokal Chrome. Memerlukan browser dan pasangan bahasa yang didukung; penggunaan pertama mungkin mengunduh paket bahasa.", "Pengaturan lainnya", "Uji dan simpan", "Simpan saja", "Perubahan belum disimpan", "Kunci tersimpan", "Uji berhasil", "Belum ada kunci tersimpan", "Uji terakhir berhasil: {date}", "Menyimpan…", "Tidak dapat menyimpan. Coba lagi.", "Model menolak konfigurasi ini. Coba model lain atau periksa endpoint khusus.", "Tidak ada terjemahan yang dapat digunakan. Coba model yang direkomendasikan.", "pratinjau", "gratis", "Kunci disimpan di browser ini. Terjemahan cloud mengirim judul langsung ke penyedia pilihan Anda. Tidak ada data yang dikirim ke pengembang.", "ID model API", "Pengaturan terjemahan", "Penyedia AI", "Model", "Tersimpan. Pengaturan berlaku pada halaman YouTube yang terbuka."],
    vi: ["Chế độ dịch", "Trên thiết bị", "Miễn phí · không cần khóa", "Dịch bằng AI", "Hiểu ngữ cảnh · cần khóa", "Sử dụng bản dịch cục bộ của Chrome. Cần trình duyệt và cặp ngôn ngữ được hỗ trợ; lần đầu có thể tải gói ngôn ngữ.", "Cài đặt khác", "Kiểm tra và lưu", "Chỉ lưu", "Thay đổi chưa lưu", "Đã lưu khóa", "Kiểm tra thành công", "Chưa lưu khóa", "Lần kiểm tra thành công: {date}", "Đang lưu…", "Không thể lưu. Vui lòng thử lại.", "Mô hình từ chối cấu hình này. Hãy thử mô hình khác hoặc kiểm tra điểm cuối tùy chỉnh.", "Chưa nhận được bản dịch hợp lệ. Hãy thử mô hình được đề xuất.", "xem trước", "miễn phí", "Khóa được lưu trong trình duyệt này. Dịch đám mây gửi tiêu đề trực tiếp đến nhà cung cấp đã chọn. Không gửi dữ liệu cho nhà phát triển.", "ID mô hình API", "Cài đặt dịch", "Nhà cung cấp AI", "Mô hình", "Đã lưu. Cài đặt áp dụng cho các trang YouTube đang mở."],
    ru: ["Режим перевода", "На устройстве", "Бесплатно · без ключа", "Перевод с ИИ", "Учитывает контекст · нужен ключ", "Используется локальный переводчик Chrome. Нужны поддерживаемый браузер и языковая пара; при первом запуске могут загружаться языковые пакеты.", "Другие настройки", "Проверить и сохранить", "Только сохранить", "Есть несохранённые изменения", "Ключ сохранён", "Проверка пройдена", "Ключ не сохранён", "Последняя успешная проверка: {date}", "Сохранение…", "Не удалось сохранить. Попробуйте ещё раз.", "Модель отклонила эту конфигурацию. Выберите другую модель или проверьте свой endpoint.", "Не получен пригодный перевод. Попробуйте рекомендуемую модель.", "предварительная", "бесплатно", "Ключи хранятся в этом браузере. При облачном переводе заголовки отправляются напрямую выбранному провайдеру. Разработчик не получает данные.", "ID модели API", "Настройки перевода", "Провайдер ИИ", "Модель", "Сохранено. Настройки применяются к открытым страницам YouTube."],
    ar: ["وضع الترجمة", "على الجهاز", "مجاني · دون مفتاح", "ترجمة بالذكاء الاصطناعي", "تفهم السياق · تتطلب مفتاحًا", "يستخدم مترجم Chrome المحلي. يلزم متصفح وزوج لغات مدعومان؛ قد يتم تنزيل حزم لغات عند الاستخدام الأول.", "إعدادات إضافية", "اختبار وحفظ", "حفظ فقط", "تغييرات غير محفوظة", "المفتاح محفوظ", "نجح الاختبار", "لا يوجد مفتاح محفوظ", "آخر اختبار ناجح: {date}", "جارٍ الحفظ…", "تعذر الحفظ. حاول مرة أخرى.", "رفض النموذج إعدادات هذا الطلب. جرّب نموذجًا آخر أو تحقق من نقطة الاتصال المخصصة.", "لم تصل ترجمة صالحة. جرّب نموذجًا موصى به.", "معاينة", "مجاني", "تُحفظ المفاتيح في هذا المتصفح. ترسل الترجمة السحابية العناوين مباشرة إلى المزود الذي تختاره. لا تُرسل بيانات إلى المطور.", "معرّف نموذج API", "إعدادات الترجمة", "مزود الذكاء الاصطناعي", "النموذج", "تم الحفظ. تُطبّق الإعدادات على صفحات YouTube المفتوحة."],
    hi: ["अनुवाद का तरीका", "डिवाइस पर", "मुफ़्त · कुंजी नहीं चाहिए", "AI अनुवाद", "संदर्भ समझता है · कुंजी चाहिए", "Chrome के स्थानीय अनुवादक का उपयोग करता है। समर्थित ब्राउज़र और भाषा जोड़ी चाहिए; पहली बार भाषा पैक डाउनलोड हो सकते हैं।", "अन्य सेटिंग", "जाँचें और सहेजें", "केवल सहेजें", "बदलाव सहेजे नहीं गए", "कुंजी सहेजी गई", "जाँच सफल", "कोई कुंजी सहेजी नहीं गई", "पिछली सफल जाँच: {date}", "सहेजा जा रहा है…", "सहेजा नहीं जा सका। फिर कोशिश करें।", "मॉडल ने यह कॉन्फ़िगरेशन अस्वीकार किया। दूसरा मॉडल आज़माएँ या कस्टम एंडपॉइंट जाँचें।", "उपयोगी अनुवाद नहीं मिला। अनुशंसित मॉडल आज़माएँ।", "पूर्वावलोकन", "मुफ़्त", "कुंजियाँ इस ब्राउज़र में रखी जाती हैं। क्लाउड अनुवाद शीर्षक सीधे चुने हुए प्रदाता को भेजता है। डेवलपर को कोई डेटा नहीं भेजा जाता।", "API मॉडल ID", "अनुवाद सेटिंग", "AI प्रदाता", "मॉडल", "सहेजा गया। सेटिंग खुले YouTube पृष्ठों पर लागू होती हैं।"]
};
Object.entries(SETTINGS_TEXT).forEach(([code, values]) => {
    SETTINGS_TEXT_KEYS.forEach((key, index) => { UI_TEXT[code][key] = values[index]; });
});
const RECOMMENDED_TEXT = { en:"recommended", "zh-Hans":"推荐", ja:"推奨", ko:"권장", th:"แนะนำ",
    es:"recomendado", fr:"recommandé", de:"empfohlen", pt:"recomendado", id:"direkomendasikan",
    vi:"đề xuất", ru:"рекомендуется", ar:"موصى به", hi:"अनुशंसित" };
Object.entries(RECOMMENDED_TEXT).forEach(([code, label]) => { UI_TEXT[code].tierRecommended = label; });
// 辅助提示也使用当前界面语言，避免手动模型和错误提示回落到英文。
const AUXILIARY_TEXT_KEYS = ["toggleKey", "openDocs", "testingConfig", "testFailed", "testFailAuth",
    "testFailQuota", "testFailModel", "testFailNetwork", "enabled", "paused", "manualModelHint",
    "customModelOption", "endpointInvalid", "endpointHttps", "permissionDenied", "keyRequired",
    "modelRequired", "manualModelPlaceholder", "clearCache", "cacheCleared", "getApiKey", "helpCustom", "examplePlaceholder"];
const AUXILIARY_TEXT = {
    en: ["Show or hide API Key", "Open project docs", "Testing current configuration…", "Test failed. Check the key, model, endpoint, or provider quota.", "Invalid API key", "Quota exhausted or rate limited", "Model unavailable. Check its ID and your account’s access.", "Network or provider error. Please try again.", "Translation enabled", "Translation paused", "Enter a model ID supported by this provider", "Other model (enter manually)", "Invalid API endpoint", "Custom endpoints require HTTPS. Localhost may use HTTP.", "Host access permission was not granted", "API Key is required", "Choose a model or enter its ID", "Enter a supported model ID", "Clear translation cache", "Cache cleared", "Get a key from {provider}", "View custom endpoint guide", "Example: {value}"],
    "zh-Hans": ["显示或隐藏 API Key", "打开项目说明", "正在测试当前配置…", "测试失败，请检查 Key、模型、接口地址或服务商额度。", "Key 无效，请检查 API Key", "余额不足或被限流", "模型不可用，请检查模型 ID 和账号访问权限。", "网络或服务商异常，请重试。", "翻译已开启", "翻译已暂停", "请输入该服务商支持的模型 ID", "其他（手动输入模型名）", "API 接口地址格式不正确", "自定义端点必须使用 HTTPS；本机 localhost 可使用 HTTP。", "未授予该域名访问权限", "必须填写 API Key", "请选择模型或填写模型 ID", "填写服务商支持的模型 ID", "清除翻译缓存", "缓存已清除", "前往 {provider} 获取 Key", "查看自定义端点说明", "例如：{value}"],
    ja: ["API キーを表示・非表示", "プロジェクトの説明を開く", "現在の設定をテスト中…", "テストに失敗しました。キー、モデル、接続先、利用枠を確認してください。", "API キーが無効です", "利用枠不足またはレート制限", "モデルを利用できません。ID とアカウントの権限を確認してください。", "ネットワークまたはプロバイダーのエラー。再試行してください。", "翻訳を有効にしました", "翻訳を一時停止しました", "このプロバイダーが対応するモデル ID を入力してください", "その他のモデル（手動入力）", "API 接続先が無効です", "カスタム接続先には HTTPS が必要です。localhost は HTTP も使用できます。", "接続先へのアクセスが許可されませんでした", "API キーが必要です", "モデルを選択するか ID を入力してください", "対応するモデル ID を入力", "翻訳キャッシュを削除", "キャッシュを削除しました", "{provider} でキーを取得", "カスタム接続先の説明を見る", "例：{value}"],
    ko: ["API 키 표시 또는 숨기기", "프로젝트 설명 열기", "현재 설정 테스트 중…", "테스트에 실패했습니다. 키, 모델, 엔드포인트 또는 사용 한도를 확인하세요.", "API 키가 유효하지 않습니다", "사용 한도 소진 또는 요청 속도 제한", "모델을 사용할 수 없습니다. ID와 계정 권한을 확인하세요.", "네트워크 또는 제공업체 오류입니다. 다시 시도하세요.", "번역이 활성화되었습니다", "번역이 일시 중지되었습니다", "이 제공업체가 지원하는 모델 ID를 입력하세요", "다른 모델 (직접 입력)", "API 엔드포인트가 유효하지 않습니다", "사용자 지정 엔드포인트에는 HTTPS가 필요합니다. localhost는 HTTP를 사용할 수 있습니다.", "호스트 접근 권한이 허용되지 않았습니다", "API 키가 필요합니다", "모델을 선택하거나 ID를 입력하세요", "지원되는 모델 ID 입력", "번역 캐시 삭제", "캐시가 삭제되었습니다", "{provider}에서 키 받기", "사용자 지정 엔드포인트 안내 보기", "예: {value}"],
    th: ["แสดงหรือซ่อน API Key", "เปิดเอกสารโครงการ", "กำลังทดสอบการตั้งค่าปัจจุบัน…", "ทดสอบไม่สำเร็จ โปรดตรวจสอบคีย์ โมเดล ปลายทาง หรือโควตาของผู้ให้บริการ", "API Key ไม่ถูกต้อง", "โควตาหมดหรือถูกจำกัดอัตราการเรียก", "ใช้โมเดลไม่ได้ โปรดตรวจสอบ ID และสิทธิ์ของบัญชี", "ข้อผิดพลาดจากเครือข่ายหรือผู้ให้บริการ โปรดลองอีกครั้ง", "เปิดใช้งานการแปลแล้ว", "หยุดการแปลชั่วคราว", "ป้อน ID โมเดลที่ผู้ให้บริการนี้รองรับ", "โมเดลอื่น (ป้อนเอง)", "ปลายทาง API ไม่ถูกต้อง", "ปลายทางที่กำหนดเองต้องใช้ HTTPS ส่วน localhost ใช้ HTTP ได้", "ไม่ได้รับสิทธิ์เข้าถึงโฮสต์", "ต้องระบุ API Key", "เลือกโมเดลหรือป้อน ID", "ป้อน ID โมเดลที่รองรับ", "ล้างแคชการแปล", "ล้างแคชแล้ว", "รับคีย์จาก {provider}", "ดูคู่มือปลายทางที่กำหนดเอง", "ตัวอย่าง: {value}"],
    es: ["Mostrar u ocultar la clave API", "Abrir documentación", "Probando la configuración actual…", "La prueba falló. Revisa la clave, el modelo, el endpoint o la cuota.", "Clave API no válida", "Cuota agotada o límite de solicitudes", "Modelo no disponible. Revisa el ID y el acceso de tu cuenta.", "Error de red o del proveedor. Inténtalo de nuevo.", "Traducción activada", "Traducción pausada", "Introduce un ID de modelo compatible con este proveedor", "Otro modelo (introducir manualmente)", "Endpoint de API no válido", "Los endpoints personalizados requieren HTTPS. Localhost puede usar HTTP.", "No se concedió permiso para acceder al servidor", "Se requiere una clave API", "Elige un modelo o introduce su ID", "Introduce un ID de modelo compatible", "Borrar caché de traducción", "Caché borrada", "Obtener una clave de {provider}", "Ver guía de endpoints personalizados", "Ejemplo: {value}"],
    fr: ["Afficher ou masquer la clé API", "Ouvrir la documentation", "Test de la configuration en cours…", "Échec du test. Vérifiez la clé, le modèle, le point de terminaison ou le quota.", "Clé API non valide", "Quota épuisé ou limite de requêtes atteinte", "Modèle indisponible. Vérifiez son ID et les droits de votre compte.", "Erreur réseau ou du fournisseur. Réessayez.", "Traduction activée", "Traduction en pause", "Saisissez un ID de modèle pris en charge par ce fournisseur", "Autre modèle (saisie manuelle)", "Point de terminaison API non valide", "Les points de terminaison personnalisés nécessitent HTTPS. Localhost peut utiliser HTTP.", "L’accès au serveur n’a pas été autorisé", "Une clé API est nécessaire", "Choisissez un modèle ou saisissez son ID", "Saisissez un ID de modèle compatible", "Vider le cache de traduction", "Cache vidé", "Obtenir une clé chez {provider}", "Voir le guide des points de terminaison", "Exemple : {value}"],
    de: ["API-Schlüssel anzeigen oder verbergen", "Projektdokumentation öffnen", "Aktuelle Konfiguration wird getestet…", "Test fehlgeschlagen. Schlüssel, Modell, Endpunkt oder Kontingent prüfen.", "Ungültiger API-Schlüssel", "Kontingent erschöpft oder Anfragen begrenzt", "Modell nicht verfügbar. ID und Kontozugriff prüfen.", "Netzwerk- oder Anbieterfehler. Bitte erneut versuchen.", "Übersetzung aktiviert", "Übersetzung pausiert", "Eine von diesem Anbieter unterstützte Modell-ID eingeben", "Anderes Modell (manuell eingeben)", "Ungültiger API-Endpunkt", "Eigene Endpunkte benötigen HTTPS. Localhost darf HTTP verwenden.", "Zugriff auf den Server wurde nicht erlaubt", "API-Schlüssel erforderlich", "Modell wählen oder ID eingeben", "Unterstützte Modell-ID eingeben", "Übersetzungscache leeren", "Cache geleert", "Schlüssel bei {provider} abrufen", "Anleitung für eigene Endpunkte", "Beispiel: {value}"],
    pt: ["Mostrar ou ocultar a chave API", "Abrir documentação", "Testando a configuração atual…", "O teste falhou. Verifique a chave, o modelo, o endpoint ou a cota.", "Chave API inválida", "Cota esgotada ou limite de solicitações", "Modelo indisponível. Verifique o ID e o acesso da sua conta.", "Erro de rede ou do provedor. Tente novamente.", "Tradução ativada", "Tradução pausada", "Digite um ID de modelo compatível com este provedor", "Outro modelo (digitar manualmente)", "Endpoint de API inválido", "Endpoints personalizados exigem HTTPS. Localhost pode usar HTTP.", "Permissão de acesso ao servidor não concedida", "É necessária uma chave API", "Escolha um modelo ou digite seu ID", "Digite um ID de modelo compatível", "Limpar cache de tradução", "Cache limpo", "Obter uma chave de {provider}", "Ver guia de endpoints personalizados", "Exemplo: {value}"],
    id: ["Tampilkan atau sembunyikan kunci API", "Buka dokumentasi proyek", "Menguji konfigurasi saat ini…", "Uji gagal. Periksa kunci, model, endpoint, atau kuota penyedia.", "Kunci API tidak valid", "Kuota habis atau batas permintaan tercapai", "Model tidak tersedia. Periksa ID dan akses akun Anda.", "Kesalahan jaringan atau penyedia. Coba lagi.", "Terjemahan diaktifkan", "Terjemahan dijeda", "Masukkan ID model yang didukung penyedia ini", "Model lain (masukkan manual)", "Endpoint API tidak valid", "Endpoint khusus memerlukan HTTPS. Localhost dapat menggunakan HTTP.", "Izin akses ke server tidak diberikan", "Kunci API diperlukan", "Pilih model atau masukkan ID-nya", "Masukkan ID model yang didukung", "Hapus cache terjemahan", "Cache dihapus", "Dapatkan kunci dari {provider}", "Lihat panduan endpoint khusus", "Contoh: {value}"],
    vi: ["Hiện hoặc ẩn khóa API", "Mở tài liệu dự án", "Đang kiểm tra cấu hình hiện tại…", "Kiểm tra thất bại. Hãy kiểm tra khóa, mô hình, điểm cuối hoặc hạn mức.", "Khóa API không hợp lệ", "Hết hạn mức hoặc bị giới hạn yêu cầu", "Mô hình không khả dụng. Kiểm tra ID và quyền truy cập của tài khoản.", "Lỗi mạng hoặc nhà cung cấp. Vui lòng thử lại.", "Đã bật dịch", "Đã tạm dừng dịch", "Nhập ID mô hình được nhà cung cấp này hỗ trợ", "Mô hình khác (nhập thủ công)", "Điểm cuối API không hợp lệ", "Điểm cuối tùy chỉnh phải dùng HTTPS. Localhost có thể dùng HTTP.", "Chưa được cấp quyền truy cập máy chủ", "Cần có khóa API", "Chọn mô hình hoặc nhập ID", "Nhập ID mô hình được hỗ trợ", "Xóa bộ nhớ đệm dịch", "Đã xóa bộ nhớ đệm", "Lấy khóa từ {provider}", "Xem hướng dẫn điểm cuối tùy chỉnh", "Ví dụ: {value}"],
    ru: ["Показать или скрыть ключ API", "Открыть документацию", "Проверка текущих настроек…", "Проверка не удалась. Проверьте ключ, модель, адрес API или квоту.", "Недействительный ключ API", "Квота исчерпана или превышен лимит запросов", "Модель недоступна. Проверьте ID и права вашей учетной записи.", "Ошибка сети или провайдера. Попробуйте снова.", "Перевод включен", "Перевод приостановлен", "Введите ID модели, поддерживаемой этим провайдером", "Другая модель (ввести вручную)", "Неверный адрес API", "Для собственного адреса API требуется HTTPS. Localhost может использовать HTTP.", "Доступ к серверу не разрешен", "Требуется ключ API", "Выберите модель или введите ее ID", "Введите ID поддерживаемой модели", "Очистить кэш переводов", "Кэш очищен", "Получить ключ у {provider}", "Руководство по настройке адреса API", "Пример: {value}"],
    ar: ["إظهار أو إخفاء مفتاح API", "فتح وثائق المشروع", "جارٍ اختبار الإعدادات الحالية…", "فشل الاختبار. تحقق من المفتاح والنموذج ونقطة النهاية أو حصة الاستخدام.", "مفتاح API غير صالح", "نفدت الحصة أو تم بلوغ حد الطلبات", "النموذج غير متاح. تحقق من المعرّف وصلاحيات حسابك.", "خطأ في الشبكة أو لدى المزوّد. حاول مرة أخرى.", "تم تفعيل الترجمة", "تم إيقاف الترجمة مؤقتًا", "أدخل معرّف نموذج يدعمه هذا المزوّد", "نموذج آخر (إدخال يدوي)", "نقطة نهاية API غير صالحة", "تتطلب نقاط النهاية المخصصة HTTPS. يمكن استخدام HTTP مع localhost.", "لم يتم منح إذن الوصول إلى الخادم", "مفتاح API مطلوب", "اختر نموذجًا أو أدخل معرّفه", "أدخل معرّف نموذج مدعوم", "مسح ذاكرة الترجمة المؤقتة", "تم مسح الذاكرة المؤقتة", "الحصول على مفتاح من {provider}", "عرض دليل نقطة النهاية المخصصة", "مثال: {value}"],
    hi: ["API कुंजी दिखाएँ या छिपाएँ", "प्रोजेक्ट के दस्तावेज़ खोलें", "वर्तमान सेटिंग की जाँच हो रही है…", "जाँच विफल रही। कुंजी, मॉडल, API पता या उपयोग सीमा जाँचें।", "API कुंजी अमान्य है", "कोटा समाप्त या अनुरोध सीमा पूरी हो गई", "मॉडल उपलब्ध नहीं है। ID और खाते की पहुँच जाँचें।", "नेटवर्क या प्रदाता की त्रुटि। दोबारा कोशिश करें।", "अनुवाद चालू है", "अनुवाद रोका गया है", "इस प्रदाता द्वारा समर्थित मॉडल ID दर्ज करें", "अन्य मॉडल (स्वयं दर्ज करें)", "API पता अमान्य है", "कस्टम API के लिए HTTPS आवश्यक है। localhost पर HTTP चल सकता है।", "सर्वर तक पहुँच की अनुमति नहीं मिली", "API कुंजी आवश्यक है", "मॉडल चुनें या उसकी ID दर्ज करें", "समर्थित मॉडल ID दर्ज करें", "अनुवाद कैश साफ़ करें", "कैश साफ़ कर दिया गया", "{provider} से कुंजी प्राप्त करें", "कस्टम API की मार्गदर्शिका देखें", "उदाहरण: {value}"]
};
Object.entries(AUXILIARY_TEXT).forEach(([code, values]) => {
    const pack = UI_TEXT[code];
    AUXILIARY_TEXT_KEYS.forEach((key, index) => { pack[key] = values[index]; });
    pack.apiUrlPlaceholder = pack.examplePlaceholder.replace("{value}", "https://openrouter.ai/api/v1/chat/completions");
    pack.customModelPlaceholder = pack.examplePlaceholder.replace("{value}", "openai/gpt-6-luna");
});

const popupReviewText = typeof require === "function" ? require("./popup-locales.js") : globalThis.POPUP_REVIEW_TEXT;
Object.entries(popupReviewText).forEach(([code, pack]) => Object.assign(UI_TEXT[code], pack));
// The compact layout has no numbered setup steps, including its accessible labels.
Object.values(UI_TEXT).forEach(pack => { pack.modelTitle = pack.modelTitle.replace(/^\d+\.\s*/, ""); });

// Only these fields may reach visible diagnostic details. Provider bodies can echo credentials.
function getSafeDiagnostic(error) {
    const knownTypes = ["extension", "auth", "quota", "model", "parameter", "empty", "parse", "network", "service", "cancelled"];
    const type = error && knownTypes.includes(error.type) ? error.type : "unknown";
    const status = error && error.detail && error.detail.status;
    return { type, status:Number.isInteger(status) && status >= 100 && status <= 599 ? status : null };
}

const PRESETS = {
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        helpUrl: "https://platform.openai.com/api-keys",
        helpKey: "helpOpenAI",
        models: [
            { id: "gpt-6-luna", name: "GPT-6 Luna", tier: "tierRecommended" },
            { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", tier: "" },
            { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", tier: "" }
        ]
    },
    anthropic: {
        url: "https://api.anthropic.com/v1/messages",
        helpUrl: "https://console.anthropic.com/settings/keys",
        helpKey: "helpAnthropic",
        models: [
            { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", tier: "tierRecommended" },
            { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", tier: "" },
            { id: "claude-opus-5-5", name: "Claude Opus 5.5", tier: "" }
        ]
    },
    deepseek: {
        url: "https://api.deepseek.com/chat/completions",
        helpUrl: "https://platform.deepseek.com/api_keys",
        helpKey: "helpDeepSeek",
        models: [
            { id: "deepseek-flash", name: "DeepSeek V4.1 Flash", tier: "tierRecommended" },
            { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", tier: "" }
        ]
    },
    custom: {
        url: "",
        helpUrl: "https://github.com/GaryGaryyy/YouTube-AI-Title-Translator#%E8%87%AA%E5%AE%9A%E4%B9%89%E7%AB%AF%E7%82%B9",
        helpKey: "helpCustom",
        models: []
    }
};

let currentProvider = "deepseek";
let uiLanguage = DEFAULT_UI_LANGUAGE;
let targetLanguage = DEFAULT_TARGET_LANGUAGE;

function buildUrl(provider, modelId) {
    const tpl = PRESETS[provider].url;
    return tpl.includes("{MODEL}") ? tpl.replace("{MODEL}", modelId) : tpl;
}

function getLocale() {
    return UI_TEXT[uiLanguage] || UI_TEXT.en;
}

function t(key, replacements) {
    let value = getLocale()[key] || UI_TEXT.en[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(name => {
            value = value.replace(`{${name}}`, replacements[name]);
        });
    }
    return value;
}

function getLanguageMeta(code) {
    return UI_LANGUAGES.find(item => item.code === code) || UI_LANGUAGES.find(item => item.code === DEFAULT_UI_LANGUAGE);
}

function populateLanguageSelect(select, languages, selectedCode, useShortName) {
    select.innerHTML = "";
    languages.forEach(language => {
        const option = document.createElement("option");
        option.value = language.code;
        option.textContent = useShortName ? language.shortName : language.nativeName;
        option.title = language.nativeName;
        option.selected = language.code === selectedCode;
        select.appendChild(option);
    });
}

function getModelLabel(model) {
    const name = model.name || model.id;
    if (!model.tier) return name;
    return uiLanguage === "zh-Hans" ? `${name}（${t(model.tier)}）` : `${name} (${t(model.tier)})`;
}

function sameProviderConfig(a, b) {
    return ["apiKey", "apiUrl", "model"].every(key => String((a || {})[key] || "").trim() === String((b || {})[key] || "").trim());
}

// Keep this storage migration identical in popup.js and background.js (no shared runtime script).
function migrateProviderSettings(result) {
    const retired = ["google", "minimax", "zhipu", "kimi"];
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
    if (retired.includes(provider)) {
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
    for (const id of retired) {
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

function normalizeStoredSettings(result) {
    result = migrateProviderSettings(result).stored;
    const provider = PRESETS[result.selectedProvider] ? result.selectedProvider : "deepseek";
    const configs = Object.assign({}, result.providerConfigs || {});
    if (!result.providerConfigs && result.customApiKey) {
        configs[provider] = { apiKey: result.customApiKey, apiUrl: result.customApiUrl, model: result.customModel };
    }
    const mode = ["local", "ai"].includes(result.translationMode)
        ? result.translationMode : ((configs[provider] || {}).apiKey ? "ai" : "local");
    return { provider, mode, configs };
}

function createProviderDrafts(configs) {
    const saved = Object.fromEntries(Object.entries(configs || {}).map(([key, cfg]) => [key, Object.assign({}, cfg)]));
    const drafts = {};
    const defaults = provider => {
        const cfg = saved[provider] || {};
        const model = provider === "custom" ? cfg.model || "" :
            (cfg.model || PRESETS[provider].models[0].id);   // 非预设 ID 视为手动模型，原样保留
        return { apiKey: cfg.apiKey || "", apiUrl: cfg.apiUrl || buildUrl(provider, model), model,
            manual: provider === "custom" || !PRESETS[provider].models.some(item => item.id === model) };
    };
    return {
        get(provider) { return Object.assign({}, drafts[provider] || defaults(provider)); },
        capture(provider, cfg) { drafts[provider] = Object.assign({}, cfg); },
        isDirty(provider) { return !sameProviderConfig(this.get(provider), defaults(provider)); },
        saved(provider) { return Object.assign({}, saved[provider]); },
        snapshot() { return Object.fromEntries(Object.entries(saved).map(([key, cfg]) => [key, Object.assign({}, cfg)])); },
        commit(provider, cfg) {
            saved[provider] = Object.assign({}, cfg);
            delete drafts[provider];
        }
    };
}

function makeSavedProviderConfig(cfg, previous, testedAt) {
    const saved = { apiKey: cfg.apiKey, apiUrl: cfg.apiUrl, model: cfg.model };
    if (testedAt) saved.testedAt = testedAt;
    else if (sameProviderConfig(cfg, previous) && previous && previous.testedAt) saved.testedAt = previous.testedAt;
    return saved;
}

function validateCustomEndpoint(url) {
    let parsed;
    try { parsed = new URL(url); } catch (e) { return { ok: false, key: "endpointInvalid" }; }
    const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if ((parsed.protocol !== "https:" && !localHttp) || parsed.username || parsed.password) {
        return { ok: false, key: "endpointHttps" };
    }
    return { ok: true, url: parsed };
}

document.addEventListener("DOMContentLoaded", () => {
    const byId = id => document.getElementById(id);
    const apiUrlInput = byId("apiUrl"), apiKeyInput = byId("apiKey"), modelNameInput = byId("modelName");
    const modelSelect = byId("modelSelect"), saveBtn = byId("saveBtn"), testBtn = byId("testBtn");
    const status = byId("status"), configState = byId("configState"), helpLink = byId("help-link");
    const masterToggle = byId("masterToggle"), uiLanguageSelect = byId("uiLanguageSelect"), targetLanguageSelect = byId("targetLanguageSelect");
    const aiSettings = byId("aiSettings"), modelSection = byId("modelSection"), manualModelSection = byId("manualModelSection");
    const apiUrlGroup = byId("apiUrlGroup"), apiKeyVisibility = byId("apiKeyVisibility"), clearCacheBtn = byId("clearCacheBtn");
    const modeLocal = byId("modeLocal"), modeAi = byId("modeAi"), localNotice = byId("localNotice");
    const cards = Object.fromEntries(Object.keys(PRESETS).map(provider => [provider, byId("card-" + provider)]));
    const providerNames = { openai:"OpenAI", anthropic:"Claude", deepseek:"DeepSeek", custom:"Custom" };
    const manualModels = {};
    let drafts = createProviderDrafts({});
    let translationMode = "local", savedMode = "local", savedProvider = "deepseek";
    let busy = "", ready = false, cacheEntryCount = 0, statusState = null;

    function setStatus(key, kind, extra, error, retained = false) {
        statusState = key ? { key, kind: kind || "info", extra: extra || "",
            diagnostic:error ? getSafeDiagnostic(error) : null, retained } : null;
        byId("statusDetails").open = false;
        renderStatus();
        if (key && byId("statusPanel").scrollIntoView) byId("statusPanel").scrollIntoView({ block:"nearest" });
    }
    function renderStatus() {
        status.hidden = !statusState;
        byId("statusPanel").hidden = !statusState;
        status.textContent = statusState ? t(statusState.key) + (statusState.extra ? "\n" + statusState.extra : "")
            + (statusState.retained ? "\n" + t("changesNotSaved") : "") : "";
        status.dataset.kind = statusState ? statusState.kind : "info";
        byId("statusPanel").dataset.kind = status.dataset.kind;
        const diagnostic = statusState && statusState.diagnostic;
        byId("statusDetails").hidden = !diagnostic;
        byId("diagnosticType").textContent = diagnostic ? diagnostic.type : "";
        byId("diagnosticHttp").textContent = diagnostic ? (diagnostic.status === null ? "—" : String(diagnostic.status)) : "";
    }
    function renderPrivacy() {
        document.querySelectorAll(".privacy-note").forEach(el => { el.textContent = t(translationMode === "ai" ? "privacyNote" : "privacyLocalNote"); });
        byId("privacyBody").textContent = t(translationMode === "ai" ? "privacyDetailsAi" : "privacyDetailsLocal");
    }
    function buildCurrentConfig() {
        const model = modelNameInput.value.trim();
        return { apiUrl: currentProvider === "custom" ? apiUrlInput.value.trim() : buildUrl(currentProvider, model),
            apiKey: apiKeyInput.value.trim(), model, targetLanguage };
    }
    function captureForm() {
        const cfg = buildCurrentConfig();
        cfg.manual = currentProvider === "custom" || modelSelect.value === CUSTOM_MODEL_VALUE;
        if (cfg.manual) manualModels[currentProvider] = cfg.model;
        drafts.capture(currentProvider, cfg);
    }
    function hasUnsavedChanges() {
        return translationMode !== savedMode ||
            (translationMode === "ai" && (currentProvider !== savedProvider || drafts.isDirty(currentProvider)));
    }
    function refreshConfiguredIndicators() {
        Object.entries(cards).forEach(([provider, card]) => {
            const saved = drafts.saved(provider);
            const configured = !!(saved.apiKey && saved.apiUrl && saved.model);
            const dirty = drafts.isDirty(provider);
            const verified = configured && !!saved.testedAt && !dirty;
            card.classList.toggle("provider-configured", configured);
            card.classList.toggle("provider-verified", verified);
            card.classList.toggle("provider-draft", dirty);
            const description = dirty ? t("draftStatus") : verified
                ? t("verifiedProvider", { date: new Date(saved.testedAt).toLocaleString() })
                : t(configured ? "savedStatus" : "unconfiguredStatus");
            card.title = providerNames[provider] + " · " + description;
            card.setAttribute("aria-label", card.title);
        });
    }
    function renderState() {
        let key, kind = "info";
        if (hasUnsavedChanges()) { key = "draftStatus"; kind = "draft"; }
        else if (translationMode === "local") key = "modeLocalDesc";
        else {
            const cfg = drafts.saved(currentProvider);
            const configured = !!(cfg.apiKey && cfg.apiUrl && cfg.model);
            key = configured ? (cfg.testedAt ? "verifiedStatus" : "savedStatus") : "unconfiguredStatus";
            if (configured && cfg.testedAt) kind = "success";
        }
        configState.textContent = (translationMode === "ai" ? providerNames[currentProvider] + " · " : "") + t(key);
        configState.dataset.kind = kind;
        byId("stateIcon").hidden = kind !== "success";
        testBtn.textContent = busy ? t(busy === "test" ? "testingConfig" : "savingSettings")
            : t(translationMode === "local" ? "saveSettings" : "testAndSave");
        saveBtn.textContent = t("saveOnly");
        saveBtn.hidden = translationMode === "local";
        byId("skipSaveSection").hidden = translationMode === "local";
        refreshConfiguredIndicators();
    }
    function setBusy(value) {
        busy = value;
        masterToggle.disabled = !ready;
        uiLanguageSelect.disabled = !ready;
        aiSettings.disabled = !!value || !ready;
        [testBtn, saveBtn, modeLocal, modeAi, targetLanguageSelect, clearCacheBtn].forEach(el => { el.disabled = !!value || !ready; });
        testBtn.setAttribute("aria-busy", value ? "true" : "false");
        renderState();
    }
    function rebuildModelSelect(provider, model, manual) {
        modelSelect.replaceChildren();
        PRESETS[provider].models.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.id; opt.textContent = getModelLabel(item);
            modelSelect.appendChild(opt);
        });
        if (provider !== "custom") {
            const other = document.createElement("option");
            other.value = CUSTOM_MODEL_VALUE; other.textContent = t("customModelOption");
            modelSelect.appendChild(other);
            modelSelect.value = manual ? CUSTOM_MODEL_VALUE : model;
        }
    }
    function renderModelFields() {
        const custom = currentProvider === "custom";
        const manual = custom || modelSelect.value === CUSTOM_MODEL_VALUE;
        apiUrlGroup.hidden = !custom;
        modelSection.hidden = custom;
        manualModelSection.hidden = !manual;
        apiUrlInput.placeholder = t("apiUrlPlaceholder");
        modelNameInput.placeholder = t(custom ? "customModelPlaceholder" : "manualModelPlaceholder");
        byId("modelIdValue").textContent = modelNameInput.value || "—";
        const info = PRESETS[currentProvider];
        helpLink.href = info.helpUrl;
        helpLink.textContent = t(custom ? "helpCustom" : "getApiKey", { provider:providerNames[currentProvider] });
    }
    function hydrateForm(provider) {
        currentProvider = provider;
        const cfg = drafts.get(provider);
        modelNameInput.value = cfg.model;
        apiKeyInput.value = cfg.apiKey;
        apiUrlInput.value = cfg.apiUrl;
        apiKeyInput.type = "password";
        apiKeyVisibility.setAttribute("aria-pressed", "false");
        if (cfg.manual) manualModels[provider] = cfg.model;
        rebuildModelSelect(provider, cfg.model, cfg.manual);
        Object.entries(cards).forEach(([key, card]) => {
            card.classList.toggle("active", key === provider);
            card.setAttribute("aria-pressed", key === provider ? "true" : "false");
        });
        renderModelFields();
        renderState();
    }
    function renderMode() {
        aiSettings.hidden = translationMode !== "ai";
        localNotice.hidden = translationMode !== "local";
        modeLocal.setAttribute("aria-pressed", translationMode === "local" ? "true" : "false");
        modeAi.setAttribute("aria-pressed", translationMode === "ai" ? "true" : "false");
        byId("modelIdRow").hidden = translationMode !== "ai";
        renderPrivacy();
        renderState();
    }
    function renderClearCacheBtn() { clearCacheBtn.textContent = t("clearCache") + " (" + cacheEntryCount + ")"; }
    function applyI18n() {
        const meta = getLanguageMeta(uiLanguage);
        document.documentElement.lang = meta.htmlLang;
        document.documentElement.dir = meta.dir;
        document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
        document.querySelectorAll("[data-i18n-attr]").forEach(el => {
            el.dataset.i18nAttr.split(";").forEach(pair => {
                const [attr, key] = pair.split(":");
                if (attr && key) el.setAttribute(attr, t(key));
            });
        });
        const cfg = drafts.get(currentProvider);
        rebuildModelSelect(currentProvider, modelNameInput.value || cfg.model, cfg.manual);
        renderModelFields();
        const version = chrome.runtime.getManifest ? chrome.runtime.getManifest().version : "";
        byId("versionLabel").textContent = version ? "v" + version : "";
        renderPrivacy();
        renderClearCacheBtn(); renderState(); renderStatus();
    }
    function validateCurrentConfig() {
        const cfg = buildCurrentConfig();
        if (!cfg.apiKey) { setStatus("keyRequired", "error"); apiKeyInput.focus(); return null; }
        if (!cfg.model) { setStatus("modelRequired", "error"); modelNameInput.focus(); return null; }
        if (currentProvider === "custom") {
            const endpoint = validateCustomEndpoint(cfg.apiUrl);
            if (!endpoint.ok) { setStatus(endpoint.key, "error"); apiUrlInput.focus(); return null; }
        }
        return cfg;
    }
    function saveStorage(values) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(values, () => {
                if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                else resolve();
            });
        });
    }
    function testFailKey(error) {
        const type = error && error.type;
        return { auth:"testFailAuth", quota:"testFailQuota", model:"testFailModel", parameter:"testFailParameter",
            extension:"testFailExtension", parse:"testFailResponse", empty:"testFailEmpty", network:"testFailNetwork", service:"testFailService" }[type] || "testFailed";
    }
    async function saveConfiguration(shouldTest) {
        if (busy || !ready) return;
        captureForm();
        const provider = currentProvider, mode = translationMode;
        const cfg = mode === "ai" ? validateCurrentConfig() : { apiKey:"", apiUrl:"", model:"" };
        if (!cfg) return;
        setBusy(shouldTest && mode === "ai" ? "test" : "save");
        let sample = "";
        try {
            if (mode === "ai" && provider === "custom") {
                const endpoint = validateCustomEndpoint(cfg.apiUrl).url;
                const origin = endpoint.protocol + "//" + endpoint.hostname + "/*";
                const granted = await chrome.permissions.request({ origins:[origin] });
                if (!granted) { setStatus("permissionDenied", "error"); return; }
            }
            let testedAt;
            if (shouldTest && mode === "ai") {
                setStatus("testingConfig");
                const reply = await new Promise(resolve => {
                    try {
                        chrome.runtime.sendMessage({ type:"testTranslation", text:"How global creators explain AI tools", config:cfg }, result => {
                            resolve(chrome.runtime.lastError || !result ? { ok:false, error:{ type:"extension" } } : result);
                        });
                    } catch (_) {
                        resolve({ ok:false, error:{ type:"extension" } });
                    }
                });
                if (!reply || !reply.ok || !reply.result || !reply.result.translatedTitle) {
                    const error = reply && reply.error ? reply.error : { type:"parse" };
                    setStatus(reply && reply.errorCode === "preview" ? "previewTestUnavailable" : testFailKey(error), "error", "", error, true);
                    return;
                }
                testedAt = Date.now();
                sample = "How global creators explain AI tools → " + reply.result.translatedTitle;
            }
            const providerConfigs = drafts.snapshot();
            const saved = mode === "ai" ? makeSavedProviderConfig(cfg, drafts.saved(provider), testedAt) : null;
            if (saved) providerConfigs[provider] = saved;
            setBusy("save");
            await saveStorage({ providerConfigs, selectedProvider:provider, translationMode:mode, targetLanguage, uiLanguage,
                customApiUrl:cfg.apiUrl, customApiKey:cfg.apiKey, customModel:cfg.model,
                providerMigrationPending:false });
            if (saved) drafts.commit(provider, saved);
            savedMode = mode; savedProvider = provider;
            setStatus(shouldTest && mode === "ai" ? "verifiedSaved" : "savedRefresh", "success", sample);
        } catch (e) {
            setStatus("saveFailed", "error");
        } finally { setBusy(""); }
    }

    populateLanguageSelect(uiLanguageSelect, UI_LANGUAGES, uiLanguage);
    populateLanguageSelect(targetLanguageSelect, TARGET_LANGUAGES, targetLanguage);
    setBusy("");
    chrome.storage.local.get({ enabled:true, retiredProviderConfigs:null, providerConfigs:null, selectedProvider:"deepseek", translationMode:null,
        customApiUrl:"", customApiKey:"", customModel:"", uiLanguage:DEFAULT_UI_LANGUAGE, targetLanguage:DEFAULT_TARGET_LANGUAGE, translationCache:null, providerMigrationPending:false }, result => {
        if (chrome.runtime.lastError) { setStatus("saveFailed", "error"); return; }
        const migration = migrateProviderSettings(result);
        if (Object.keys(migration.updates).length) chrome.storage.local.set(migration.updates, () => {
            if (chrome.runtime.lastError) setStatus("saveFailed", "error");
        });
        result = migration.stored;
        const stored = normalizeStoredSettings(result);
        drafts = createProviderDrafts(stored.configs);
        translationMode = savedMode = stored.mode; savedProvider = stored.provider;
        uiLanguage = UI_TEXT[result.uiLanguage] ? result.uiLanguage : DEFAULT_UI_LANGUAGE;
        targetLanguage = TARGET_LANGUAGES.some(item => item.code === result.targetLanguage) ? result.targetLanguage : DEFAULT_TARGET_LANGUAGE;
        masterToggle.checked = result.enabled !== false;
        const cache = result.translationCache;
        cacheEntryCount = (Array.isArray(cache) ? cache : (cache && Array.isArray(cache.entries) ? cache.entries : [])).length;
        populateLanguageSelect(uiLanguageSelect, UI_LANGUAGES, uiLanguage);
        populateLanguageSelect(targetLanguageSelect, TARGET_LANGUAGES, targetLanguage);
        hydrateForm(stored.provider); applyI18n(); renderMode();
        ready = true; setBusy("");
        if (result.providerMigrationPending) setStatus("providerRetired", "");
    });

    masterToggle.addEventListener("change", async () => {
        try { await saveStorage({ enabled:masterToggle.checked }); if (!busy) setStatus(masterToggle.checked ? "enabled" : "paused", "success"); }
        catch (e) { setStatus("saveFailed", "error"); masterToggle.checked = !masterToggle.checked; }
    });
    uiLanguageSelect.addEventListener("change", async () => {
        captureForm();
        uiLanguage = UI_TEXT[uiLanguageSelect.value] ? uiLanguageSelect.value : DEFAULT_UI_LANGUAGE;
        applyI18n();
        try { await saveStorage({ uiLanguage }); } catch (e) { setStatus("saveFailed", "error"); }
    });
    targetLanguageSelect.addEventListener("change", async () => {
        targetLanguage = TARGET_LANGUAGES.some(item => item.code === targetLanguageSelect.value) ? targetLanguageSelect.value : DEFAULT_TARGET_LANGUAGE;
        try { await saveStorage({ targetLanguage }); } catch (e) { setStatus("saveFailed", "error"); }
    });
    Object.entries(cards).forEach(([provider, card]) => card.addEventListener("click", () => {
        if (busy) return; captureForm(); hydrateForm(provider); setStatus("");
    }));
    [[modeLocal,"local"],[modeAi,"ai"]].forEach(([button, mode]) => button.addEventListener("click", () => {
        if (busy) return; captureForm(); translationMode = mode; renderMode(); setStatus("");
    }));
    apiKeyVisibility.addEventListener("click", () => {
        const show = apiKeyInput.type === "password";
        apiKeyInput.type = show ? "text" : "password"; apiKeyVisibility.setAttribute("aria-pressed", show ? "true" : "false");
    });
    modelSelect.addEventListener("change", () => {
        const manual = modelSelect.value === CUSTOM_MODEL_VALUE;
        modelNameInput.value = manual ? (manualModels[currentProvider] || "") : modelSelect.value;
        apiUrlInput.value = buildUrl(currentProvider, modelNameInput.value);
        captureForm(); renderModelFields(); renderState(); setStatus("");
        if (manual) modelNameInput.focus();
    });
    [modelNameInput,apiKeyInput,apiUrlInput].forEach(el => el.addEventListener("input", () => {
        if (currentProvider !== "custom") apiUrlInput.value = buildUrl(currentProvider, modelNameInput.value.trim());
        captureForm(); renderModelFields(); renderState(); setStatus("");
    }));
    testBtn.addEventListener("click", () => saveConfiguration(true));
    saveBtn.addEventListener("click", () => saveConfiguration(false));
    clearCacheBtn.addEventListener("click", () => {
        chrome.storage.local.remove("translationCache", () => {
            if (chrome.runtime.lastError) { setStatus("saveFailed", "error"); return; }
            cacheEntryCount = 0; renderClearCacheBtn(); setStatus("cacheCleared", "success");
        });
    });
});

if (typeof module !== "undefined" && module.exports) {
    module.exports = { migrateProviderSettings, getBrowserDefaultLanguages, getBrowserLanguage, DEFAULT_UI_LANGUAGE, DEFAULT_TARGET_LANGUAGE, UI_TEXT, UI_LANGUAGES, TARGET_LANGUAGES, PRESETS, SETTINGS_TEXT_KEYS, SETTINGS_TEXT,
        sameProviderConfig, normalizeStoredSettings, createProviderDrafts, makeSavedProviderConfig, validateCustomEndpoint, getSafeDiagnostic };
}
