// PIIGuard - detector.js

// --- Luhn algorithm for credit card validation ---
function luhn(raw) {
  const digits = raw.replace(/\D/g, '');
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// --- IBAN mod-97 checksum validation ---
function validIBAN(raw) {
  const iban = raw.replace(/[\s\-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.split('').map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 ? (code - 55).toString() : c;
  }).join('');
  let remainder = 0;
  for (const chunk of numeric.match(/.{1,9}/g)) {
    remainder = parseInt(remainder + chunk, 10) % 97;
  }
  return remainder === 1;
}

const PATTERNS = {
  emails: {
    regex: /[a-zA-Z0-9._%+\-!#$&'*\/=?^`{|}~]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    rule: 'emails',
    label: '[EMAIL]',
  },
  creditCards: {
    // Visa/MC/etc (16 digits), Amex (15 digits) — separators optional
    regex: /\b(?:\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}|\d{4}[\s\-]?\d{6}[\s\-]?\d{5})\b/g,
    rule: 'creditCards',
    label: '[CREDIT CARD]',
    validate: (match) => luhn(match),
  },
  ibans: {
    // Country code + check digits + BBAN, spaces/dashes optional between groups
    regex: /\b[A-Z]{2}\d{2}[\s\-]?(?:[A-Z0-9]{4}[\s\-]?){2,7}[A-Z0-9]{1,4}\b/g,
    rule: 'ibans',
    label: '[IBAN]',
    validate: (match) => validIBAN(match),
  },
};

const PATTERN_ORDER = ['emails', 'ibans', 'creditCards'];

// Local-format phone regex — catches 0... numbers (e.g. 0664 123 4567)
// libphonenumber won't catch these without a country hint, so we always run this
const LOCAL_PHONE_REGEX = /\b0\d{1,4}[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}\b/g;

// Phone detection — hybrid:
//   libphonenumber-js for international +XX numbers (accurate, global)
//   regex for local 0... numbers (libphonenumber misses these without a country hint)
//   pure regex fallback if libphonenumber bundle is not loaded
function findPhones(text, rules) {
  if (!rules.phones?.detect) return [];

  const matched = new Set();
  const entities = [];

  if (typeof window !== 'undefined' && window.libphonenumber?.findPhoneNumbersInText) {
    // International numbers via libphonenumber
    const matches = window.libphonenumber.findPhoneNumbersInText(text);
    for (const match of matches) {
      entities.push({ start: match.startsAt, end: match.endsAt, label: '[PHONE]' });
      for (let i = match.startsAt; i < match.endsAt; i++) matched.add(i);
    }
  }

  // Local 0... numbers via regex (always runs, deduped against libphonenumber matches)
  const localRegex = new RegExp(LOCAL_PHONE_REGEX.source, 'g');
  let match;
  while ((match = localRegex.exec(text)) !== null) {
    const start = match.index, end = match.index + match[0].length;
    let overlaps = false;
    for (let i = start; i < end; i++) if (matched.has(i)) { overlaps = true; break; }
    if (overlaps) continue;
    entities.push({ start, end, label: '[PHONE]' });
  }

  // Pure regex fallback if libphonenumber is not loaded at all
  if (typeof window === 'undefined' || !window.libphonenumber?.findPhoneNumbersInText) {
    const intlRegex = /\+\d{1,3}[\s\-.]?\d{1,4}[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}\b/g;
    while ((match = intlRegex.exec(text)) !== null) {
      const start = match.index, end = match.index + match[0].length;
      let overlaps = false;
      for (let i = start; i < end; i++) if (matched.has(i)) { overlaps = true; break; }
      if (overlaps) continue;
      entities.push({ start, end, label: '[PHONE]' });
    }
  }

  return entities;
}

async function anonymise(text, rules) {
  const matched = new Set();
  const entities = [];

  // Regex-based patterns (emails, cards, IBANs)
  for (const key of PATTERN_ORDER) {
    const pattern = PATTERNS[key];
    const rule = rules[pattern.rule];
    if (!rule || !rule.detect) continue;

    const regex = new RegExp(pattern.regex.source, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;

      // Run checksum / Luhn validation if defined
      if (pattern.validate && !pattern.validate(match[0])) continue;

      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (matched.has(i)) { overlaps = true; break; }
      }
      if (overlaps) continue;

      for (let i = start; i < end; i++) matched.add(i);
      entities.push({ start, end, label: pattern.label });
    }
  }

  // Phone detection (libphonenumber or fallback)
  for (const phone of findPhones(text, rules)) {
    let overlaps = false;
    for (let i = phone.start; i < phone.end; i++) {
      if (matched.has(i)) { overlaps = true; break; }
    }
    if (overlaps) continue;
    for (let i = phone.start; i < phone.end; i++) matched.add(i);
    entities.push(phone);
  }

  // NER — personal names (runs after regex so names inside emails/IBANs are skipped)
  if (typeof nerDetect === 'function' && rules.names?.detect) {
    const nerEntities = await nerDetect(text, rules);
    for (const entity of nerEntities) {
      let overlaps = false;
      for (let i = entity.start; i < entity.end; i++) {
        if (matched.has(i)) { overlaps = true; break; }
      }
      if (overlaps) continue;
      for (let i = entity.start; i < entity.end; i++) matched.add(i);
      entities.push(entity);
    }
  }

  entities.sort((a, b) => b.start - a.start);
  let result = text;
  for (const entity of entities) {
    result = result.slice(0, entity.start) + entity.label + result.slice(entity.end);
  }

  return result;
}