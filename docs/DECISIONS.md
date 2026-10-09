# Engineering decisions

## SQLite with normalized records and Drizzle migrations

Context: testers should run the application without infrastructure services.

Decision: local SQLite with relational tables, real foreign keys, an addressable-object registry, and retained migrations. Better-sqlite3 supplies supported platform binaries.

Consequences: one installation owner, straightforward backups, no distributed scaling assumptions. PostgreSQL can be added through the repository boundary later.

## Full-bundle atomic saves for the alpha

Context: scene refactoring affects many dependent records, and undo must preserve integrity.

Decision: validate a project bundle, compare revision, and replace its relational records in one transaction. Keep UI transaction history and browser recovery separately.

Consequences: easy atomic restoration and stale-write protection; larger write volume than incremental updates. Large-project optimization is explicitly deferred, with measured projection tests now.

## Scalar story points with author labels

Context: fictional calendars and nonlinear narration cannot assume Gregorian dates.

Decision: finite numeric story points, arbitrary labels, optional ends, and independent sibling ranks for authored order.

Consequences: users can express ordinals, elapsed time, or timestamps. Within-point event order is separate. UI does not pretend that moving reading order changes world time.

## Portable JSON v1

Context: users need complete exports immediately; attachments are optional alpha scope.

Decision: one validated `.warp-weft.json` file, consistent ID remapping on import, and a separate Markdown manuscript export. Retain `format: "storygraph"` and legacy file imports through the product rename.

Consequences: no archive extraction or asset path hazards. ZIP/asset support needs a future format extension.

## Portable pane organization and explicit motion

Decision: store typed folder trees, item ranks, and collapse state in project settings; store entity/unit appearance in metadata. Keep narrative outline hierarchy and story chronology independent of collection folders. Validate references and remap them on import/duplication without adding a database migration.

Decision: keep the graph mounted across lens and camera changes; interpolate node positions with requestAnimationFrame, animate fitting through Svelte Flow, and use Svelte slide/flip transitions for pane organization. A browser preference defaults to the device's motion setting and permits explicit Smooth or Reduced motion.

Consequences: organization travels with a project and participates in undo; visual transitions remain lightweight and avoid a new animation dependency. Native drag has keyboard and inspector/summary alternatives, with touch organization using those controls.

## Local deployment workflow

Context: the brief explicitly requires SvelteKit, SQLite, self-hosting, retained writing, and no cloud dependency.

Decision: create the repository directly in the supplied workspace and provide a Node/Docker deployment, rather than a managed-hosting-specific runtime. No public deployment or source upload is performed by the implementation task.

Consequences: the result runs independently and can be published on GitHub; a future host is selected by the owner.

## Apache-2.0 and optional AI boundary

Decision: use the requested Apache-2.0 license. Authors retain rights to their writing. AI remains off; its typed provider interface is present, but no request flow is claimed to work.

## SvelteKit 3 and the current Node LTS major

Decision: use Node 24 with SvelteKit 3's Vite configuration and `#lib` imports, following the [Node release schedule](https://nodejs.org/en/about/previous-releases) and [SvelteKit migration documentation](https://svelte.dev/docs/kit/migrating-to-sveltekit-3). Pin the lockfile and pnpm version for repeatable builds.

## Runtime origin at the Node server boundary

Context: adapter-node 6 defaults to HTTPS and removed its runtime `ORIGIN` option. A production HTTP smoke check caught origin rejection despite correct development behavior.

Decision: supply a small Node launcher around the official handler. It derives local HTTP or the explicitly configured runtime origin, overwrites private protocol/host headers, and sets the adapter body limit to 20 MB. Docker uses the same launcher.

Consequences: local and proxied deployments can change origin without rebuilding, while application and framework CSRF checks see the same origin. TLS terminates at the configured trusted proxy; arbitrary client-provided forwarding headers are not used.

## Connected manuscript and stable anchor identities

Decision: use the existing narrative units and documents as chapters/scenes and writing, with a lazy-loaded Tiptap Markdown editor. Inline story-reference atoms carry an object UUID, kind and fallback label for all five object types. Their durable Markdown tokens use Tiptap's [custom tokenizer and render/parse hooks](https://tiptap.dev/docs/editor/markdown/advanced-usage/custom-tokenizer). Clean manuscript export omits planning references and notes; complete JSON preserves them and remaps reference IDs on copy/import.

Consequences: graph and manuscript share identity and autosave. References survive object deletion with readable labels. Expanding references is an undoable explicit change; later prose and writing notes survive unrelated graph undo. Markdown supports the installed schema, rather than arbitrary HTML or unsupported publication features.

Decision: retain the original unnamed source/target handles, give extra anchors stable direction/number IDs, and persist chosen anchors on canonical connections. Moving sides keeps IDs, and reducing count routes missing extra anchors back to the original point. Empty-canvas connection creation atomically adds the object, its layout, and its connection. Selecting a line does not open a blocking dialog; Delete removes it immediately with undo. Removing a derived sequence line records a break without changing reading order.

Consequences: existing projects and connections remain usable without a database migration. Presentation, writing notes, and anchor configuration stay in validated JSON/metadata; icon favorites remain browser-local preferences.
