# YouTube 제목 번역 - AI 이중 언어 제목

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

> YouTube를 시청할 때 외국어 제목을 이해하지 못해 훌륭한 영상을 놓친 적이 있나요?  
> 인터넷 유행어, 밈, 축약어를 전혀 이해하지 못하는 융통성 없는 기계 번역의 직역에 지치셨나요?  
> 번역을 보았지만 원래 제목이 덮어씌워져 생생한 원어 표현을 비교 학습할 기회를 잃어버리셨나요?

**YouTube 제목 번역 - AI 이중 언어 제목**은 바로 이러한 불편을 해결하기 위해 개발되었습니다! YouTube 맞춤형 차세대 AI 이중 언어 번역 확장 프로그램입니다: **번역문이 원래 제목 위치에 크게 표시되고, 원본 제목은 그 아래에 보기 좋게 작게 유지됩니다**. 최신 대규모 언어 모델(LLM)의 깊이 있는 문맥 이해력을 바탕으로 인터넷 밈과 어조까지 자연스럽게 전달할 뿐 아니라, 영상 자동 카테고리 태그까지 생성합니다. API Key가 없어도 바로 사용할 수 있습니다!

---

## 🌟 주요 특징

- 🎯 **완벽한 이중 언어 대조 레이아웃**: 번역문이 눈에 띄는 메인 제목으로 표시되며 원본 제목이 바로 아래 작게 함께 표시됩니다. 마우스 호버 없이도 추천 피드를 훑어보며 영상 주제를 즉시 파악하고 어학 학습에도 큰 도움이 됩니다.
- 🧠 **밈과 뉘앙스를 꿰뚫는 AI 의역**: 기계적인 글자 그대로의 번역에서 벗어났습니다. 인터넷 유행어, 문화적 밈, 슬랭, 축약어 및 YouTube 특유의 어그로성 표현까지 자연스럽게 의역합니다.
- 🏷️ **스마트 영상 카테고리 태그**: 제목 번역과 동시에 AI가 영상 분야를 분석하여 [테크], [뉴스], [음악], [금융], [게임] 등의 태그를 자동으로 붙여주어 낚시성 영상을 거르고 원하는 영상을 빠르게 선택할 수 있습니다.
- ⚡ **설정 제로! Key 없이도 바로 사용**: Chrome 138+ 내장 온디바이스 번역(Chrome Translator)을 완벽 지원합니다. API Key를 설정하지 않아도 기기 내에서 100% 무료, 오프라인으로 즉시 작동합니다.
- 🌐 **주요 AI 서비스 및 로컬 모델 자유 연동**: 주요 상용 LLM 지원은 물론, OpenAI 표준 호환 커스텀 엔드포인트를 통해 Ollama, LM Studio 등 로컬 모델이나 서드파티 중계 서비스를 자유롭게 연결할 수 있습니다.
- 🚀 **초고속 로컬 캐시 및 클릭 재시도**: 번역 결과가 브라우저에 영구 캐시되어 페이지를 새로고침해도 중복 토큰을 소모하지 않습니다. 일시적인 네트워크 오류 시 빨간색 배지를 클릭하여 즉시 재시도할 수 있습니다.

---

## 📌 최근 업데이트 (v8.0.3)

- **API Key 없이도 사용 가능**: Key가 설정되지 않은 경우 Chrome 138+ 내장 온디바이스 번역으로 자동 전환되어 비용 없이 바로 사용할 수 있습니다.
- **번역 실패 시 클릭하여 재시도**: 실패한 제목에 빨간색 표시가 나타나며, 클릭 한 번으로 다시 번역합니다.
- **DeepSeek V4 사고 모드로 인한 "모델 응답 형식 오류" 수정**: V4 시리즈의 thinking 모드로 인한 JSON 잘림 현상을 방지하기 위해 V4 모델의 사고 모드를 비활성화했습니다.
- 팝업에 번역 캐시 삭제 버튼 추가(항목 수 표시), Key가 저장된 제공업체 카드에 녹색 점 표시, 설정 테스트 시 샘플 번역 즉시 표시.
- 12개 신규 로컬라이제이션 언어를 추가하여 총 14개 언어 인터페이스 지원.

---

## 📊 기능 비교 매트릭스

| 비교 항목 | 기존 페이지 전체 번역 / 스크립트 | 본 확장 프로그램 (Key 없는 내장 모드) | 본 확장 프로그램 (클라우드/로컬 AI 모드) |
| :--- | :--- | :--- | :--- |
| **표시 형태** | 원본을 덮어써서 레이아웃 손상 | **번역문 위 + 원본 제목 아래 대조** | **번역문 위 + 원본 제목 아래 대조** |
| **번역 품질** | 문맥 없는 단어별 직역 | 매끄러운 일상 번역 | **밈, 슬랭, 뉘앙스를 이해하는 자연스러운 의역** |
| **카테고리 태그** | ❌ 없음 | ❌ 없음 | **✅ [테크/금융/음악...] 자동 분류 태그** |
| **사용 난이도** | 낮음 | **매우 낮음 (설정 없이 즉시 작동)** | API Key 또는 로컬 환경 필요 |
| **비용 및 보안** | 페이지 전체 데이터를 전송할 수 있음 | **100% 오프라인, 완전 무료, 데이터 기기 보관** | 제공업체로 직접 전송, 중계 서버 없음 |

---

## 📸 데모

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

## 🚀 빠른 시작

### 방법 1: Chrome 웹 스토어에서 설치 (권장)
👉 [Chrome 웹 스토어에서 바로 설치하기](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)

### 방법 2: 개발자 모드에서 소스 코드 로드
1. [GitHub Releases](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/releases)에서 최신 ZIP 압축 파일을 다운로드하고 해제합니다.
2. Chrome 주소창에 `chrome://extensions/`를 입력하고 우측 상단의 **"개발자 모드"**를 켭니다.
3. 좌측 상단의 **"압축해제된 확장 프로그램을 로드합니다"**를 클릭하여 압축을 푼 폴더를 선택합니다.

---

## 🛠️ 사용 및 설정

설치 후 브라우저 툴바의 확장 프로그램 아이콘을 클릭하여 설정 패널을 엽니다:

![설정 화면](screenshots/v8.0.1/config-ui.png)

### 1. 기본 사용 (API Key 불필요)
API Key가 구성되지 않은 경우, Chrome 138+ 내장 온디바이스 번역이 자동으로 활성화됩니다. 별도의 설정 없이 YouTube를 열기만 하면 이중 언어 제목이 바로 표시됩니다!

### 2. 고급 AI 설정 (밈 의역 + 카테고리 태그 활성화)
더욱 생생한 의역과 스마트 카테고리 태그를 사용하려면:
1. **Translate titles into**: 원하는 목표 언어 선택 (12개 언어 지원);
2. **Choose AI provider**: 선호하는 AI 제공업체를 선택하고 발급받은 API Key를 입력;
3. **Save settings**를 클릭하여 설정을 저장하고 YouTube 페이지를 새로고침합니다.

---

## 🤖 지원하는 AI 제공업체

| 제공업체 | API Key 발급처 |
| :--- | :--- |
| **DeepSeek (권장)** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Claude** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **MiniMax** | [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |
| **Z.AI** | [z.ai](https://z.ai/manage-apikey/apikey-list) |
| **Kimi** | [platform.kimi.ai](https://platform.kimi.ai/console/api-keys) |

### 🔌 사용자 지정 OpenAI 호환 엔드포인트 (로컬 모델 및 중계 서비스)
**Custom**을 선택하면 OpenAI Chat Completions 규격을 따르는 모든 엔드포인트에 연결할 수 있습니다:
- **API Endpoint**: 엔드포인트 전체 URL (예: `http://localhost:11434/v1/chat/completions` 또는 OpenRouter);
- **Model name**: 호출할 모델 ID (예: `llama3.3`, `qwen2.5`);
- **API Key**: 제공업체의 Key (인증이 없는 로컬 모델인 경우 임의의 문자열 입력 가능).

---

## 🌍 지원 언어

- **번역 목표 언어 (12개)**: 한국어, 영어, 일본어, 중국어(간체/번체), 태국어, 스페인어, 프랑스어, 독일어, 포르투갈어, 인도네시아어, 베트남어
- **UI 인터페이스 언어 (14개)**: 한국어, 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어, 러시아어, 아랍어, 힌디어 등
- **원본 언어 자동 감지**: 전 세계 대부분의 주요 언어 제목을 자동으로 감지하며, 이미 목표 언어와 일치하는 제목은 자동으로 번역을 건너뜁니다.

---

## 🔒 개인정보 및 보안

- **데이터 수집 제로**: 사용자의 브라우징 기록을 추적하거나 개인 정보를 수집하지 않습니다.
- **로컬 저장소 전용**: API Key, 환경 설정 및 캐시는 사용자의 브라우저 `chrome.storage.local`에만 안전하게 저장됩니다.
- **중계 서버 없음**: 모든 요청은 선택한 AI 서비스로 직접 전송되거나 기기 내부에서 처리됩니다.

---

## ❓ 자주 묻는 질문 FAQ

<details>
<summary><b>Q1: 확장 프로그램 사용이 무료인가요?</b></summary>
네, 확장 프로그램 자체는 MIT 라이선스 기반의 완전 무료 오픈소스입니다. Chrome 내장 온디바이스 번역 기능도 100% 무료입니다. 외부 클라우드 AI API를 사용할 경우에만 해당 플랫폼의 요금 규정에 따라 사용료가 발생합니다.
</details>

<details>
<summary><b>Q2: 페이지를 새로고침하면 API 토큰이 중복으로 소모되나요?</b></summary>
아닙니다. 로컬 캐시 시스템이 내장되어 있어 이미 번역된 제목은 로컬에서 즉시 불러오므로 불필요한 네트워크 요청을 하지 않습니다.
</details>

<details>
<summary><b>Q3: 네트워크 오류로 번역에 실패하면 어떻게 하나요?</b></summary>
일부 제목의 번역에 실패하면 제목 옆에 빨간색 오류 배지가 표시됩니다. 해당 배지를 클릭하기만 하면 즉시 재번역됩니다.
</details>

---

## 💻 개발자 가이드

```bash
# 저장소 복제
git clone https://github.com/GaryGaryyy/YouTube-AI-Title-Translator.git
cd YouTube-AI-Title-Translator

# 전체 단위 테스트 실행 (Node.js 18+ 기본 테스트 러너, 외부 종속성 없음)
npm test
```

- **기술 스택**: Chrome Extension Manifest V3 (Content Script + Background Service Worker), 바닐라 HTML5/ES6+/CSS3, Chrome Storage Local API.
- **빌드 과정 없음**: 번들링 단계가 필요 없으므로, 코드를 수정한 후 확장 프로그램을 다시 로드하면 즉시 변경 사항이 반영됩니다.

---

## 📄 라이선스 및 피드백

- **라이선스**: 본 프로젝트는 [MIT License](LICENSE)에 따라 제공됩니다.
- **피드백**: 버그 제보나 기능 제안은 [GitHub Issues](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues) 또는 이메일(`garyzhang345@gmail.com`)로 환영합니다.

*최종 업데이트: 2026년 9월*
