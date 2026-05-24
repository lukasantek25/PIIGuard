// PIIGuard - ner.js
// Client-side NER using Transformers.js (runs entirely in the browser).
// Requires transformers.min.js to be bundled locally in the extension folder.

let nerPipeline = null;
let nerLoading = false;
let nerReady = false;

async function loadNER() {
  if (nerReady || nerLoading) return;
  nerLoading = true;

  try {
    const { pipeline, env } = await import(chrome.runtime.getURL("transformers.min.js"));

    env.allowLocalModels = false;
    env.useBrowserCache = true;

    console.log("[PIIGuard] Loading NER model... (first load may take a moment)");

    nerPipeline = await pipeline(
      "token-classification",
      "Xenova/bert-base-NER",
      { aggregation_strategy: "simple" }
    );

    nerReady = true;
    nerLoading = false;
    console.log("[PIIGuard] NER model ready.");
  } catch (err) {
    nerLoading = false;
    console.warn("[PIIGuard] NER model failed to load:", err);
  }
}

async function nerDetect(text, rules) {
  if (!rules) return [];

  const nerEnabled = rules.names?.detect || rules.locations?.detect;
  if (!nerEnabled) return [];

  if (!nerReady) {
    await loadNER();
    if (!nerReady) return [];
  }

  try {
    const results = await nerPipeline(text);
    const entities = [];

    for (const entity of results) {
      const label = entity.entity_group || entity.entity;
      const isPerson   = label === "PER" && rules.names?.detect;
      const isLocation = label === "LOC" && rules.locations?.detect;

      if (isPerson || isLocation) {
        entities.push({ start: entity.start, end: entity.end });
      }
    }

    return entities;
  } catch (err) {
    console.warn("[PIIGuard] NER inference failed:", err);
    return [];
  }
}