# Factorio Production Calculator — Development Roadmap

## Product direction

Evolve Factorio Production Calculator from a production-rate calculator into a practical factory-planning assistant while preserving the existing public site and its three-language support.

## Compatibility requirements

- Keep Japanese, English, and Simplified Chinese interfaces aligned.
- Keep Base Game recipes separate from Space Age recipes and planet-specific conditions.
- Preserve existing calculator behavior, settings, exports, item catalog, and admin-only tools.
- Do not deploy experimental features directly to the public default branch.
- Verify desktop and mobile layouts and check all three languages before merging a feature.

## Existing functionality found in the current calculator

The current calculator already includes production-chain views, machine estimates, material/belt bottleneck summaries, power estimates, layout estimates, graphs, CSV export, and an item catalog. New work should extend these features rather than duplicate them.

## Roadmap

1. **Actionable supply diagnostics** — compare required material flow with user-entered available supply; show surplus/shortage per material and practical improvement targets.
2. **Plan save and share** — save plans locally first, then add portable share links/import-export with validation.
3. **Transport planner** — calculate belt, pipe, and train capacity from the selected game edition and relevant transport settings.
4. **Research planner** — calculate science-pack demand, research-facility requirements, and estimated research time.
5. **Factory layout simulator** — provide a visual, editable representation of production lines and compare alternative layouts.
6. **Space Age interplanetary planning** — account for planet-specific recipes, local production, imports, and interplanetary logistics.
7. **Item and recipe encyclopedia/community** — improve item/recipe discovery and enable users to publish and browse shared plans.

## Milestone 1: Actionable supply diagnostics

### Goal

Turn the existing material/belt bottleneck view into a practical diagnostic by comparing calculated demand with the supply rate entered by the user.

### Initial scope

- Add an optional supply-rate input for each required solid material.
- Display required rate, available rate, shortage/surplus, and status.
- Show a clear recommendation based on the calculated shortage.
- Keep unknown/unset supply separate from zero supply; never assume that an unconfigured material has no supply.
- Keep belt-capacity warnings distinct from material-supply shortages.
- Keep existing calculations unchanged when no supply values are entered.
- Use the same calculation engine for Base Game and Space Age while respecting each page's recipe dataset.

### Acceptance criteria

- No supply values entered: existing calculator results remain unchanged.
- Supply entered: shortages and surpluses are calculated in consistent units (items/minute).
- Multiple production targets aggregate demand before comparison.
- Fluid inputs are not incorrectly treated as solid belt cargo.
- Inputs are validated; invalid or negative values cannot produce misleading diagnoses.
- Japanese, English, and Simplified Chinese labels and help text are provided.
- Mobile layout remains usable.
- Existing CSV export and item catalog continue to work.
- Tests cover no-input, exact-match, shortage, surplus, multiple-target, and Space Age cases.

## Milestone 2: Plan save and share

### Goal

Let players keep multiple production plans, restore them later, and move a plan between browsers or devices without requiring an account or server.

### Initial scope

- Automatically save the active plan and calculator settings in browser storage.
- Keep saved plans separate between Base Game and Space Age.
- Save multiple named plans and allow loading, overwriting, and deleting them.
- Export a selected or current plan as a versioned JSON file and import it with validation.
- Include the selected target, production targets, calculator settings, and material supply rates.
- Reject files for the wrong game edition and plans containing items unavailable in the active dataset.
- Keep the feature local-first; no account, cloud sync, or public sharing service is required for this milestone.
- Provide Japanese, English, and Simplified Chinese labels.

### Acceptance criteria

- Editing a plan and reloading the same browser restores the latest working state.
- Named plans survive reloads and remain separate by game edition.
- JSON export/import round-trips the plan, settings, and supply rates.
- Invalid, oversized, or wrong-edition files are rejected without replacing the current plan.
- Imported item names and numeric rates are validated before applying.
- Existing recipe data, calculator output, CSV export, and item catalog remain unchanged.
- Desktop and mobile behavior is checked in all three languages before release.


## Milestone 3: Transport planner

### Goal

Turn the calculator's aggregated material demand into practical belt, pipe, and train transport estimates without changing the production calculation engine.

### Initial scope

- Show per-material solid flow and estimate dedicated belt lanes using the selected belt tier.
- Support yellow, red, and blue belts in Base Game; add turbo belts only in Space Age.
- Show fluid flow separately and estimate pipe count only when the user supplies a design flow per pipe; do not assume a universal pipe throughput.
- Estimate train sets per material from user-configured wagons per train, round-trip time, cargo slots, item stack size, and fluid wagon capacity.
- Keep Base Game and Space Age settings separate in browser storage.
- Provide Japanese, English, and Simplified Chinese labels and a responsive layout.
- Make assumptions visible; estimates do not simulate station loading, unloading, intersections, or detailed pipe geometry.

### Acceptance criteria

- Material rates are read from the existing calculation totals and update after every recalculation.
- Fluids are never counted as belt cargo; solids are never counted as pipe flow.
- Belt counts use items/second and preserve the existing belt conversion setting behavior.
- Pipe counts remain unset until a positive per-pipe design flow is entered.
- Train estimates validate all inputs and clearly state the per-material, separate-transport assumption.
- Base Game does not offer turbo belts; Space Age does.
- Settings persist independently for Base Game and Space Age.
- Existing production results, material diagnostics, saved plans, CSV export, and item catalog remain unchanged.
- Desktop and mobile layouts are checked in all three languages before release.

## Release process

Develop on feature branches, review the diff, run regression checks, and merge only after the feature is verified in all supported languages and editions.


## Milestone 4: Research planner — implementation in progress

### Calculation core

- Added a versioned dataset contract for separate Base Game and Space Age technology data.
- Added prerequisite expansion with shared-prerequisite de-duplication and cycle detection.
- Added completed-technology and current-level handling.
- Added science-pack aggregation and research work totals.
- Added a restricted arithmetic parser for infinite-research cost formulas; no dynamic code evaluation is used.
- Added separate handling for condition/trigger-based unlocks.
- Added a policy filter for combat-tagged technologies and all technologies that depend on them.
- Added assertion-based smoke tests and a GitHub Actions workflow.

### Remaining before integration

- Populate versioned technology datasets from sources permitted for this project; do not copy third-party technology datasets.
- Verify the exclusion classification against the source data.
- Build the three-language research planner UI and connect it to the correct edition dataset.
- Test prerequisite totals, infinite levels, completed research, and condition-based unlocks in both editions.
- Confirm the UI and calculations on desktop/mobile in Japanese, English, and Simplified Chinese.

The calculation engine is not yet connected to the public calculator pages. Do not deploy this milestone until its data and UI are complete and reviewed.
