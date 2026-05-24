// PIIGuard - detector.js
// Detects PII entities in text using RegEx patterns.

const PATTERNS = {
  emails: {
    regex: /[a-zA-Z0-9._%+\-!#$%&'*+/=?^`{|}~]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    label: "email",
  },
  ibans: {
    // Allows spaces, double spaces or dashes as separators
    regex: /\b[A-Z]{2}\d{2}(?:[\s\-]{1,2}?[A-Z0-9]){11,30}\b/g,
    label: "iban",
  },
  creditCards: {
    // Visa/Mastercard: 4-4-4-4, Amex: 4-6-5
    // Allows single or double spaces, or dashes as separators
    regex: /\b(?:\d{4}[\s\-]{1,2}\d{4}[\s\-]{1,2}\d{4}[\s\-]{1,2}\d{4}|\d{4}[\s\-]{1,2}\d{6}[\s\-]{1,2}\d{5})\b/g,
    label: "credit card",
  },
};

const PATTERN_ORDER = ["emails", "ibans", "creditCards"];

function anonymise(text, rules) {
  const matched = new Set();
  const entities = [];

  for (const key of PATTERN_ORDER) {
    const pattern = PATTERNS[key];
    const rule = rules[key];
    if (!rule || !rule.detect) continue;

    const regex = new RegExp(pattern.regex.source, "g");
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;

      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (matched.has(i)) { overlaps = true; break; }
      }
      if (overlaps) continue;

      for (let i = start; i < end; i++) matched.add(i);
      entities.push({ start, end });
    }
  }

  entities.sort((a, b) => b.start - a.start);
  let result = text;
  for (const entity of entities) {
    result = result.slice(0, entity.start) + "[REDACTED]" + result.slice(entity.end);
  }

  return result;
}