# AI Title Translator - AI Bilingual YouTube Titles

[![GitHub stars](https://img.shields.io/github/stars/GaryGaryyy/YouTube-AI-Title-Translator?style=for-the-badge)](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/GaryGaryyy/YouTube-AI-Title-Translator?style=for-the-badge)](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/network)
[![GitHub issues](https://img.shields.io/github/issues/GaryGaryyy/YouTube-AI-Title-Translator?style=for-the-badge)](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)

<p align="center">
  <a href="README.md">简体中文</a> |
  <a href="README.en.md">English</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.pt.md">Português</a> |
  <a href="README.id.md">Bahasa Indonesia</a> |
  <a href="README.vi.md">Tiếng Việt</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.hi.md">हिन्दी</a>
</p>

> Ever missed out on great YouTube videos because foreign titles were hard to understand?  
> Tired of stiff, robotic machine translations that completely miss internet memes, slang, and puns?  
> Frustrated when tools overwrite the original title, leaving no way to compare and learn authentic expressions?

**AI Title Translator - YouTube Titles** is built to solve exactly that! A next-generation Chrome extension that translates YouTube video titles with AI: **the translation replaces the title prominently, while the original title is preserved neatly below**. Powered by modern large language models, it delivers natural, meme-aware translations and smart topic tags — and works right out of the box without an API key!

---

## 🌟 Key Highlights

- 🎯 **True Bilingual In-Place Display**: The translation replaces the title prominently, with the original kept below. Scan foreign feeds naturally while picking up authentic expressions in context.
- 🧠 **Context & Meme-Aware AI**: Say goodbye to rigid, word-by-word machine translation. Accurately understands internet slang, cultural memes, humor, abbreviations, and YouTube clickbait phrasing.
- 🏷️ **Smart Video Topic Badges**: Automatically identifies video domains and attaches tags like [Tech], [News], [Music], [Finance], [Gaming], and more, helping you filter noise at a glance.
- ⚡ **On-Device Translation Without API Keys**: Uses Chrome 138+ Translator. Requires a supported browser, device, and language pair; the first use may download language packs. Title text is processed on your device.
- 🌐 **Universal AI & Local Model Support**: Built-in support for leading cloud AI providers, plus full compatibility with custom OpenAI-compatible endpoints (e.g., local models via Ollama or LM Studio).
- 🚀 **Local Caching & One-Click Retry**: Persistent browser cache eliminates duplicate requests and saves quota. If a network hiccup occurs, simply click the red failed badge to retry.

---

## 📌 Recent Updates (v8.1.0)

- Retained OpenAI / Claude / DeepSeek / custom OpenAI-compatible endpoints and refreshed models; retired presets migrate to custom endpoints and require saving to authorize access again
- Explicit **On-device** and **AI translation** modes. On-device mode preserves saved keys, cancels cloud work that has not started, and uses a separate translation cache
- Compact red-and-white popup with a fixed action area, collapsed extra settings, dark mode, and keyboard focus styles. Switching providers or modes preserves drafts within the current popup
- The globe changes interface text and shows the full locale name. Choose the translation mode before the title target. Larger provider logos, a fixed save area, and privacy details keep the settings compact
- **Verify & save** saves only after receiving a sample translation. **More settings → Save without verification** skips the test. A gray dot means a key is saved, green means the current configuration is verified, and orange means unsaved changes
- Provider-specific reasoning parameters and output budgets, clearer parameter/auth/quota/model errors, and localized settings and error messages in all 14 UI languages

Changes and verification limits are recorded in the [8.1.0 release notes](RELEASE_NOTES_v8.1.0.md).

---

## 📊 Feature Comparison Matrix

| Comparison Dimension | Traditional Page Translators / Scripts | This Extension (Built-in Mode) | This Extension (Cloud/Local AI Mode) |
| :--- | :--- | :--- | :--- |
| **Display Layout** | Overwrites original text, breaks layout | **Bilingual: translation on top, original below** | **Bilingual: translation on top, original below** |
| **Translation Quality**| Word-by-word mechanical translation | Fluent daily translation | **Context-rich, understands memes & slang** |
| **Topic Category Badges** | ❌ None | ❌ None | **✅ Auto tags [Tech/Finance/Music...]** |
| **Setup Effort** | Low | **Zero (works out of the box)** | Bring your own API key or local model |
| **Cost & Privacy** | May upload entire page content | **100% offline, free forever, text never leaves device** | Direct to provider, no intermediate servers |

---

## 📸 Demo

| English -> Japanese | English -> Korean |
|---|---|
| ![English to Japanese](screenshots/v8.0.1/en-to-ja.png) | ![English to Korean](screenshots/v8.0.1/en-to-ko.png) |

| English -> Thai | English -> Spanish |
|---|---|
| ![English to Thai](screenshots/v8.0.1/en-to-th.png) | ![English to Spanish](screenshots/v8.0.1/en-to-es.png) |

| Chinese -> English | Chinese -> French |
|---|---|
| ![Chinese to English](screenshots/v8.0.1/zh-to-en.png) | ![Chinese to French](screenshots/v8.0.1/zh-to-fr.png) |

| Chinese -> German | Chinese -> Portuguese |
|---|---|
| ![Chinese to German](screenshots/v8.0.1/zh-to-de.png) | ![Chinese to Portuguese](screenshots/v8.0.1/zh-to-pt.png) |

| Chinese -> Indonesian | Chinese -> Vietnamese |
|---|---|
| ![Chinese to Indonesian](screenshots/v8.0.1/zh-to-id.png) | ![Chinese to Vietnamese](screenshots/v8.0.1/zh-to-vi.png) |

---

## 🚀 Quick Start

### Option 1: Chrome Web Store (Recommended)
👉 [Install directly from the Chrome Web Store](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)

### Option 2: Load Unpacked Source in Developer Mode
1. Download the latest ZIP release from [GitHub Releases](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/releases) and extract it;
2. Navigate to `chrome://extensions/` in Chrome and enable **"Developer mode"** in the top-right corner;
3. Click **"Load unpacked"** in the top-left corner and select the extracted folder.

---

## 🛠️ Usage & Settings

The first installation opens a welcome page to confirm the target language.

Click the extension icon in the toolbar to open the control panel:

![Settings UI (historical v8.0.1 screenshot)](screenshots/v8.0.1/config-ui.png)

### 1. Basic Mode (No API Key Required)
New installations default to **On-device**. You can also select this mode and save it even when an AI key is already stored. A supported browser, device, and language pair are required; the first use may download language packs. Unsupported pairs display a configuration prompt.

### 2. Advanced AI Mode (Unlocks Meme Understanding + Topic Badges)
To enjoy idiomatic, meme-aware translations and intelligent topic classification:
1. Turn on automatic translation and select **AI translation**;
2. Choose a target under **Translate titles into**, select a provider and model, and paste your API key. Recommended models suit short titles; **Other model (enter manually)** accepts another supported ID;
3. Click **Verify & save**. A real API request translates one sample title, and the configuration is saved only on success. Failed tests keep your draft and previous configuration and explain the cause. **More settings → Save without verification** applies the configuration without marking an untested configuration as verified.

Saved settings apply to open YouTube pages. Drafts last only for the current popup session, so save before closing it. Upgrades preserve saved keys; saved models absent from a provider’s presets fall back to its recommended model, while custom endpoints keep their model IDs.

---

## 🤖 Supported AI Providers

| Provider | Where to Get an API Key |
| :--- | :--- |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Claude** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **Custom** | Custom OpenAI-compatible endpoint |

### 🔌 Custom OpenAI-Compatible Endpoints (Local & Gateway Models)
Select **Custom** to connect to any endpoint that follows the OpenAI Chat Completions standard:
- **API Endpoint**: Full endpoint URL (e.g., `http://localhost:11434/v1/chat/completions` or OpenRouter);
- **Model name**: Exact model ID to call (e.g., `llama3.3`, `qwen2.5`);
- **API Key**: Corresponding API key (can be arbitrary for local unauthenticated models).

Remote endpoints require HTTPS. `localhost`, `127.0.0.1`, and `[::1]` may use HTTP. Saving requests the necessary host permission for your endpoint.

---

## 🌍 Supported Languages

- **Target Languages (12)**: Simplified Chinese, Traditional Chinese, English, Japanese, Korean, Thai, Spanish, French, German, Portuguese, Indonesian, Vietnamese
- **UI Languages (14)**: English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Indonesian, Vietnamese, Russian, Arabic, Hindi, etc.
- **Source Language Detection**: Fully automatic; titles already matching the target language are skipped intelligently.

---

## 🔒 Privacy & Data Security

Built-in AI providers are limited to OpenAI / Claude / DeepSeek, with custom OpenAI-compatible endpoints also supported. Page injection and access are limited to `https://www.youtube.com/*` and `https://m.youtube.com/*`; built-in API access is limited to `https://api.openai.com/*`, `https://api.anthropic.com/*`, and `https://api.deepseek.com/*`; optional host access for a custom endpoint is requested when saving it.

- **Zero Data Collection**: We do not track browsing activity or collect any personal information.
- **Local Storage Only**: API keys, preferences, and cache live entirely in your browser's `chrome.storage.local`.
- **Mode-Specific Processing**: On-device mode processes titles locally. AI mode sends title text and the required API credentials directly to your selected provider or custom endpoint. The developer collects no data. **Verify & save** sends one sample title to the chosen endpoint. The info button in the footer opens the full privacy explanation.

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Q1: Is this extension free?</b></summary>
Yes! The extension is completely free and open-source under the MIT license. Built-in on-device translation is 100% free. If using cloud AI APIs, token costs are billed by each provider according to their pricing.
</details>

<details>
<summary><b>Q2: Will refreshing YouTube consume additional API tokens?</b></summary>
While an entry remains cached, its translation is served from local storage without another API request. Caches are partitioned by target language and on-device/AI mode. Clearing the cache or evicting an entry due to the size limit causes a new translation.
</details>

<details>
<summary><b>Q3: What if a translation fails due to network hiccups?</b></summary>
If an individual title fails to translate, a red status badge appears next to it. Simply click on the badge to retry immediately.
</details>

---

## 💻 Developer Guide

```bash
# Clone the repository
git clone https://github.com/GaryGaryyy/YouTube-AI-Title-Translator.git
cd YouTube-AI-Title-Translator

# Run all unit tests (Node.js 18+ native test runner, zero third-party dependencies)
npm test
```

- **Tech Stack**: Chrome Extension Manifest V3 (Content Script + Background Service Worker), vanilla HTML5/ES6+/CSS3, Chrome Storage Local API.
- **Zero Build Step**: Native JavaScript architecture — no Webpack/Vite bundle step required. Reload the extension in `chrome://extensions/` to test changes immediately.

---

## 📄 License & Feedback

- **License**: Released under the [MIT License](LICENSE).
- **Feedback**: Issues and pull requests are warmly welcomed via [GitHub Issues](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues), or reach out via email: `garyzhang345@gmail.com`.

*Last updated: October 2026*
