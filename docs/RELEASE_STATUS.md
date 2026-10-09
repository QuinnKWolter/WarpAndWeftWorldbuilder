# Release verification: 0.1.0-alpha.1

Verified on 2026-10-05 in the supplied Windows workspace with Node 24.21.0 and pnpm 12.9.1, plus a Linux Node 24 production container. This alpha is ready for private single-user local/self-hosted testing within the documented limits. It has not been published or deployed to a public service.

| Check                                | Result                                                                                                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen dependency installation       | Passed in the development environment and a clean Linux Docker dependency layer.                                                                                                              |
| Retained Drizzle migrations          | Passed on fresh in-memory databases, local setup, and persistent container data.                                                                                                              |
| `pnpm lint`                          | Passed ESLint and Prettier.                                                                                                                                                                   |
| `pnpm check`                         | Passed with zero errors and zero warnings.                                                                                                                                                    |
| `pnpm test`                          | 21 passing domain/SQLite integration tests in two files.                                                                                                                                      |
| `pnpm test:e2e`                      | Four passing Chromium workflows against development.                                                                                                                                          |
| `E2E_PRODUCTION=1 pnpm test:e2e`     | Four passing workflows against the built Node launcher, including phone resizing. CI is configured to use this mode.                                                                          |
| `pnpm build`                         | Passed with adapter-node production output.                                                                                                                                                   |
| `docker build -t storygraph:alpha .` | Passed with frozen installation, production build, nonroot runtime, and retained migrations.                                                                                                  |
| Container browser smoke check        | Passed layout arrangement/movement, prose save/reload, light/dark display and 390px focus writing; no browser errors.                                                                         |
| Persistent-volume restart            | Passed: saved prose and layout remained after container restart; previously created project also survived image replacement.                                                                  |
| HTTP origin/body handling            | Same-origin writes passed, cross-origin writes returned 403, and a 650 KB save passed the production launcher.                                                                                |
| Docker Compose                       | Configuration passed; an isolated compose project started the built image, passed browser save/layout checks, and retained prose/layout through restart. The supplied port binds to loopback. |
| `pnpm setup` / `pnpm backup`         | Passed; online SQLite backup created successfully.                                                                                                                                            |
| `pnpm audit --prod --json`           | Zero reported vulnerabilities at verification time.                                                                                                                                           |
| Repository hygiene                   | Databases, drafts, secrets, dependency caches, browser reports and build output ignored. Source, migrations, license, docs and screenshots retained.                                          |

## Writer acceptance

The primary browser workflow constructs Alice/Bob, a changing relationship, Beginning → Betrayal → Ending, a nested beat, an event and possession change, and a Mystery thread. It scrubs relationship time, switches lenses, inserts/reorders/undoes, writes prose, reloads, exports, deletes the original project, imports, and confirms writing survived. This covers the required 19 browser behaviors and portable reconstruction.

Additional tests cover the original demo's real continuity warning, phone drawers, keyboard search, failed saves with local drafts, concurrent-window revision conflicts, semantic connection editing/deletion/undo, event steps, and placeholder merging with restored prose. Domain tests independently cover nonlinear chronology, inferred transfers/knowledge, interval boundaries, deterministic projections, validation, safe cascades, and merge/reference preservation.

## Workspace polish follow-up — 2026-10-05

The unreleased follow-up fixes proxy-backed deletion previews, adds bulk entity creation, clarifies the entities pane, themes native select options, centers dialogs, and adds reduced-motion-aware pane/dialog/control animation. No database migration or export-format change is required.

Follow-up verification passed: ESLint/Prettier, zero-error/zero-warning Svelte checks, 25 domain/SQLite tests in three files, six Chromium workflows against development, six against the built Node launcher, and the production build. New browser regressions cover keyboard moment deletion with prose restoration and bulk creation with duplicates, validation, undo/redo, reload, dark controls, and a 390px phone viewport.

Fresh production screenshots cover light/dark workspaces, dark bulk preview, phone writing, and phone bulk preview. These checks used isolated databases and recorded no browser errors or horizontal overflow. The existing development server and user database were left intact. Container checks in the original alpha table above were not repeated for this UI follow-up.

## Warp & Weft organization and motion follow-up — 2026-10-05

The app is now named Warp & Weft Worldbuilder. This follow-up adds persistent nested collection folders, names/colors/icons, item and folder dragging, outline nesting/collapse, readable summaries, entity/moment appearance, keyboard alternatives, automatic pane edge scrolling, and menu dismissal. Folder deletion retains contents. Narrative ordering remains independent of chronology. Typed organization references survive save, export/import, duplication, deletion, merge, and undo.

The graph stays mounted while fitting, arranging, and changing lenses. Folder/list/inspector transitions and node/camera animation use existing Svelte and Svelte Flow capabilities. Device/Smooth/Reduced preferences are available in Settings & shortcuts. Browser checks sample actual intermediate folder heights and camera transforms; production visual QA also samples pane widths. A phone resize regression ensures the drawer close button remains available.

Verification: ESLint/Prettier, zero-error/zero-warning Svelte checks, 31 passing domain/SQLite tests in four files, eight Chromium workflows against development and the production Node launcher, and a successful production build. Fresh production screenshots cover the woven brand, light/dark workspaces, folder editing, readable summaries, phone folders/writing/summaries, and bulk previews. Isolated test databases recorded no browser errors or horizontal overflow. Container checks from the original alpha were not repeated for this UI follow-up.

Exports now use `.warp-weft.json`; the v1 format identifier, legacy imports, existing database path, and recovery/theme storage keys remain compatible. No database migration is required. Native pane dragging targets mouse/trackpad use; keyboard reordering and summary/inspector placement controls provide alternatives on touch devices.

## Connected manuscript and graph controls — 2026-10-09

This follow-up delivers full-card color in both themes, a 192-icon searchable/category/favorites library, immediate keyboard node/edge deletion with undo, explicit thread unfollow, empty-canvas connection creation, configurable incoming/outgoing anchor sides and counts, and focus views for graph, both drawers and manuscript. Bulk descriptions work with explicit or default-only facets. The manuscript shares narrative identity and documents: chapters/scenes, rich text/Markdown/read modes, formatting, find/replace, all five reference kinds, ordered outline population, expansion/hiding, optional notes, live graph summaries, and clean Markdown export. A searchable 126-term glossary explains the systems.

Final verification in the Windows Node 24.21.0 / pnpm 12.9.1 workspace:

| Check                       | Result                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Svelte/TypeScript           | Zero errors and zero warnings.                                                                                                  |
| ESLint/Prettier             | Passed.                                                                                                                         |
| Domain/SQLite suite         | 40 passing tests in five files.                                                                                                 |
| Production build            | Passed with adapter-node output.                                                                                                |
| Production Chromium suite   | All 11 workflows passed in one full run, using the built Node launcher and an isolated database.                                |
| Production visual review    | Light/dark manuscript, 390px writing, and recolored graph; no browser errors or horizontal overflow.                            |
| Production dependency audit | Zero reported vulnerabilities at verification time.                                                                             |
| Repository hygiene          | Data, temporary QA scripts, browser reports and builds remain ignored; only source, docs and reviewed screenshots are included. |

Development workflows were also exercised through full and focused runs while implementing the changes. Regression checks caught and corrected proxy-safe deletion paths, selection rebuilding edge labels between clicks, stale phone writing focus, blank text-style selection, and transition/focus interaction during folder reopening. Browser drag checks wait for enclosing animation and scrolling geometry to settle while retaining real pointer dragging and motion sampling.

References and creation-view/layout contexts remap on import/duplication; possibility merges retarget their manuscript references. Prose and writing notes survive unrelated graph undo. Removing extra anchors routes their connections to the first anchor. Existing projects require no database migration. Older builds cannot import the new inline reference node. Fullscreen means the application window; supported Markdown and export limits are documented in [MANUSCRIPT.md](MANUSCRIPT.md).

Screenshots: [light manuscript](../static/screenshots/manuscript-light.png), [dark manuscript](../static/screenshots/manuscript-dark.png), [phone manuscript](../static/screenshots/manuscript-mobile.png), and [recolored graph](../static/screenshots/graph-polish.png). Docker build/restart checks from the original alpha were not repeated for this follow-up; no public deployment or new remote CI result is claimed here.

## Practical limits

Read the [README limitations](../README.md#known-limitations), [scope map](REQUIREMENTS.md), and [roadmap](ROADMAP.md). There is no authentication, real-time collaboration, AI request execution, attachment storage, or inline mention autocomplete. Public access needs external access control. Spatial graph accessibility and large-project browser benchmarking remain incomplete; no WCAG certification or comprehensive performance certification is claimed.

The production build reports a large ELK chunk (about 1.43 MB raw / 442 KB gzip). ELK loads only when Arrange is invoked. The manuscript/editor chunk loads on opening writing (about 463 KB raw / 146 KB gzip). The current workspace route chunk is about 404 KB raw / 121 KB gzip, with shared framework and graph chunks in addition. The bundle warning is retained rather than hidden by increasing the warning threshold.

GitHub Actions is configured, but a remote CI run has not been performed as part of this follow-up. Docker checks verify the application build/runtime; they are not a certification of the container base image's entire operating-system supply chain.
