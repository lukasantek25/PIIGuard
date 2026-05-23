// AnonyMe - popup.js

const masterToggle = document.getElementById("master-toggle");
const statusLabel = document.getElementById("status-label");
const rulesSection = document.getElementById("rules-section");
const emailCheckbox = document.getElementById("rule-emails");

// Load saved settings
chrome.storage.sync.get(["enabled", "rules"], (data) => {
  if (data.enabled !== undefined) {
    masterToggle.checked = data.enabled;
    updateMasterUI(data.enabled);
  }
  if (data.rules?.emails !== undefined) {
    emailCheckbox.checked = data.rules.emails.detect;
  }
});

// Master toggle
masterToggle.addEventListener("change", () => {
  const enabled = masterToggle.checked;
  updateMasterUI(enabled);
  chrome.storage.sync.set({ enabled });
});

// Email checkbox
emailCheckbox.addEventListener("change", () => {
  chrome.storage.sync.get("rules", (data) => {
    const rules = data.rules || {};
    rules.emails = { detect: emailCheckbox.checked };
    chrome.storage.sync.set({ rules });
  });
});

function updateMasterUI(enabled) {
  statusLabel.textContent = enabled ? "On" : "Off";
  rulesSection.style.opacity = enabled ? "1" : "0.4";
  rulesSection.style.pointerEvents = enabled ? "auto" : "none";
}