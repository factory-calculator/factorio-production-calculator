"use strict";
const assert = require("node:assert/strict");
const planner = require("./research-planner.js");

assert.equal(planner.parseFormula("100 + 20 * L", 3), 160);
assert.equal(planner.parseFormula("(L + 2)^2", 3), 25);
assert.throws(() => planner.parseFormula("process.exit()", 1));

const data = {
  schemaVersion: 1,
  edition: "base",
  technologies: [
    { id: "automation", prerequisites: [], unitCount: 10, timeSeconds: 5, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 1 }] },
    { id: "logistics", prerequisites: ["automation"], unitCount: 20, timeSeconds: 10, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 1 }, { id: "logistic-science-pack", amountPerUnit: 1 }] },
    { id: "infinite-demo", prerequisites: ["automation"], countFormula: "100 + 10 * L", maxLevel: "infinite", timeSeconds: 30, sciencePacks: [{ id: "automation-science-pack", amountPerUnit: 2 }] },
    { id: "combat-demo", category: "combat", prerequisites: [], unitCount: 999, timeSeconds: 1, sciencePacks: [] },
    { id: "blocked-dependent", prerequisites: ["combat-demo"], unitCount: 999, timeSeconds: 1, sciencePacks: [] },
    { id: "trigger-demo", researchType: "condition", researchTrigger: { type: "demo" }, prerequisites: [], timeSeconds: 1, sciencePacks: [] }
  ]
};
const result = planner.plan(data, {
  edition: "base",
  targets: [{ id: "logistics", level: 1 }, { id: "infinite-demo", level: 2 }],
  completed: [],
  currentLevels: {}
});
assert.deepEqual({ ...result.sciencePacks }, {
  "automation-science-pack": 10 + 20 + 2 * (110 + 120),
  "logistic-science-pack": 20
});
assert.equal(result.totalUnits, 260);
assert.equal(result.technologies.length, 3);
assert.throws(() => planner.plan(data, { edition: "spaceage", targets: [{ id: "logistics" }] }));
assert.throws(() => planner.plan(data, { edition: "base", targets: [{ id: "blocked-dependent" }] }));
const condition = planner.plan(data, { edition: "base", targets: [{ id: "trigger-demo" }] });
assert.equal(condition.conditions.length, 1);
console.log("research-planner tests passed");
