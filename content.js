const { getBrowserDefaultLanguages, getBrowserLanguage, buildPublicConfig, getDisplayPreferences, isChineseLanguage } =
    typeof require === "function" ? require("./shared.js") : globalThis.GaryShared;

// ================= 配置区 =================
let USER_CONFIG = { configured: false, batchSize: 6 };
let TARGET_LANGUAGE = "en";
let UI_LANGUAGE = "en";
let CONFIG_READY = false;
let TRANSLATION_MODE = "local";
let translationGeneration = 0;
let aiCacheScope = "";
let legacyAiCacheScope = null;
let displayPreferences = getDisplayPreferences({});
let setupBanner = null;
let setupBannerDismissed = false;

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

Object.entries({
    "en": "Click to download and enable on-device language detection",
    "zh-Hans": "点击下载并启用本机语言检测",
    "ja": "クリックして端末内の言語検出をダウンロードして有効にする",
    "ko": "클릭하여 기기 내 언어 감지 모델을 다운로드하고 사용 설정",
    "th": "คลิกเพื่อดาวน์โหลดและเปิดใช้การตรวจหาภาษาในอุปกรณ์",
    "es": "Haz clic para descargar y activar la detección de idioma en el dispositivo",
    "fr": "Cliquez pour télécharger et activer la détection de langue sur l’appareil",
    "de": "Klicken, um die lokale Spracherkennung herunterzuladen und zu aktivieren",
    "pt": "Clique para baixar e ativar a detecção de idioma no dispositivo",
    "id": "Klik untuk mengunduh dan mengaktifkan deteksi bahasa di perangkat",
    "vi": "Nhấp để tải xuống và bật tính năng nhận diện ngôn ngữ trên thiết bị",
    "ru": "Нажмите, чтобы скачать и включить определение языка на устройстве",
    "ar": "انقر لتنزيل ميزة اكتشاف اللغة على الجهاز وتفعيلها",
    "hi": "डिवाइस पर भाषा पहचान डाउनलोड और चालू करने के लिए क्लिक करें"
}).forEach(([code, text]) => { CONTENT_TEXT[code].downloadDetector = text; });

const SETUP_TEXT_KEYS = ["setupUnsupported", "setupUnavailable", "setupAi", "openSetup", "closeSetup"];
const SETUP_TEXT = {
    en: ["This browser doesn’t support on-device title translation.", "On-device translation is unavailable for some titles. You can use AI translation.", "Set up an AI API key to translate titles.", "Open settings", "Close"],
    "zh-Hans": ["此浏览器不支持本机标题翻译。", "部分标题暂不支持本机翻译，可以改用 AI 翻译。", "配置 AI API 密钥后即可翻译标题。", "打开设置", "关闭"],
    ja: ["このブラウザーは端末内でのタイトル翻訳に対応していません。", "一部のタイトルは端末内で翻訳できません。AI 翻訳をご利用いただけます。", "タイトルを翻訳するには AI API キーを設定してください。", "設定を開く", "閉じる"],
    ko: ["이 브라우저는 기기 내 제목 번역을 지원하지 않습니다.", "일부 제목은 기기에서 번역할 수 없습니다. AI 번역을 사용할 수 있습니다.", "제목을 번역하려면 AI API 키를 설정하세요.", "설정 열기", "닫기"],
    th: ["เบราว์เซอร์นี้ไม่รองรับการแปลชื่อวิดีโอบนอุปกรณ์", "ไม่สามารถแปลชื่อบางรายการบนอุปกรณ์ได้ คุณสามารถใช้การแปลด้วย AI", "ตั้งค่าคีย์ API สำหรับ AI เพื่อแปลชื่อวิดีโอ", "เปิดการตั้งค่า", "ปิด"],
    es: ["Este navegador no admite la traducción de títulos en el dispositivo.", "Algunos títulos no se pueden traducir en el dispositivo. Puedes usar la traducción con IA.", "Configura una clave de API de IA para traducir títulos.", "Abrir ajustes", "Cerrar"],
    fr: ["Ce navigateur ne prend pas en charge la traduction des titres sur l’appareil.", "Certains titres ne peuvent pas être traduits sur l’appareil. Vous pouvez utiliser la traduction par IA.", "Configurez une clé d’API d’IA pour traduire les titres.", "Ouvrir les réglages", "Fermer"],
    de: ["Dieser Browser unterstützt keine Titelübersetzung auf dem Gerät.", "Einige Titel lassen sich auf dem Gerät nicht übersetzen. Du kannst die KI-Übersetzung nutzen.", "Hinterlege einen KI-API-Schlüssel, um Titel zu übersetzen.", "Einstellungen öffnen", "Schließen"],
    pt: ["Este navegador não oferece tradução de títulos no dispositivo.", "Alguns títulos não podem ser traduzidos no dispositivo. Você pode usar a tradução por IA.", "Configure uma chave de API de IA para traduzir títulos.", "Abrir configurações", "Fechar"],
    id: ["Browser ini tidak mendukung terjemahan judul di perangkat.", "Sebagian judul tidak dapat diterjemahkan di perangkat. Anda dapat menggunakan terjemahan AI.", "Atur kunci API AI untuk menerjemahkan judul.", "Buka setelan", "Tutup"],
    vi: ["Trình duyệt này không hỗ trợ dịch tiêu đề trên thiết bị.", "Một số tiêu đề không thể dịch trên thiết bị. Bạn có thể dùng tính năng dịch bằng AI.", "Thiết lập khóa API AI để dịch tiêu đề.", "Mở cài đặt", "Đóng"],
    ru: ["Этот браузер не поддерживает перевод заголовков на устройстве.", "Некоторые заголовки нельзя перевести на устройстве. Можно воспользоваться переводом с ИИ.", "Настройте ключ API для ИИ, чтобы переводить заголовки.", "Открыть настройки", "Закрыть"],
    ar: ["هذا المتصفح لا يدعم ترجمة العناوين على الجهاز.", "لا يمكن ترجمة بعض العناوين على الجهاز. يمكنك استخدام الترجمة بالذكاء الاصطناعي.", "أعدّ مفتاح واجهة برمجة التطبيقات للذكاء الاصطناعي لترجمة العناوين.", "فتح الإعدادات", "إغلاق"],
    hi: ["यह ब्राउज़र डिवाइस पर शीर्षकों के अनुवाद की सुविधा नहीं देता।", "कुछ शीर्षकों का अनुवाद डिवाइस पर संभव नहीं है। आप AI अनुवाद का इस्तेमाल कर सकते हैं।", "शीर्षकों का अनुवाद करने के लिए AI की API कुंजी सेट करें।", "सेटिंग खोलें", "बंद करें"]
};
for (const [code, values] of Object.entries(SETUP_TEXT)) {
    SETUP_TEXT_KEYS.forEach((key, index) => { CONTENT_TEXT[code][key] = values[index]; });
}

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

console.log("🚀 Gary插件 v8.2.0 已启动");

// 页面只保留本页热缓存；持久化与跨标签页查询由 SW 管理。
const CACHE_LIMIT = 2000;
const CACHE_LOOKUP_LIMIT = 200;
const translationCache = new Map();
let cacheSaveTimer = null;
const pendingCacheEntries = new Map();
const touchedCacheKeys = new Set();
let cacheClearedAt = 0;
let localCacheEpoch = 0;

function getCacheKey(text, lang, mode = TRANSLATION_MODE, scope = aiCacheScope) {
    const prefix = `${mode}\n${lang || TARGET_LANGUAGE}\n`;
    return mode === "ai" && scope ? `${prefix}${scope}\n${text}` : prefix + text;
}

function normalizeCachedResult(value) {
    if (!value) return null;
    const translatedTitle = value.translatedTitle || value.cn;
    if (typeof translatedTitle !== "string" || !translatedTitle.trim()) return null;
    return { tag: value.tag || "其它", translatedTitle };
}

function getLookupKeys(text) {
    const key = getCacheKey(text);
    return TRANSLATION_MODE === "ai" && aiCacheScope && aiCacheScope === legacyAiCacheScope
        ? [key, getCacheKey(text, TARGET_LANGUAGE, "ai", "")] : [key];
}

function cacheGet(text) {
    for (const key of getLookupKeys(text)) {
        const stored = translationCache.get(key);
        const value = normalizeCachedResult(stored);
        if (!value) continue;
        translationCache.delete(key);
        translationCache.set(key, stored);
        touchedCacheKeys.add(key);
        if (touchedCacheKeys.size > 300) touchedCacheKeys.delete(touchedCacheKeys.values().next().value);
        return value;
    }
    return null;
}

function rememberCacheEntry(key, value) {
    translationCache.delete(key);
    translationCache.set(key, value);
    while (translationCache.size > CACHE_LIMIT) translationCache.delete(translationCache.keys().next().value);
}

function cacheSet(text, result, lang, scope = aiCacheScope, requestStartedAt = Math.max(Date.now(), cacheClearedAt + 1)) {
    const key = getCacheKey(text, lang, result.tag === "__builtin__" ? "local" : "ai", scope);
    const value = { tag: result.tag, translatedTitle: result.translatedTitle, ts: requestStartedAt, requestStartedAt };
    rememberCacheEntry(key, value);
    pendingCacheEntries.set(key, value);
    scheduleCacheSave();
}

async function lookupCache(keys) {
    const epoch = localCacheEpoch;
    const hits = new Map();
    for (let offset = 0; offset < keys.length && epoch === localCacheEpoch; offset += CACHE_LOOKUP_LIMIT) {
        const batch = keys.slice(offset, offset + CACHE_LOOKUP_LIMIT);
        let reply;
        try { reply = await chrome.runtime.sendMessage({ type: "cacheLookup", keys: batch }); }
        catch (e) { break; }
        if (epoch !== localCacheEpoch) return new Map();
        if (!reply?.ok || !Array.isArray(reply.hits)) continue;
        const requested = new Set(batch);
        for (const [key, value] of reply.hits) {
            if (!requested.has(key) || !normalizeCachedResult(value) || (cacheClearedAt && !(value.ts > cacheClearedAt))) continue;
            hits.set(key, value);
            if (!translationCache.has(key)) rememberCacheEntry(key, value);
        }
    }
    return hits;
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
    const epoch = localCacheEpoch;
    let reply = null;
    try { reply = await chrome.runtime.sendMessage({ type: "cachePut", entries: fresh, touched }); } catch (e) { /* 上下文失效 */ }
    if ((reply && reply.ok) || epoch !== localCacheEpoch) return;
    // 后台没确认落盘：留到下一次写入时一起重发。不单独起定时器，避免后台持续失败时空转；
    // 期间被清掉的缓存不重发，积压上限 500 条。
    for (const [key, value] of fresh) {
        if (value.ts > cacheClearedAt && !pendingCacheEntries.has(key)) pendingCacheEntries.set(key, value);
    }
    while (pendingCacheEntries.size > 500) pendingCacheEntries.delete(pendingCacheEntries.keys().next().value);
}

function scheduleCacheSave() {
    if (cacheSaveTimer) clearTimeout(cacheSaveTimer);
    cacheSaveTimer = setTimeout(flushCacheWrites, 500);
}

let ENABLED = true;

// 兼容仍向单测辅助函数传入旧存储结构的调用方。
function getActiveTranslationConfig(result) {
    const { translationMode: mode, configured, batchSize, cacheScope } = buildPublicConfig(result, getBrowserLanguage());
    return { mode, config: { configured, batchSize }, cacheScope };
}

function applyConfigFromStorage(result) {
    const configIdentity = () => JSON.stringify([ENABLED, TARGET_LANGUAGE, UI_LANGUAGE, TRANSLATION_MODE,
        USER_CONFIG, aiCacheScope, displayPreferences]);
    const previous = configIdentity();
    const config = typeof result.configured === "boolean" ? result : buildPublicConfig(result, getBrowserLanguage());
    ENABLED = config.enabled !== false;
    TARGET_LANGUAGE = config.targetLanguage;
    UI_LANGUAGE = config.uiLanguage;
    TRANSLATION_MODE = config.translationMode;
    USER_CONFIG = { configured: config.configured, batchSize: config.batchSize };
    aiCacheScope = config.cacheScope;
    displayPreferences = getDisplayPreferences(config);
    // 无 scope 的旧条目只供页面首次遇到的 AI 模型使用。
    if (aiCacheScope && legacyAiCacheScope === null) legacyAiCacheScope = aiCacheScope;
    if (previous !== configIdentity()) translationGeneration++;
}

function clearPageCache(clearedAt) {
    if (!(clearedAt > cacheClearedAt)) return;
    cacheClearedAt = clearedAt;
    localCacheEpoch++;
    translationCache.clear();
    pendingCacheEntries.clear();
    touchedCacheKeys.clear();
    if (cacheSaveTimer) clearTimeout(cacheSaveTimer);
    cacheSaveTimer = null;
}

function initConfig() {
    let receivedUpdate = false;
    chrome.runtime.onMessage?.addListener(msg => {
        if (msg?.type === "cacheCleared") clearPageCache(msg.clearedAt);
        if (msg?.type !== "configUpdated" || !msg.config) return;
        receivedUpdate = true;
        const wasEnabled = ENABLED;
        const generation = translationGeneration;
        applyConfigFromStorage(msg.config);
        setupBanner?.remove();
        setupBanner = null;
        setupBannerDismissed = false;
        CONFIG_READY = true;
        if (wasEnabled === ENABLED) {
            // 凭证或端点变更也会通知页面，即使这次公开配置内容相同。
            if (generation === translationGeneration) translationGeneration++;
            resetAllRenderedTranslations();
        } else if (!ENABLED) {
            resetAllRenderedTranslations();
        }
        if (ENABLED) scheduleProcess();
    });

    const finish = reply => {
        if (reply?.ok) clearPageCache(reply.cacheClearedAt);
        if (!receivedUpdate) applyConfigFromStorage(reply?.ok && reply.config ? reply.config : {});
        CONFIG_READY = true;
        scheduleProcess();
    };
    try {
        chrome.runtime.sendMessage({ type: "getPageBootstrap" }, reply => {
            finish(chrome.runtime.lastError ? null : reply);
        });
    } catch (e) { finish(null); }
}

// --- UI 创建函数 ---
function showSetupBanner(reason) {
    if (setupBannerDismissed || setupBanner?.isConnected || !document.body) return;
    const banner = document.createElement("aside");
    banner.className = "gary-setup-banner";
    banner.dir = UI_LANGUAGE === "ar" ? "rtl" : "ltr";
    banner.lang = UI_LANGUAGE;
    const message = document.createElement("span");
    message.textContent = getText(reason);
    message.setAttribute("role", "status");
    const open = document.createElement("button");
    open.type = "button";
    open.textContent = getText("openSetup");
    open.addEventListener("click", () => {
        try {
            chrome.runtime.sendMessage({ type: "openSetup" })?.catch?.(() => {});
        } catch (e) { /* The extension may have been reloaded. */ }
    });
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = getText("closeSetup");
    close.addEventListener("click", () => {
        setupBannerDismissed = true;
        banner.remove();
        setupBanner = null;
    });
    banner.appendChild(message);
    banner.appendChild(open);
    banner.appendChild(close);
    document.body.appendChild(banner);
    setupBanner = banner;
}

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
    setBadgeState(container, state);
    if (!displayPreferences.showTags) container.classList.add("gary-hide-tags");
    if (displayPreferences.bilingualOrder === "original-first") container.classList.add("gary-original-first");
    if (isMainTitle) container.classList.add('gary-main-title-box');
    setBoxTooltip(container, originalText, statusText);

    const tagSpan = document.createElement('span');
    tagSpan.className = 'gary-tag';
    tagSpan.textContent = tagText;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'gary-cn-title';
    titleSpan.textContent = translatedText;

    const originalFirst = displayPreferences.bilingualOrder === "original-first";
    let originalLine;
    if (isMainTitle) {
        originalLine = document.createElement('div');
        originalLine.className = 'gary-original-title';
        originalLine.textContent = originalText;
        if (originalFirst) container.appendChild(originalLine);
    }
    container.appendChild(tagSpan);
    container.appendChild(titleSpan);
    if (originalLine && !originalFirst) container.appendChild(originalLine);

    return container;
}

function setBadgeState(box, state) {
    box.dataset.garyState = state;
    if (state === "error" || state === "download") {
        box.tabIndex = 0;
        box.setAttribute("role", "button");
    } else {
        if (box.tagName === "A" || box.hasAttribute("role")) box.tabIndex = -1;
        box.removeAttribute("role");
    }
}

// 渲染辅助函数（批量翻译走相同的成功/失败渲染路径）
// dataset.garyState：pending（排队/翻译中）、done、error、download。
function renderStatus(box, tagText, translatedText, statusText) {
    setBadgeState(box, "pending");
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
    setBadgeState(box, "done");
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

function safeErrorCode(error) {
    const raw = typeof error?.detail === "string" ? error.detail : "";
    return /^[A-Za-z0-9_-]{1,40}$/.test(raw) ? raw : "";
}

function renderError(box, error) {
    setBadgeState(box, "error");
    const tag = box.querySelector('.gary-tag');
    const title = box.querySelector('.gary-cn-title');
    const reason = getFriendlyErrorText(error);
    const failedPrefix = getTargetText("failedPrefix");
    const code = safeErrorCode(error);
    if (tag)   { tag.classList.add('gary-error');   tag.textContent = "❌"; }
    if (title) { title.classList.add('gary-error'); title.textContent = `${failedPrefix}: ${reason}`; }
    setBoxTooltip(box, box.dataset.garyOriginal || "", `${failedPrefix}: ${reason}${code ? ` [${code}]` : ""}\n${getText("retryHint")}`);
}

// --- 内置翻译兜底（Chrome 138+ Translator / LanguageDetector，设备端、无需 Key） ---
// 在本机模式启用：用 LanguageDetector 判源语言，Translator 按语言对翻译。
// 没有分类能力，tag 统一用 "__builtin__"（TAG_LABELS 里有对应本地化标签"本机/On-device"）。
const BUILTIN_TAG = "__builtin__";
let builtinDetectorPromise = null;
let builtinDetectorAvailability = null;
const detectorDownloadBoxes = new Set();
const builtinTranslators = new Map();
const builtinPairAvailability = new Map();
const builtinDownloadBoxes = new Set();

function builtinApiExists() {
    return typeof Translator !== "undefined" && typeof LanguageDetector !== "undefined";
}

function createBuiltinDetector() {
    if (builtinDetectorPromise) return builtinDetectorPromise;
    let creating;
    try { creating = LanguageDetector.create(); }
    catch (e) { creating = Promise.reject(e); }
    builtinDetectorPromise = Promise.resolve(creating)
        .then(detector => {
            if (!detector) throw new Error("Language detector unavailable");
            builtinDetectorAvailability = null;
            return detector;
        })
        .catch(e => {
            console.warn("[Gary] LanguageDetector 创建失败:", e);
            builtinDetectorPromise = null;
            builtinDetectorAvailability = e.name === "NotAllowedError" ? Promise.resolve("downloadable") : null;
            throw e;
        });
    return builtinDetectorPromise;
}

async function getBuiltinDetector() {
    if (builtinDetectorPromise) return { detector: await builtinDetectorPromise };
    if (typeof LanguageDetector.availability === "function") {
        builtinDetectorAvailability ??= Promise.resolve().then(() => LanguageDetector.availability());
        let state;
        try { state = await builtinDetectorAvailability; }
        catch (e) { builtinDetectorAvailability = null; throw e; }
        if (builtinDetectorPromise) return { detector: await builtinDetectorPromise };
        if (state !== "available") return { state };
    } else if (builtinDetectorAvailability && await builtinDetectorAvailability === "downloadable") {
        return { state: "downloadable" };
    }
    return { detector: await createBuiltinDetector() };
}

async function readBuiltinSource(text) {
    try {
        const { detector, state } = await getBuiltinDetector();
        if (!detector) return { state };
        const results = await detector.detect(text);
        const pick = results?.find(item => item?.detectedLanguage && item.detectedLanguage !== "und" &&
            !/-latn$/i.test(item.detectedLanguage));
        let source = pick?.detectedLanguage || results?.[0]?.detectedLanguage;
        if ((!source || source === "und" || /-latn$/i.test(source)) && isLikelyEnglishTitle(text)) source = "en";
        return source ? { source } : { state: "error", errorName: "EmptyDetection" };
    } catch (e) {
        return { state: e.name === "NotAllowedError" ? "downloadable" : "error", errorName: e?.name || "DetectorError" };
    }
}

async function detectSourceLanguage(text) {
    return (await readBuiltinSource(text)).source || null;
}

function inferScriptSourceLanguage(text) {
    const languages = getDetectedLanguages(text);
    if (languages.has("ja")) return "ja";
    if (languages.has("ko")) return "ko";
    if (languages.has("th")) return "th";
    if (languages.has("ru")) return "ru";
    if (languages.has("ar")) return "ar";
    if (languages.has("hi")) return "hi";
    if (languages.has("en") && (!languages.has("zh") || !hasChineseTextBalance(text))) return "en";
    if (languages.has("zh") && hasChineseTextBalance(text)) return "zh";
    return null;
}

function builtinLanguageCode(language) {
    const raw = String(language || "").trim();
    const script = getChineseScript(raw);
    if (script === "zh-hans") return "zh";
    if (script === "zh-hant") return "zh-Hant";
    return raw.toLowerCase().split("-")[0] || raw;
}

function getBuiltinPairKey(source, target) {
    return `${builtinLanguageCode(source)}→${builtinLanguageCode(target)}`;
}

function getBuiltinPairAvailability(source, target) {
    const key = getBuiltinPairKey(source, target);
    if (!builtinPairAvailability.has(key)) {
        builtinPairAvailability.set(key, Promise.resolve().then(() => Translator.availability({
            sourceLanguage: builtinLanguageCode(source), targetLanguage: builtinLanguageCode(target)
        })).catch(() => "unavailable"));
    }
    return builtinPairAvailability.get(key);
}

function createBuiltinTranslatorSession(source, target) {
    const key = getBuiltinPairKey(source, target);
    if (!builtinTranslators.has(key)) {
        let creation;
        try { creation = Translator.create({ sourceLanguage: builtinLanguageCode(source), targetLanguage: builtinLanguageCode(target) }); }
        catch (e) {
            console.warn("[Gary] Translator 创建失败:", key, e?.name || "Error", e?.message || e);
            if (e?.name === "NotAllowedError") builtinPairAvailability.delete(key);
            return Promise.resolve({ translator: null, error: e });
        }
        builtinTranslators.set(key, Promise.resolve(creation).then(translator => {
            if (!translator) throw new Error("Translator unavailable");
            builtinPairAvailability.delete(key);
            for (const box of builtinDownloadBoxes) {
                if (!box.isConnected || box.garyGeneration !== translationGeneration) { builtinDownloadBoxes.delete(box); continue; }
                if (box.dataset.garyState === "download" && getBuiltinPairKey(box.dataset.garySource, box.dataset.garyTarget) === key) {
                    translateBuiltinIntoBox(box.dataset.garyOriginal, box, target, source, true);
                }
            }
            return { translator, error: null };
        }).catch(e => {
            console.warn("[Gary] Translator 创建失败:", key, e?.name || "Error", e?.message || e);
            builtinTranslators.delete(key);
            if (e?.name === "NotAllowedError") builtinPairAvailability.delete(key);
            return { translator: null, error: e };
        }));
    }
    return builtinTranslators.get(key);
}

async function getBuiltinTranslator(source, target) {
    return (await createBuiltinTranslatorSession(source, target)).translator;
}

// 语言是否相同：source 是检测器给的 BCP47（如 en/zh），target 是我们的目标码（如 zh-Hans）
function getChineseScript(language) {
    const code = language.toLowerCase();
    if (/^zh-(hans|cn|sg)(-|$)/.test(code)) return "zh-hans";
    if (/^zh-(hant|tw|hk|mo)(-|$)/.test(code)) return "zh-hant";
    return "";
}

const CHINESE_SCRIPT_MARKERS = {
    "zh-hans": /[这们说话语书车门东长见开关过进还没让认该给对视频测发网电买卖听]/,
    "zh-hant": /[這們說話讓該給對學頻國發網賣聽體灣麼裡]/
};

function oppositeChineseScript(script) {
    if (script === "zh-hans") return "zh-hant";
    if (script === "zh-hant") return "zh-hans";
    return "";
}

function inferChineseScript(text, targetScript) {
    const opposite = oppositeChineseScript(targetScript);
    if (CHINESE_SCRIPT_MARKERS[opposite]?.test(text)) return opposite;
    const simplified = CHINESE_SCRIPT_MARKERS["zh-hans"].test(text);
    const traditional = CHINESE_SCRIPT_MARKERS["zh-hant"].test(text);
    return simplified === traditional ? "" : simplified ? "zh-hans" : "zh-hant";
}

function isSameLanguage(source, target, text = "") {
    if (!source) return false;
    const s = source.toLowerCase();
    const t = target.toLowerCase();
    if (s.split("-")[0] === "zh" && t.split("-")[0] === "zh") {
        // 简体与繁体中文互通可读，目标为任一中文时均自动跳过中文标题。
        return !text || hasChineseTextBalance(text);
    }
    return s.split("-")[0] === t.split("-")[0];
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
    const generation = translationGeneration;
    if (!isCurrentTitle({ text, el, targetElement }, generation)) return false;
    box.dataset.garyOriginal = text;
    box.dataset.garyNodeId = ensureTitleNodeId(el);
    box.garyTitle = { text, el, targetElement, isMainTitle, owner: scannedTitles.get(el) };
    box.garyGeneration = generation;
    const parent = targetElement.parentElement;
    if (!parent) return false;
    try {
        const originalFirst = displayPreferences.bilingualOrder === "original-first";
        parent.insertBefore(box, originalFirst && !isMainTitle ? targetElement.nextSibling : targetElement);
        if (isMainTitle) targetElement.classList.add('gary-original-source-hidden');
        else if (!originalFirst) el.classList.add('gary-en-sub');
    } catch (e) { return false; }

    if (box.tagName === "A") {
        const refreshHref = () => { box.href = targetElement.href; };
        for (const event of ["pointerdown", "mousedown", "auxclick", "contextmenu"]) box.addEventListener(event, refreshHref);
    }
    box.onclick = (e) => {
        // 失败状态：点击 = 重试翻译（灰色的原文链接仍可正常点击跳转）
        if (["error", "download"].includes(box.dataset.garyState)) {
            e.preventDefault();
            if (!isCurrentBox(box, box.garyTitle, generation)) return;
            if (box.dataset.garyDownloadKind === "detector") retryBuiltinDetector(box);
            else if (USER_CONFIG.configured) translateChunk([{ text, box, el, targetElement }]);
            else translateBuiltinIntoBox(text, box, box.dataset.garyTarget || TARGET_LANGUAGE,
                box.dataset.garySource || inferScriptSourceLanguage(text), box.dataset.garyState === "download");
            return;
        }
        if (box.tagName === 'A' && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || (e.button != null && e.button !== 0))) return;
        e.preventDefault();
        const link = !isMainTitle && targetElement.closest("a");
        (link || el).click();
    };
    box.addEventListener("auxclick", e => {
        if (["error", "download"].includes(box.dataset.garyState)) box.onclick(e);
    });
    box.addEventListener("keydown", e => {
        if (["error", "download"].includes(box.dataset.garyState) && (e.key === "Enter" || e.key === " ")) {
            if (e.repeat) e.preventDefault();
            else box.onclick(e);
        }
    });
    return true;
}

function renderDetectorDownload(box) {
    const label = getText("downloadDetector");
    renderStatus(box, localizeTag(BUILTIN_TAG), label, label);
    setBadgeState(box, "download");
    box.dataset.garyDownloadKind = "detector";
    detectorDownloadBoxes.add(box);
    // A scan can finish using the earlier availability while a download completes.
    builtinDetectorPromise?.then(() => resumeDetectorDownloads(), () => {});
}

function resumeDetectorDownloads() {
    for (const box of detectorDownloadBoxes) {
        detectorDownloadBoxes.delete(box);
        if (isCurrentBox(box, box.garyTitle, box.garyGeneration)) {
            processBuiltinCandidate({ ...box.garyTitle, box });
        }
    }
    scheduleProcess();
}

function retryBuiltinDetector(box) {
    const pending = createBuiltinDetector();
    detectorDownloadBoxes.add(box);
    renderStatus(box, localizeTag(BUILTIN_TAG), getText("translatingTitle"), getText("translatingStatus"));
    pending.then(resumeDetectorDownloads, error => {
        if (!isCurrentBox(box, box.garyTitle, box.garyGeneration)) return;
        if (error.name === "NotAllowedError") renderDetectorDownload(box);
        else {
            recordLocalMetric(false, "detector");
            renderError(box, { type: "local", detail: error?.name || "DetectorError" });
            showSetupBanner("setupUnavailable");
        }
    });
}

function renderDownload(box, source, target) {
    box.dataset.garySource = source;
    box.dataset.garyTarget = target;
    box.garyGeneration = translationGeneration;
    let language = source;
    try { language = new Intl.DisplayNames([UI_LANGUAGE], { type:"language" }).of(source) || source; } catch (e) {}
    const title = getText("downloadLanguagePack").replace("{language}", language);
    renderStatus(box, localizeTag(BUILTIN_TAG), title, title);
    setBadgeState(box, "download");
    builtinDownloadBoxes.add(box);
    // 该语言对的翻译器可能正在创建或刚创建完（扫描与下载完成交错）：接在同一个 Promise 上补译，
    // 不能只靠创建完成时那一次遍历。
    const creating = builtinTranslators.get(getBuiltinPairKey(source, target));
    if (creating) creating.then(outcome => {
        if (outcome?.translator && box.isConnected && box.dataset.garyState === "download" && box.garyGeneration === translationGeneration) {
            translateBuiltinIntoBox(box.dataset.garyOriginal, box, target, source, true);
        }
    });
}

function recordLocalMetric(ok, errorType) {
    const message = ok ? { type: "recordLocalMetric", ok } : { type: "recordLocalMetric", ok, errorType };
    try { chrome.runtime.sendMessage(message)?.catch?.(() => {}); }
    catch (e) { /* Metrics must never interrupt translation. */ }
}

async function translateBuiltinIntoBox(text, box, requestLanguage, source, downloading = false) {
    const generation = box.garyGeneration ?? translationGeneration;
    if (!isCurrentBox(box, box.garyTitle, generation)) return;
    const requestCacheEpoch = localCacheEpoch;
    const requestStartedAt = Math.max(Date.now(), cacheClearedAt + 1);
    renderStatus(box, localizeTag(BUILTIN_TAG), getText("translatingTitle"), getText("translatingStatus"));
    let translatedTitle;
    try {
        // Download clicks already know the source. Call create before any awaited detection.
        source = source || await detectSourceLanguage(text) || inferScriptSourceLanguage(text);
        const session = source ? await createBuiltinTranslatorSession(source, requestLanguage) : { translator: null, error: null };
        const { translator, error } = session;
        if (!translator) {
            if (error?.name === "NotAllowedError") {
                recordLocalMetric(false, "notAllowed");
                if (isCurrentBox(box, box.garyTitle, generation)) renderDownload(box, source, requestLanguage);
                return;
            }
            if (error?.name === "NotSupportedError") {
                if (isCurrentBox(box, box.garyTitle, generation)) {
                    const { el, targetElement } = box.garyTitle || {};
                    discardBox(box);
                    el?.classList.remove("gary-en-sub");
                    targetElement?.classList.remove("gary-original-source-hidden");
                    showSetupBanner("setupUnavailable");
                }
                return;
            }
            recordLocalMetric(false, "translator");
            if (isCurrentBox(box, box.garyTitle, generation)) {
                if (downloading) renderDownload(box, source, requestLanguage);
                else {
                    renderError(box, { type: "local", detail: error?.name || "TranslatorUnavailable" });
                    showSetupBanner("setupUnavailable");
                }
            }
            return;
        }
        builtinDownloadBoxes.delete(box);
        translatedTitle = await translator.translate(text);
    } catch (e) {
        console.warn("[Gary] 本机翻译执行失败:", `${source || "?"}→${requestLanguage}`, e?.name || "Error", e?.message || e);
        if (source && ["InvalidStateError", "UnknownError", "OperationError"].includes(e?.name)) {
            builtinTranslators.delete(getBuiltinPairKey(source, requestLanguage));
        }
        recordLocalMetric(false, e.name === "NotAllowedError" ? "notAllowed" : "translator");
        if (isCurrentBox(box, box.garyTitle, generation)) {
            if (e.name === "NotAllowedError") renderDownload(box, source, requestLanguage);
            else {
                renderError(box, { type: "local", detail: e?.name || "TranslateError" });
                showSetupBanner("setupUnavailable");
            }
        }
        return;
    }
    if (translatedTitle) {
        recordLocalMetric(true);
        if (isCurrentBox(box, box.garyTitle, generation)) renderSuccess(box, { tag: BUILTIN_TAG, translatedTitle });
        if (requestCacheEpoch === localCacheEpoch) {
            cacheSet(text, { tag: BUILTIN_TAG, translatedTitle }, requestLanguage, "", requestStartedAt);
        }
    } else {
        recordLocalMetric(false, "translator");
        if (isCurrentBox(box, box.garyTitle, generation)) renderError(box, { type: "local", detail: "EmptyTranslation" });
    }
}

// 无 Key 用户的内置翻译流程：先判源语言和语言对可用性，再决定渲染哪种 badge
async function processBuiltinCandidate({ text, el, targetElement, isMainTitle, box, cached }) {
    const requestLanguage = TARGET_LANGUAGE;
    const generation = translationGeneration;
    const cacheEpoch = localCacheEpoch;
    const candidate = { text, el, targetElement };
    const owner = scannedTitles.get(el);
    const isCurrent = () => {
        if (box) return isCurrentBox(box, candidate, generation);
        if (isCurrentTitle(candidate, generation) && scannedTitles.get(el) === owner) return true;
        if (owner && scannedTitles.get(el) === owner) abandonedTitles.add(el);
        return false;
    };
    const detection = await readBuiltinSource(text);
    if (!isCurrent()) return;
    let source = detection.source;
    if (source === "und" || (!source && detection.state === "error")) {
        source = inferScriptSourceLanguage(text) || (source === "und" ? null : source);
    }
    if (source?.toLowerCase().split("-")[0] === "zh" && !hasChineseTextBalance(text) && isLikelyEnglishTitle(text)) source = "en";
    if (isSameLanguage(source, requestLanguage, text) || shouldSkipSource(source, requestLanguage, text)) {
        skipDuplicateTranslation({ ...candidate, box });
        return;
    }
    if (cached && cacheEpoch === localCacheEpoch) {
        const cachedBox = createSafeBadge(localizeTag(cached.tag), cached.translatedTitle, isMainTitle,
            text, getText("cachedStatus"), "done", targetElement);
        attachTitleBadge(el, targetElement, isMainTitle, cachedBox, text);
        return;
    }
    if (source?.toLowerCase() === "zh") source = inferChineseScript(text, getChineseScript(requestLanguage)) || source;
    const availability = source ? await getBuiltinPairAvailability(source, requestLanguage) : detection.state;
    if (!isCurrent()) return;
    if (availability === "unavailable") {
        if (box) {
            discardBox(box);
            el.classList.remove("gary-en-sub");
            targetElement.classList.remove("gary-original-source-hidden");
        }
        showSetupBanner("setupUnavailable");
        return;
    }
    if (!box) {
        box = createSafeBadge(localizeTag(BUILTIN_TAG), getText("translatingTitle"), isMainTitle, text, getText("translatingStatus"), "pending", targetElement);
        if (!attachTitleBadge(el, targetElement, isMainTitle, box, text)) return;
    }
    if (!source) {
        box.dataset.garyDownloadKind = "detector";
        if (["downloadable", "downloading"].includes(availability)) renderDetectorDownload(box);
        else {
            recordLocalMetric(false, "detector");
            renderError(box, { type: "local", detail: detection.errorName || "DetectorError" });
            showSetupBanner("setupUnavailable");
        }
        return;
    }
    delete box.dataset.garyDownloadKind;
    box.dataset.garySource = source;
    box.dataset.garyTarget = requestLanguage;
    if (["downloadable", "downloading"].includes(availability)) renderDownload(box, source, requestLanguage);
    else translateBuiltinIntoBox(text, box, requestLanguage, source);
}

// --- 页面扫描 + 批量翻译 ---
const PRIORITY_VIEWPORT_MARGIN = 320;
let titleNodeIdCounter = 0;
const scannedTitles = new WeakMap();
const abandonedTitles = new WeakSet();

function isNearViewport(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    return rect.bottom >= -PRIORITY_VIEWPORT_MARGIN &&
        rect.top <= window.innerHeight + PRIORITY_VIEWPORT_MARGIN;
}

function getDynamicBatchSize() {
    return USER_CONFIG.batchSize;
}

function getTitleText(el) {
    return (el.textContent || el.innerText || "").trim();
}

function isCurrentTitle({ text, el, targetElement }, generation) {
    return generation === translationGeneration && ENABLED &&
        el.isConnected && targetElement.isConnected && getTitleText(el) === text;
}

function discardBox(box) {
    detectorDownloadBoxes.delete(box);
    builtinDownloadBoxes.delete(box);
    box.remove?.();
}

function isCurrentBox(box, candidate, generation) {
    if (box.isConnected && (candidate?.el ? isCurrentTitle(candidate, generation) : generation === translationGeneration && ENABLED)) {
        return true;
    }
    const owner = box.garyTitle;
    if (owner?.owner && scannedTitles.get(owner.el) === owner.owner && owner.el.dataset.garyOriginal === owner.text) {
        abandonedTitles.add(owner.el);
    }
    discardBox(box);
    return false;
}

function getTitleTarget(el) {
    if (el.matches("h2.slim-video-information-title")) return { targetElement: el, isMainTitle: true };
    if (el.matches('ytd-watch-metadata h1 yt-formatted-string')) {
        const heading = el.closest('h1') || el;
        return { targetElement: heading, isMainTitle: true };
    }
    const link = el.closest('a');
    const insideMobileLink = el.matches("h3.media-item-headline") && link && link !== el;
    return { targetElement: insideMobileLink ? el : link || el, isMainTitle: false };
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
            discardBox(box);
        }
    });
}

function resetTitleProcessingState(el, targetElement) {
    abandonedTitles.delete(el);
    scannedTitles.delete(el);
    removeTranslationBoxesForTitle(el, targetElement);
    el.removeAttribute('data-gary-done');
    el.removeAttribute('data-gary-original');
    delete el.dataset.garyOriginal;
    el.classList.remove('gary-en-sub');
    targetElement.classList.remove('gary-original-source-hidden');
}

function resetAllRenderedTranslations() {
    detectorDownloadBoxes.clear();
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
    if (/\p{Script=Han}/u.test(text)) languages.add("zh");
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
        "changing", "everything", "first", "hello", "inside", "into", "just", "last", "made", "make", "makes",
        "more", "most", "news", "over", "review", "use", "used", "using", "video", "without", "work"
    ]);
    return words.some(word => englishMarkers.has(word));
}

function shouldTranslateTitle(text) {
    const languages = getDetectedLanguages(text);
    if (languages.size === 0) return false;

    if ((TARGET_LANGUAGE === "zh-Hans" || TARGET_LANGUAGE === "zh-Hant") &&
        isChineseTitleForTarget(text, languages)) {
        return false;
    }
    if (languages.size > 1) return true;
    if (languages.has(TARGET_LANGUAGE)) return false;
    return true;
}

function shouldSkipSource(source, target, text) {
    if (!source) return false;
    const base = source.toLowerCase().split("-")[0];
    if (base === "zh") {
        if (isChineseLanguage(target)) return false;
        return displayPreferences.skipLanguages.some(isChineseLanguage) && (!text || hasChineseTextBalance(text));
    }
    return base !== target && displayPreferences.skipLanguages.includes(base);
}

function shouldSkipByScript(text) {
    const languages = getDetectedLanguages(text);
    if (languages.has("ja")) languages.delete("zh"); // Japanese titles can mix kana and kanji.
    const [source] = languages;
    return languages.size === 1 && shouldSkipSource(source, TARGET_LANGUAGE, text);
}

function hasChineseTextBalance(text) {
    const han = (text.match(/\p{Script=Han}/gu) || []).length;
    const latin = (text.match(/\p{Script=Latin}/gu) || []).length;
    return latin === 0 ? han > 0 : han >= 2 && han * 3 >= latin;
}

function isChineseTitleForTarget(text, languages) {
    return languages.has("zh") && [...languages].every(code => ["zh", "latin", "en"].includes(code)) &&
        hasChineseTextBalance(text);
}

function isAmbiguousHanTitle(text) {
    return !!getChineseScript(TARGET_LANGUAGE) && /^\p{Script=Han}+$/u.test(text.replace(/[^\p{L}]/gu, "")) &&
        !inferChineseScript(text);
}

function needsAiLanguageDetection(text, checkFamiliarLanguage) {
    if (isAmbiguousHanTitle(text)) return true;
    const languages = getDetectedLanguages(text);
    if (checkFamiliarLanguage && (languages.size > 1 || languages.has("zh") || languages.has("latin"))) return true;
    return ["en", "es", "fr", "de", "pt", "id", "vi"].includes(TARGET_LANGUAGE) &&
        languages.size > 0 && [...languages].every(code => code === "en" || code === "latin");
}

async function detectAiSourceLanguage(text) {
    try {
        if (typeof LanguageDetector !== "undefined") {
            const { detector } = await getBuiltinDetector();
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
    if (box) discardBox(box);
    if (el) {
        el.classList.remove("gary-en-sub");
        el.setAttribute("data-gary-done", "skip");
    }
    if (targetElement) targetElement.classList.remove("gary-original-source-hidden");
}

const SPECIFIC_TITLE_SELECTORS = [
    "#video-title", "#video-title-link", "ytd-watch-metadata h1 yt-formatted-string",
    "yt-lockup-view-model h3 a", "ytm-shorts-lockup-view-model-v2 h3 a", "ytm-shorts-lockup-view-model h3 a",
    "h2.slim-video-information-title", "h3.media-item-headline"
].join(", ");
const VIDEO_CARD_SELECTORS = [
    "ytd-rich-grid-media", "ytd-video-renderer", "ytd-grid-video-renderer", "ytd-compact-video-renderer",
    "ytd-reel-item-renderer", "yt-lockup-view-model", "ytm-shorts-lockup-view-model-v2", "ytm-shorts-lockup-view-model",
    "ytm-video-with-context-renderer", "ytm-compact-video-renderer"
].join(", ");

function isVideoTitle(el) {
    if (!el.matches("h3 a") || el.matches(SPECIFIC_TITLE_SELECTORS) || el.closest(VIDEO_CARD_SELECTORS)) return true;
    try {
        const href = new URL(el.getAttribute("href"), "https://www.youtube.com");
        return ["https:", "http:"].includes(href.protocol) && ["www.youtube.com", "m.youtube.com"].includes(href.hostname) &&
            (href.pathname === "/watch" || /^\/(shorts|live)\/[^/]+/.test(href.pathname));
    } catch (e) { return false; }
}

async function process() {
    if (!CONFIG_READY || !ENABLED) return;
    const localAvailable = TRANSLATION_MODE === "local" && builtinApiExists();
    const engineReady = localAvailable || USER_CONFIG.configured;
    const checkFamiliarLanguage = displayPreferences.skipLanguages.some(code =>
        code !== TARGET_LANGUAGE && !(isChineseLanguage(code) && isChineseLanguage(TARGET_LANGUAGE)));
    if (!engineReady) showSetupBanner(TRANSLATION_MODE === "local" ? "setupUnsupported" : "setupAi");
    const matched = new Set();
    for (const el of document.querySelectorAll(`${SPECIFIC_TITLE_SELECTORS}, h3 a`)) {
        if (el.dataset.garyRole === "translation" || el.closest(".gary-cn-box") ||
            el.closest("ytd-comments, ytd-comment-renderer, ytd-comment-thread-renderer, ytm-comments-entry-point-header-renderer, ytm-comment-renderer, ytm-comment-thread-renderer, #comments") ||
            !isVideoTitle(el)) continue;
        matched.add(el);
    }
    const duplicateParents = new Set();
    for (const el of matched) {
        for (let parent = el.parentElement; parent; parent = parent.parentElement) {
            if (matched.has(parent)) duplicateParents.add(parent);
        }
    }
    const titles = new Map();
    for (const el of matched) {
        if (duplicateParents.has(el)) continue;
        const link = el.closest("a");
        const key = link || el;
        // 外层链接和标题同时命中时，保留内层标题作为文本来源。
        if (!titles.has(key) || el !== link) titles.set(key, el);
    }

    const pendingBatch = [];        // 缓存未命中、需要发 API 的项 [{text, box}]
    const aiDetections = [];
    const builtinCandidates = [];   // 浏览器支持内置翻译的项

    const missingCandidates = [];
    const missingKeys = new Set();
    const generation = translationGeneration;

    const handleCandidate = (candidate, cached) => {
        const { text, el, targetElement, isMainTitle } = candidate;
        if (scannedTitles.get(el) !== candidate) return;
        if (!isCurrentTitle(candidate, generation)) {
            if (el.dataset.garyOriginal === text) resetTitleProcessingState(el, targetElement);
            return;
        }
        if (localAvailable && (!cached || checkFamiliarLanguage)) {
            builtinCandidates.push({ ...candidate, cached });
            return;
        }
        if (!cached && !engineReady) return;

        const renderCandidate = () => {
            if (!isCurrentTitle(candidate, generation) || scannedTitles.get(el) !== candidate) return;
            if (cached && TRANSLATION_MODE === "ai" && isUnchangedTranslation(text, cached.translatedTitle)) {
                skipDuplicateTranslation({ el, targetElement });
                return;
            }
            const box = createSafeBadge(cached ? localizeTag(cached.tag) : getText("queuedTag"),
                cached ? cached.translatedTitle : getText("queuedTitle"), isMainTitle, text,
                getText(cached ? "cachedStatus" : "queuedStatus"), cached ? "done" : "pending", targetElement);
            if (!attachTitleBadge(el, targetElement, isMainTitle, box, text)) return;

            if (cached) return;

            pendingBatch.push({ text, box, el, targetElement, generation: translationGeneration });
        };
        if ((!cached || checkFamiliarLanguage) && USER_CONFIG.configured &&
            needsAiLanguageDetection(text, checkFamiliarLanguage)) {
            const target = TARGET_LANGUAGE;
            const cacheEpoch = localCacheEpoch;
            aiDetections.push((async () => {
                const source = await detectAiSourceLanguageWithTimeout(text);
                if (scannedTitles.get(el) !== candidate) return;
                if (!isCurrentTitle(candidate, generation)) {
                    if (el.dataset.garyOriginal === text) resetTitleProcessingState(el, targetElement);
                    return;
                }
                if (isSameLanguage(source, target, text) || shouldSkipSource(source, target, text)) {
                    el.setAttribute("data-gary-done", "skip");
                    return;
                }
                // 等待检测期间，本页另一处相同标题可能已完成翻译。
                cached = cacheGet(text) || (localCacheEpoch === cacheEpoch ? cached : null);
                renderCandidate();
            })());
        } else renderCandidate();
    };

    for (const el of titles.values()) {
        const text = getTitleText(el);
        if (!text || text.length < 3) continue;

        const { targetElement, isMainTitle } = getTitleTarget(el);
        const parent = targetElement.parentElement;
        if (!parent) continue;

        if (!el.getAttribute('data-gary-done') && !isNearViewport(targetElement)) continue;

        if (el.getAttribute('data-gary-done')) {
            if (el.dataset.garyOriginal === text && !abandonedTitles.has(el)) continue;
            resetTitleProcessingState(el, targetElement);
        }

        const canDetectHan = isAmbiguousHanTitle(text) && (TRANSLATION_MODE === "local" ? localAvailable :
            USER_CONFIG.configured && (typeof LanguageDetector !== "undefined" || typeof chrome.i18n?.detectLanguage === "function"));
        if ((checkFamiliarLanguage && shouldSkipByScript(text)) || (!shouldTranslateTitle(text) && !canDetectHan)) {
            // 已是目标语言（或无法识别）：打标跳过，后续扫描靠 data-gary-done 直接放行，
            // 不再每次重复跑语言检测正则
            el.setAttribute('data-gary-done', 'skip');
            el.dataset.garyOriginal = text;
            continue;
        }

        el.setAttribute('data-gary-done', 'true');
        el.dataset.garyOriginal = text;
        const candidate = { text, el, targetElement, isMainTitle };
        scannedTitles.set(el, candidate);

        const cached = cacheGet(text);
        if (cached) {
            handleCandidate(candidate, cached);
            continue;
        }
        const lookupKeys = getLookupKeys(text);
        lookupKeys.forEach(key => missingKeys.add(key));
        missingCandidates.push({ candidate, lookupKeys });
    }

    if (missingKeys.size) {
        const cacheEpoch = localCacheEpoch;
        const hits = await lookupCache([...missingKeys]);
        for (const { candidate, lookupKeys } of missingCandidates) {
            const lookupResult = cacheEpoch === localCacheEpoch
                ? lookupKeys.map(key => normalizeCachedResult(hits.get(key))).find(Boolean) : null;
            const cached = generation === translationGeneration ? cacheGet(candidate.text) || lookupResult : null;
            handleCandidate(candidate, cached);
        }
    }

    builtinCandidates.forEach(processBuiltinCandidate);

    const dispatchPending = () => {
        const batchSize = getDynamicBatchSize();
        const ready = pendingBatch.splice(0).filter(item => {
            // 其它标题的检测尚未结束时，较早完成的候选也可能已因配置变化失效。
            if (isCurrentBox(item.box, item, item.generation)) {
                // 排队等其它标题检测的这段时间里，本页其它位置可能已翻好这一条：命中缓存就直接用，不再请求。
                const hit = cacheGet(item.text);
                if (!hit) return true;
                if (isUnchangedTranslation(item.text, hit.translatedTitle)) skipDuplicateTranslation(item);
                else renderSuccess(item.box, hit);
                return false;
            }
            // 不管卡片此刻在不在文档里都要复位：YouTube 会把节点移出再插回，留着标记会永久卡在“排队中”。
            if (scannedTitles.get(item.el) === item.box.garyTitle.owner && item.el.dataset.garyOriginal === item.text) {
                resetTitleProcessingState(item.el, item.targetElement);
            }
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
    const requestScope = aiCacheScope;
    const requestCacheEpoch = localCacheEpoch;
    const requestStartedAt = Math.max(Date.now(), cacheClearedAt + 1);
    chunk = chunk.filter(p => isCurrentBox(p.box, p, p.generation ?? generation));
    if (!chunk.length) return;
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
            if (isCurrentBox(p.box, p, generation)) renderError(p.box, runtimeError);
        });
        return;
    }

    const wrongScope = reply?.cacheScope !== undefined && reply.cacheScope !== requestScope;
    if (!reply || !Array.isArray(reply.results) || wrongScope) {
        chunk.forEach(p => {
            if (isCurrentBox(p.box, p, generation)) renderError(p.box, reply && reply.error);
        });
        return;
    }

    chunk.forEach((p, i) => {
        const result = reply.results[i];
        if (result && result.tag && result.translatedTitle) {
            if (isCurrentBox(p.box, p, generation)) {
                if (isUnchangedTranslation(p.text, result.translatedTitle)) skipDuplicateTranslation(p);
                else renderSuccess(p.box, result);
            }
            if (requestCacheEpoch === localCacheEpoch) cacheSet(p.text, result, requestLanguage, requestScope, requestStartedAt);
        } else {
            const itemError = Array.isArray(reply.errors) ? reply.errors[i] : null;
            if (isCurrentBox(p.box, p, generation)) renderError(p.box, itemError || reply.error);
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
    const root = document.querySelector('ytd-app, ytm-app') || document.body;
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
        getBrowserDefaultLanguages, getBrowserLanguage, flushCacheWrites, lookupCache,
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
