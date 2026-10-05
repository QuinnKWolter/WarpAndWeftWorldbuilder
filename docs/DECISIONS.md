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

Decision: one validated `.storygraph.json` file, consistent ID remapping on import, and a separate Markdown manuscript export.

Consequences: no archive extraction or asset path hazards. ZIP/asset support needs a future format extension.

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
