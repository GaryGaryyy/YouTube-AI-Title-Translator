# 8.1.0

- 移除中文标题屏蔽规则，标题统一按语言与翻译配置处理。
- 服务商精简为 OpenAI / Claude / DeepSeek / 自定义 OpenAI 兼容端点；下线预设自动迁移，保留已有 custom 配置，保存后重新授权。
- 更新 OpenAI、Claude 模型及推理参数；预设中已移除的旧模型回落到推荐项。
- 本机语言包显示点击下载提示，成功后自动重试同语言对的其他标题。
- 自动翻译由后台读取凭证，页面消息不再携带 API Key、端点或模型；仅注入 www.youtube.com 与 m.youtube.com。
- 首次安装打开引导页确认目标语言，更新多语言说明与项目链接。

验证范围：OpenAI / Claude 的新模型参数未用真实 Key 实测，仅 DeepSeek 实测。

## English

- Removed Chinese-target title filtering; all titles follow the same language and translation rules.
- Retained OpenAI / Claude / DeepSeek / custom OpenAI-compatible endpoints. Retired presets migrate without overwriting existing custom settings; save to authorize access again.
- Updated OpenAI and Claude models and reasoning parameters; obsolete preset models fall back to the recommended model.
- Added click-to-download language packs and automatic retries for other titles using the same language pair.
- Automatic translation reads credentials in the background; page messages no longer carry keys, endpoints, or models. Injection is limited to www.youtube.com and m.youtube.com.
- First installation opens a welcome page to confirm the target language; localized documentation and project links are updated.

Validation scope: the new OpenAI / Claude model parameters have not been tested with real API keys; only DeepSeek has been tested with a real key.

## 已知限制 / Known limitation

- 原 Gemini、MiniMax、Z.AI、Kimi 用户会被转为“自定义端点”，Key 会保留。自定义端点只发送通用的 OpenAI 兼容参数，不再包含这些服务商的专属参数适配，个别模型（例如 Kimi K2.6）可能因此验证失败，需要改用 OpenAI、Claude、DeepSeek 或其它兼容端点。
- Former Gemini, MiniMax, Z.AI and Kimi users are moved to "Custom endpoint" with their key kept. Custom endpoints only receive generic OpenAI-compatible parameters; provider-specific tuning was removed, so some models (for example Kimi K2.6) may fail verification. Switch to OpenAI, Claude, DeepSeek or another compatible endpoint.
