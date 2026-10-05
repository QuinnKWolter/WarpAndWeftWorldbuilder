# Deployment

## Local production

Run `pnpm install --frozen-lockfile`, `pnpm setup`, `pnpm build`, and `pnpm start`. Default runtime address is `127.0.0.1:3000`. Set `ORIGIN` to your exact browser origin. Set `DATABASE_PATH` for a different SQLite file. Runtime Node reads environment variables provided by the process; use `node --env-file=.env scripts/start.mjs` if you choose to maintain a local `.env`.

Use the supplied launcher rather than `node build`. It sets the adapter's request origin correctly for local HTTP or the configured public origin, overwrites its internal protocol/host headers, and aligns the adapter body limit with the 20 MB application limit. SvelteKit 3 removed adapter-node's old runtime `ORIGIN` option; this launcher preserves Storygraph's simple runtime configuration.

PowerShell example:

```powershell
$env:ORIGIN = 'http://localhost:3000'
pnpm start
```

POSIX shell example:

```sh
ORIGIN=http://localhost:3000 pnpm start
```

The database directory must be writable. Drizzle migrations apply automatically when a connection opens. No external database, authentication service, or AI provider is required.

## Docker

Start: `docker compose up --build -d`. Stop: `docker compose down`. The checked-in compose file binds the host port to loopback and retains a named data volume. The runtime uses the unprivileged Node user and provides a health check. Node 24 is pinned as the runtime major.

Upgrade: export valuable stories, stop the old container, back up its volume, pull/update the source, then `docker compose up --build -d`. Do not remove volumes as part of upgrade. Future migrations must preserve existing projects. Keep the previous image and backup until the upgraded data has been checked.

## Backups

For a local install, `pnpm backup` uses SQLite's online backup API and writes a consistent standalone file under `data/backups`. It includes live WAL content safely. Keep the copy outside the database directory/machine for disaster recovery.

For Docker, stop the service before copying volume files. For example, after `docker compose stop`, use `docker compose cp storygraph:/app/data ./storygraph-backup` while the stopped container still exists, then `docker compose start`. Copy the entire data directory, including any WAL/SHM files. Never copy only an actively written `.db` while ignoring its WAL. A Storygraph JSON export is an additional portable project backup.

Restore with the service stopped and preserve ownership for the `node` user. Always test restored projects before discarding the previous data.

## Hosted access

This release has one local owner and no authentication. Put it behind a private network or an authenticated reverse proxy before making it accessible beyond loopback. Set `HOST=0.0.0.0` inside the hosted container and `ORIGIN` to the public origin. Terminate TLS at the proxy, retain the data volume, and back it up. Do not advertise this alpha as a public multi-user service.
