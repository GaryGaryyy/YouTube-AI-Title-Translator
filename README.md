# YouTube 标题翻译 - AI 双语标题

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

> 刷 YouTube 时，是否常因外语标题看不懂而错过优质视频？  
> 依赖传统机翻，是否受够了死板生硬、完全不懂网络梗与标题党的机械直译？  
> 好不容易看懂了翻译，原标题却被直接覆盖，丧失了对照学习地道外语的机会？

**YouTube 标题翻译 - 双语标题** 专为解决这些痛点而生！这是一款专为 YouTube 打造的次世代 AI 双语标题翻译与内容辅助扩展：**译文置顶替换原标题，原文微缩保留在下方**。结合前沿大语言模型的强大理解力，不仅懂梗、懂语气、地道自然，还能自动打上视频分类标签，无需 API Key 也能开箱即用！

---

## 🌟 核心亮点

- 🎯 **极致双语对照，沉浸浏览**：译文作为主标题醒目展示，原文微缩紧随其后。无需鼠标悬停，扫一眼推荐流即可秒懂视频主题，兼顾信息获取与外语对照学习。
- 🧠 **真正懂“梗”的 AI 语境意译**：彻底告别机械生硬的逐字死译。深度理解网络流行语、文化梗、俚语、缩写与 YouTube 标题党夸张表达，自然地道。
- 🏷️ **智能视频内容标签**：翻译标题的同时，AI 会自动推断视频所属领域，打上【科技】、【新闻】、【音乐】、【财经】、【游戏】等分类标签，一眼避坑防标题党。
- ⚡ **无需 Key 的本机翻译**：使用 Chrome 138+ 内置设备端翻译（Chrome Translator）。需要受支持的浏览器、设备和语言对；首次使用可能下载语言包，翻译文本留在本机。
- 🌐 **自由接入主流大模型与本地模型**：内置主流大语言模型快捷支持，并全面兼容 OpenAI 格式的自定义接口（无缝接入 Ollama、LM Studio 等本地私有化模型或中转服务）。
- 🚀 **极速本地持久缓存与容错重试**：已翻译标题本地持久化秒开，刷新不重复消耗额度；偶遇网络波动失败时，点击红色状态标签即可秒级重试。

---

## 📌 近期更新（v8.0.4）

- 更新 7 家服务商的模型预设，每家最多 4 个，每家一个“推荐”模型，保留手动模型输入；服务商统一使用英文品牌名，智谱显示为 **Z.AI**
- 明确区分“本机翻译”和“AI 翻译”；本机模式保留已有 Key，停止尚未发出的云端任务，并与 AI 模式分别缓存译文
- 紧凑的红白设置界面：先开翻译开关、选本机或 AI 模式，再选标题翻译目标；顶部地球图标切换界面文字，显示完整名称。提供大尺寸品牌图标、固定保存区、折叠更多设置和暗色主题
- **验证并保存**成功后才保存配置并显示示例译文；**更多设置 → 跳过验证保存**可直接应用配置。灰点表示 Key 已保存，绿点表示当前配置已验证，橙点表示未保存更改
- 按服务商调整推理参数和输出额度，区分扩展通信、网络、参数、认证、额度和模型错误；设置与错误提示均支持 14 种界面文字，阿拉伯语采用从右到左布局

模型 ID、官方参考链接与验证范围见 [8.0.4 更新说明](RELEASE_NOTES_v8.0.4.md)。

---

## 📊 特性对比矩阵

| 对比维度 | 传统全页机翻 / 传统脚本 | 本扩展（内置无 Key 模式） | 本扩展（云端/本地大模型模式） |
| :--- | :--- | :--- | :--- |
| **展示形式** | 覆盖原文，排版混乱 | **译文在上、原文在下对照** | **译文在上、原文在下对照** |
| **翻译质量** | 逐字生硬死译，丢失语境 | 流畅日常翻译 | **地道意译，深谙网络梗与流行语** |
| **视频分类标签** | ❌ 无 | ❌ 无 | **✅ 自动生成【科技/财经/娱乐】等标签** |
| **上手门槛** | 低 | **极低（零配置、即装即用）** | 自备 API Key 或本地模型 |
| **费用与隐私** | 可能上传整页内容 | **100% 离线、永久免费、文本不离机** | 直连服务商，不经中间服务器 |

---

## 📸 效果演示

| 英文 -> 日语 | 英文 -> 韩语 |
|---|---|
| ![English to Japanese](screenshots/v8.0.1/en-to-ja.png) | ![English to Korean](screenshots/v8.0.1/en-to-ko.png) |

| 英文 -> 泰语 | 英文 -> 西班牙语 |
|---|---|
| ![English to Thai](screenshots/v8.0.1/en-to-th.png) | ![English to Spanish](screenshots/v8.0.1/en-to-es.png) |

| 中文 -> 英文 | 中文 -> 法语 |
|---|---|
| ![Chinese to English](screenshots/v8.0.1/zh-to-en.png) | ![Chinese to French](screenshots/v8.0.1/zh-to-fr.png) |

| 中文 -> 德语 | 中文 -> 葡萄牙语 |
|---|---|
| ![Chinese to German](screenshots/v8.0.1/zh-to-de.png) | ![Chinese to Portuguese](screenshots/v8.0.1/zh-to-pt.png) |

| 中文 -> 印尼语 | 中文 -> 越南语 |
|---|---|
| ![Chinese to Indonesian](screenshots/v8.0.1/zh-to-id.png) | ![Chinese to Vietnamese](screenshots/v8.0.1/zh-to-vi.png) |

---

## 🚀 快速开始

### 方式一：Chrome 应用商店安装（推荐）
👉 [点击前往 Chrome 应用商店直接安装](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)

### 方式二：开发者模式加载源码
1. 前往 [GitHub Releases](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/releases) 下载最新版本的 ZIP 压缩包并解压；
2. 在 Chrome 地址栏访问 `chrome://extensions/`，打开右上角 **“开发者模式”**；
3. 点击左上角 **“加载已解压的扩展程序”**，选择解压出的文件夹即可。

---

## 🛠️ 使用与配置

安装后点击浏览器工具栏的插件图标打开控制面板：

![插件配置界面（v8.0.1 历史截图）](screenshots/v8.0.1/config-ui.png)

### 1. 基础开箱即用（无需 API Key）
首次安装默认使用“本机翻译”。也可以在弹窗中选择该模式并点击“保存设置”，即使已经保存 AI Key，标题也会使用 Chrome 的设备端翻译。需要受支持的浏览器、设备和语言对；首次使用可能下载语言包。不支持时会显示配置提示。

### 2. 进阶大模型配置（获得梗意译 + 分类标签）
若想体验更生动懂梗的翻译以及智能内容标签：
1. 打开自动翻译开关，选择 **AI 翻译**；
2. 在 **标题翻译为** 中选择目标，选择服务商和模型，并粘贴对应平台的 API Key；推荐项适合短标题翻译，也可选择“其他（手动输入模型名）”；
3. 点击 **验证并保存**。扩展会用一条示例标题进行真实 API 调用，成功后保存；失败会保留草稿和原配置并显示原因。**更多设置 → 跳过验证保存**可直接保存，此时不会把未经验证的配置标记为已验证。

保存后的设置会应用到已打开的 YouTube 页面。草稿只在本次弹窗内保留，关闭弹窗前请保存。升级会保留已保存的 Key 和旧模型 ID；未列出的旧模型会显示为手动输入。

---

## 🤖 支持的 AI 服务商

| 服务商 | API Key 申请入口 |
| :--- | :--- |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Claude** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **MiniMax** | [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |
| **Z.AI** | [z.ai](https://z.ai/manage-apikey/apikey-list) |
| **Kimi** | [platform.kimi.ai](https://platform.kimi.ai/console/api-keys) |

### 🔌 自定义 OpenAI 兼容端点（本地模型与中转）
选择 **Custom** 可连接任意兼容 OpenAI Chat Completions 规范的接口：
- **API Endpoint**：接口完整 URL（如 `http://localhost:11434/v1/chat/completions` 或 OpenRouter 等聚合服务）；
- **Model name**：调用的具体模型名称（如 `llama3.3`、`qwen2.5`）；
- **API Key**：对应服务商的 Key（本地无鉴权模型可随意填写）。

远程端点必须使用 HTTPS；`localhost`、`127.0.0.1` 和 `[::1]` 可使用 HTTP。保存时会请求该端点所需的访问权限。

---

## 🌍 支持的语言

- **目标语言（12 种）**：简体中文、繁體中文、English、日本語、한국어、ไทย、Español、Français、Deutsch、Português、Bahasa Indonesia、Tiếng Việt
- **界面语言（14 种）**：中、英、日、韩、西、法、德、葡、印尼、越、俄、阿、印地等 14 国语言
- **源语言识别**：无需手动选择，智能自动识别全语言视频标题；若标题与目标语言一致则自动跳过。

---

## 🔒 隐私与数据安全

- **0 数据收集**：扩展不追踪用户浏览历史，不收集任何个人敏感信息。
- **纯本地存储**：API Key、偏好设置和翻译缓存完全保存在你当前浏览器的 `chrome.storage.local` 中。
- **按模式处理标题**：本机模式的标题在设备端处理；AI 模式会将标题文本和调用所需的 Key 直接发送到所选服务商或自定义端点。开发者不收集任何数据。“验证并保存”会向所选端点发送一条示例标题；底部信息图标可查看完整隐私说明。

---

## ❓ 常见问题 FAQ

<details>
<summary><b>Q1: 扩展本身收费吗？</b></summary>
扩展完全免费且基于 MIT 协议开源。使用 Chrome 内置设备端翻译完全免费；若使用云端大模型，API 额度费用按各服务商官方规则由用户自理。
</details>

<details>
<summary><b>Q2: 频繁刷新页面会重复消耗 API Token 吗？</b></summary>
缓存仍存在时，已翻译标题会直接从本地加载，避免重复 API 请求。缓存按目标语言和本机/AI 模式隔离；清除缓存或条目被容量限制淘汰后会重新翻译。
</details>

<details>
<summary><b>Q3: 偶遇网络波动翻译失败了怎么办？</b></summary>
若单条标题翻译失败，会在标题旁显示红色的错误状态标识，直接鼠标点击该标识即可立即一键重新翻译。
</details>

---

## 💻 开发者指南

```bash
# 克隆仓库
git clone https://github.com/GaryGaryyy/YouTube-AI-Title-Translator.git
cd YouTube-AI-Title-Translator

# 运行全量单元测试（Node.js 18+ 原生 test runner，无第三方依赖）
npm test
```

- **技术栈**：Chrome Extension Manifest V3（Content Script + Background Service Worker）、原生 HTML5/ES6+/CSS3、Chrome Storage Local API。
- **零外部构建**：纯原生前端架构，无需 Webpack/Vite 打包，修改代码后重载插件即可调试。

---

## 📄 开源协议与反馈

- **许可证**：本项目采用 [MIT License](LICENSE) 开源。
- **问题反馈**：欢迎提交 [GitHub Issues](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues) 或通过邮件联系：`garyzhang345@gmail.com`。

*最后更新：2026年10月*
