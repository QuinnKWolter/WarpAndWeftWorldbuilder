# Privacy

The app has no telemetry, analytics, tracking pixels, advertising, cloud storage integration, hosted fonts, or external AI requests. It does not contact third-party servers during ordinary writing. Your browser talks to the Warp & Weft Worldbuilder installation you run. Development includes Vite's local hot-reload connection. Installation downloads open-source dependencies; CI and browser installation also use package registries and browser distribution servers.

Projects and rich prose are stored in local SQLite at `DATABASE_PATH`, default `./data/storygraph.db`. Docker stores this in a retained named volume. There is no app-level encryption; use operating-system or disk encryption to protect private work.

Pending/failed saves have a recovery copy in that browser origin's local storage. A successfully acknowledged complete save removes its pending copy. Theme and motion preferences also live in local storage. Stale recovery copies can be exported from the recovery dialog; discarding one does not alter the current database project. Shared machines should use separate operating-system/browser profiles.

Exports are user-initiated files in your chosen download location. Import validates JSON and creates a separate local project. Deleted projects are removed transactionally from the active SQLite database; backups, exported files, and recovery drafts are separate copies. SQLite storage pages are not a secure-erasure guarantee.

AI is disabled and unimplemented at the network boundary. Future providers must send only explicitly selected structured context after explicit user invocation, keep secrets server-side, and use a review/apply step for suggestions.

Self-hosting access is determined by the host and network configuration. There is no authentication in this alpha. See deployment and security documentation before exposing it to other people.
