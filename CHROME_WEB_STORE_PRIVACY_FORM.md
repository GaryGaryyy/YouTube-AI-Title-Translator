# Chrome Web Store Privacy Form Checklist

Use this checklist when completing the Chrome Web Store Developer Dashboard privacy form.

## Single Purpose (单一用途说明)

Paste (English recommended for reviewers):

```
This extension has a single purpose: it translates YouTube video titles into the user's chosen language and displays the translation together with the original title on YouTube pages.
```

中文：

```
本扩展具有单一用途：将 YouTube 视频标题翻译为用户选择的语言，并把译文与原始标题一起显示在 YouTube 页面上。
```

## Remote Code (您正在使用远程代码吗？)

Answer **No / 不，我并未使用远程代码**.

The extension executes only code bundled in its own package. Calls to AI providers fetch data (JSON text), never executable code — that is not "remote code" under the MV3 policy. Answering "Yes" is factually wrong and invites rejection or in-depth review.

## Privacy Policy URL

Use one of these public URLs:

- GitHub page: https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/blob/main/PRIVACY.md
- Raw text: https://raw.githubusercontent.com/GaryGaryyy/YouTube-AI-Title-Translator/main/PRIVACY.md

## Data Types To Disclose

Disclose the following data types if the form asks what user data the extension handles:

- Website content: YouTube video titles visible on the page are read so the extension can translate and display bilingual titles.
- Authentication information: API keys entered by the user are stored locally and used to call the user-selected AI service.
- User activity or user settings/preferences: selected provider, model, endpoint, translation switch, and local translation cache are stored locally for extension functionality.

Do not claim that the extension collects personal identity, financial information, health information, or precise location.

## Data Use Statements

Use these statements where relevant:

- User data is used only to provide the extension's title translation features.
- API keys, preferences, and cached translations are stored locally in the user's browser.
- The developer does not operate a server for this extension.
- The extension does not sell user data.
- The extension does not use user data for advertising.
- The extension does not use user data for creditworthiness, lending, or unrelated analytics.
- When AI translation is enabled and configured, visible YouTube title text and the required API credentials are sent directly from the user's browser to the selected endpoint. An explicit Verify & save action sends one sample title to verify the configuration, even when automatic translation is paused or on-device mode is currently saved.
- On-device mode uses Chrome's built-in translator on supported browsers, devices, and language pairs (Chrome 138+); title text is processed locally. First use may download language packs. Saved provider credentials are preserved without being used for on-device translation.

## Permissions Justification

Paste-ready, storage (需请求 storage 的理由):

```
The storage permission is used only to save the user's settings (API keys, provider, model, translation mode, target language, UI language, and last successful configuration test time) and a local translation cache in the browser. Stored settings and cache are never uploaded to the developer. AI translation and explicit configuration tests send title text and required API credentials directly to the user's selected endpoint.
```

Paste-ready, host permissions (需请求主机权限的理由):

```
Host permissions serve the single purpose: (1) the youtube.com content script reads visible video titles and renders translations in place; (2) the built-in AI provider hosts (api.openai.com, api.deepseek.com, etc.) let the browser send title text directly to the AI provider the user selected; (3) optional host access is requested at runtime only when the user configures a custom OpenAI-compatible endpoint. No host data is sent to the developer.
```

## Custom Endpoint Note

Custom endpoints must use HTTPS. HTTP is allowed only for local development endpoints such as `localhost` or `127.0.0.1`.
