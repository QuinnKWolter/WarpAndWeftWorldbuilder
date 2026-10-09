# Changelog

## Unreleased

- Tint complete node cards, text and icons in light/dark themes; add 192 categorized previewable icons with search and browser-local favorites.
- Delete selected graph nodes and relationships/semantic/sequence connections immediately with keyboard Delete/Backspace and undo. Retain inspector impact previews and preserve reading order when deleting automatic lines.
- Add explicit thread unfollow actions and visible followed-thread filters.
- Create connected objects where a dragged connection is released on empty canvas; preserve anchor identities and layouts.
- Configure incoming/outgoing anchor sides and up to four anchors per direction, falling back safely when extra anchors are removed.
- Add full-window entities, inspector, graph, and manuscript focus views with Escape and keyboard focus handling.
- Support bulk summaries/descriptions with blank/default facet columns and a simpler default-only format, with explanatory help.
- Add a connected chapter/scene manuscript workspace with rich text, Markdown, read mode, formatting, find/replace, searchable placeholders for every story-object type, ordered outline population, optional notes, live graph summaries, and clean export.
- Preserve inline reference identities through save, import/duplication, deletion and undo. Existing project storage requires no schema migration; older builds cannot import the new reference node.
- Add a searchable 126-term glossary and manuscript workflow documentation.

- Name the app **Warp & Weft Worldbuilder**, with woven branding and `.warp-weft.json` exports. Preserve legacy imports and existing storage paths.
- Add persistent nested folders for entities, ideas, and plot threads, with editable names, colors, icons, and collapse state. Drag folders/items to move or reorder, with drop markers and pane edge scrolling; remove folders while retaining contents.
- Add drag-to-nest outline organization, persisted container collapse, search expansion, Alt+↑/↓ reordering, and Alt+Enter summaries. Narrative reordering preserves story chronology.
- Add double-click summaries with notes, connections, folder selection, and edit/write/explore actions. Double-click canvas entities for summaries and timeline points for details.
- Add entity/moment accent colors and icons to panes and graph cards.
- Animate folder height, list reordering, inspector selection, graph arrangement, camera fitting and lens changes. Keep the canvas mounted and provide System/Smooth/Reduced motion preferences.
- Validate and remap folder references through save, export/import, duplication, deletion, and placeholder merging; retain organization through undo/redo.
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
