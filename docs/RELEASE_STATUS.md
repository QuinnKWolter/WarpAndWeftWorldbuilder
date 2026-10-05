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

## Practical limits

Read the [README limitations](../README.md#known-limitations), [scope map](REQUIREMENTS.md), and [roadmap](ROADMAP.md). There is no authentication, real-time collaboration, AI request execution, attachment storage, or inline mention autocomplete. Public access needs external access control. Spatial graph accessibility and large-project browser benchmarking remain incomplete; no WCAG certification or comprehensive performance certification is claimed.

The production build reports a large ELK chunk (about 1.43 MB raw / 442 KB gzip). ELK loads only when Arrange is invoked. The prose editor also loads on opening writing. The workspace route chunk is about 275 KB raw / 86 KB gzip, with shared framework and graph chunks in addition. The bundle warning is retained rather than hidden by increasing the warning threshold.

GitHub Actions is configured, but a remote CI run has not been performed because this task did not publish a repository. Docker checks verify the application build/runtime; they are not a certification of the container base image's entire operating-system supply chain.
