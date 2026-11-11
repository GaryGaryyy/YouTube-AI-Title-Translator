# Privacy Policy

Effective date: October 1, 2026

YouTube Title Translator - AI Bilingual is a Chrome extension that translates YouTube video titles and shows bilingual title information on YouTube pages.

## Data We Process

The extension may process the following data to provide its core translation features:

- YouTube video titles visible on the page.
- Translation settings selected by the user.
- API keys, model names, and endpoint settings entered by the user.
- Local translation cache and extension preferences.

## How Data Is Stored

API keys, settings, preferences, and cached translation results are stored locally in the user's browser using Chrome extension storage.

We do not operate a server for this extension, and we do not collect, sell, or share user data with the developer's own server.

## Limited Use

User data is used only to provide the extension's title translation features. We do not use or transfer user data for advertising, unrelated analytics, creditworthiness, lending, resale, or any purpose unrelated to the extension's single purpose.

## Third-Party AI Services

When the user enables AI translation and saves an AI service configuration, the extension sends video title text and the credentials required for the API call directly from the user's browser to the selected endpoint. The selected third-party service may process that text according to its own privacy policy and terms. Clicking **Verify & save** explicitly sends one sample title to that endpoint to verify the configuration, including when automatic translation is paused or on-device mode is currently saved.

On-device mode uses Chrome's built-in translator and does not send title text to an AI provider. The first use may download language packs from Chrome. Switching to on-device mode preserves saved provider credentials and prevents queued cloud requests and retries from starting; requests already sent may still finish.

Built-in AI providers are limited to OpenAI / Claude / DeepSeek, with custom OpenAI-compatible endpoints also supported. Users are responsible for choosing which AI service, model, API key, and endpoint they want to use. API keys are read by the background service worker for translation; content scripts send only title text and the target language.

Custom endpoints must use HTTPS. HTTP is allowed only for local development endpoints such as localhost or 127.0.0.1.

## Permissions

Page injection and access are limited to `https://www.youtube.com/*` and `https://m.youtube.com/*`; built-in API access is limited to `https://api.openai.com/*`, `https://api.anthropic.com/*`, and `https://api.deepseek.com/*`; optional host access for a custom endpoint is requested when saving it. The storage permission saves settings locally in the browser. The first installation opens a welcome page to confirm the target language.

Optional host permissions may be requested when a user configures a custom API endpoint, so the extension can send translation requests to that endpoint.

## Chrome Web Store Privacy Disclosure Guidance

For the Chrome Web Store privacy form, this extension's data use should be disclosed as handling website content, authentication information, and user settings/preferences. The data is used only for title translation, stored locally where possible, and sent to user-selected AI services for enabled AI translation or an explicit configuration test.

## Data Retention and Control

Users can remove stored API keys, settings, and cached data by clearing the extension's site data, resetting extension settings, or uninstalling the extension from Chrome.

## Changes to This Policy

This policy may be updated when the extension's features or data practices change. Updates will be published in this repository.

## Contact

For privacy questions, please open an issue in this GitHub repository:

https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues

---

# 隐私政策

生效日期：2026 年 10 月 1 日

YouTube 标题翻译 - AI双语标题 是一款 Chrome 扩展，用于翻译 YouTube 视频标题，并在 YouTube 页面中显示双语标题信息。

## 我们处理的数据

为了提供核心翻译功能，扩展可能会处理以下数据：

- YouTube 页面中可见的视频标题。
- 用户选择的翻译设置。
- 用户填写的 API Key、模型名称和接口地址设置。
- 本地翻译缓存和扩展偏好设置。

## 数据如何存储

API Key、设置、偏好和缓存翻译结果会通过 Chrome 扩展存储保存在用户本地浏览器中。

我们不为此扩展运营服务器，也不会将用户数据收集、出售或共享到开发者自有服务器。

## 限定用途

用户数据仅用于提供扩展的标题翻译功能。我们不会将用户数据用于广告、无关分析、信用评估、贷款、转售或任何与扩展单一用途无关的目的。

## 第三方 AI 服务

当用户启用 AI 翻译并保存 AI 服务配置后，扩展会从用户浏览器直接向所选端点发送标题文本及 API 调用所需的凭证。第三方服务可能会根据其自身隐私政策和服务条款处理这些文本。点击“验证并保存”会向所选端点发送一条示例标题以验证配置，即使当前已保存的是本机模式或自动翻译已暂停。

本机模式使用 Chrome 内置翻译，不向 AI 服务商发送标题文本；首次使用可能从 Chrome 下载语言包。切换到本机模式会保留已保存的服务商凭证，并阻止排队中的云端请求和重试继续发出；已经发出的请求仍可能完成。

内置 AI 服务商仅保留 OpenAI / Claude / DeepSeek，并支持自定义 OpenAI 兼容端点。用户自行决定使用哪个 AI 服务、模型、API Key 和接口地址。翻译时由后台读取 API Key，content script 仅发送标题文本与目标语言。

自定义接口必须使用 HTTPS。本机开发接口（例如 localhost 或 127.0.0.1）可使用 HTTP。

## 权限说明

注入与页面访问仅限 `https://www.youtube.com/*` 和 `https://m.youtube.com/*`；内置 API 权限仅限 `https://api.openai.com/*`、`https://api.anthropic.com/*`、`https://api.deepseek.com/*`；自定义端点在保存时按需申请可选主机权限。扩展使用 storage 权限在本地浏览器保存设置。首次安装会打开引导页确认目标语言。

当用户配置自定义 API 接口时，扩展可能会请求可选主机权限，以便向该接口发送翻译请求。

## Chrome 应用商店隐私披露建议

在 Chrome 应用商店隐私表单中，本扩展应披露会处理网站内容、身份验证信息以及用户设置/偏好。相关数据仅用于标题翻译，尽可能保存在本地，并会在启用 AI 翻译或主动测试配置时发送到用户自行选择的 AI 服务。

## 数据保留和控制

用户可以通过清除扩展站点数据、重置扩展设置或从 Chrome 卸载扩展来移除已保存的 API Key、设置和缓存数据。

## 政策更新

当扩展功能或数据处理方式发生变化时，本政策可能会更新。更新内容会发布在本仓库中。

## 联系方式

如有隐私相关问题，请在本 GitHub 仓库提交 issue：

https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues
