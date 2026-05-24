# PIIGuard 🛡️

> Protect your privacy before your text reaches any AI tool. Locally. Instantly.

---

## What is PIIGuard?

PIIGuard is a Chrome extension that automatically detects and redacts sensitive data in your text **before** you send it to ChatGPT or Claude.

It runs entirely in your browser. Your data never leaves your device.

---

## The Problem

Every day people paste sensitive information into AI tools without thinking — emails, credit card numbers, bank account details. Once it's sent, you have no control over what happens to it.

PIIGuard sits between you and the AI, silently cleaning your text before it goes anywhere.

---

## What It Detects

| Entity | Default | Example |
|---|---|---|
| Email addresses | On | `john@example.com` → `[REDACTED]` |
| Credit cards | On | `4111 1111 1111 1111` → `[REDACTED]` |
| IBANs | Off | `GB29 NWBK 6016 1331 9268 19` → `[REDACTED]` |

---

## How It Works

1. You type or paste text into ChatGPT or Claude
2. Press Enter or click Send
3. PIIGuard detects sensitive entities and replaces them with `[REDACTED]`
4. The clean text is what the AI sees

Everything happens locally — no server, no API calls, no data collection.

---

## Supported Platforms

- ChatGPT
- Claude

---

## Project Structure

```
piiguard/
├── manifest.json      # Extension config and permissions
├── content.js         # Intercepts text on AI tool pages
├── detector.js        # RegEx detection and redaction logic
├── background.js      # Service worker and default settings
├── popup.html         # Extension popup UI
├── popup.js           # Popup settings logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Loading in Chrome (Development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `piiguard/` folder
4. The extension icon will appear in your toolbar

---

## Status

🚧 **Early release.** Feedback welcome.

---

## License

MIT

---

*Built with privacy as the architecture, not an afterthought.*