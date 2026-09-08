# YouTube-Titel-Übersetzer - Zweisprachige KI-Titel

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

> Haben Sie schon einmal großartige YouTube-Videos verpasst, weil fremdsprachige Titel schwer verständlich waren?  
> Haben Sie genug von starren, wortwörtlichen Maschinenübersetzungen, die Internet-Memes, Slang und Wortspiele völlig missverstehen?  
> Frustriert darüber, dass herkömmliche Tools den Originaltitel einfach überschreiben und Ihnen die Chance nehmen, authentische Ausdrücke zu vergleichen und zu lernen?

**YouTube-Titel-Übersetzer - Zweisprachige KI-Titel** wurde genau dafür entwickelt! Eine moderne Chrome-Erweiterung für YouTube: **Die Übersetzung ersetzt den Titel gut sichtbar, während der Originaltitel direkt darunter kompakt erhalten bleibt**. Angetrieben von modernen Large Language Models (LLMs) versteht sie Slang, Tonfall und Clickbait-Formulierungen und vergibt sogar automatische Kategorie-Tags. Funktioniert sofort ohne API-Schlüssel!

---

## 🌟 Hauptmerkmale

- 🎯 **Echte zweisprachige Inline-Anzeige**: Die Übersetzung wird als Haupttitel angezeigt und der Originaltitel bleibt darunter erhalten. Durchstöbern Sie Feeds ohne Mouseover, erfassen Sie Inhalte sofort und lernen Sie echte Ausdrücke im Kontext.
- 🧠 **Kontextbewusste KI-Übersetzung (Versteht Memes & Slang)**: Schluss mit starren Wort-für-Wort-Übersetzungen. Versteht Internet-Slang, kulturelle Memes, Abkürzungen und typische Clickbait-Muster präzise und übersetzt natürlich.
- 🏷️ **Intelligente Kategorie-Tags**: Während des Übersetzens erkennt die KI die Kategorie des Videos und fügt Tags wie [Tech], [News], [Musik], [Finanzen] oder [Gaming] hinzu, um Videos blitzschnell auszuwählen.
- ⚡ **Keine Einrichtung nötig! Funktioniert ohne API-Key**: Unterstützt die in Chrome 138+ integrierte Übersetzung direkt auf dem Gerät (Chrome Translator). Völlig kostenlos, offline und sofort einsatzbereit.
- 🌐 **Universelle KI- und lokale Modell-Unterstützung**: Nahtlose Verbindung zu führenden Cloud-KI-Anbietern oder benutzerdefinierten OpenAI-kompatiblen Endpunkten (einschließlich lokaler Modelle über Ollama oder LM Studio).
- 🚀 **Blitzschneller lokaler Cache & Ein-Klick-Wiederholung**: Der persistente Browser-Cache verhindert doppelte Anfragen und spart Kontingent. Bei einem Netzwerkfehler genügt ein Klick auf das rote Badge für eine sofortige Wiederholung.

---

## 📌 Kürzliche Updates (v8.0.3)

- **Funktioniert ohne API-Key**: Bei fehlendem Key wird automatisch auf die integrierte On-Device-Übersetzung von Chrome 138+ zurückgegriffen.
- **Klick-Wiederholung**: Fehlgeschlagene Titel zeigen einen roten Indikator; ein Klick startet die Übersetzung erneut.
- **DeepSeek V4 Thinking-Fix**: Thinking-Modus für V4-Modelle deaktiviert, um ein Abschneiden der JSON-Ausgabe zu verhindern.
- Neues Popup mit Cache-Bereinigungs-Schaltfläche (inkl. Zähler), grüner Punkt auf Karten mit gespeichertem Key und Vorschau beim Konfigurationstest.
- 12 neue Lokalisierungssprachen hinzugefügt (jetzt insgesamt 14 Oberflächensprachen).

---

## 📊 Funktionsvergleichsmatrix

| Vergleichskriterium | Herkömmliche Seitenübersetzer / Skripte | Diese Erweiterung (Integrierter Modus) | Diese Erweiterung (Cloud-/Lokaler KI-Modus) |
| :--- | :--- | :--- | :--- |
| **Darstellung** | Überschreibt das Original, zerstört Layout | **Zweisprachig: Übersetzung oben, Original unten** | **Zweisprachig: Übersetzung oben, Original unten** |
| **Qualität** | Wortwörtlich ohne Kontext | Fließend für den Alltag | **Kontextbezogen, versteht Slang & Memes** |
| **Kategorie-Tags** | ❌ Keine | ❌ Keine | **✅ Automatisch [Tech/Finanzen/Musik...]** |
| **Einrichtungsaufwand** | Gering | **Null (sofort einsatzbereit)** | API-Key oder lokales Modell erforderlich |
| **Kosten & Datenschutz**| Sendet ggf. ganze Seiteninhalte | **100% offline, kostenlos, bleibt auf dem Gerät** | Direkt zum Anbieter, keine Zwischenserver |

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

## 🚀 Schnellstart

### Option 1: Installation über den Chrome Web Store (Empfohlen)
👉 [Direkt im Chrome Web Store installieren](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)

### Option 2: Quellcode im Entwicklermodus laden
1. Neueste ZIP-Version von [GitHub Releases](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/releases) herunterladen und entpacken;
2. In Chrome `chrome://extensions/` aufrufen und oben rechts den **"Entwicklermodus"** aktivieren;
3. Oben links auf **"Entpackte Erweiterung laden"** klicken und den entpackten Ordner auswählen.

---

## 🛠️ Verwendung & Einstellungen

Klicken Sie auf das Erweiterungssymbol in der Symbolleiste, um das Menü zu öffnen:

![Einstellungsansicht](screenshots/v8.0.1/config-ui.png)

### 1. Basisfunktion (Kein API-Key erforderlich)
Ohne konfigurierten API-Key wird die On-Device-Übersetzung von Chrome 138+ automatisch aktiviert. Öffnen Sie einfach YouTube und sehen Sie sofort zweisprachige Titel!

### 2. Erweiterter KI-Modus (Memes & Kategorie-Tags freischalten)
Für nuancierte Übersetzungen und automatische Themen-Tags:
1. **Translate titles into**: Zielsprache wählen (12 Sprachen verfügbar);
2. **Choose AI provider**: Bevorzugten Anbieter wählen und API-Key eintragen;
3. Auf **Save settings** klicken und die YouTube-Seite aktualisieren.

---

## 🤖 Unterstützte KI-Anbieter

| Anbieter | API-Key erhalten |
| :--- | :--- |
| **DeepSeek (Empfohlen)** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Claude** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **MiniMax** | [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |
| **Z.AI** | [z.ai](https://z.ai/manage-apikey/apikey-list) |
| **Kimi** | [platform.kimi.ai](https://platform.kimi.ai/console/api-keys) |

### 🔌 Benutzerdefinierte OpenAI-kompatible Endpunkte
Wählen Sie **Custom**, um jeden mit OpenAI Chat Completions kompatiblen Dienst anzubinden:
- **API Endpoint**: Vollständige URL (z. B. `http://localhost:11434/v1/chat/completions` oder OpenRouter);
- **Model name**: Aufzurufender Modellname (z. B. `llama3.3`, `qwen2.5`);
- **API Key**: Schlüssel des Dienstes (kann bei lokalen Modellen beliebig sein).

---

## 🌍 Unterstützte Sprachen

- **Zielsprachen (12)**: Deutsch, Englisch, Chinesisch (vereinfacht/traditionell), Japanisch, Koreanisch, Thailändisch, Spanisch, Französisch, Portugiesisch, Indonesisch, Vietnamesisch.
- **Oberflächensprachen (14)**: Deutsch, Englisch, Chinesisch, Japanisch, Koreanisch, Spanisch, Französisch, Russisch, Arabisch, Hindi usw.
- **Automatische Quellsprachenerkennung**: Erkennt fast alle Sprachen weltweit und überspringt Titel, die bereits in der Zielsprache vorliegen.

---

## 🔒 Datenschutz & Sicherheit

- **Keine Datenerfassung**: Wir verfolgen kein Nutzerverhalten und speichern keine persönlichen Daten.
- **Rein lokaler Speicher**: API-Keys, Einstellungen und Cache verbleiben ausschließlich in Ihrem Browser (`chrome.storage.local`).
- **Keine Zwischenserver**: Anfragen gehen direkt zum gewählten KI-Dienst oder bleiben lokal auf dem Gerät.

---

## ❓ Häufig gestellte Fragen (FAQ)

<details>
<summary><b>Q1: Ist die Erweiterung kostenlos?</b></summary>
Ja, die Erweiterung ist kostenlos und Open Source unter der MIT-Lizenz. Die integrierte Chrome-Übersetzung ist 100% gratis. Bei Cloud-APIs fallen Gebühren gemäß der Preisliste des jeweiligen Anbieters an.
</details>

<details>
<summary><b>Q2: Verbraucht das Neuladen von Seiten zusätzliche API-Tokens?</b></summary>
Nein. Die Erweiterung verfügt über einen persistenten lokalen Cache. Bereits übersetzte Titel werden sofort aus dem Speicher geladen, ohne erneute Netzwerkanfragen.
</details>

<details>
<summary><b>Q3: Was tun, wenn eine Übersetzung fehlschlägt?</b></summary>
Neben dem Titel erscheint ein rotes Fehlersymbol. Klicken Sie einfach darauf, um die Übersetzung sofort erneut zu starten.
</details>

---

## 💻 Entwickler-Leitfaden

```bash
# Repository klonen
git clone https://github.com/GaryGaryyy/YouTube-AI-Title-Translator.git
cd YouTube-AI-Title-Translator

# Alle Tests ausführen (Node.js 18+, keine externen Abhängigkeiten)
npm test
```

- **Technologie-Stack**: Chrome Extension Manifest V3 (Content Script + Background Service Worker), natives HTML5/ES6+/CSS3, Chrome Storage Local API.
- **Kein Build-Schritt**: Natives JavaScript – kein Webpack oder Vite erforderlich. Nach Codeänderungen einfach in `chrome://extensions/` neu laden.

---

## 📄 Lizenz & Feedback

- **Lizenz**: Veröffentlicht unter der [MIT-Lizenz](LICENSE).
- **Feedback**: Fehlermeldungen und Vorschläge sind über [GitHub Issues](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues) oder per E-Mail an `garyzhang345@gmail.com` willkommen.

*Zuletzt aktualisiert: September 2026*
