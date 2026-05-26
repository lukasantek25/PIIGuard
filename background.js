// PIIGuard - background.js

console.log("[PIIGuard] Background service worker started.");

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    rules: {
      emails:      { detect: true },
      creditCards: { detect: true },
      phones:      { detect: true },
      ibans:       { detect: true },
      names:       { detect: true }, // on by default — model downloads in background on first page load
    }
  });
  console.log("[PIIGuard] Default settings initialised.");
});