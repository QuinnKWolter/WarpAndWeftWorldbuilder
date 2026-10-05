# Architecture

Storygraph uses SvelteKit 3, Svelte 5, strict TypeScript, a Node 24 server, Drizzle ORM, and local SQLite. Svelte Flow handles graph interaction; ELK is loaded for automatic arrangement. Tiptap isolates the ProseMirror writing surface. Tailwind is integrated and semantic CSS variables define the shared visual language.

## Boundaries

`src/lib/domain` contains validated data, ordering, deterministic state resolution, diagnostics, portability operations, and graph projections. These modules have no component or database dependencies.

`src/lib/server` defines normalized relational tables, retained migrations, the repository, and bounded input parsing. `src/routes/api` validates requests and exposes project transactions. Changing storage should preserve the repository contract rather than introduce queries into views.

`src/lib/application` owns UI orchestration, local history, autosave serialization, browser recovery, layout commands, and file downloads. `Workspace` distinguishes selected lens, point, panels, and selection from canonical story data. Positions live in `view_layouts`, never in narrative order.

`src/lib/components` owns graph nodes/edges, shelf, timeline, inspectors, accessible dialogs, commands, and the writing adapter. The project route composes these surfaces. Providers have a typed boundary in `src/lib/assistant`; none performs requests yet.

## Why separate entities, units, events, and changes?

A person persists across scenes. A scene is authored structure. An event happens inside the world. A property or relationship state is true during a modeled interval. Combining them into generic document nodes would lose the distinction needed for nonlinear chronology, history inspection, dependency checks, and scene decomposition.

Every lens consumes the same bundle and resolver rules. `projectGraph` returns normalized nodes and edges; components adapt them to Svelte Flow. No view independently interprets time or queries SQLite. Semantic zoom currently changes summary detail; hierarchy exploration changes the projection scope.

## Persistence and concurrency

The alpha transfers a validated project bundle for each debounced save. The repository transaction compares the expected revision, replaces that project's relational records atomically, and increments its revision. UUIDs remain stable. A failed transaction rolls back. Concurrent windows receive a 409 and can export pending work before reloading.

This deliberate alpha tradeoff makes whole-transaction undo and data validation straightforward. It increases write volume for large projects. The repository boundary can later support incremental transactions without changing domain semantics. SQLite uses WAL, foreign keys, and a busy timeout. The objects registry gives polymorphic semantic/thread/layout links real foreign keys.

Save requests are serialized. New edits during an in-flight request are retained and saved against the returned revision. Local drafts are written before scheduling the database save. A save acknowledgment updates only revision/time, not newer live content. Navigation waits for saves or retains the workspace on failure. Browser shutdown cannot guarantee delivery; recovery drafts bridge this gap.

The server runs migrations on opening the connection; `pnpm setup` applies them explicitly too. Migrations are kept in version control. Never delete a user database to upgrade it.
