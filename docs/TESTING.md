# Testing

`pnpm test` runs deterministic domain tests and real SQLite integration tests with fresh in-memory databases and retained migrations. Coverage includes temporal relationship intervals, transfers, knowledge, inferred diffs, hierarchy/order separation, scene insertion, reference validation, portable duplication, safe deletion, thread projection, continuity and reader-order rules, revision conflict protection, and complete persistence round trips.

The projection budget test creates 500+ entities and 2,000+ relationship edges, then checks a one-second projection budget. This is a domain performance check, not a complete browser benchmark.

Entity-batch tests cover facet defaults/overrides, duplicate skipping, invalid lines, limits, and valid bundle integration. A proxy-backed story tests deletion previews, cloning, and restoration without changing the original data.

`pnpm test:e2e` runs Chromium against an isolated E2E database. Install its browser with `pnpm exec playwright install chromium`. The writer workflow covers project/entity/scene creation, participants, relationships and changing states, timeline updates, edge insertion, reordering and undo, nested scenes, threads, events, world changes, prose, refresh, lens switching, diagnostics, export and import. Separate cases exercise phone drawers and a 390px viewport, failed saves and local recovery, and concurrent-window conflicts.

Each E2E invocation owns a fresh database and server. The default server starts from the local Vite binary for cross-platform portability. Dependency prebundling prevents a cold route's optimizer reload from interrupting initial navigation. Set `E2E_PRODUCTION=1` after `pnpm build` to run the same workflows against the production launcher; CI uses this mode. Failures retain traces and screenshots. Browser tests assert user behavior and stored outcomes rather than component implementation. The additional workflow covers semantic-link editing/deletion/undo, event steps, and placeholder merge/prose restoration. Prose written after a graph action is checked across undo/redo.

The deletion regression clicks one of two moment nodes, presses Delete, confirms the impact preview, checks undo restores its prose, then redoes and reloads to confirm persistence. The bulk workflow checks preview errors and duplicate skipping, atomic undo/redo, reload persistence, dark select colors, pane toggles, and phone creation with reduced motion enabled.

Organization domain/SQLite tests cover default folders, reference validation, nesting/cycle guards, independent ordering, safe folder removal, deletion/merge cleanup, clone remapping, and persistence. Two browser workflows exercise actual pointer drags, folder styles/nesting/removal/undo/reload/import, outline nesting and keyboard reordering without changing chronology, summaries/edit/write, appearance, search expansion, and phone inspection. Animation checks sample intermediate rendered folder heights and camera transforms, so static CSS duration declarations cannot satisfy them.

## Release checks

Run the complete CI suite plus a Docker build. Start the production container with a named volume, create a project, restart it, and verify the project is retained. Verify a clean frozen-lockfile install independently of the current development node_modules. Record results in `RELEASE_STATUS.md`.

Review the original acceptance scenarios A–G in `PROMPT.md`. Automated tests exercise relationship progression, insertion/undo, nonlinear chronology, transfers, missing-possession diagnostics, overlapping threads, and portable reconstruction. Accessibility requires manual judgment too: focus controls, modal containment, contrast, reduced motion, and non-pointer alternatives.
