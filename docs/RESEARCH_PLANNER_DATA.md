# Research planner data format

The planner engine deliberately separates calculation logic from game-version data. Do not copy third-party technology datasets. Populate the locale-aware data files only from sources whose use is permitted for this project, and record the game version and provenance for every dataset release.

## Dataset shape

```json
{
  "schemaVersion": 1,
  "edition": "base",
  "gameVersion": "2.0.x",
  "provenance": {
    "sourceName": "Permitted source name",
    "sourceUrl": "https://example.com/source",
    "retrievedAt": "YYYY-MM-DD",
    "permissionStatus": "approved",
    "permissionReference": "Written permission record reference"
  },
  "technologies": [
    {
      "id": "stable-technology-id",
      "name": {
        "ja": "日本語名",
        "en": "English name",
        "zh-CN": "简体中文名称"
      },
      "category": "production",
      "prerequisites": [],
      "researchType": "science",
      "timeSeconds": 30,
      "unitCount": 100,
      "countFormula": null,
      "maxLevel": 1,
      "sciencePacks": [
        { "id": "automation-science-pack", "amountPerUnit": 1 }
      ]
    }
  ]
}
```

- Use `edition: "base"` for Base Game and `edition: "spaceage"` for Space Age. Never mix the two datasets.
- Use `maxLevel: "infinite"` and `countFormula` for level-scaled infinite research; formulas may use only `L`, numbers, parentheses, and arithmetic operators.
- Use `researchType: "condition"` with a descriptive `condition` or `researchTrigger` for unlocks that do not consume science packs.
- Mark disallowed categories with `category: "combat"` or `policyExcluded: true`. The engine also omits every technology that depends on an excluded technology.
- Hidden and disabled entries are not offered to users.
- Localized names are data, not UI strings; the interface itself must also be translated into Japanese, English, and Simplified Chinese.

## Engine API

Load `research-planner.js`, then call:

```js
const result = FactorioResearchPlanner.plan(dataset, {
  edition: "base",
  targets: [{ id: "some-tech", level: 1 }],
  completed: ["already-researched-tech"],
  currentLevels: { "infinite-tech": 3 }
});
```

The result includes science-pack totals, research unit count, theoretical lab work in seconds/hours, and a separate list of condition-based unlocks. Lab-work time is not a wall-clock completion estimate; prerequisites, research speed bonuses, lab count, and parallel research affect actual completion time.

## Validation

Run `node --test` only if a Node test runner is added, or run `node research-planner.test.js` for the included assertion-based smoke tests.
