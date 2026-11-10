// Only the old Chrome Web Store listing receives this one-time migration update.
(function (factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    else api.start(globalThis);
})(function () {
    "use strict";
    const LEGACY_ID = "gjhklbipjkngmefflhbajmfnhkagbbcj";
    const OFFICIAL_ID = "bhajnflcikmidmdalnjhknillnkaojhk";
    const OFFICIAL_URL = "https://chromewebstore.google.com/detail/" + OFFICIAL_ID;
    const SNOOZE_KEY = "legacyMigrationReminderAfter";
    const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
    const HOST_ID = "ytatt-legacy-migration-notice";
    const COPY = {
        en: ["This extension has moved", "Future updates will be in the official listing. Install and set it up, then remove this old extension to avoid translating twice.", "Open official listing", "Your API key and settings do not transfer automatically. Enter them again in the official extension.", "Remind me in 7 days", "Could not save the reminder. Please try again."],
        "zh-Hans": ["请切换到正式版", "后续更新将在正式条目提供。安装并完成设置后，请移除旧版，避免重复翻译。", "前往正式版", "Key 和设置不会自动转移，需在正式版重新填写。", "7 天后提醒", "无法保存提醒时间，请重试。"],
        "zh-Hant": ["請切換到正式版", "後續更新將在正式項目提供。安裝並完成設定後，請移除舊版，避免重複翻譯。", "前往正式版", "Key 和設定不會自動轉移，需在正式版重新填寫。", "7 天後提醒", "無法儲存提醒時間，請重試。"],
        ja: ["正式版へ移行してください", "今後の更新は正式版で提供します。インストールと設定を済ませてから、この旧版を削除し、翻訳の重複を防いでください。", "正式版を開く", "API キーと設定は自動で移行されません。正式版で再入力してください。", "7 日後に通知", "通知日時を保存できませんでした。もう一度お試しください。"],
        ko: ["정식 버전으로 이동해 주세요", "앞으로의 업데이트는 정식 버전에서 제공됩니다. 설치와 설정을 마친 후 이 이전 버전을 삭제해 중복 번역을 방지하세요.", "정식 버전 보기", "API 키와 설정은 자동으로 이전되지 않습니다. 정식 버전에서 다시 입력해 주세요.", "7일 후 알림", "알림 시간을 저장하지 못했습니다. 다시 시도해 주세요."],
        th: ["โปรดย้ายไปใช้รุ่นทางการ", "การอัปเดตต่อไปจะอยู่ในรุ่นทางการ หลังติดตั้งและตั้งค่าแล้ว โปรดลบส่วนขยายรุ่นเก่านี้เพื่อหลีกเลี่ยงการแปลซ้ำ", "ไปยังรุ่นทางการ", "คีย์ API และการตั้งค่าจะไม่ถูกย้ายโดยอัตโนมัติ โปรดกรอกอีกครั้งในรุ่นทางการ", "เตือนอีกครั้งใน 7 วัน", "บันทึกเวลาเตือนไม่สำเร็จ โปรดลองอีกครั้ง"],
        es: ["Pásate a la versión oficial", "Las próximas actualizaciones estarán en la versión oficial. Instálala y configúrala; después elimina esta extensión antigua para evitar traducciones duplicadas.", "Ver versión oficial", "La clave API y los ajustes no se transfieren automáticamente. Vuelve a introducirlos en la versión oficial.", "Recordar en 7 días", "No se pudo guardar el recordatorio. Inténtalo de nuevo."],
        fr: ["Passez à la version officielle", "Les prochaines mises à jour seront disponibles dans la version officielle. Installez-la et configurez-la, puis supprimez cette ancienne extension pour éviter les traductions en double.", "Voir la version officielle", "Votre clé API et vos réglages ne sont pas transférés automatiquement. Saisissez-les à nouveau dans la version officielle.", "Rappeler dans 7 jours", "Impossible d’enregistrer le rappel. Réessayez."],
        de: ["Zur offiziellen Version wechseln", "Künftige Updates erhalten Sie in der offiziellen Version. Installieren und konfigurieren Sie diese, und entfernen Sie dann die alte Erweiterung, um doppelte Übersetzungen zu vermeiden.", "Offizielle Version öffnen", "API-Schlüssel und Einstellungen werden nicht automatisch übertragen. Geben Sie diese in der offiziellen Version erneut ein.", "In 7 Tagen erinnern", "Die Erinnerung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."],
        pt: ["Mude para a versão oficial", "As próximas atualizações estarão na versão oficial. Instale-a e configure-a; depois remova esta extensão antiga para evitar traduções duplicadas.", "Abrir versão oficial", "A chave API e as configurações não são transferidas automaticamente. Insira-as novamente na versão oficial.", "Lembrar em 7 dias", "Não foi possível salvar o lembrete. Tente novamente."],
        id: ["Beralih ke versi resmi", "Pembaruan berikutnya tersedia di versi resmi. Instal dan atur versi tersebut, lalu hapus ekstensi lama ini agar terjemahan tidak muncul dua kali.", "Buka versi resmi", "Kunci API dan pengaturan tidak dipindahkan secara otomatis. Masukkan kembali di versi resmi.", "Ingatkan dalam 7 hari", "Pengingat tidak dapat disimpan. Silakan coba lagi."],
        vi: ["Chuyển sang phiên bản chính thức", "Các bản cập nhật tiếp theo sẽ có ở phiên bản chính thức. Hãy cài đặt và thiết lập, rồi xóa tiện ích cũ này để tránh dịch hai lần.", "Mở phiên bản chính thức", "Khóa API và cài đặt không tự động chuyển sang. Hãy nhập lại trong phiên bản chính thức.", "Nhắc sau 7 ngày", "Không thể lưu lời nhắc. Vui lòng thử lại."],
        ru: ["Перейдите на официальную версию", "Следующие обновления будут доступны в официальной версии. Установите и настройте её, затем удалите это старое расширение, чтобы избежать двойного перевода.", "Открыть официальную версию", "Ключ API и настройки не переносятся автоматически. Введите их заново в официальной версии.", "Напомнить через 7 дней", "Не удалось сохранить напоминание. Попробуйте ещё раз."],
        ar: ["انتقل إلى الإصدار الرسمي", "ستتوفر التحديثات القادمة في الإصدار الرسمي. ثبّته وأكمل الإعداد، ثم أزل هذه الإضافة القديمة لتجنب ترجمة العناوين مرتين.", "فتح الإصدار الرسمي", "لا يُنقل مفتاح API والإعدادات تلقائيًا. أدخلها من جديد في الإصدار الرسمي.", "ذكّرني بعد 7 أيام", "تعذّر حفظ موعد التذكير. حاول مرة أخرى."],
        hi: ["आधिकारिक संस्करण पर जाएँ", "आगे के अपडेट आधिकारिक संस्करण में मिलेंगे। उसे इंस्टॉल करके सेटअप पूरा करें, फिर दोहरे अनुवाद से बचने के लिए यह पुराना एक्सटेंशन हटाएँ।", "आधिकारिक संस्करण खोलें", "API कुंजी और सेटिंग अपने आप स्थानांतरित नहीं होतीं। आधिकारिक संस्करण में उन्हें फिर से दर्ज करें।", "7 दिन बाद याद दिलाएँ", "रिमाइंडर सहेजा नहीं जा सका। कृपया फिर से कोशिश करें।"]
    };
    const CSS = `
        :host { all:initial; display:block; color-scheme:light; --text:#18202b; --muted:#626b78; --surface:#fff; --border:#dce0e7; --accent:#d9153c; --tint:#fff1f4; font:13px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; }
        :host([data-context="page"]) { position:fixed; inset-inline-end:20px; bottom:20px; width:360px; max-width:calc(100vw - 32px); z-index:2147483646; }
        :host([data-context="popup"]) { margin-bottom:16px; }
        :host([hidden]) { display:none !important; }
        * { box-sizing:border-box; } section { max-height:calc(100vh - 40px); overflow:auto; padding:16px; border:1px solid var(--border); border-top:3px solid var(--accent); border-radius:12px; background:var(--surface); color:var(--text); box-shadow:0 8px 28px #0002; }
        :host([data-context="popup"]) section { max-height:none; box-shadow:none; }
        h2 { margin:0; font:700 15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; }
        p { margin:8px 0; overflow-wrap:anywhere; } .detail { color:var(--muted); font-size:11px; }
        .actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-top:12px; }
        a,button { min-height:36px; padding:7px 12px; border-radius:7px; font:600 12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; text-align:center; cursor:pointer; }
        a { display:inline-block; color:#fff; background:#d9153c; border:1px solid #d9153c; text-decoration:none; }
        a:hover { background:#b90c31; } button { border:1px solid var(--border); background:var(--surface); color:var(--muted); }
        button:disabled { opacity:.6; cursor:wait; } a:focus-visible,button:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
        .error { color:var(--accent); font-size:12px; } .error:empty { display:none; }
        @media (prefers-color-scheme:dark) { :host { color-scheme:dark; --text:#f0f2f6; --muted:#b5bdca; --surface:#20242c; --border:#414958; --accent:#ff5478; } }
    `;
    function resolveLanguage(value) {
        if (typeof value !== "string") return "en";
        const normalized = value.replace(/_/g, "-");
        if (COPY[normalized]) return normalized;
        if (/^zh-(TW|HK|MO|Hant)/i.test(normalized)) return "zh-Hant";
        if (/^zh/i.test(normalized)) return "zh-Hans";
        const short = normalized.split("-")[0].toLowerCase();
        return COPY[short] ? short : "en";
    }
    function isSnoozed(value, now) {
        return typeof value === "number" && Number.isFinite(value) && value > now && value <= now + SNOOZE_MS;
    }
    function start(env) {
        // Loading this file in the official listing can never show a migration reminder.
        if (env.chrome?.runtime?.id !== LEGACY_ID || !env.document) return null;
        const doc = env.document;
        const popup = env.location?.protocol === "chrome-extension:" && env.location?.pathname === "/popup.html";
        let host = null;
        let language = "en";
        let snooze = 0;
        let initialized = false;
        const now = () => (env.Date || Date).now();
        function remove() { if (host) host.remove(); host = null; }
        function render() {
            if (!initialized || (!popup && isSnoozed(snooze, now()))) { remove(); return; }
            remove();
            if (doc.getElementById(HOST_ID)) return;
            const parent = popup ? doc.querySelector(".app-shell main") || doc.body : doc.body;
            if (!parent) return;
            const copy = COPY[language];
            host = doc.createElement("div");
            host.id = HOST_ID;
            host.setAttribute("data-context", popup ? "popup" : "page");
            host.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
            host.setAttribute("lang", language);
            const shadow = host.attachShadow({ mode:"open" });
            const style = doc.createElement("style"); style.textContent = CSS;
            const section = doc.createElement("section");
            section.setAttribute("role", "region"); section.setAttribute("aria-label", copy[0]);
            const title = doc.createElement("h2"); title.textContent = copy[0];
            const body = doc.createElement("p"); body.textContent = copy[1];
            const detail = doc.createElement("p"); detail.className = "detail"; detail.textContent = copy[3];
            const actions = doc.createElement("div"); actions.className = "actions";
            const link = doc.createElement("a");
            link.textContent = copy[2]; link.href = OFFICIAL_URL;
            link.target = "_blank"; link.rel = "noopener noreferrer";
            actions.appendChild(link);
            const error = doc.createElement("p"); error.className = "error";
            error.setAttribute("role", "status");
            if (!popup) {
                const later = doc.createElement("button");
                later.type = "button"; later.textContent = copy[4];
                later.addEventListener("click", () => {
                    later.disabled = true;
                    const after = now() + SNOOZE_MS;
                    try {
                        env.chrome.storage.local.set({ [SNOOZE_KEY]:after }, () => {
                            if (env.chrome.runtime.lastError) { error.textContent = copy[5]; later.disabled = false; return; }
                            snooze = after; remove();
                        });
                    } catch (_) { error.textContent = copy[5]; later.disabled = false; }
                });
                actions.appendChild(later);
            }
            section.append(title, body, detail, actions, error);
            shadow.append(style, section);
            if (popup) parent.prepend(host); else parent.appendChild(host);
            if (!popup) host.hidden = Boolean(doc.fullscreenElement);
        }
        function ready() {
            const fallback = env.chrome.i18n?.getUILanguage?.() || env.navigator?.language || "en";
            language = resolveLanguage(fallback);
            env.chrome.storage.onChanged.addListener((changes, area) => {
                if (area !== "local") return;
                let changed = false;
                if (changes.uiLanguage) { language = resolveLanguage(changes.uiLanguage.newValue || fallback); changed = true; }
                if (changes[SNOOZE_KEY]) { snooze = changes[SNOOZE_KEY].newValue; changed = true; }
                if (changed) render();
            });
            if (!popup) doc.addEventListener("fullscreenchange", () => { if (host) host.hidden = Boolean(doc.fullscreenElement); });
            try {
                // Never read a key, provider configuration, or title from either extension.
                env.chrome.storage.local.get(["uiLanguage", SNOOZE_KEY], values => {
                    if (!env.chrome.runtime.lastError) {
                        language = resolveLanguage(values?.uiLanguage || fallback);
                        snooze = values?.[SNOOZE_KEY];
                    }
                    initialized = true; render();
                });
            } catch (_) { initialized = true; render(); }
        }
        if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", ready, { once:true });
        else ready();
        return { remove };
    }
    return { LEGACY_ID, OFFICIAL_ID, OFFICIAL_URL, SNOOZE_KEY, SNOOZE_MS, COPY, resolveLanguage, isSnoozed, start };
});
