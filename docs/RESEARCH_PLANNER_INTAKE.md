# Research dataset intake and release rules

This repository contains no real technology data until the required permission is confirmed. The files in this milestone are validation infrastructure only.

## Required provenance

Every future Base Game and Space Age dataset must be stored separately and include:

- Exact Factorio game version (never a wildcard such as `2.0.x`)
- Source name and HTTPS URL
- Retrieval date
- Attribution text, where required
- Permission status and a reference to the permission record

A production dataset is accepted only when `provenance.permissionStatus` is `approved`. The validator allows `test-fixture` only when tests explicitly pass `{ allowTestFixture: true }`. A pending dataset is rejected.

## Validation

Load `research-planner-data.js` and call:

```js
FactorioResearchData.validate(dataset);
```

The intake validator checks the edition, exact game version, provenance, three locale names, IDs, prerequisite references, dependency cycles, research values, and science-pack entries. It validates structure and provenance; it does not grant permission or establish that a source is legally reusable.

Run the checks locally with:

```sh
node --check research-planner-data.js
node research-planner.test.js
node research-planner-data.test.js
```

## Release gate

Do not place a dataset into a public runtime path until:

1. Wube's permission for the specific technology data and public redistribution is confirmed.
2. The source and version are recorded.
3. The dataset passes the intake validator.
4. The combat/policy exclusion review is completed.
5. The Base Game and Space Age datasets are checked independently.
6. The research planner is tested in Japanese, English, and Simplified Chinese on desktop and mobile.

The validator is not a substitute for a source-data review. Unknown or ambiguous categories must be held back for manual review rather than assumed safe.
