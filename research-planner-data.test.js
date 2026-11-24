"use strict";
const assert = require("node:assert/strict");
const intake = require("./research-planner-data.js");

const valid = {
  schemaVersion: 1,
  edition: "base",
  gameVersion: "2.0.72",
  provenance: {
    sourceName: "Synthetic test fixture",
    sourceUrl: "https://example.invalid/test-fixture",
    retrievedAt: "2026-11-22",
    permissionStatus: "test-fixture"
  },
  technologies: [{
    id: "fixture-tech",
    name: { ja: "架空技術", en: "Fictional technology", "zh-CN": "虚构科技" },
    category: "production",
    prerequisites: [],
    researchType: "science",
    timeSeconds: 30,
    unitCount: 10,
    maxLevel: 1,
    sciencePacks: [{ id: "fixture-pack", amountPerUnit: 1 }]
  }]
};

const cases = [
  ["valid fixture is accepted only in test mode", () => {
    assert.equal(intake.validate(valid, { allowTestFixture: true }).valid, true);
    assert.throws(() => intake.validate(valid), /permissionStatus/);
  }],
  ["approved provenance is required", () => {
    const copy = structuredClone(valid);
    copy.provenance.permissionStatus = "pending";
    assert.throws(() => intake.validate(copy), /permissionStatus/);
  }],
  ["all three localized names are required", () => {
    const copy = structuredClone(valid);
    delete copy.technologies[0].name["zh-CN"];
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /zh-CN/);
  }],
  ["edition and specific game version are validated", () => {
    const copy = structuredClone(valid);
    copy.edition = "mixed";
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /edition/);
    copy.edition = "base";
    copy.gameVersion = "2.0.x";
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /gameVersion/);
  }],
  ["approved data must include a permission reference", () => {
    const copy = structuredClone(valid);
    copy.provenance.permissionStatus = "approved";
    assert.throws(() => intake.validate(copy), /permissionReference/);
    copy.provenance.permissionReference = "Written permission email, 2026-11-24";
    assert.equal(intake.validate(copy).permissionStatus, "approved");
  }],
  ["invalid calendar dates and malformed HTTPS URLs are rejected", () => {
    const copy = structuredClone(valid);
    copy.provenance.retrievedAt = "2026-02-31";
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /real YYYY-MM-DD/);
    copy.provenance.retrievedAt = "2026-11-22";
    copy.provenance.sourceUrl = "https://";
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /valid HTTPS/);
  }],
  ["prerequisites must be valid string IDs", () => {
    const copy = structuredClone(valid);
    copy.technologies[0].prerequisites = [42];
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /valid technology IDs/);
  }],
  ["provenance URL and retrieval date are validated", () => {
    const copy = structuredClone(valid);
    copy.provenance.sourceUrl = "http://example.invalid";
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /HTTPS/);
  }],
  ["duplicate IDs and missing prerequisites are rejected", () => {
    const copy = structuredClone(valid);
    copy.technologies.push(structuredClone(copy.technologies[0]));
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /Duplicate technology id/);
    copy.technologies[0].prerequisites = ["missing-tech"];
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /Unknown prerequisite/);
  }],
  ["cycles are rejected", () => {
    const copy = structuredClone(valid);
    copy.technologies.push({
      id: "second-tech", name: { ja: "二番", en: "Second", "zh-CN": "第二" },
      prerequisites: ["fixture-tech"], timeSeconds: 1, unitCount: 1,
      sciencePacks: [{ id: "fixture-pack", amountPerUnit: 1 }]
    });
    copy.technologies[0].prerequisites = ["second-tech"];
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /Circular/);
  }],
  ["invalid science pack quantities are rejected", () => {
    const copy = structuredClone(valid);
    copy.technologies[0].sciencePacks[0].amountPerUnit = 0;
    assert.throws(() => intake.validate(copy, { allowTestFixture: true }), /science pack/);
  }]
];
for (const [name, fn] of cases) { fn(); }
console.log(JSON.stringify({ status: "passed", checks: cases.length, names: cases.map(x => x[0]) }, null, 2));
