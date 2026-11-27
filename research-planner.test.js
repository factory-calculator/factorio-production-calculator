"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const planner = require("./research-planner.js");

const checks = [];
function check(name, fn) {
  fn();
  checks.push(name);
}

const base = {
  schemaVersion: 1,
  edition: "base",
  gameVersion: "test-fixture",
  technologies: [
    { id: "automation", prerequisites: [], unitCount: 10, timeSeconds: 5, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 1 }] },
    { id: "logistics", prerequisites: ["automation"], unitCount: 20, timeSeconds: 10, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 1 }, { id: "logistic-science-pack", amountPerUnit: 1 }] },
    { id: "shared-a", prerequisites: ["automation"], unitCount: 3, timeSeconds: 10, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 1 }] },
    { id: "shared-b", prerequisites: ["automation"], unitCount: 4, timeSeconds: 10, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 1 }] },
    { id: "infinite-demo", prerequisites: ["automation"], countFormula: "100 + 10 * L", maxLevel: "infinite", timeSeconds: 30, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 2 }] },
    { id: "combat-demo", category: "combat", prerequisites: [], unitCount: 999, timeSeconds: 1, sciencePacks: [] },
    { id: "blocked-dependent", prerequisites: ["combat-demo"], unitCount: 999, timeSeconds: 1, sciencePacks: [] },
    { id: "trigger-demo", researchType: "condition", researchTrigger: { type: "demo" }, prerequisites: [], timeSeconds: 1, sciencePacks: [] },
    { id: "hidden-demo", hidden: true, prerequisites: [], unitCount: 1, timeSeconds: 1, sciencePacks: [] },
    { id: "disabled-demo", enabled: false, prerequisites: [], unitCount: 1, timeSeconds: 1, sciencePacks: [] },
    { id: "hidden-dependent", prerequisites: ["hidden-demo"], unitCount: 1, timeSeconds: 1, sciencePacks: [] },
    { id: "disabled-dependent", prerequisites: ["disabled-demo"], unitCount: 1, timeSeconds: 1, sciencePacks: [] },
    { id: "cycle-a", prerequisites: ["cycle-b"], unitCount: 1, timeSeconds: 1, sciencePacks: [] },
    { id: "cycle-b", prerequisites: ["cycle-a"], unitCount: 1, timeSeconds: 1, sciencePacks: [] }
  ]
};

check("formula arithmetic and precedence", () => {
  assert.equal(planner.parseFormula("100 + 20 * L", 3), 160);
  assert.equal(planner.parseFormula("(L + 2)^2", 3), 25);
  assert.equal(planner.parseFormula("2^3^2", 1), 512);
});
check("formula rejects executable or unsupported input", () => {
  assert.throws(() => planner.parseFormula("process.exit()", 1));
  assert.throws(() => planner.parseFormula("1/0", 1));
  assert.throws(() => planner.parseFormula("-5", 1));
});
check("prerequisites are expanded and shared prerequisites counted once", () => {
  const r = planner.plan(base, { edition: "base", targets: [{ id: "shared-a" }, { id: "shared-b" }] });
  assert.deepEqual(r.technologies.map(x => x.id), ["automation", "shared-a", "shared-b"]);
  assert.equal(r.sciencePacks["automation-science-pack"], 17);
});
check("multiple targets aggregate science packs and research work", () => {
  const r = planner.plan(base, { edition: "base", targets: [{ id: "logistics" }] });
  assert.equal(r.sciencePacks["automation-science-pack"], 30);
  assert.equal(r.sciencePacks["logistic-science-pack"], 20);
  assert.equal(r.totalUnits, 30);
  assert.equal(r.totalResearchSeconds, 250);
});
check("facility count and research speed scale estimated elapsed time", () => {
  const r = planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchFacilityCount: 5, researchSpeedMultiplier: 2 });
  assert.equal(r.totalResearchSeconds, 250);
  assert.equal(r.estimatedResearchSeconds, 25);
  assert.equal(r.estimatedResearchHours, 25 / 3600);
  assert.equal(r.researchFacilityCount, 5);
  assert.equal(r.researchSpeedMultiplier, 2);
  const defaults = planner.plan(base, { edition: "base", targets: [{ id: "logistics" }] });
  assert.equal(defaults.estimatedResearchSeconds, 250);
});
check("invalid facility count and research speed are rejected", () => {
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchFacilityCount: 0 }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchFacilityCount: 1.5 }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchSpeedMultiplier: 0 }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchSpeedMultiplier: 1001 }));
});
check("mixed research facility groups aggregate effective research speed", () => {
  const r = planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchFacilities: [
    { count: 2, speedMultiplier: 1 },
    { count: 3, speedMultiplier: 2 }
  ]});
  assert.equal(r.researchFacilityCount, 5);
  assert.equal(r.totalResearchSpeed, 8);
  assert.equal(r.researchSpeedMultiplier, 1.6);
  assert.equal(r.estimatedResearchSeconds, 31.25);
  assert.equal(r.researchFacilities.length, 2);
});
check("invalid facility groups and excessive group counts are rejected", () => {
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchFacilities: [{ count: 0, speedMultiplier: 1 }] }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchFacilities: [{ count: 1, speedMultiplier: 0 }] }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], researchFacilities: Array.from({ length: 21 }, () => ({ count: 1, speedMultiplier: 1 })) }));
});
check("completed prerequisite is not charged again", () => {
  const r = planner.plan(base, { edition: "base", targets: [{ id: "logistics" }], completed: ["automation"] });
  assert.deepEqual(r.technologies.map(x => x.id), ["logistics"]);
  assert.equal(r.sciencePacks["automation-science-pack"], 20);
});
check("current level and infinite research levels are calculated", () => {
  const r = planner.plan(base, { edition: "base", targets: [{ id: "infinite-demo", level: 3 }], currentLevels: { "infinite-demo": 1 }, completed: ["automation"] });
  assert.equal(r.sciencePacks["automation-science-pack"], 2 * (120 + 130));
  assert.equal(r.technologies[0].levels, 2);
});
check("combat technologies and all descendants are excluded", () => {
  const normalized = planner.normalizeDataset(base, "base");
  assert.equal(normalized.technologies.has("combat-demo"), false);
  assert.equal(normalized.technologies.has("blocked-dependent"), false);
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "blocked-dependent" }] }));
});
check("hidden and disabled technologies are excluded", () => {
  const normalized = planner.normalizeDataset(base, "base");
  assert.equal(normalized.technologies.has("hidden-demo"), false);
  assert.equal(normalized.technologies.has("disabled-demo"), false);
  assert.equal(normalized.technologies.has("hidden-dependent"), false);
  assert.equal(normalized.technologies.has("disabled-dependent"), false);
});
check("condition-based unlocks are separated from science costs", () => {
  const r = planner.plan(base, { edition: "base", targets: [{ id: "trigger-demo" }] });
  assert.equal(r.conditions.length, 1);
  assert.equal(r.totalUnits, 0);
  assert.equal(Object.keys(r.sciencePacks).length, 0);
});
check("edition mismatch, unavailable targets, and invalid levels fail safely", () => {
  assert.throws(() => planner.plan(base, { edition: "spaceage", targets: [{ id: "logistics" }] }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "not-real" }] }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics", level: 0 }] }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "logistics", level: 2 }] }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "infinite-demo", level: 3 }], currentLevels: { "infinite-demo": -1 } }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "infinite-demo", level: 3 }], currentLevels: { "infinite-demo": 1.5 } }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "infinite-demo", level: 3 }], currentLevels: { "not-real": 1 } }));
});
check("malformed datasets, duplicate IDs, missing prerequisites, and cycles are rejected", () => {
  assert.throws(() => planner.normalizeDataset({ schemaVersion: 2, edition: "base", technologies: [] }));
  assert.throws(() => planner.normalizeDataset({ schemaVersion: 1, edition: "base", technologies: [{ id: "x" }, { id: "x" }] }));
  assert.throws(() => planner.normalizeDataset({ schemaVersion: 1, edition: "base", technologies: [{ id: "x", prerequisites: "not-an-array" }] }));
  assert.throws(() => planner.plan({ schemaVersion: 1, edition: "base", technologies: [{ id: "x", prerequisites: ["missing"] }] }, { edition: "base", targets: [{ id: "x" }] }));
  assert.throws(() => planner.plan(base, { edition: "base", targets: [{ id: "cycle-a" }] }));
});
check("empty target selection is rejected", () => {
  assert.throws(() => planner.plan(base, { edition: "base", targets: [] }));
});

check("unknown prerequisites are rejected even when the dependent entry is filtered", () => {
  const malformed = {
    schemaVersion: 1,
    edition: "base",
    technologies: [
      { id: "filtered-entry", policyExcluded: true, prerequisites: ["missing-entry"] }
    ]
  };
  assert.throws(() => planner.normalizeDataset(malformed), /Unknown prerequisite/);
});

check("duplicate prerequisite references are rejected", () => {
  const malformed = {
    schemaVersion: 1,
    edition: "base",
    technologies: [
      { id: "root", prerequisites: [] },
      { id: "target", prerequisites: ["root", "root"] }
    ]
  };
  assert.throws(() => planner.normalizeDataset(malformed), /Duplicate prerequisite/);
});

check("standalone preview contains syntactically valid bundled scripts", () => {
  const html = fs.readFileSync("research-planner-preview-standalone.html", "utf8");
  const scripts = html.split("<script>").slice(1).map(part => part.split("</script>")[0]);
  assert.equal(scripts.length, 2);
  scripts.forEach(source => new vm.Script(source));
  assert.match(html, /name="robots" content="noindex,nofollow"/);
});

console.log(JSON.stringify({ status: "passed", checks: checks.length, checkNames: checks }, null, 2));
