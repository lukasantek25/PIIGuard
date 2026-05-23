// PIIGuard - content.js
// Intercepts Enter key, redacts PII, then submits.

console.log("[PIIGuard] Content script loaded on:", window.location.hostname);

const INPUT_SELECTORS = [
  "#prompt-textarea",
  "div[contenteditable='true']",
  "textarea",
];

const SUBMIT_SELECTORS = [
  '[data-testid="send-button"]',
  'button[aria-label="Send message"]',
  'button[aria-label="Send"]',
  'button[type="submit"]',
];

function findInputField() {
  for (const selector of INPUT_SELECTORS) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function findSubmitButton() {
  for (const selector of SUBMIT_SELECTORS) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function setFieldText(input, text) {
  if (input.isContentEditable) {
    input.focus();
    input.innerText = "";
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(input);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("insertText", false, text);
  } else {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    ).set;
    nativeInputValueSetter.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// Intercept Enter, block it, redact, then click send button
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;

  const input = findInputField();
  if (!input) return;

  const text = input.innerText || input.value || "";
  if (!text.trim()) return;

  // Block the original submit
  event.stopImmediatePropagation();
  event.preventDefault();

  chrome.storage.sync.get(["enabled", "rules"], (data) => {
    if (data.enabled) {
      const cleaned = anonymise(text, data.rules || {});
      if (cleaned !== text) {
        setFieldText(input, cleaned);
      }
    }

    // Submit after redaction is applied
    setTimeout(() => {
      const button = findSubmitButton();
      if (button) {
        button.click();
      }
    }, 30);
  });
}, true);