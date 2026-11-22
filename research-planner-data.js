/* Factorio Production Calculator — research dataset intake validation
 * This validates structure and provenance only; it does not contain game data.
 */
(function (root) {
  "use strict";

  const EDITIONS = new Set(["base", "spaceage"]);
  const LOCALES = ["ja", "en", "zh-CN"];

  function fail(message) { throw new Error(message); }

  function validate(input, options) {
    const opts = options || {};
    if (!input || typeof input !== "object" || Array.isArray(input)) fail("Dataset must be a JSON object");
    if (input.schemaVersion !== 1) fail("Unsupported schemaVersion");
    if (!EDITIONS.has(input.edition)) fail("edition must be base or spaceage");
    if (typeof input.gameVersion !== "string" || !/^\\d+\\.\\d+(\\.\\d+)?([+-][\\w.-]+)?$/.test(input.gameVersion)) {
      fail("gameVersion must be a specific version, not a wildcard");
    }
    const p = input.provenance;
    if (!p || typeof p !== "object") fail("provenance is required");
    if (typeof p.sourceName !== "string" || !p.sourceName.trim()) fail("provenance.sourceName is required");
    if (typeof p.sourceUrl !== "string" || !/^https:\\/\\//.test(p.sourceUrl)) fail("provenance.sourceUrl must be HTTPS");
    if (typeof p.retrievedAt !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(p.retrievedAt)) fail("provenance.retrievedAt must be YYYY-MM-DD");
    if (p.permissionStatus !== "approved" && !(opts.allowTestFixture === true && p.permissionStatus === "test-fixture")) {
      fail("Dataset is blocked until permissionStatus is approved");
    }
    if (!Array.isArray(input.technologies)) fail("technologies must be an array");

    const byId = new Map();
    for (const tech of input.technologies) {
      if (!tech || typeof tech.id !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(tech.id)) fail("Invalid technology id");
      if (byId.has(tech.id)) fail("Duplicate technology id: " + tech.id);
      byId.set(tech.id, tech);
      if (!tech.name || typeof tech.name !== "object") fail("Localized names are required for " + tech.id);
      for (const locale of LOCALES) {
        if (typeof tech.name[locale] !== "string" || !tech.name[locale].trim()) fail("Missing " + locale + " name for " + tech.id);
      }
      if (!Array.isArray(tech.prerequisites)) fail("prerequisites must be an array for " + tech.id);
      if (new Set(tech.prerequisites).size !== tech.prerequisites.length) fail("Duplicate prerequisite for " + tech.id);
      if (tech.policyExcluded === true && tech.category !== "combat") {
        // Explicit policy exclusion is allowed for source categories that cannot be exposed.
      }
      if (tech.researchType === "condition" || tech.researchTrigger) {
        if (!tech.condition && !tech.researchTrigger) fail("Condition research needs a trigger or description for " + tech.id);
        continue;
      }
      if (!Number.isFinite(Number(tech.timeSeconds)) || Number(tech.timeSeconds) <= 0) fail("Invalid timeSeconds for " + tech.id);
      const infinite = tech.maxLevel === "infinite";
      if (!infinite && (!Number.isInteger(Number(tech.maxLevel == null ? 1 : tech.maxLevel)) || Number(tech.maxLevel == null ? 1 : tech.maxLevel) < 1)) {
        fail("Invalid maxLevel for " + tech.id);
      }
      if (infinite ? typeof tech.countFormula !== "string" : !Number.isFinite(Number(tech.unitCount)) || Number(tech.unitCount) < 0) {
        fail("Invalid research unit count for " + tech.id);
      }
      if (!Array.isArray(tech.sciencePacks)) fail("sciencePacks must be an array for " + tech.id);
      const packIds = new Set();
      for (const pack of tech.sciencePacks) {
        if (!pack || typeof pack.id !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(pack.id) ||
            packIds.has(pack.id) || !Number.isFinite(Number(pack.amountPerUnit)) || Number(pack.amountPerUnit) <= 0) {
          fail("Invalid science pack entry for " + tech.id);
        }
        packIds.add(pack.id);
      }
    }

    for (const tech of byId.values()) {
      for (const prereq of tech.prerequisites) {
        if (!byId.has(prereq)) fail("Unknown prerequisite " + prereq + " for " + tech.id);
        if (prereq === tech.id) fail("Technology cannot depend on itself: " + tech.id);
      }
    }

    // Detect cycles across the entire imported dataset, including excluded entries.
    const visiting = new Set(), visited = new Set();
    function visit(id) {
      if (visiting.has(id)) fail("Circular prerequisite dependency at " + id);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const prereq of byId.get(id).prerequisites) visit(prereq);
      visiting.delete(id);
      visited.add(id);
    }
    for (const id of byId.keys()) visit(id);

    return Object.freeze({
      valid: true,
      edition: input.edition,
      gameVersion: input.gameVersion,
      technologyCount: input.technologies.length,
      permissionStatus: p.permissionStatus
    });
  }

  const api = Object.freeze({ validate, locales: LOCALES.slice() });
  root.FactorioResearchData = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
