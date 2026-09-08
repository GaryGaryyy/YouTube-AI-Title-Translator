# Tradutor de Títulos do YouTube - Títulos Bilíngues com IA

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

> Você já perdeu ótimos vídeos no YouTube porque os títulos em outros idiomas eram difíceis de entender?  
> Cansado de traduções automáticas mecânicas que não entendem memes da internet, gírias e trocadilhos?  
> Frustrado ao ver ferramentas que substituem o título original por completo, tirando a chance de comparar e aprender expressões autênticas?

**Tradutor de Títulos do YouTube - Títulos Bilíngues com IA** foi criado exatamente para resolver isso! Uma extensão moderna para o Chrome feita sob medida para o YouTube: **a tradução substitui o título em destaque, enquanto o título original permanece logo abaixo em tamanho reduzido**. Com o poder dos grandes modelos de linguagem (LLM), ela compreende gírias, tom e clickbaits, além de adicionar etiquetas automáticas de categorias. E funciona instantaneamente sem precisar de nenhuma API Key!

---

## 🌟 Principais Recursos

- 🎯 **Exibição Bilíngue Perfeita**: A tradução substitui o título em destaque e o original fica logo abaixo. Navegue pelo feed sem precisar passar o cursor, entendendo os temas de imediato enquanto aprende expressões reais no contexto.
- 🧠 **Tradução Contextual com IA (Entende Memes e Gírias)**: Diga adeus às traduções rígidas palavra por palavra. A IA interpreta com precisão gírias da internet, memes culturais, abreviações e o estilo exagerado típico do YouTube.
- 🏷️ **Etiquetas Temáticas Inteligentes**: Ao traduzir, a IA identifica a categoria do vídeo e adiciona tags como [Tecnologia], [Notícias], [Música], [Finanças] ou [Jogos], facilitando a escolha rápida de conteúdo.
- ⚡ **Zero Configuração! Funciona sem Chave de API**: Compatível com a tradução nativa no dispositivo do Chrome 138+ (Chrome Translator). Totalmente gratuito, privado, offline e pronto para uso ao instalar.
- 🌐 **Suporte Universal para IAs e Modelos Locais**: Conecte-se facilmente aos principais provedores de IA em nuvem ou a qualquer endpoint compatível com o padrão OpenAI (incluindo modelos locais via Ollama ou LM Studio).
- 🚀 **Cache Local Ultrarrápido e Retentativa em um Clique**: Cache persistente no navegador evita requisições duplicadas e economiza tokens. Se ocorrer uma instabilidade de rede, basta clicar no selo vermelho para tentar novamente.

---

## 📌 Atualizações Recentes (v8.0.3)

- **Funciona sem chave de API**: na ausência de chave configurada, alterna automaticamente para a tradução no dispositivo do Chrome 138+, sem custo inicial.
- **Retentativa em um clique**: títulos com falha exibem um indicador vermelho; clique uma vez para traduzir novamente.
- **Ajuste no DeepSeek V4**: modo thinking desativado nos modelos V4 para evitar que o raciocínio esgote os tokens e corte o JSON.
- Painel pop-up com botão para limpar cache (com contagem), ponto verde em cartões com chave salva e tradução de exemplo no teste.
- Adicionados 12 novos idiomas de localização, totalizando 14 idiomas na interface.

---

## 📊 Matriz Comparativa de Recursos

| Critério | Tradutores Tradicionais de Páginas / Scripts | Esta Extensão (Modo Local sem Chave) | Esta Extensão (Modo IA em Nuvem / Local) |
| :--- | :--- | :--- | :--- |
| **Exibição** | Sobrescreve o original e quebra o layout | **Bilíngue: tradução em cima, original embaixo** | **Bilíngue: tradução em cima, original embaixo** |
| **Qualidade** | Literal, palavra por palavra | Fluida para o dia a dia | **Contextual, compreende memes e gírias** |
| **Etiquetas de Categoria** | ❌ Não | ❌ Não | **✅ Automático [Tech/Finanças/Música...]** |
| **Facilidade de Uso** | Baixa | **Imediata (pronto para usar)** | Requer chave de API ou modelo local |
| **Custo e Privacidade** | Pode enviar a página toda | **100% offline, grátis sempre, fica no dispositivo**| Conexão direta ao provedor, sem intermediários |

---

## 📸 Demonstração

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

## 🚀 Início Rápido

### Opção 1: Instalar pela Chrome Web Store (Recomendado)
👉 [Instalar diretamente pela Chrome Web Store](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)

### Opção 2: Carregar código-fonte no Modo Desenvolvedor
1. Baixe o arquivo ZIP da versão mais recente em [GitHub Releases](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/releases) e descompacte-o;
2. Abra `chrome://extensions/` no Chrome e ative o **"Modo do desenvolvedor"** no canto superior direito;
3. Clique em **"Carregar sem compactação"** e selecione a pasta descompactada.

---

## 🛠️ Uso e Configurações

Clique no ícone da extensão na barra de ferramentas para abrir o painel:

![Painel de configurações](screenshots/v8.0.1/config-ui.png)

### 1. Uso Básico (Sem Chave de API)
Se você não configurar nenhuma chave, a tradução no dispositivo do Chrome 138+ é ativada automaticamente. Basta abrir o YouTube para ver os títulos bilíngues de imediato!

### 2. Configuração Avançada de IA (Desbloqueie Memes + Etiquetas)
Para obter traduções mais refinadas e classificação automática:
1. **Translate titles into**: Escolha o idioma de destino (12 idiomas disponíveis);
2. **Choose AI provider**: Escolha seu provedor favorito e insira sua API Key;
3. Clique em **Save settings** e recarregue a página do YouTube.

---

## 🤖 Provedores de IA Suportados

| Provedor | Onde Obter a Chave |
| :--- | :--- |
| **DeepSeek (Recomendado)** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Claude** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **MiniMax** | [platform.minimax.io](https://platform.minimax.io/user-center/basic-information/interface-key) |
| **Z.AI** | [z.ai](https://z.ai/manage-apikey/apikey-list) |
| **Kimi** | [platform.kimi.ai](https://platform.kimi.ai/console/api-keys) |

### 🔌 Endpoints Personalizados Compatíveis com OpenAI
Selecione **Custom** para conectar qualquer serviço que siga o padrão OpenAI Chat Completions:
- **API Endpoint**: URL completa (ex: `http://localhost:11434/v1/chat/completions` ou OpenRouter);
- **Model name**: Nome exato do modelo (ex: `llama3.3`, `qwen2.5`);
- **API Key**: Chave do serviço (pode ser qualquer texto em modelos locais sem autenticação).

---

## 🌍 Idiomas Suportados

- **Idiomas de Destino (12)**: Português, Inglês, Chinês Simplificado/Tradicional, Japonês, Coreano, Tailandês, Espanhol, Francês, Alemão, Indonésio, Vietnamita.
- **Idiomas da Interface (14)**: Português, Inglês, Chinês, Japonês, Coreano, Espanhol, Francês, Alemão, Russo, Árabe, Hindi, etc.
- **Detecção Automática de Origem**: Detecta títulos em praticamente qualquer idioma e ignora automaticamente aqueles que já correspondem ao idioma de destino.

---

## 🔒 Privacidade e Segurança

- **Zero Coleta de Dados**: Não rastreamos navegação e não recolhemos informações pessoais.
- **Armazenamento 100% Local**: Chaves, preferências e cache residem exclusivamente em `chrome.storage.local` no seu navegador.
- **Sem Servidores Intermediários**: As requisições vão direto para a IA escolhida ou são processadas no seu próprio dispositivo.

---

## ❓ Perguntas Frequentes (FAQ)

<details>
<summary><b>Q1: A extensão é gratuita?</b></summary>
Sim, a extensão é totalmente gratuita e de código aberto sob a licença MIT. A tradução integrada no dispositivo também é 100% gratuita. Caso utilize APIs externas de IA na nuvem, as taxas de consumo são cobradas diretamente pelo provedor escolhido.
</details>

<details>
<summary><b>Q2: Recarregar a página consome tokens adicionais da API?</b></summary>
Não. A extensão possui um cache local persistente. Uma vez traduzido, o título é carregado instantaneamente do armazenamento local sem novas requisições de rede.
</details>

<details>
<summary><b>Q3: O que fazer se uma tradução falhar por erro de rede?</b></summary>
Um selo vermelho de erro aparecerá ao lado do título. Basta clicar nele para tentar traduzir novamente no mesmo instante.
</details>

---

## 💻 Guia do Desenvolvedor

```bash
# Clonar o repositório
git clone https://github.com/GaryGaryyy/YouTube-AI-Title-Translator.git
cd YouTube-AI-Title-Translator

# Executar testes unitários (Node.js 18+, sem dependências externas)
npm test
```

- **Tecnologias**: Chrome Extension Manifest V3 (Content Script + Background Service Worker), HTML5/ES6+/CSS3 nativo, Chrome Storage Local API.
- **Sem Etapa de Build**: Código nativo – sem necessidade de Webpack ou Vite. Recarregue a extensão em `chrome://extensions/` para testar alterações ao vivo.

---

## 📄 Licença e Contato

- **Licença**: Distribuído sob a [Licença MIT](LICENSE).
- **Feedback**: Relate bugs ou envie sugestões no [GitHub Issues](https://github.com/GaryGaryyy/YouTube-AI-Title-Translator/issues) ou por e-mail: `garyzhang345@gmail.com`.

*Última atualização: Setembro de 2026*
