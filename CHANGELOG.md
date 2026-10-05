# Changelog

## Unreleased

- Rename the left workspace pane to World entities, with Entities, Outline, and Ideas tabs.
- Bulk add up to 500 entities from one-per-line names or `Name | facets | summary`, with preview, line-specific validation, duplicate skipping, autosave, and one-step undo/redo. Also available through the command palette.
- Smooth desktop pane collapse/expansion, phone drawer slides, dialog entrances, menus, writing-panel entrances, and control/card feedback, respecting reduced-motion preferences.
- Center dialogs within the viewport on desktop and phones.
- Apply light/dark semantic colors to native select menus, including graph lenses, entity sorting, and timeline controls.
- Fix moment deletion previews crashing on Svelte reactive proxies; use JSON-safe snapshots for deletion impact, project cloning, and history restoration.
- Prevent workspace deletion/arrow shortcuts from acting behind an open dialog; clear writing or nesting context when its containing moment is deleted.
- Add proxy cloning and batch parser coverage plus browser regressions for keyboard deletion/prose restoration and bulk entity workflows across desktop and phones.

## 0.1.0-alpha.1 — 2026-10-05

- Initial SvelteKit story workspace with SQLite and Drizzle migrations.
- Separate narrative hierarchy/order and labeled in-world chronology.
- World entities with composable facets, first-class relationships and temporal histories.
- Deterministic knowledge, possession, location, and custom-property state resolution.
- Narrative, world, relationship, thread, and chronology projections.
- Scene insertion, reordering, layout persistence, scoped undo/redo, scene participants, events, and state diffs.
- Rich prose writing, autosave, browser draft recovery, command palette, and project-wide search.
- Version 1 portable JSON import/export, Markdown manuscript export, and project duplication.
- Original Lantern Archive demo, light/dark themes, responsive drawers, and continuity diagnostics.
- Apache-2.0 licensing, contributor documentation, CI, and single-container deployment.

Data format: initial export schema v1 and initial database migration. No previous user database exists to migrate. Future migrations will be additive or explicitly documented; a backup is recommended before every upgrade.
