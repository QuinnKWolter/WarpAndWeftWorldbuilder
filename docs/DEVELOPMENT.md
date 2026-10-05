# Development

Use Node 24 and pnpm 12.9.1, pinned in package metadata. Run `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm setup`, `pnpm dev`. If Corepack is missing, `npm install --global corepack@0.36.0` installs it. `corepack pnpm` also works.

SvelteKit 3 keeps configuration in `vite.config.ts` and uses `#lib/*` subpath imports. It generates `$app/tsconfig`; run `pnpm check` after cloning to synchronize types. There is intentionally no obsolete `svelte.config.js`. Product metadata is centralized in `src/lib/product.ts`.

## Platforms

- Windows: PowerShell works. If an NVM-managed shim reports a changed identity after an intentional installation, use that manager's documented `nvm reshim` repair. An exFAT workspace needs the checked-in hoisted node linker because exFAT lacks symlink support. Corepack commands work without a globally installed pnpm binary.
- macOS/Linux: the same commands apply. SQLite ships platform binaries for supported systems. Linux browser tests may need `pnpm exec playwright install --with-deps chromium`.
- Docker is optional, not required for development. Start its engine before running container checks.

## Schema changes

Edit `src/lib/server/schema.ts`, run `pnpm db:generate`, inspect SQL, commit SQL and Drizzle metadata, back up an existing DB, then run `pnpm db:migrate`. Do not modify a migration already shipped to users. Update export version/defaults separately as needed.

## Verification

`pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`. Run `pnpm format` before checks. Playwright uses a separate `data/e2e.db`. Tests create uniquely identified project records and do not touch `data/storygraph.db`.

Never put secrets, personal writing, runtime databases, recovery copies, cache directories, or build output in Git. The demo is original licensed material. Keep changes in cohesive commits and update the decision log only for consequential architecture decisions.
