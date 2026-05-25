// PIIGuard - content.js
// Intercepts Enter key and send button, redacts PII, then submits.

console.log("[PIIGuard] Content script loaded on:", window.location.hostname);

const IS_CLAUDE = window.location.hostname === "claude.ai";

const INPUT_SELECTORS = [
  "#prompt-textarea",
  "div[contenteditable='true'].ProseMirror",
  "div[contenteditable='true']",
  "textarea",
];

const SUBMIT_SELECTORS = [
  '[data-testid="send-button"]',
  'button[aria-label="Send Message"]',
  'button[aria-label="Send message"]',
  'button[aria-label="Send"]',
  'button[type="submit"]',
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

function getFieldText(input) {
  if (input.isContentEditable) {
    const clone = input.cloneNode(true);
    clone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
    clone.querySelectorAll("p, div").forEach(block => {
      block.insertAdjacentText("afterend", "\n");
    });
    return clone.innerText.replace(/\n{3,}/g, "\n\n").trimEnd();
  }
  return input.value || "";
}

function setFieldText(input, text) {
  if (input.isContentEditable) {
    input.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(input);
    selection.removeAllRanges();
    selection.addRange(range);
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

  const text = getFieldText(input);
  if (!text.trim()) {
    isRedacting = false;
    return submitFn();
  }

  chrome.storage.sync.get(["enabled", "rules"], (data) => {
    if (data.enabled) {
      const cleaned = anonymise(text, data.rules || {});
      if (cleaned !== text) {
        setFieldText(input, cleaned);
        console.log("[PIIGuard] Text redacted.");
      }
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
  const text = getFieldText(input);
  if (!text.trim()) return;

  event.stopImmediatePropagation();
  event.preventDefault();

  redactThenSubmit(() => {
    if (IS_CLAUDE) {
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
    const handler = (event) => {
      if (isRedacting) return;
      event.stopImmediatePropagation();
      event.preventDefault();

      redactThenSubmit(() => {
        button._piiguardAttached = false;
        button.removeEventListener("click", button._piiguardHandler, true);
        button._piiguardHandler = null;
        button.click();
        setTimeout(() => attachButtonListener(), 100);
      });
    };

    button._piiguardHandler = handler;
    button.addEventListener("click", handler, true);
    button._piiguardAttached = true;
    console.log("[PIIGuard] Submit button listener attached.");
  }
}

const observer = new MutationObserver(() => attachButtonListener());
observer.observe(document.body, { childList: true, subtree: true });
attachButtonListener();