// PIIGuard - popup.js

const masterToggle = document.getElementById("master-toggle");
const statusLabel  = document.getElementById("status-label");
const rulesSection = document.getElementById("rules-section");

// Individual rule checkboxes
const checkboxes = {
  names:       document.getElementById("rule-names"),
  emails:      document.getElementById("rule-emails"),
  phones:      document.getElementById("rule-phones"),
  ibans:       document.getElementById("rule-ibans"),
  creditCards: document.getElementById("rule-creditCards"),
};

// Subgroup definitions — drives both checkbox logic and indeterminate states
const subgroups = {
  identity:  { keys: ["names"] },
  contact:   { keys: ["emails", "phones"] },
  financial: { keys: ["ibans", "creditCards"] },
};

// All rule keys in display order
const allKeys = ["names", "emails", "phones", "ibans", "creditCards"];

const nerBadge = document.getElementById("ner-badge");

// --- Load saved settings ---
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
    for (const name of Object.keys(subgroups)) updateSubgroupCheckbox(name);
    updateCategoryCheckbox();
  }
  // Show NER badge if model is still loading
  if (checkboxes.names?.checked) {
    chrome.storage.local.get("nerStatus", (d) => updateNerBadge(d.nerStatus));
  }
});

// --- Master toggle ---
masterToggle.addEventListener("change", () => {
  const enabled = masterToggle.checked;
  updateMasterUI(enabled);
  chrome.storage.sync.set({ enabled });
});

// --- Individual rule checkboxes ---
for (const [key, checkbox] of Object.entries(checkboxes)) {
  checkbox.addEventListener("change", () => {
    saveRule(key, checkbox.checked);
    const subgroupName = findSubgroup(key);
    if (subgroupName) updateSubgroupCheckbox(subgroupName);
    updateCategoryCheckbox();
    if (key === "names") {
      if (checkbox.checked) {
        chrome.storage.local.get("nerStatus", (d) => updateNerBadge(d.nerStatus || "loading"));
      } else {
        updateNerBadge(null);
      }
    }
  });
}

// --- Subgroup checkboxes ---
for (const [name, group] of Object.entries(subgroups)) {
  const subCheckbox = document.getElementById("sub-toggle-" + name);
  if (!subCheckbox) continue;
  subCheckbox.addEventListener("change", () => {
    const checked = subCheckbox.checked;
    chrome.storage.sync.get("rules", (data) => {
      const rules = data.rules || {};
      group.keys.forEach((key) => {
        rules[key] = { detect: checked };
        checkboxes[key].checked = checked;
      });
      chrome.storage.sync.set({ rules });
    });
    updateCategoryCheckbox();
    if (group.keys.includes("names")) {
      if (checked) {
        chrome.storage.local.get("nerStatus", (d) => updateNerBadge(d.nerStatus || "loading"));
      } else {
        updateNerBadge(null);
      }
    }
  });
}

// --- General category checkbox (select/deselect all) ---
document.getElementById("cat-toggle-general").addEventListener("change", (e) => {
  const checked = e.target.checked;
  chrome.storage.sync.get("rules", (data) => {
    const rules = data.rules || {};
    allKeys.forEach((key) => {
      rules[key] = { detect: checked };
      checkboxes[key].checked = checked;
    });
    chrome.storage.sync.set({ rules });
  });
  for (const name of Object.keys(subgroups)) {
    const sub = document.getElementById("sub-toggle-" + name);
    if (sub) { sub.checked = checked; sub.indeterminate = false; }
  }
  if (checked) {
    chrome.storage.local.get("nerStatus", (d) => updateNerBadge(d.nerStatus || "loading"));
  } else {
    updateNerBadge(null);
  }
});

// --- Category header expand/collapse ---
document.getElementById("header-general").addEventListener("click", (e) => {
  if (e.target.type === "checkbox") return;
  const content = document.getElementById("cat-general");
  const arrow   = document.getElementById("arrow-general");
  const isOpen  = content.style.display !== "none";
  content.style.display = isOpen ? "none" : "flex";
  arrow.classList.toggle("open", !isOpen);
});

// --- Helpers ---

function saveRule(key, detect) {
  chrome.storage.sync.get("rules", (data) => {
    const rules = data.rules || {};
    rules[key] = { detect };
    chrome.storage.sync.set({ rules });
  });
}

function findSubgroup(key) {
  for (const [name, group] of Object.entries(subgroups)) {
    if (group.keys.includes(key)) return name;
  }
  return null;
}

function updateSubgroupCheckbox(name) {
  const group = subgroups[name];
  const sub   = document.getElementById("sub-toggle-" + name);
  if (!sub) return;
  const allChecked  = group.keys.every(k => checkboxes[k]?.checked);
  const noneChecked = group.keys.every(k => !checkboxes[k]?.checked);
  sub.checked       = allChecked;
  sub.indeterminate = !allChecked && !noneChecked;
}

function updateCategoryCheckbox() {
  const cat         = document.getElementById("cat-toggle-general");
  const allChecked  = allKeys.every(k => checkboxes[k]?.checked);
  const noneChecked = allKeys.every(k => !checkboxes[k]?.checked);
  cat.checked       = allChecked;
  cat.indeterminate = !allChecked && !noneChecked;
}

function updateNerBadge(status) {
  if (!nerBadge) return;
  if (status === "loading") {
    nerBadge.textContent = "Loading…";
    nerBadge.style.display = "inline";
    nerBadge.style.background = "#dbeafe";
    nerBadge.style.color = "#1e40af";
  } else if (status === "error") {
    nerBadge.textContent = "Failed";
    nerBadge.style.display = "inline";
    nerBadge.style.background = "#fee2e2";
    nerBadge.style.color = "#991b1b";
  } else {
    nerBadge.style.display = "none";
  }
}

function updateMasterUI(enabled) {
  statusLabel.textContent = enabled ? "On" : "Off";
  statusLabel.classList.toggle("off", !enabled);
  rulesSection.style.opacity       = enabled ? "1"    : "0.4";
  rulesSection.style.pointerEvents = enabled ? "auto" : "none";
}

// Update NER badge in real time if model loads while popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.nerStatus && checkboxes.names?.checked) {
    updateNerBadge(changes.nerStatus.newValue);
  }
});