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
- ⚡ **Zero Setup! Works Without API Keys**: Leverages Chrome 138+ on-device translation (Chrome Translator). Works out of the box with zero configuration, completely free and offline.
- 🌐 **Universal AI & Local Model Support**: Built-in support for leading cloud AI providers, plus full compatibility with custom OpenAI-compatible endpoints (e.g., local models via Ollama or LM Studio).
- 🚀 **Local Caching & One-Click Retry**: Persistent browser cache eliminates duplicate requests and saves quota. If a network hiccup occurs, simply click the red failed badge to retry.

---

## 📌 Recent Updates (v8.0.3)

- **Works without an API key**: when no key is configured, it automatically falls back to the on-device translation built into Chrome 138+, so you can get started at zero cost
- **Click to retry failed translations**: failed titles show a red indicator; click once to translate again
- **Fixed "malformed model response" caused by DeepSeek V4 thinking mode**: the V4 series enables thinking by default, and the chain of thought could exhaust the output budget and truncate the JSON; thinking is now disabled for V4 models
- The popup adds a Clear translation cache button (with entry count); provider cards with a saved key show a green dot; Test configuration now displays a sample translation directly
- Added 12 new localization languages, bringing the interface to 14 languages

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

Click the extension icon in the toolbar to open the control panel:

![Settings UI](screenshots/v8.0.1/config-ui.png)

### 1. Basic Mode (No API Key Required)
When no API key is configured, the extension automatically activates Chrome 138+ on-device translation. No setup needed — open YouTube and see bilingual titles instantly!

### 2. Advanced AI Mode (Unlocks Meme Understanding + Topic Badges)
To enjoy idiomatic, meme-aware translations and intelligent topic classification:
1. **Translate titles into**: Choose your target language (12 supported);
2. **Choose AI provider**: Select your preferred provider and paste your API key;
3. Click **Save settings** and refresh your YouTube page.

---

## 🤖 Supported AI Providers

| Provider | Where to Get an API Key |
| :--- | :--- |
| **DeepSeek (Recommended)** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Claude** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **MiniMax** | [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |
| **Z.AI** | [z.ai](https://z.ai/manage-apikey/apikey-list) |
| **Kimi** | [platform.kimi.ai](https://platform.kimi.ai/console/api-keys) |

### 🔌 Custom OpenAI-Compatible Endpoints (Local & Gateway Models)
Select **Custom** to connect to any endpoint that follows the OpenAI Chat Completions standard:
- **API Endpoint**: Full endpoint URL (e.g., `http://localhost:11434/v1/chat/completions` or OpenRouter);
- **Model name**: Exact model ID to call (e.g., `llama3.3`, `qwen2.5`);
- **API Key**: Corresponding API key (can be arbitrary for local unauthenticated models).

---

## 🌍 Supported Languages

- **Target Languages (12)**: Simplified Chinese, Traditional Chinese, English, Japanese, Korean, Thai, Spanish, French, German, Portuguese, Indonesian, Vietnamese
- **UI Languages (14)**: English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Indonesian, Vietnamese, Russian, Arabic, Hindi, etc.
- **Source Language Detection**: Fully automatic; titles already matching the target language are skipped intelligently.

---

## 🔒 Privacy & Data Security

- **Zero Data Collection**: We do not track browsing activity or collect any personal information.
- **Local Storage Only**: API keys, preferences, and cache live entirely in your browser's `chrome.storage.local`.
- **No Middleman Servers**: Requests travel directly to your chosen AI provider or stay on-device. No proxy servers involved.

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Q1: Is this extension free?</b></summary>
Yes! The extension is completely free and open-source under the MIT license. Built-in on-device translation is 100% free. If using cloud AI APIs, token costs are billed by each provider according to their pricing.
</details>

<details>
<summary><b>Q2: Will refreshing YouTube consume additional API tokens?</b></summary>
No. The extension features a persistent local cache. Once a title is translated, it is served instantly from local storage without duplicate network requests. Caches are partitioned by target language.
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

*Last updated: September 2026*
