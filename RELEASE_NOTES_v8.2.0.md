# 8.2.0

## 中文

- **v8.1.1 翻译稳定性**。首次使用时可以点击下载本机语言检测器和语言包，准备完成后自动补译。AI 批量响应缺项时仅重试缺失标题。请求共享并发限制，并遵循服务商的 `Retry-After` 冷却时间。
- **安全和架构**。扩展本地存储仅向受信任的扩展环境开放。YouTube 页面脚本从后台接收公开配置，后台负责设置迁移、请求校验和分桶缓存的串行写入。缓存按语言、模式和 AI 配置区分，清除缓存后，旧请求不会重新写入。改进桌面及移动 YouTube 标题和 Shorts 的识别，减少混合语言及页面卡片复用造成的误译。
- **首次使用**。重塑欢迎页三步引导（选语言并按需「下载本机语言包」 → 对称双卡工具栏固定引导 → 本机 vs AI 效果对比与打开 YouTube），支持 14 国界面语言自动适配与切换。浏览器、语言检测器或语言对不可用时，页面用一条可关闭的提示引导用户打开设置。下载和重试提示可以通过 Enter 或空格触发。
- **日常控制与新版弹窗**。全新卡片分组式弹窗设置页；彻底移除本机翻译模式的无意义「本机」标签及开关，仅在 AI 翻译模式保留智能内容分类标签与开关；简体中文与繁体中文默认互通自动跳过，不再互相翻译；在「更多设置」可切换原文与译文顺序，或设置除目标语言外额外跳过的熟悉语言。使用 `Alt+Shift+T` 快捷键可一键暂停或恢复当前浏览器内所有 YouTube 标签页的翻译。
- **本机统计与诊断**。扩展只在本机记录翻译次数、错误类别和最多 30 个活跃日期，用于诊断及判断何时显示可永久关闭的商店评分入口。达到 50 次成功翻译并在至少 3 天使用后，评分入口才会出现。复制的诊断包含版本、脱敏设置、缓存条目数和聚合统计。统计与诊断不会上传，也不会记录标题、网址或 API 密钥。

验证范围：OpenAI / Claude 的新模型参数未用真实 Key 实测，仅 DeepSeek 实测。v8.2.0 的自动化测试使用模拟的浏览器和服务商接口。

## English

- **v8.1.1 translation reliability.** Click to download the on-device language detector and language packs. Affected titles resume when the downloads finish. AI batches retry missing translations individually, share a request concurrency limit, and respect the provider’s `Retry-After` cooldown.
- **Security and architecture.** Extension storage is limited to trusted extension contexts. YouTube page scripts receive public settings from the background worker, which also handles settings migration, validates requests, and serializes writes to the sharded cache. Cache entries are scoped by language, mode, and AI configuration. Results from older requests cannot repopulate a cleared cache. Desktop and mobile title selection, Shorts detection, and handling of mixed-language and reused cards are improved.
- **First use.** Redesigned the 3-step welcome guide (pick a language with an on-demand "Download language pack" button → symmetrical two-card toolbar pin guide → on-device vs AI comparison card and Open YouTube CTA), with automatic adaptation and manual switching across 14 UI languages. If the browser, language detector, or language pair is unavailable, a dismissible banner offers a shortcut to settings. Press Enter or Space on a download or retry badge to activate it.
- **Everyday controls & redesigned popup.** Refreshed the popup with clean grouped cards. Removed the redundant "On-device" tag and toggle from on-device mode altogether — topic tags remain exclusively for AI mode. Simplified and Traditional Chinese automatically skip each other. In More settings, swap original/translated title order or choose additional familiar languages to skip (your target language is always skipped automatically). Press `Alt+Shift+T` to pause or resume translation across YouTube tabs in the current browser.
- **Local usage stats and diagnostics.** The extension keeps translation counts, error categories, and up to 30 active dates locally for diagnostics and a dismissible store rating link. The link becomes eligible after 50 successful translations and at least 3 active days. Copied diagnostics include the version, sanitized settings, cache size, and aggregate stats. Stats and diagnostics stay on the device and contain no titles, URLs, or API keys.

Validation scope. The new OpenAI and Claude model parameters were not tested with real API keys. DeepSeek was the only provider tested with a real key. The v8.2.0 automated tests use simulated browser and provider APIs.
