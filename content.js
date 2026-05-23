// PIIGuard - content.js
// Intercepts Enter key and send button, redacts PII, then submits.

console.log("[PIIGuard] Content script loaded on:", window.location.hostname);

const IS_CLAUDE = window.location.hostname === "claude.ai";
const IS_CHATGPT = window.location.hostname === "chatgpt.com" || window.location.hostname === "chat.openai.com";

const INPUT_SELECTORS = [
  "#prompt-textarea",                          // ChatGPT
  "div[contenteditable='true'].ProseMirror",   // Claude specific
  "div[contenteditable='true']",               // Claude fallback
  "textarea",                                  // generic fallback
];

const SUBMIT_SELECTORS = [
  '[data-testid="send-button"]',               // ChatGPT
  'button[aria-label="Send Message"]',         // Claude (capital M)
  'button[aria-label="Send message"]',         // Claude variant
  'button[aria-label="Send"]',                 // generic
  'button[type="submit"]',                     // fallback
];

let isRedacting = false;

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

function redactThenSubmit(submitFn) {
  if (isRedacting) return;
  isRedacting = true;

  const input = findInputField();
  if (!input) {
    isRedacting = false;
    return submitFn();
  }

  const text = input.innerText || input.value || "";
  if (!text.trim()) {
    isRedacting = false;
    return submitFn();
  }

  chrome.storage.sync.get(["enabled", "rules"], (data) => {
    if (data.enabled) {
      const cleaned = anonymise(text, data.rules || {});
      if (cleaned !== text) setFieldText(input, cleaned);
    }
    setTimeout(() => {
      isRedacting = false;
      submitFn();
    }, 50);
  });
}

// --- Intercept Enter key ---
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  if (isRedacting) return;
  const input = findInputField();
  if (!input) return;
  const text = input.innerText || input.value || "";
  if (!text.trim()) return;

  event.stopImmediatePropagation();
  event.preventDefault();

  redactThenSubmit(() => {
    if (IS_CLAUDE) {
      // Claude needs Enter key dispatched on the input field itself
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13,
        bubbles: true, cancelable: true, composed: true,
      }));
    } else {
      const button = findSubmitButton();
      if (button) button.click();
    }
  });
}, true);

// --- Intercept send button click ---
function attachButtonListener() {
  const button = findSubmitButton();
  if (button && !button._piiguardAttached) {
    button.addEventListener("click", (event) => {
      if (isRedacting) return;
      event.stopImmediatePropagation();
      event.preventDefault();

      redactThenSubmit(() => {
        button._piiguardAttached = false;
        button.removeEventListener("click", button._piiguardHandler, true);
        button.click();
        setTimeout(() => attachButtonListener(), 100);
      });
    }, true);
    button._piiguardAttached = true;
    console.log("[PIIGuard] Submit button listener attached.");
  }
}

const observer = new MutationObserver(() => attachButtonListener());
observer.observe(document.body, { childList: true, subtree: true });
attachButtonListener();