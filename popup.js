// PIIGuard - popup.js

const masterToggle = document.getElementById("master-toggle");
const statusLabel = document.getElementById("status-label");
const rulesSection = document.getElementById("rules-section");

const checkboxes = {
  emails:      document.getElementById("rule-emails"),
  creditCards: document.getElementById("rule-creditCards"),
  ibans:       document.getElementById("rule-ibans"),
};

chrome.storage.sync.get(["enabled", "rules"], (data) => {
  if (data.enabled !== undefined) {
    masterToggle.checked = data.enabled;
    updateMasterUI(data.enabled);
  }
  if (data.rules) {
    for (const [key, checkbox] of Object.entries(checkboxes)) {
      if (data.rules[key] !== undefined) {
        checkbox.checked = data.rules[key].detect;
      }
    }
  }
});

masterToggle.addEventListener("change", () => {
  const enabled = masterToggle.checked;
  updateMasterUI(enabled);
  chrome.storage.sync.set({ enabled });
});

for (const [key, checkbox] of Object.entries(checkboxes)) {
  checkbox.addEventListener("change", () => {
    chrome.storage.sync.get("rules", (data) => {
      const rules = data.rules || {};
      rules[key] = { detect: checkbox.checked };
      chrome.storage.sync.set({ rules });
    });
  });
}

function updateMasterUI(enabled) {
  statusLabel.textContent = enabled ? "On" : "Off";
  rulesSection.style.opacity = enabled ? "1" : "0.4";
  rulesSection.style.pointerEvents = enabled ? "auto" : "none";
}