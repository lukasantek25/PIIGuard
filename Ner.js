// PIIGuard - ner.js
// Client-side NER using Transformers.js — runs entirely in the browser.
// Loaded lazily; model is downloaded once and cached by the browser.

let nerPipeline = null;
let nerLoading = false;
let nerReady = false;
let nerQueue = []; // pending resolve callbacks while model is loading

function setNerStatus(status) {
  chrome.storage.local.set({ nerStatus: status });
}

async function loadNER() {
  if (nerReady) return true;

  // If already loading, queue up and wait for it to finish
  if (nerLoading) {
    return new Promise(resolve => nerQueue.push(resolve));
  }

  nerLoading = true;
  setNerStatus('loading');
  console.log('[PIIGuard] Loading NER model... (first load downloads and caches the model)');

  try {
    const { pipeline, env } = await import(chrome.runtime.getURL('transformers.min.js'));

    env.allowLocalModels = false;
    env.useBrowserCache = true;

    nerPipeline = await pipeline(
      'token-classification',
      'Xenova/distilbert-base-multilingual-cased-ner-hrl'
      // No aggregation_strategy — offsets are null for this model so we
      // group BIO tokens and recover positions ourselves in extractNamesFromBIO()
    );

    nerReady = true;
    nerLoading = false;
    setNerStatus('ready');
    console.log('[PIIGuard] NER model ready.');

    nerQueue.forEach(resolve => resolve(true));
    nerQueue = [];
    return true;

  } catch (err) {
    nerLoading = false;
    setNerStatus('error');
    console.warn('[PIIGuard] NER model failed to load:', err);

    nerQueue.forEach(resolve => resolve(false));
    nerQueue = [];
    return false;
  }
}

// Group BIO-tagged tokens into named entities and recover character positions
// by searching the original text. Handles WordPiece ## subword tokens.
function extractNamesFromBIO(text, tokens) {
  const groups = [];
  let current = null;

  for (const token of tokens) {
    const tag = token.entity || token.entity_group || '';
    const word = token.word || '';

    if (tag === 'B-PER' || tag === 'PER') {
      if (current) groups.push(current);
      current = [word];
    } else if (tag === 'I-PER' && current) {
      current.push(word);
    } else {
      if (current) groups.push(current);
      current = null;
    }
  }
  if (current) groups.push(current);

  const entities = [];
  let searchFrom = 0;

  for (const words of groups) {
    // Reconstruct surface form, joining WordPiece ## subword tokens without space
    let surface = '';
    for (const word of words) {
      if (word.startsWith('##')) {
        surface += word.slice(2);
      } else {
        surface += (surface ? ' ' : '') + word;
      }
    }

    // Find position in original text (case-insensitive, advancing to avoid re-matching)
    const idx = text.toLowerCase().indexOf(surface.toLowerCase(), searchFrom);
    if (idx !== -1) {
      entities.push({ start: idx, end: idx + surface.length, label: '[NAME]' });
      searchFrom = idx + surface.length;
    }
  }

  return entities;
}

async function nerDetect(text, rules) {
  if (!rules?.names?.detect) return [];

  // If model isn't ready, start loading in background but don't block submission.
  // First use may not catch names — every use after the model is cached will.
  if (!nerReady) {
    loadNER();
    return [];
  }

  try {
    const results = await nerPipeline(text);
    const entities = extractNamesFromBIO(text, results);
    console.log('[PIIGuard NER] entities found:', JSON.stringify(entities));
    return entities;
  } catch (err) {
    console.warn('[PIIGuard] NER inference failed:', err);
    return [];
  }
}

// Pre-warm: start loading the model immediately if names detection is already enabled
chrome.storage.sync.get('rules', (data) => {
  if (data.rules?.names?.detect) {
    loadNER();
  }
});

// Watch for names being toggled on so we can start loading right away
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.rules?.newValue?.names?.detect) {
    loadNER();
  }
});