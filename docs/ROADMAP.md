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

## Release process

Develop on feature branches, review the diff, run regression checks, and merge only after the feature is verified in all supported languages and editions.
