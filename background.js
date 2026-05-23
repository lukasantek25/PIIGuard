// AnonyMe - background.js
// Service worker. Runs in the background, independent of any tab.
// Handles communication between the popup and content scripts.

console.log("[AnonyMe] Background service worker started.");

// --- Listen for messages from popup or content scripts ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[AnonyMe] Message received:", message);

  if (message.type === "PING") {
    sendResponse({ status: "OK" });
  }

  return true;
});

// --- On install: set default settings in storage ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    rules: {
      emails:      { detect: true,  action: "redact" },
      phones:      { detect: true,  action: "redact" },
      ibans:       { detect: true,  action: "redact" },
      creditCards: { detect: true,  action: "redact" },
      ipAddresses: { detect: false, action: "redact" },
      dates:       { detect: false, action: "redact" },
    }
  });
  console.log("[AnonyMe] Default settings initialised.");
});