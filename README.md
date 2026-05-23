# PIIGuard 🕶️

> Protect your privacy before your text reaches any AI tool. Locally. Instantly. Privately.

---

## What is PIIGuard?
PIIGuard is a browser extension that detects and anonymizes sensitive data in your text **before** you paste it into ChatGPT, Claude, Gemini, Copilot, or any other AI tool.

It runs entirely on your device. Your data never touches our servers.

---

## The Problem

Millions of people paste sensitive information into AI tools every day — contracts with real names, emails with salaries, support tickets with customer data. Most don't think twice about it.

PIIGuard sits between you and the AI, quietly cleaning your text before it goes anywhere.

---

## Project Structure

```
piiguard/
├── manifest.json      # Extension config, permissions, entry points
├── content.js         # Injected into AI tool pages, intercepts text fields
├── detector.js        # RegEx patterns and anonymisation logic
├── background.js      # Service worker, handles messaging and default settings
├── popup.html         # UI shown when clicking the extension icon
├── popup.js           # Loads and saves user settings to chrome.storage
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## What It Detects

| Entity | Default | Action options |
|---|---|---|
| Email addresses | On | Redact, Replace with synthetic |
| Phone numbers | On | Redact, Replace with synthetic |
| IBANs | On | Redact, Replace with synthetic |
| Credit card numbers | On | Redact, Replace with synthetic |
| IP addresses | Off | Redact, Replace with synthetic |
| Dates | Off | Redact, Replace with synthetic |

---

## Supported AI Tools

- ChatGPT
- Claude
- Gemini
- Microsoft Copilot

---

## Loading in Chrome (Development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `piiguard/` folder
4. The extension icon will appear in your toolbar

---

## Status

🚧 **Early development.** Not yet available in the Chrome Web Store.

---

## License

TBD — to be decided before public release.

---

*Built with privacy as the architecture, not an afterthought.*