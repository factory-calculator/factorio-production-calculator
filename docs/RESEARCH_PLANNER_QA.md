# Research planner — verification guide

This checklist is the acceptance record for milestone 4. The planner must remain on its feature branch until all required checks are marked PASS and reviewed.

## 1. Automated checks

Run from the repository root:

```sh
node research-planner.test.js
```

The test runner prints a JSON summary with named checks. GitHub Actions runs the same test on pushes to `feature/research-planner` and pull requests to `main`.

Automated coverage:
- Formula parsing, precedence, and rejection of unsafe/unsupported formulas
- Prerequisite expansion and de-duplication when multiple targets share prerequisites
- Aggregation of science packs, unit counts, and theoretical research work
- Completed prerequisites and already-researched levels
- Infinite research target levels and formula-based costs
- Combat-category exclusion and recursive exclusion of dependent technologies
- Hidden and disabled technology exclusion
- Condition/trigger unlocks separated from science-pack costs
- Edition mismatch, invalid targets/levels, malformed datasets, duplicate IDs, missing prerequisites, and prerequisite cycles
- Empty target selection

## 2. Data acceptance checks — must pass for each edition

Record the exact game version and permitted source/provenance in each dataset. Do not use a third-party technology dataset unless both its code and the underlying game data are explicitly licensed for this use.

| Check | Base Game | Space Age | Evidence |
|---|---|---|---|
| Dataset edition and version metadata are correct | TODO | TODO | |
| Every included technology has a stable unique ID | TODO | TODO | |
| All names have Japanese, English, and Simplified Chinese values | TODO | TODO | |
| All prerequisites exist in the same edition dataset | TODO | TODO | |
| Science packs, amounts, research time, and level formulas are source-verified | TODO | TODO | |
| Hidden/disabled entries are omitted | TODO | TODO | |
| Combat/weapon-related entries and every dependent technology are omitted | TODO | TODO | |
| Trigger/condition-based unlocks are represented separately | TODO | TODO | |
| No Base Game-only technology leaks into Space Age or vice versa | TODO | TODO | |

## 3. Interactive preview

A responsive, three-language interaction prototype is available at `research-planner-preview.html` with behavior in `research-planner-preview.js`. A single-file copy is available as `research-planner-preview-standalone.html` for easier manual opening. It intentionally uses fictional sample technology names and costs only. It is not connected to real Factorio technology data and must not be presented as a complete calculator. The preview supports edition switching, localized search, target selection, infinite-research current/target levels, completed-tech exclusions, science-pack totals, prerequisite ordering, and condition-based unlock display.

The preview is committed to the feature branch and is not part of the public website. It still requires a browser session to verify visual behavior and accessibility.

## 4. Browser acceptance checks

Do not mark these PASS based only on unit tests. Perform them in an actual browser on desktop and a narrow mobile/tablet viewport.

| Scenario | Japanese | English | 简体中文 |
|---|---|---|---|
| Research planner page loads without visible JS errors | TODO | TODO | TODO |
| Language switch preserves the same page/edition | TODO | TODO | TODO |
| Base Game and Space Age selection loads the correct dataset | TODO | TODO | TODO |
| Search finds localized technology names | TODO | TODO | TODO |
| Selecting a target adds its prerequisite chain in correct order | TODO | TODO | TODO |
| Shared prerequisites are not duplicated | TODO | TODO | TODO |
| Completed technology removes its remaining research cost | TODO | TODO | TODO |
| Current level to target level computes only remaining levels | TODO | TODO | TODO |
| Science-pack totals match a hand-calculated fixture | TODO | TODO | TODO |
| Condition-based unlocks are clearly distinguished from science research | TODO | TODO | TODO |
| Empty, invalid, or unavailable selections show a helpful message | TODO | TODO | TODO |
| Layout remains usable at mobile/tablet width | TODO | TODO | TODO |
| Existing calculator, item list, saved plans, transport planner, and CSV export still work | TODO | TODO | TODO |

## 5. Regression and release gates

- [ ] Automated test suite passes on the final feature commit.
- [ ] Both edition datasets pass the data acceptance table.
- [ ] Japanese, English, and Simplified Chinese browser checks pass.
- [ ] Desktop and mobile/tablet checks pass.
- [ ] Existing calculator pages and features pass regression checks.
- [ ] Pull request diff reviewed; no unrelated public-page changes.
- [ ] Public deployment is performed only after explicit release approval and successful Pages workflow.

## 6. Test record

| Field | Value |
|---|---|
| Feature branch | feature/research-planner |
| Automated test run | See linked GitHub Actions run |
| Browser/device | TODO |
| Dataset game version | TODO |
| Reviewer | TODO |
| Preview UI | Implemented with fictional fixtures; browser verification pending |
| Final result | NOT READY — permitted game data and browser verification are outstanding |
