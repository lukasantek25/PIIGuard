// PIIGuard - background.js

console.log("[PIIGuard] Background service worker started.");

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    rules: {
      emails:      { detect: true },
      creditCards: { detect: true },
      ibans:       { detect: false },
    }
  });
  console.log("[PIIGuard] Default settings initialised.");
});