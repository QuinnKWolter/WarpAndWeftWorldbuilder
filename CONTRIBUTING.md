# Contributing

Use Node 24 and the pinned pnpm version. Run `corepack enable`, `pnpm install`, `pnpm setup`, and `pnpm dev`.

Read [architecture](docs/ARCHITECTURE.md), [domain semantics](docs/DOMAIN_MODEL.md), and [development](docs/DEVELOPMENT.md) before changing temporal behavior. Keep story chronology separate from reading order. Add meaningful domain tests for a changed invariant and browser coverage for new workflows. Include a Drizzle migration when changing the schema; never replace a user's database to upgrade it.

Before proposing a change, run `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`. Describe the concrete behavior, validation, and any data-format implications. Never commit personal writing, recovery drafts, API credentials, or local databases.

Small, cohesive pull requests are welcome. New graph lenses should use the shared projection boundary; diagnostics should be deterministic and navigable. User writing remains authoritative.
