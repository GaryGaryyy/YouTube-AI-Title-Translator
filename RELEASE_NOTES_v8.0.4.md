# v8.0.4 更新说明

日期：2026-10-01。8.0.3 已上传，本次使用递增版本号 8.0.4。

## 模型与服务商

每家服务商最多 4 个预设，推荐项排在第一位；继续提供“其他（手动输入模型名）”。推荐依据是短标题翻译的成本、速度与能力取舍，并非通用任务排名。

| 服务商 | 推荐模型 / API ID | 其他预设 API ID |
| --- | --- | --- |
| OpenAI | GPT-6 Luna / `gpt-6-luna` | `gpt-6.1-sol`、`gpt-6-astra` |
| Gemini | Gemini 3.5 Flash-Lite / `gemini-3.5-flash-lite` | `gemini-3.8-flash`、`gemini-3.1-pro-preview`（预览） |
| Claude | Claude Haiku 4.5 / `claude-haiku-4-5-20251001` | `claude-sonnet-5-5`、`claude-opus-5-5`、`claude-fable-5-1` |
| DeepSeek | DeepSeek V4.1 Flash / `deepseek-flash` | `deepseek-v4-pro` |
| MiniMax | MiniMax M3 / `MiniMax-M3` | `MiniMax-M2.7-highspeed` |
| Z.AI | GLM-5.3 Flash / `glm-5.3-flash` | `glm-5.3-flashx`、`glm-5.3`、`glm-4.7-flash`（免费） |
| Kimi | Kimi K2.6 / `kimi-k2.6` | `kimi-k3` |

智谱的显示名称改为 **Z.AI**，内部配置键仍为 `zhipu`。升级保留所有已保存的服务商 Key、模型 ID 和偏好；不在新预设中的旧 ID 会显示为手动模型。

GPT-5.4 与 GPT-5.5 从精简预设中移除，不表示已经停用。核对时官方仍列出这两个系列，未发现停用公告。账号权限、区域、余额及请求参数都可能导致调用失败。

## 页面与交互

- 440px 紧凑弹窗，红白配色，固定操作区，可滚动内容和折叠的更多设置；提供暗色主题、键盘焦点与阿拉伯语从右到左布局。
- 顶部地球图标切换界面文字，显示完整名称；翻译开关和本机 / AI 模式位于标题目标选择之前。放大服务商图标，OpenAI 图标下保留品牌名。
- 明确区分“本机翻译”和“AI 翻译”。本机模式保留 Key，不自动调用云端；尚未发出的云端任务及后续重试停止，已经发出的请求可能完成。
- 切换服务商、模式或界面语言保留本次弹窗的草稿。关闭弹窗前需保存。
- 主按钮“验证并保存”使用当前草稿发出真实示例请求，成功后才保存；失败不覆盖旧配置，并提示原设置仍在使用。测试不同 Key 不会复用旧 Key 的进行中请求。
- “跳过验证保存”位于“更多设置”，有明确的区别说明；不发测试请求，也不会把未经验证的新配置标记为已验证。本机模式主按钮为“保存设置”。灰点表示 Key 已保存，绿点表示配置已验证，橙点表示草稿有改动。
- 底部简化为“Key 仅本机保存 · 开发者不收集任何数据”，信息图标紧随说明，反馈与支持分开对齐。完整说明明确 AI 服务商会直接收到标题和调用凭证，并适用其自身隐私政策。
- 错误提示持续显示，不会在几秒后自动消失；设置、手动模型、错误及缓存提示支持现有 14 种界面语言。
- 后台未响应、消息通道错误或扩展上下文失效会提示扩展通信问题；网络、服务异常、空返回和解析失败分别提示。诊断详情仅展示安全的类型及 HTTP 状态，不显示返回体或 Key。
- 本机与 AI 译文分别缓存；旧缓存可迁移。配置变更后，旧回复不会重新挂回页面标题。
- 本机翻译失败使用独立提示，说明点击重试及可能需要下载 Chrome 语言包，避免误报成服务商异常。

## API 请求兼容

对 OpenAI、Gemini、Claude、DeepSeek、MiniMax、Z.AI 和 Kimi 分别处理推理开关、effort 与输出额度。可关闭思考的模型直接回答；强制思考模型使用低 effort 并保留最终 JSON 的输出空间。自定义兼容网关使用通用参数，服务商专属参数仅发送至准确匹配的官方域名。

Gemini 的 API Key 使用请求头，不放在 URL 中。Gemini 和 Claude 的返回解析只提取最终文本。参数错误与模型不可用、认证错误、额度限制分别提示。

## 官方参考

模型清单与请求参数核对参考以下官方资料；后续维护应重新核对，账号可调用范围以真实测试为准。

- [OpenAI 模型](https://developers.openai.com/api/docs/models)、[GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)、[停用公告](https://developers.openai.com/api/docs/deprecations)
- [Gemini 模型](https://ai.google.dev/gemini-api/docs/models)、[思考参数](https://ai.google.dev/gemini-api/docs/thinking)
- [Claude 模型](https://platform.claude.com/docs/en/models/overview)、[effort 参数](https://platform.claude.com/docs/en/build-with-claude/effort)
- [DeepSeek 模型与价格](https://api-docs.deepseek.com/quick_start/pricing/)
- [MiniMax OpenAI 兼容接口](https://platform.minimax.io/docs/api-reference/text-openai-api)
- [Z.AI GLM-5.3 Flash](https://docs.z.ai/guides/vlm/glm-5.3-flash)、[通用参数](https://docs.z.ai/guides/overview/concept-param)
- [Kimi 思考模型参数](https://platform.kimi.ai/docs/guide/use-thinking-models)

## 验证与交付

- `npm test`：71 项全部通过，覆盖请求体与响应解析、后台队列、模式切换、缓存迁移、草稿、验证 / 保存失败、自定义端点权限、扩展通信错误、诊断脱敏及本机语言包失败后的提示与重试。
- `node --check`：`popup.js`、`popup-locales.js`、`background.js`、`content.js` 均通过；`git diff --check` 通过。
- 自动回归使用模拟 DOM、Chrome API 和网络响应；最终已用原有 DeepSeek 配置通过新版“验证并保存”的真实请求，并在 YouTube 页面观察到滚动后新标题翻译完成。
- Chrome 弹窗完成中文确认稿对照、全部 14 种界面的最终检查、RTL、键盘操作、草稿保留、两种保存和隐私弹层验收；底部换行问题已修复并复核。暗色扩展文档及 Chrome 本机英文到中文翻译也已实测通过。结果、证据及其他服务商尚无真实账号测试的范围限制见 `design-qa.md` 和 `TEST_REPORT_v8.0.4.md`。
- 上传包：`YouTube_AI_Title_Translator_v8.0.4.zip`，仅包含运行时文件、图标、品牌资源和商店本地化文件。

在 Chrome Web Store 开发者后台打开需要继续维护的**现有扩展条目**，上传此包作为新版本。新建条目会产生另一个扩展 ID；更新原条目才能让该条目的现有用户收到更新。
