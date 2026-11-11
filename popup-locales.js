// Reviewed copy for the compact popup. Keep each locale explicit so new UI never falls back to English.
(function (root) {
    const text = {
        en: {
            providerRetired:"This provider preset has been retired and converted to a custom endpoint. Click Save to authorize access again.",
            appTitle:"YouTube Title Translator", brandSubtitle:"Bilingual titles · Explore more", masterLabel:"Translate", modeLocal:"On-device", modeAi:"AI translation",
            uiLanguageLabel:"Switch interface text", targetLanguageLabel:"Translate titles into", targetLanguageHint:"For YouTube video titles", feedback:"Feedback", supportDeveloper:"Support",
            testAndSave:"Verify & save", saveOnly:"Save without verification", saveOnlyHint:"Skips the test and applies this configuration.",
            privacyNote:"Key stays local · Developer collects no data", privacyLocalNote:"On-device translation · Developer collects no data", privacyTitle:"Privacy details",
            privacyDetailsAi:"Keys and settings are stored in this browser. AI translation and configuration tests send title text and the credentials needed for the API call directly to your chosen provider. That provider processes them under its own privacy policy. The developer collects no data.",
            privacyDetailsLocal:"On-device translation runs on your device and does not send titles to an AI provider. Keys and settings remain in this browser. The developer collects no data. Chrome may download language packs on first use.",
            testFailExtension:"Could not contact the extension background. Reload the extension and try again.", testFailEmpty:"The provider returned no translation. Try again or choose another model.", testFailResponse:"The model returned an unexpected format. Try a recommended model.", testFailService:"The provider could not complete the request. Check its service status and try again.",
            changesNotSaved:"Changes were not saved. Your previous settings are still in use.", diagnosticLabel:"Diagnostic details", diagnosticTypeLabel:"Type", diagnosticHttpLabel:"HTTP status", verifiedSaved:"Verified and saved. Settings apply to open YouTube pages."
        },
        "zh-Hans": {
            providerRetired:"该服务商已下线预设，已转为自定义端点，请点击保存以重新授权。",
            appTitle:"YouTube 标题翻译", brandSubtitle:"双语标题 · 轻松看懂全球内容", masterLabel:"自动翻译", modeLocal:"本机翻译", modeAi:"AI 翻译",
            uiLanguageLabel:"切换界面文字", targetLanguageLabel:"标题翻译为", targetLanguageHint:"用于 YouTube 视频标题", feedback:"反馈", supportDeveloper:"支持",
            testAndSave:"验证并保存", saveOnly:"跳过验证保存", saveOnlyHint:"不验证可用性，直接保存并应用配置。",
            privacyNote:"Key 仅本机保存 · 开发者不收集任何数据", privacyLocalNote:"本机翻译 · 开发者不收集任何数据", privacyTitle:"隐私说明",
            privacyDetailsAi:"Key 和设置保存在当前浏览器。使用 AI 翻译或主动验证配置时，标题及调用所需凭证会直接发送给你选择的服务商，由该服务商按其隐私政策处理。开发者不收集任何数据。",
            privacyDetailsLocal:"本机翻译在设备上完成，标题不会发送给 AI 服务商。Key 和设置保存在当前浏览器，开发者不收集任何数据。首次使用可能需要 Chrome 下载语言包。",
            testFailExtension:"无法连接扩展后台，请重新加载扩展后重试。", testFailEmpty:"服务商返回了空内容，未收到译文。请重试或切换模型。", testFailResponse:"模型返回的格式不正确，请尝试推荐模型。", testFailService:"服务商未能完成请求，请检查其服务状态后重试。",
            changesNotSaved:"当前更改未保存；原设置仍在使用。", diagnosticLabel:"诊断详情", diagnosticTypeLabel:"错误类型", diagnosticHttpLabel:"HTTP 状态", verifiedSaved:"已验证并保存，设置会应用到已打开的 YouTube 页面。"
        },
        ja: {
            providerRetired:"このプロバイダーのプリセットは終了し、カスタムエンドポイントに移行しました。保存をクリックしてアクセスを再許可してください。",
            appTitle:"YouTube タイトル翻訳", brandSubtitle:"二言語のタイトル · 世界の動画を楽しむ", masterLabel:"自動翻訳", modeLocal:"端末内翻訳", modeAi:"AI 翻訳",
            uiLanguageLabel:"表示する言語を切り替え", targetLanguageLabel:"タイトルの翻訳先", targetLanguageHint:"YouTube 動画のタイトルに適用", feedback:"ご意見", supportDeveloper:"支援",
            testAndSave:"確認して保存", saveOnly:"確認せずに保存", saveOnlyHint:"動作確認を省略して設定を保存・適用します。",
            privacyNote:"キーは端末内に保存 · 開発者はデータを収集しません", privacyLocalNote:"端末内翻訳 · 開発者はデータを収集しません", privacyTitle:"プライバシーについて",
            privacyDetailsAi:"キーと設定はこのブラウザーに保存されます。AI 翻訳や設定の動作確認では、タイトルと API 呼び出しに必要な認証情報を選択したプロバイダーに直接送信します。プロバイダーは自身のプライバシーポリシーに従って処理します。開発者はデータを収集しません。",
            privacyDetailsLocal:"端末内翻訳はお使いの端末で実行され、タイトルを AI プロバイダーに送信しません。キーと設定はこのブラウザーに保存されます。開発者はデータを収集しません。初回は Chrome が言語パックをダウンロードする場合があります。",
            testFailExtension:"拡張機能のバックグラウンドに接続できません。拡張機能を再読み込みしてお試しください。", testFailEmpty:"プロバイダーから翻訳が返されませんでした。再試行するか、別のモデルを選んでください。", testFailResponse:"モデルの応答形式が正しくありません。推奨モデルをお試しください。", testFailService:"プロバイダーがリクエストを処理できませんでした。サービスの状態を確認して再試行してください。",
            changesNotSaved:"変更は保存されていません。これまでの設定が引き続き使われます。", diagnosticLabel:"診断の詳細", diagnosticTypeLabel:"種類", diagnosticHttpLabel:"HTTP ステータス", verifiedSaved:"動作を確認して保存しました。開いている YouTube ページに適用されます。"
        },
        ko: {
            providerRetired:"이 제공업체의 프리셋이 종료되어 사용자 지정 엔드포인트로 전환되었습니다. 저장을 눌러 접근 권한을 다시 허용하세요.",
            appTitle:"YouTube 제목 번역", brandSubtitle:"두 언어로 제목 보기 · 세계의 영상 즐기기", masterLabel:"자동 번역", modeLocal:"기기 내 번역", modeAi:"AI 번역",
            uiLanguageLabel:"화면 표시 언어 변경", targetLanguageLabel:"제목을 번역할 언어", targetLanguageHint:"YouTube 동영상 제목에 적용", feedback:"의견", supportDeveloper:"후원",
            testAndSave:"확인 후 저장", saveOnly:"확인 없이 저장", saveOnlyHint:"작동 확인을 건너뛰고 설정을 저장하여 적용합니다.",
            privacyNote:"키는 기기에 저장 · 개발자는 데이터를 수집하지 않음", privacyLocalNote:"기기 내 번역 · 개발자는 데이터를 수집하지 않음", privacyTitle:"개인정보 처리 안내",
            privacyDetailsAi:"키와 설정은 이 브라우저에 저장됩니다. AI 번역이나 설정 확인 시 제목과 API 호출에 필요한 인증 정보가 선택한 제공업체로 직접 전송됩니다. 제공업체는 자체 개인정보 처리방침에 따라 이를 처리합니다. 개발자는 데이터를 수집하지 않습니다.",
            privacyDetailsLocal:"기기 내 번역은 사용자의 기기에서 실행되며 제목을 AI 제공업체로 전송하지 않습니다. 키와 설정은 이 브라우저에 저장됩니다. 개발자는 데이터를 수집하지 않습니다. 처음 사용하면 Chrome이 언어 팩을 다운로드할 수 있습니다.",
            testFailExtension:"확장 프로그램의 백그라운드에 연결할 수 없습니다. 확장 프로그램을 새로고침한 후 다시 시도하세요.", testFailEmpty:"제공업체에서 번역을 반환하지 않았습니다. 다시 시도하거나 다른 모델을 선택하세요.", testFailResponse:"모델의 응답 형식이 올바르지 않습니다. 권장 모델을 사용해 보세요.", testFailService:"제공업체가 요청을 처리하지 못했습니다. 서비스 상태를 확인한 후 다시 시도하세요.",
            changesNotSaved:"변경 사항이 저장되지 않았습니다. 이전 설정을 계속 사용합니다.", diagnosticLabel:"진단 정보", diagnosticTypeLabel:"유형", diagnosticHttpLabel:"HTTP 상태", verifiedSaved:"작동을 확인하고 저장했습니다. 열려 있는 YouTube 페이지에 적용됩니다."
        },
        th: {
            providerRetired:"ค่าที่ตั้งไว้ของผู้ให้บริการนี้ถูกยกเลิกและเปลี่ยนเป็นปลายทางกำหนดเองแล้ว คลิกบันทึกเพื่ออนุญาตการเข้าถึงอีกครั้ง",
            appTitle:"แปลชื่อวิดีโอ YouTube", brandSubtitle:"ชื่อวิดีโอสองภาษา · รับชมได้ทั่วโลก", masterLabel:"แปลอัตโนมัติ", modeLocal:"บนอุปกรณ์", modeAi:"แปลด้วย AI",
            uiLanguageLabel:"เปลี่ยนภาษาที่แสดง", targetLanguageLabel:"แปลชื่อวิดีโอเป็น", targetLanguageHint:"ใช้กับชื่อวิดีโอ YouTube", feedback:"ข้อเสนอแนะ", supportDeveloper:"สนับสนุน",
            testAndSave:"ตรวจสอบและบันทึก", saveOnly:"บันทึกโดยไม่ตรวจสอบ", saveOnlyHint:"ข้ามการทดสอบแล้วบันทึกและใช้การตั้งค่านี้",
            privacyNote:"เก็บคีย์ในเครื่อง · ผู้พัฒนาไม่เก็บข้อมูล", privacyLocalNote:"แปลบนอุปกรณ์ · ผู้พัฒนาไม่เก็บข้อมูล", privacyTitle:"รายละเอียดความเป็นส่วนตัว",
            privacyDetailsAi:"คีย์และการตั้งค่าจะเก็บไว้ในเบราว์เซอร์นี้ การแปลด้วย AI และการตรวจสอบการตั้งค่าจะส่งชื่อวิดีโอและข้อมูลยืนยันตัวตนที่จำเป็นต่อการเรียก API ไปยังผู้ให้บริการที่คุณเลือกโดยตรง ผู้ให้บริการจะประมวลผลตามนโยบายความเป็นส่วนตัวของตน ผู้พัฒนาไม่เก็บข้อมูลใดๆ",
            privacyDetailsLocal:"การแปลบนอุปกรณ์ทำงานในเครื่องของคุณและไม่ส่งชื่อวิดีโอให้ผู้ให้บริการ AI คีย์และการตั้งค่าจะเก็บไว้ในเบราว์เซอร์นี้ ผู้พัฒนาไม่เก็บข้อมูลใดๆ เมื่อใช้ครั้งแรก Chrome อาจดาวน์โหลดชุดภาษา",
            testFailExtension:"ติดต่อระบบเบื้องหลังของส่วนขยายไม่ได้ โปรดโหลดส่วนขยายใหม่แล้วลองอีกครั้ง", testFailEmpty:"ผู้ให้บริการไม่ได้ส่งคำแปลกลับมา โปรดลองอีกครั้งหรือเลือกโมเดลอื่น", testFailResponse:"รูปแบบคำตอบจากโมเดลไม่ถูกต้อง โปรดลองใช้โมเดลที่แนะนำ", testFailService:"ผู้ให้บริการประมวลผลคำขอไม่สำเร็จ โปรดตรวจสอบสถานะบริการแล้วลองอีกครั้ง",
            changesNotSaved:"ยังไม่ได้บันทึกการเปลี่ยนแปลง ระบบยังใช้การตั้งค่าเดิม", diagnosticLabel:"รายละเอียดการวินิจฉัย", diagnosticTypeLabel:"ประเภท", diagnosticHttpLabel:"สถานะ HTTP", verifiedSaved:"ตรวจสอบและบันทึกแล้ว การตั้งค่าจะใช้กับหน้า YouTube ที่เปิดอยู่"
        },
        es: {
            providerRetired:"Este proveedor ya no tiene un ajuste predefinido y se ha convertido en un punto de conexión personalizado. Pulsa Guardar para volver a autorizar el acceso.",
            appTitle:"Traductor de títulos", brandSubtitle:"Títulos bilingües · Descubre más", masterLabel:"Traducir", modeLocal:"En el dispositivo", modeAi:"Traducción IA",
            uiLanguageLabel:"Cambiar el idioma de la interfaz", targetLanguageLabel:"Traducir títulos a", targetLanguageHint:"Para títulos de vídeos de YouTube", feedback:"Comentarios", supportDeveloper:"Apoyar",
            testAndSave:"Verificar y guardar", saveOnly:"Guardar sin verificar", saveOnlyHint:"Omite la prueba y aplica esta configuración.",
            privacyNote:"Clave local · El desarrollador no recopila datos", privacyLocalNote:"Traducción local · El desarrollador no recopila datos", privacyTitle:"Detalles de privacidad",
            privacyDetailsAi:"Las claves y los ajustes se guardan en este navegador. La traducción con IA y las pruebas de configuración envían los títulos y las credenciales necesarias para llamar a la API directamente al proveedor elegido. Este los trata conforme a su política de privacidad. El desarrollador no recopila datos.",
            privacyDetailsLocal:"La traducción se ejecuta en tu dispositivo y no envía títulos a proveedores de IA. Las claves y los ajustes permanecen en este navegador. El desarrollador no recopila datos. Chrome puede descargar paquetes de idiomas la primera vez.",
            testFailExtension:"No se pudo conectar con el proceso en segundo plano de la extensión. Vuelve a cargarla e inténtalo de nuevo.", testFailEmpty:"El proveedor no devolvió ninguna traducción. Inténtalo de nuevo o elige otro modelo.", testFailResponse:"El modelo devolvió un formato inesperado. Prueba un modelo recomendado.", testFailService:"El proveedor no pudo completar la solicitud. Comprueba el estado del servicio e inténtalo de nuevo.",
            changesNotSaved:"Los cambios no se han guardado. Se siguen usando los ajustes anteriores.", diagnosticLabel:"Detalles de diagnóstico", diagnosticTypeLabel:"Tipo", diagnosticHttpLabel:"Estado HTTP", verifiedSaved:"Verificado y guardado. Los ajustes se aplican a las páginas de YouTube abiertas."
        },
        fr: {
            providerRetired:"Ce préréglage de fournisseur a été retiré et converti en point de terminaison personnalisé. Cliquez sur Enregistrer pour autoriser à nouveau l’accès.",
            appTitle:"Traducteur de titres", brandSubtitle:"Titres bilingues · Découvrez plus", masterLabel:"Traduire", modeLocal:"Sur l’appareil", modeAi:"Traduction IA",
            uiLanguageLabel:"Changer la langue de l’interface", targetLanguageLabel:"Traduire les titres en", targetLanguageHint:"Pour les titres des vidéos YouTube", feedback:"Avis", supportDeveloper:"Soutenir",
            testAndSave:"Vérifier et enregistrer", saveOnly:"Enregistrer sans vérifier", saveOnlyHint:"Ignore le test et applique cette configuration.",
            privacyNote:"Clé stockée ici · Aucune collecte par le développeur", privacyLocalNote:"Traduction locale · Aucune collecte par le développeur", privacyTitle:"Détails de confidentialité",
            privacyDetailsAi:"Les clés et les paramètres sont stockés dans ce navigateur. La traduction IA et les tests de configuration envoient les titres et les identifiants nécessaires à l’appel API directement au fournisseur choisi. Celui-ci les traite selon sa propre politique de confidentialité. Le développeur ne collecte aucune donnée.",
            privacyDetailsLocal:"La traduction s’exécute sur votre appareil et n’envoie aucun titre à un fournisseur IA. Les clés et les paramètres restent dans ce navigateur. Le développeur ne collecte aucune donnée. Chrome peut télécharger des packs linguistiques lors de la première utilisation.",
            testFailExtension:"Impossible de joindre le processus en arrière-plan de l’extension. Rechargez l’extension et réessayez.", testFailEmpty:"Le fournisseur n’a renvoyé aucune traduction. Réessayez ou choisissez un autre modèle.", testFailResponse:"Le modèle a renvoyé un format inattendu. Essayez un modèle recommandé.", testFailService:"Le fournisseur n’a pas pu traiter la demande. Vérifiez l’état du service et réessayez.",
            changesNotSaved:"Les modifications n’ont pas été enregistrées. Les paramètres précédents restent actifs.", diagnosticLabel:"Détails du diagnostic", diagnosticTypeLabel:"Type", diagnosticHttpLabel:"Statut HTTP", verifiedSaved:"Vérification réussie et paramètres enregistrés. Ils s’appliquent aux pages YouTube ouvertes."
        },
        de: {
            providerRetired:"Diese Anbietervoreinstellung wurde entfernt und in einen eigenen Endpunkt umgewandelt. Klicken Sie auf Speichern, um den Zugriff erneut zu erlauben.",
            appTitle:"YouTube-Titelübersetzer", brandSubtitle:"Zweisprachige Titel · Mehr entdecken", masterLabel:"Übersetzen", modeLocal:"Auf dem Gerät", modeAi:"KI-Übersetzung",
            uiLanguageLabel:"Sprache der Oberfläche wechseln", targetLanguageLabel:"Titel übersetzen in", targetLanguageHint:"Für YouTube-Videotitel", feedback:"Feedback", supportDeveloper:"Unterstützen",
            testAndSave:"Prüfen und speichern", saveOnly:"Ohne Prüfung speichern", saveOnlyHint:"Überspringt den Test und übernimmt diese Einstellungen.",
            privacyNote:"Schlüssel lokal · Entwickler sammelt keine Daten", privacyLocalNote:"Lokale Übersetzung · Entwickler sammelt keine Daten", privacyTitle:"Datenschutzhinweise",
            privacyDetailsAi:"Schlüssel und Einstellungen werden in diesem Browser gespeichert. KI-Übersetzungen und Konfigurationstests senden Titel und die für den API-Aufruf nötigen Zugangsdaten direkt an den gewählten Anbieter. Dieser verarbeitet sie gemäß seiner eigenen Datenschutzerklärung. Der Entwickler erhebt keine Daten.",
            privacyDetailsLocal:"Die Übersetzung läuft auf Ihrem Gerät und sendet keine Titel an KI-Anbieter. Schlüssel und Einstellungen bleiben in diesem Browser. Der Entwickler erhebt keine Daten. Beim ersten Einsatz kann Chrome Sprachpakete herunterladen.",
            testFailExtension:"Der Hintergrundprozess der Erweiterung ist nicht erreichbar. Laden Sie die Erweiterung neu und versuchen Sie es erneut.", testFailEmpty:"Der Anbieter hat keine Übersetzung zurückgegeben. Versuchen Sie es erneut oder wählen Sie ein anderes Modell.", testFailResponse:"Das Modell hat ein unerwartetes Format zurückgegeben. Versuchen Sie ein empfohlenes Modell.", testFailService:"Der Anbieter konnte die Anfrage nicht verarbeiten. Prüfen Sie den Dienststatus und versuchen Sie es erneut.",
            changesNotSaved:"Die Änderungen wurden nicht gespeichert. Die bisherigen Einstellungen bleiben aktiv.", diagnosticLabel:"Diagnosedetails", diagnosticTypeLabel:"Typ", diagnosticHttpLabel:"HTTP-Status", verifiedSaved:"Geprüft und gespeichert. Die Einstellungen gelten für offene YouTube-Seiten."
        },
        pt: {
            providerRetired:"Esta predefinição foi removida e convertida em um endpoint personalizado. Clique em Salvar para autorizar o acesso novamente.",
            appTitle:"Tradutor de títulos", brandSubtitle:"Títulos bilíngues · Descubra mais", masterLabel:"Traduzir", modeLocal:"No dispositivo", modeAi:"Tradução IA",
            uiLanguageLabel:"Alterar o idioma da interface", targetLanguageLabel:"Traduzir títulos para", targetLanguageHint:"Para títulos de vídeos do YouTube", feedback:"Comentários", supportDeveloper:"Apoiar",
            testAndSave:"Verificar e salvar", saveOnly:"Salvar sem verificar", saveOnlyHint:"Pula o teste e aplica esta configuração.",
            privacyNote:"Chave local · Desenvolvedor não coleta dados", privacyLocalNote:"Tradução local · Desenvolvedor não coleta dados", privacyTitle:"Detalhes de privacidade",
            privacyDetailsAi:"As chaves e as configurações ficam neste navegador. A tradução com IA e os testes de configuração enviam os títulos e as credenciais necessárias para chamar a API diretamente ao provedor escolhido. Ele processa esses dados conforme sua própria política de privacidade. O desenvolvedor não coleta dados.",
            privacyDetailsLocal:"A tradução é executada no seu dispositivo e não envia títulos a provedores de IA. As chaves e as configurações ficam neste navegador. O desenvolvedor não coleta dados. O Chrome pode baixar pacotes de idiomas no primeiro uso.",
            testFailExtension:"Não foi possível acessar o processo em segundo plano da extensão. Recarregue a extensão e tente novamente.", testFailEmpty:"O provedor não retornou uma tradução. Tente novamente ou escolha outro modelo.", testFailResponse:"O modelo retornou um formato inesperado. Tente um modelo recomendado.", testFailService:"O provedor não conseguiu processar a solicitação. Verifique o status do serviço e tente novamente.",
            changesNotSaved:"As alterações não foram salvas. As configurações anteriores continuam em uso.", diagnosticLabel:"Detalhes do diagnóstico", diagnosticTypeLabel:"Tipo", diagnosticHttpLabel:"Status HTTP", verifiedSaved:"Verificado e salvo. As configurações se aplicam às páginas do YouTube abertas."
        },
        id: {
            providerRetired:"Prasetel penyedia ini telah dihentikan dan dialihkan ke endpoint kustom. Klik Simpan untuk mengizinkan akses kembali.",
            appTitle:"Penerjemah judul", brandSubtitle:"Judul dwibahasa · Jelajahi dunia", masterLabel:"Terjemahkan", modeLocal:"Di perangkat", modeAi:"Terjemahan AI",
            uiLanguageLabel:"Ubah bahasa tampilan", targetLanguageLabel:"Terjemahkan judul ke", targetLanguageHint:"Untuk judul video YouTube", feedback:"Masukan", supportDeveloper:"Dukung",
            testAndSave:"Verifikasi dan simpan", saveOnly:"Simpan tanpa verifikasi", saveOnlyHint:"Melewati pengujian dan menerapkan konfigurasi ini.",
            privacyNote:"Kunci lokal · Pengembang tidak mengumpulkan data", privacyLocalNote:"Terjemahan lokal · Pengembang tidak mengumpulkan data", privacyTitle:"Informasi privasi",
            privacyDetailsAi:"Kunci dan pengaturan disimpan di browser ini. Terjemahan AI dan pengujian konfigurasi mengirim judul serta kredensial yang diperlukan untuk memanggil API langsung ke penyedia pilihan Anda. Penyedia memprosesnya sesuai kebijakan privasinya. Pengembang tidak mengumpulkan data.",
            privacyDetailsLocal:"Terjemahan berjalan di perangkat Anda dan tidak mengirim judul ke penyedia AI. Kunci dan pengaturan tetap disimpan di browser ini. Pengembang tidak mengumpulkan data. Chrome mungkin mengunduh paket bahasa saat pertama kali digunakan.",
            testFailExtension:"Tidak dapat terhubung ke proses latar belakang ekstensi. Muat ulang ekstensi dan coba lagi.", testFailEmpty:"Penyedia tidak mengembalikan terjemahan. Coba lagi atau pilih model lain.", testFailResponse:"Model mengembalikan format yang tidak sesuai. Coba model yang direkomendasikan.", testFailService:"Penyedia tidak dapat memproses permintaan. Periksa status layanan dan coba lagi.",
            changesNotSaved:"Perubahan belum disimpan. Pengaturan sebelumnya masih digunakan.", diagnosticLabel:"Detail diagnostik", diagnosticTypeLabel:"Jenis", diagnosticHttpLabel:"Status HTTP", verifiedSaved:"Berhasil diverifikasi dan disimpan. Pengaturan berlaku pada halaman YouTube yang terbuka."
        },
        vi: {
            providerRetired:"Cấu hình sẵn của nhà cung cấp này đã ngừng và được chuyển thành điểm cuối tùy chỉnh. Nhấp Lưu để cấp lại quyền truy cập.",
            appTitle:"Dịch tiêu đề YouTube", brandSubtitle:"Tiêu đề song ngữ · Khám phá thêm", masterLabel:"Tự động dịch", modeLocal:"Trên thiết bị", modeAi:"Dịch bằng AI",
            uiLanguageLabel:"Đổi ngôn ngữ giao diện", targetLanguageLabel:"Dịch tiêu đề sang", targetLanguageHint:"Áp dụng cho tiêu đề video YouTube", feedback:"Góp ý", supportDeveloper:"Ủng hộ",
            testAndSave:"Kiểm tra và lưu", saveOnly:"Lưu không qua kiểm tra", saveOnlyHint:"Bỏ qua bước kiểm tra và áp dụng cấu hình này.",
            privacyNote:"Khóa lưu trên thiết bị · Nhà phát triển không thu thập dữ liệu", privacyLocalNote:"Dịch trên thiết bị · Nhà phát triển không thu thập dữ liệu", privacyTitle:"Thông tin quyền riêng tư",
            privacyDetailsAi:"Khóa và cài đặt được lưu trong trình duyệt này. Khi dịch bằng AI hoặc kiểm tra cấu hình, tiêu đề và thông tin xác thực cần cho lệnh gọi API được gửi trực tiếp đến nhà cung cấp bạn chọn. Nhà cung cấp xử lý theo chính sách quyền riêng tư của họ. Nhà phát triển không thu thập dữ liệu.",
            privacyDetailsLocal:"Bản dịch được xử lý trên thiết bị của bạn và không gửi tiêu đề đến nhà cung cấp AI. Khóa và cài đặt vẫn được lưu trong trình duyệt này. Nhà phát triển không thu thập dữ liệu. Chrome có thể tải gói ngôn ngữ khi dùng lần đầu.",
            testFailExtension:"Không thể kết nối với tiến trình nền của tiện ích. Hãy tải lại tiện ích rồi thử lại.", testFailEmpty:"Nhà cung cấp không trả về bản dịch. Hãy thử lại hoặc chọn mô hình khác.", testFailResponse:"Mô hình trả về định dạng không đúng. Hãy thử mô hình được đề xuất.", testFailService:"Nhà cung cấp không thể xử lý yêu cầu. Hãy kiểm tra trạng thái dịch vụ rồi thử lại.",
            changesNotSaved:"Các thay đổi chưa được lưu. Cài đặt trước đó vẫn được sử dụng.", diagnosticLabel:"Chi tiết chẩn đoán", diagnosticTypeLabel:"Loại", diagnosticHttpLabel:"Trạng thái HTTP", verifiedSaved:"Đã kiểm tra và lưu. Cài đặt áp dụng cho các trang YouTube đang mở."
        },
        ru: {
            providerRetired:"Предустановка этого провайдера удалена и преобразована в собственный адрес API. Нажмите «Сохранить», чтобы снова разрешить доступ.",
            appTitle:"Переводчик заголовков", brandSubtitle:"Два языка · Больше открытий", masterLabel:"Перевод", modeLocal:"На устройстве", modeAi:"ИИ-перевод",
            uiLanguageLabel:"Изменить язык интерфейса", targetLanguageLabel:"Переводить заголовки на", targetLanguageHint:"Для заголовков видео YouTube", feedback:"Отзыв", supportDeveloper:"Поддержка",
            testAndSave:"Проверить и сохранить", saveOnly:"Сохранить без проверки", saveOnlyHint:"Сохраняет и применяет настройки без теста.",
            privacyNote:"Ключ в браузере · Разработчик не собирает данные", privacyLocalNote:"Локальный перевод · Разработчик не собирает данные", privacyTitle:"О конфиденциальности",
            privacyDetailsAi:"Ключи и настройки хранятся в этом браузере. При ИИ-переводе и проверке настроек заголовки и данные авторизации, необходимые для вызова API, отправляются напрямую выбранному провайдеру. Он обрабатывает их по собственной политике конфиденциальности. Разработчик не собирает данные.",
            privacyDetailsLocal:"Перевод выполняется на вашем устройстве, а заголовки не отправляются ИИ-провайдеру. Ключи и настройки остаются в этом браузере. Разработчик не собирает данные. При первом использовании Chrome может скачать языковые пакеты.",
            testFailExtension:"Не удалось связаться с фоновым процессом расширения. Перезагрузите расширение и попробуйте снова.", testFailEmpty:"Провайдер не вернул перевод. Повторите попытку или выберите другую модель.", testFailResponse:"Модель вернула ответ в неожиданном формате. Попробуйте рекомендованную модель.", testFailService:"Провайдер не смог обработать запрос. Проверьте состояние сервиса и повторите попытку.",
            changesNotSaved:"Изменения не сохранены. Прежние настройки остаются в силе.", diagnosticLabel:"Диагностика", diagnosticTypeLabel:"Тип", diagnosticHttpLabel:"Статус HTTP", verifiedSaved:"Проверено и сохранено. Настройки применяются к открытым страницам YouTube."
        },
        ar: {
            providerRetired:"تم إيقاف الإعداد المسبق لهذا المزوّد وتحويله إلى نقطة نهاية مخصصة. انقر على حفظ للسماح بالوصول مجددًا.",
            appTitle:"مترجم عناوين YouTube", brandSubtitle:"عناوين بلغتين · اكتشف المزيد", masterLabel:"ترجمة تلقائية", modeLocal:"على الجهاز", modeAi:"ترجمة بالذكاء الاصطناعي",
            uiLanguageLabel:"تغيير لغة الواجهة", targetLanguageLabel:"ترجمة العناوين إلى", targetLanguageHint:"لعناوين فيديوهات YouTube", feedback:"ملاحظات", supportDeveloper:"دعم",
            testAndSave:"التحقق والحفظ", saveOnly:"الحفظ دون تحقق", saveOnlyHint:"يتخطى الاختبار ويحفظ هذه الإعدادات ويطبقها.",
            privacyNote:"المفتاح محفوظ محليًا · المطوّر لا يجمع أي بيانات", privacyLocalNote:"ترجمة على الجهاز · المطوّر لا يجمع أي بيانات", privacyTitle:"تفاصيل الخصوصية",
            privacyDetailsAi:"تُحفظ المفاتيح والإعدادات في هذا المتصفح. ترسل الترجمة بالذكاء الاصطناعي واختبارات الإعدادات العناوين وبيانات الاعتماد اللازمة لاستدعاء API مباشرة إلى المزوّد الذي تختاره. يعالج المزوّد هذه البيانات وفق سياسة الخصوصية الخاصة به. المطوّر لا يجمع أي بيانات.",
            privacyDetailsLocal:"تعمل الترجمة على جهازك ولا ترسل العناوين إلى مزوّد للذكاء الاصطناعي. تبقى المفاتيح والإعدادات في هذا المتصفح. المطوّر لا يجمع أي بيانات. قد ينزّل Chrome حزم اللغات عند الاستخدام لأول مرة.",
            testFailExtension:"تعذّر الاتصال بعملية الإضافة في الخلفية. أعد تحميل الإضافة وحاول مرة أخرى.", testFailEmpty:"لم يُرجع المزوّد أي ترجمة. حاول مرة أخرى أو اختر نموذجًا آخر.", testFailResponse:"أرجع النموذج تنسيقًا غير متوقع. جرّب نموذجًا موصى به.", testFailService:"لم يتمكن المزوّد من معالجة الطلب. تحقق من حالة الخدمة وحاول مرة أخرى.",
            changesNotSaved:"لم تُحفظ التغييرات. لا تزال الإعدادات السابقة قيد الاستخدام.", diagnosticLabel:"تفاصيل التشخيص", diagnosticTypeLabel:"النوع", diagnosticHttpLabel:"حالة HTTP", verifiedSaved:"تم التحقق والحفظ. تُطبّق الإعدادات على صفحات YouTube المفتوحة."
        },
        hi: {
            providerRetired:"इस प्रदाता की पूर्वनिर्धारित सेटिंग हटा दी गई है और इसे कस्टम API पते में बदल दिया गया है। पहुँच की अनुमति फिर देने के लिए सहेजें पर क्लिक करें।",
            appTitle:"YouTube शीर्षक अनुवादक", brandSubtitle:"दो भाषाओं में शीर्षक · और जानें", masterLabel:"अनुवाद", modeLocal:"डिवाइस पर", modeAi:"AI अनुवाद",
            uiLanguageLabel:"इंटरफ़ेस की भाषा बदलें", targetLanguageLabel:"शीर्षकों का अनुवाद करें", targetLanguageHint:"YouTube वीडियो के शीर्षकों के लिए", feedback:"सुझाव", supportDeveloper:"सहयोग",
            testAndSave:"जाँचें और सहेजें", saveOnly:"बिना जाँच के सहेजें", saveOnlyHint:"जाँच छोड़कर यह सेटिंग सहेजता और लागू करता है।",
            privacyNote:"कुंजी डिवाइस पर सहेजी जाती है · डेवलपर कोई डेटा एकत्र नहीं करता", privacyLocalNote:"डिवाइस पर अनुवाद · डेवलपर कोई डेटा एकत्र नहीं करता", privacyTitle:"गोपनीयता की जानकारी",
            privacyDetailsAi:"कुंजियाँ और सेटिंग इस ब्राउज़र में सहेजी जाती हैं। AI अनुवाद और सेटिंग की जाँच के दौरान शीर्षक तथा API कॉल के लिए ज़रूरी क्रेडेंशियल सीधे आपके चुने हुए प्रदाता को भेजे जाते हैं। प्रदाता उन्हें अपनी गोपनीयता नीति के अनुसार संसाधित करता है। डेवलपर कोई डेटा एकत्र नहीं करता।",
            privacyDetailsLocal:"अनुवाद आपके डिवाइस पर होता है और शीर्षक AI प्रदाता को नहीं भेजे जाते। कुंजियाँ और सेटिंग इस ब्राउज़र में रहती हैं। डेवलपर कोई डेटा एकत्र नहीं करता। पहली बार इस्तेमाल करते समय Chrome भाषा पैक डाउनलोड कर सकता है।",
            testFailExtension:"एक्सटेंशन की बैकग्राउंड प्रक्रिया से संपर्क नहीं हो सका। एक्सटेंशन दोबारा लोड करें और फिर कोशिश करें।", testFailEmpty:"प्रदाता ने कोई अनुवाद नहीं लौटाया। दोबारा कोशिश करें या दूसरा मॉडल चुनें।", testFailResponse:"मॉडल ने अपेक्षित प्रारूप में उत्तर नहीं दिया। सुझाया गया मॉडल आज़माएँ।", testFailService:"प्रदाता अनुरोध पूरा नहीं कर सका। सेवा की स्थिति जाँचें और दोबारा कोशिश करें।",
            changesNotSaved:"बदलाव सहेजे नहीं गए। पिछली सेटिंग अभी भी लागू है।", diagnosticLabel:"समस्या की जानकारी", diagnosticTypeLabel:"प्रकार", diagnosticHttpLabel:"HTTP स्थिति", verifiedSaved:"जाँच पूरी हुई और सेटिंग सहेजी गई। यह खुले YouTube पेजों पर लागू होगी।"
        }
    };
    const verified = {en:"Verified","zh-Hans":"已验证",ja:"確認済み",ko:"확인 완료",th:"ตรวจสอบแล้ว",es:"Verificado",fr:"Vérifié",de:"Geprüft",pt:"Verificado",id:"Terverifikasi",vi:"Đã kiểm tra",ru:"Проверено",ar:"تم التحقق",hi:"जाँच पूरी"};
    Object.entries(verified).forEach(([code, value]) => { text[code].verifiedStatus = value; });
    root.POPUP_REVIEW_TEXT = text;
    if (typeof module !== "undefined" && module.exports) module.exports = text;
})(globalThis);
