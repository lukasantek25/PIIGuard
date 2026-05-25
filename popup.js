// PIIGuard - popup.js

const masterToggle = document.getElementById("master-toggle");
const statusLabel = document.getElementById("status-label");
const rulesSection = document.getElementById("rules-section");

const checkboxes = {
  emails:      document.getElementById("rule-emails"),
  creditCards: document.getElementById("rule-creditCards"),
  phones:      document.getElementById("rule-phones"),
  ibans:       document.getElementById("rule-ibans"),
};

const categories = {
  general: ["emails", "creditCards", "phones", "ibans"],
};

// Load saved settings
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
    updateCategoryCheckbox("general");
  }
});

// Master toggle
masterToggle.addEventListener("change", () => {
  const enabled = masterToggle.checked;
  updateMasterUI(enabled);
  chrome.storage.sync.set({ enabled });
});

// Entity checkboxes
for (const [key, checkbox] of Object.entries(checkboxes)) {
  checkbox.addEventListener("change", () => {
    chrome.storage.sync.get("rules", (data) => {
      const rules = data.rules || {};
      rules[key] = { detect: checkbox.checked };
      chrome.storage.sync.set({ rules });
    });
    updateCategoryCheckbox("general");
  });
}

// Category header — toggle expand/collapse
document.getElementById("header-general").addEventListener("click", (e) => {
  if (e.target.type === "checkbox") return;
  const content = document.getElementById("cat-general");
  const arrow = document.getElementById("arrow-general");
  const isOpen = content.style.display !== "none";
  content.style.display = isOpen ? "none" : "block";
  arrow.classList.toggle("open", !isOpen);
});

// Category checkbox — select/deselect all
document.getElementById("cat-toggle-general").addEventListener("change", (e) => {
  const checked = e.target.checked;
  chrome.storage.sync.get("rules", (data) => {
    const rules = data.rules || {};
    categories.general.forEach((key) => {
      rules[key] = { detect: checked };
      checkboxes[key].checked = checked;
    });
    chrome.storage.sync.set({ rules });
  });
});

function updateCategoryCheckbox(name) {
  const catCheckbox = document.getElementById("cat-toggle-" + name);
  const allChecked = categories[name].every(key => checkboxes[key].checked);
  const noneChecked = categories[name].every(key => !checkboxes[key].checked);
  catCheckbox.checked = allChecked;
  catCheckbox.indeterminate = !allChecked && !noneChecked;
}

function updateMasterUI(enabled) {
  statusLabel.textContent = enabled ? "On" : "Off";
  rulesSection.style.opacity = enabled ? "1" : "0.4";
  rulesSection.style.pointerEvents = enabled ? "auto" : "none";
}