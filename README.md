# 🧠 PageMind — AI Browser Companion

> Your AI companion for every webpage. Summarize, ask questions, explain anything — without leaving your tab.

**Built for the Next-Generation Web Experiences Hackathon**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pagemind.github.io-6c63ff?style=flat-square)](https://yourusername.github.io/pagemind)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome)](https://github.com/yourusername/pagemind/releases)

---

## What It Does

PageMind lives inside your browser as a Chrome side panel. Open it on **any webpage** and you can:

- **⚡ Summarize** — One click → 3 specific bullets about the current page
- **🧠 Ask Anything** — Full multi-turn AI chat about the page content
- **🔍 Explain Selection** — Highlight any text → right-click → instant explanation
- **✨ Auto-fill Forms** — AI generates realistic values for all form fields
- **🎯 Smart Chips** — Context-aware suggestions based on page type (news, product, GitHub, docs)

**Keyboard shortcut:** `Ctrl+Shift+K` (Mac: `Cmd+Shift+K`) — opens PageMind on any tab.

---

## Demo

👉 **[Try the live demo](https://yourusername.github.io/pagemind)** — no installation needed, just paste a free Gemini API key.

---

## Install (60 seconds)

### 1. Get a free Gemini API key
Visit [aistudio.google.com](https://aistudio.google.com), click "Get API key" → Create key. It's free, no credit card needed.

**Free tier:** 15 requests/min, 1,000,000 tokens/day — more than enough.

### 2. Download the extension
[Download the latest ZIP from Releases](https://github.com/yourusername/pagemind/releases/latest)

### 3. Load into Chrome
1. Open `chrome://extensions`
2. Toggle **Developer Mode** (top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder from the ZIP

### 4. Activate
Click the PageMind icon in your toolbar, paste your API key, and you're live.

---

## Build from Source

### Prerequisites
- Node.js 18+
- npm 9+

### Steps

```bash
# Clone the repo
git clone https://github.com/yourusername/pagemind.git
cd pagemind

# Install side panel dependencies
cd extension/sidepanel
npm install

# Build for production
npm run build
# Output goes to extension/dist-sidepanel/

# OR run in dev mode (hot reload)
npm run dev
```

Then load `extension/` as an unpacked Chrome extension.

> **Note:** After `npm run build`, the built files are in `extension/dist-sidepanel/`. Update `manifest.json`'s `side_panel.default_path` to `dist-sidepanel/index.html` for production.

### Development (dev mode)

In dev mode, Vite serves the side panel at `http://localhost:5173`. To use it:

1. Run `npm run dev` inside `extension/sidepanel/`
2. In `extension/manifest.json`, temporarily set `"default_path": "http://localhost:5173"` (requires `--allow-insecure-localhost` Chrome flag)

For simplicity, a pre-built version is included in `extension/sidepanel/dist/`.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Chrome Browser                  │
│                                                  │
│  ┌──────────────┐      ┌──────────────────────┐  │
│  │  Any Webpage │      │   Side Panel (React) │  │
│  │              │      │                      │  │
│  │ content.js   │─────▶│  Chat UI             │  │
│  │ (extracts    │      │  Summarize button    │  │
│  │  page text)  │      │  Action chips        │  │
│  └──────┬───────┘      └──────────┬───────────┘  │
│         └──────┬──────────────────┘              │
│                │                                 │
│         ┌──────▼───────┐                         │
│         │ background.js│                         │
│         │ (service     │                         │
│         │  worker)     │                         │
│         └──────┬───────┘                         │
└────────────────┼────────────────────────────────-┘
                 │
                 ▼
        ┌────────────────┐
        │  Gemini 1.5    │
        │  Flash API     │
        │  (free tier)   │
        └────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `extension/manifest.json` | Chrome extension config (MV3) |
| `extension/background.js` | Service worker: opens panel, relays messages, context menu |
| `extension/content.js` | Runs on every page: extracts text, detects forms, fills fields |
| `extension/sidepanel/src/App.jsx` | Main chat interface |
| `extension/sidepanel/src/lib/gemini.js` | Streaming Gemini API calls |
| `extension/sidepanel/src/components/ActionChips.jsx` | Context-aware suggestion chips |
| `landing/index.html` | GitHub Pages landing with live embedded demo |

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Extension | Chrome MV3 | Native browser extension standard |
| UI | React + Vite | Fast dev, component-based |
| Styling | Pure CSS | No build step dependency |
| AI | Gemini 1.5 Flash | Free tier: 1M tokens/day |
| AI API | Google Generative AI REST | Direct fetch, streaming SSE |
| Landing | HTML + CSS + JS | GitHub Pages, zero cost |

---

## Privacy

- Your Gemini API key is stored **only in `chrome.storage.local`** — on your device, never on any server.
- Page content is sent directly to Google's Gemini API from your browser. No intermediate server.
- No analytics, no telemetry, no accounts.

---

## Demo Script (for judges — 90 seconds)

| Step | Action | What they see |
|------|--------|--------------|
| 1 | Open BBC/NDTV news article | Normal webpage |
| 2 | Press `Ctrl+Shift+K` | Side panel slides in |
| 3 | Hit "Summarize" chip | 3-bullet summary in ~2s |
| 4 | Ask "What's the author's main argument?" | Specific, page-aware answer |
| 5 | Highlight confusing text → right-click → Explain | Instant explanation |
| 6 | Navigate to any signup form | Form page |
| 7 | Click "✨ Fill Form" chip | Fields auto-populate |
| 8 | Show landing page live demo | Polished project page |

---

## License

MIT — use freely, build on it, ship it.

---

*Built with ❤️ for the Next-Generation Web Experiences Hackathon · $0 cost · 100% open source*
