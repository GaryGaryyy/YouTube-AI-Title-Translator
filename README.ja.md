# YouTube タイトル翻訳 - AI 二言語タイトル

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

> YouTube を見ているとき、外国語のタイトルが理解できず素晴らしい動画を見逃していませんか？  
> 従来の機械翻訳に頼って、スラングやネタ、略語がまったく通じない不自然な直訳にうんざりしていませんか？  
> せっかく翻訳を見ても元のタイトルが上書きされてしまい、本物の自然な外国語表現を学ぶ機会を失っていませんか？

**YouTube タイトル翻訳 - AI 二言語タイトル** は、まさにこれらの悩みを解決するために生まれました！YouTube 専用に設計された次世代の AI 二言語タイトル翻訳・ブラウジング補助拡張機能です：**翻訳がメインタイトルとして置き換わり、元のタイトルはその下に小さくそのまま残ります**。最先端の LLM（大規模言語モデル）の文脈理解力を活かし、ネットスラングや語調を自然に翻訳するだけでなく、動画の自動ジャンルタグ付けにも対応。API Key なしでもすぐに使えます！

---

## 🌟 主な特徴

- 🎯 **究極の二言語対照表示**：翻訳が目立つメインタイトルとして表示され、原文はその下にコンパクトに残ります。マウスホバー不要で、一覧を流し読みしながら内容を瞬時に把握し、語学学習にも最適です。
- 🧠 **ネットの「ネタ」や語調を理解する AI 意訳**：単語ごとの不自然な直訳とは決別。ネットスラング、文化的なミーム、略語、YouTube 特有の釣りタイトルのニュアンスまで的確に汲み取って自然に意訳します。
- 🏷️ **AI による動画ジャンルタグ自動付与**：タイトルの翻訳と同時に、AI が動画の分野を推測して【テクノロジー】【ニュース】【音楽】【金融】【ゲーム】などのタグを付与。釣り動画を回避し、見たい動画をひと目で選べます。
- ⚡ **設定不要！Key なしでもすぐに使える**：Chrome 138+ 内蔵の端末内ネイティブ翻訳（Chrome Translator）に完全対応。API Key を設定しなくても、端末内完全無料・オフライン・即座に動作します。
- 🌐 **主要 AI サービスとローカルモデルに自由接続**：主要な商用 LLM プロバイダーに対応するほか、OpenAI 互換のカスタムエンドポイント（Ollama や LM Studio などのローカルモデルも含む）をシームレスに利用できます。
- 🚀 **高速ローカルキャッシュとワンクリック再試行**：翻訳結果はローカルに保存されるため、再読み込みしてもリクエストを重複消費しません。一時的なネットワークエラー時も赤いバッジをクリックするだけで即座に再試行できます。

---

## 📌 最近の更新（v8.0.3）

- **API Key なしでも使える**：Key が未設定の場合、Chrome 138+ 内蔵の端末内翻訳に自動的に切り替わり、コストゼロですぐに使えます
- **翻訳失敗時はクリックで再試行**：失敗したタイトルには赤い表示が出て、クリックするだけで再翻訳できます
- **DeepSeek V4 の思考モードによる「モデルの応答形式が異常です」問題を修正**：V4 シリーズはデフォルトで思考が有効になっており、思考チェーンが出力枠を使い切って JSON が途中で切れてしまうため、V4 モデルでは思考を無効化しました
- ポップアップに翻訳キャッシュ削除ボタンを追加（件数表示付き）。Key 保存済みのプロバイダーカードには緑のドットを表示。設定テスト時にはサンプル翻訳をその場で表示します
- ローカライズ言語を 12 種類追加し、インターフェース言語は全 14 種類になりました

---

## 📊 機能比較マトリクス

| 比較項目 | 従来のページ翻訳 / スクリプト | 本拡張機能（Key 不要の内蔵モード） | 本拡張機能（クラウド/ローカル AI モード） |
| :--- | :--- | :--- | :--- |
| **表示形式** | 原文が上書きされレイアウトが崩れる | **翻訳が上、原文が下の二言語対照** | **翻訳が上、原文が下の二言語対照** |
| **翻訳品質** | 機械的な逐語訳で文脈が抜け落ちる | 自然な日常翻訳 | **スラングやミームを深く理解した自然な意訳** |
| **ジャンルタグ** | ❌ なし | ❌ なし | **✅【テクノロジー/金融/音楽...】を自動付与** |
| **導入の手間** | 低い | **ゼロ（インストール後すぐ使える）** | API Key またはローカル環境を用意 |
| **料金とプライバシー** | ページ全体を送信する場合がある | **100% オフライン、永久無料、外部送信なし** | プロバイダーへ直接通信、中継サーバーなし |

---

## 📸 デモ

| 英語 -> 日本語 | 英語 -> 韓国語 |
|---|---|
| ![English to Japanese](screenshots/v8.0.1/en-to-ja.png) | ![English to Korean](screenshots/v8.0.1/en-to-ko.png) |

| 英語 -> タイ語 | 英語 -> スペイン語 |
|---|---|
| ![English to Thai](screenshots/v8.0.1/en-to-th.png) | ![English to Spanish](screenshots/v8.0.1/en-to-es.png) |

| 中国語 -> 英語 | 中国語 -> フランス語 |
|---|---|
| ![Chinese to English](screenshots/v8.0.1/zh-to-en.png) | ![Chinese to French](screenshots/v8.0.1/zh-to-fr.png) |

| 中国語 -> ドイツ語 | 中国語 -> ポルトガル語 |
|---|---|
| ![Chinese to German](screenshots/v8.0.1/zh-to-de.png) | ![Chinese to Portuguese](screenshots/v8.0.1/zh-to-pt.png) |

| 中国語 -> インドネシア語 | 中国語 -> ベトナム語 |
|---|---|
| ![Chinese to Indonesian](screenshots/v8.0.1/zh-to-id.png) | ![Chinese to Vietnamese](screenshots/v8.0.1/zh-to-vi.png) |

---

## 🚀 クイックスタート

### 方法 1：Chrome ウェブストアからインストール（推奨）
👉 [Chrome ウェブストアから直接インストール](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)

### 方法 2：デベロッパーモードでソースコードを読み込む
1. [GitHub Releases](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/releases) から最新の ZIP をダウンロードして解凍します。
2. Chrome のアドレスバーに `chrome://extensions/` と入力し、右上の **「デベロッパーモード」** をオンにします。
3. 左上の **「パッケージ化されていない拡張機能を読み込む」** をクリックし、解凍したフォルダを選択します。

---

## 🛠️ 使い方と設定

インストール後、ブラウザのツールバーにある拡張機能アイコンをクリックして設定パネルを開きます：

![設定画面](screenshots/v8.0.1/config-ui.png)

### 1. 基本利用（API Key 不要）
API Key を設定していない場合、Chrome 138+ 内蔵の端末内翻訳が自動的に作動します。設定は一切不要で、YouTube を開くだけですぐに二言語タイトルが表示されます！

### 2. 高度な AI 設定（ネットスラング意訳 + ジャンルタグの有効化）
より生き生きとした翻訳やスマートなタグ機能を利用したい場合：
1. **Translate titles into**：翻訳先言語を選択（12 言語対応）；
2. **Choose AI provider**：お好みのプロバイダーを選択し、API Key を貼り付けます；
3. **Save settings** をクリックして設定を保存し、YouTube ページを更新します。

---

## 🤖 対応 AI プロバイダー

| プロバイダー | API Key 取得先 |
| :--- | :--- |
| **DeepSeek（推奨）** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Claude** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **MiniMax** | [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |
| **Z.AI** | [z.ai](https://z.ai/manage-apikey/apikey-list) |
| **Kimi** | [platform.kimi.ai](https://platform.kimi.ai/console/api-keys) |

### 🔌 OpenAI 互換のカスタムエンドポイント（ローカルモデルなど）
**Custom** を選択すると、OpenAI Chat Completions 規格に準拠したあらゆるエンドポイントに接続できます：
- **API Endpoint**：完全な URL（例：`http://localhost:11434/v1/chat/completions` や OpenRouter）；
- **Model name**：呼び出すモデル名（例：`llama3.3`, `qwen2.5`）；
- **API Key**：プロバイダーの Key（認証不要なローカルモデルの場合は任意の文字列で可）。

---

## 🌍 対応言語

- **翻訳先言語（12 言語）**：日本語、英語、簡体字中国語、繁体字中国語、韓国語、タイ語、スペイン語、フランス語、ドイツ語、ポルトガル語、インドネシア語、ベトナム語
- **UI 表示言語（14 言語）**：日本語、英語、中国語、韓国語、スペイン語、フランス語、ドイツ語、ロシア語、アラビア語、ヒンディー語など
- **原言語の自動検出**：設定不要で、世界中の一般的な言語のタイトルを自動識別。すでに翻訳先言語と同じタイトルの場合は自動的にスキップします。

---

## 🔒 プライバシーと安全性

- **データ収集ゼロ**：閲覧履歴の追跡や個人情報の収集は一切行いません。
- **ローカル完結**：API Key、設定、キャッシュはお使いのブラウザの `chrome.storage.local` にのみ保存されます。
- **中継サーバーなし**：通信は選択した AI サービスへ直接行われるか、お使いの端末内で処理されます。

---

## ❓ よくある質問 FAQ

<details>
<summary><b>Q1: 拡張機能の利用は無料ですか？</b></summary>
はい、拡張機能自体は完全に無料で MIT ライセンスのオープンソースです。Chrome 内蔵の端末内翻訳も完全無料です。クラウド AI API を利用する場合のみ、各サービスの料金規定に基づき API 利用料が発生します。
</details>

<details>
<summary><b>Q2: ページを再読み込みすると API トークンを重複消費しますか？</b></summary>
いいえ、消費しません。ローカルキャッシュを備えており、一度翻訳されたタイトルはローカルから瞬時に読み込まれます。
</details>

<details>
<summary><b>Q3: 一時的なネットワーク障害で翻訳に失敗した場合は？</b></summary>
タイトルの横に赤いエラー表示が出ます。その表示をクリックするだけで、その場で再試行できます。
</details>

---

## 💻 開発者ガイド

```bash
# リポジトリをクローン
git clone https://github.com/GaryGaryyy/YouTube-AI-Title-Translator.git
cd YouTube-AI-Title-Translator

# 全テストを実行（Node.js 18+ 標準テストランナー、依存関係ゼロ）
npm test
```

- **技術スタック**：Chrome Extension Manifest V3（Content Script + Background Service Worker）、Vanilla HTML5/ES6+/CSS3、Chrome Storage Local API。
- **ビルド不要**：Webpack や Vite のようなビルドステップは不要で、コード変更後は拡張機能を再読み込みするだけで即時反映されます。

---

## 📄 ライセンスとフィードバック

- **ライセンス**：本プロジェクトは [MIT License](LICENSE) のもとで公開されています。
- **フィードバック**：バグ報告や機能要望は [GitHub Issues](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues) またはメール（`garyzhang345@gmail.com`）でお気軽にどうぞ。

*最終更新：2026年9月*
