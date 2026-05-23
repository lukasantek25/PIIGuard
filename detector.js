// AnonyMe - detector.js
// Detects PII entities in text using RegEx patterns.

const PATTERNS = {
  emails: {
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    label: "email",
  },
};

// Returns text with all detected and enabled entities replaced with [REDACTED]
function anonymise(text, rules) {
  let result = text;

  for (const [key, pattern] of Object.entries(PATTERNS)) {
    const rule = rules[key];
    if (!rule || !rule.detect) continue;

    result = result.replace(new RegExp(pattern.regex.source, "g"), "[REDACTED]");
  }

  return result;
}