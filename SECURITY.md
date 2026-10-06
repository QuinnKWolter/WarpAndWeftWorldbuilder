# Security

Warp & Weft Worldbuilder is a single-user alpha. Its default local server and Docker port bind to loopback. There is no authentication or user separation. Public hosting requires access control at a reverse proxy or private network; this release is not a multi-user SaaS.

Server mutations validate project shapes and references. SQLite foreign keys and transactions protect integrity. Concurrent saves use revision checks. Rich documents allow a restricted node schema and safe URL protocols. Imports accept JSON only, never archive paths or executable attachments. There is no telemetry or AI network traffic.

Do not publish private manuscripts or secrets when reporting an issue. Once this repository is hosted on GitHub, enable private vulnerability reporting and submit security issues through the repository's Security tab. Until that is enabled, contact the repository owner privately through an established channel. There is intentionally no invented reporting email address.

Supported version: `0.1.0-alpha.1`. Dependency audit and release checks are recorded in [release status](docs/RELEASE_STATUS.md). Back up the database before upgrading. The SQLite file and local recovery drafts are not encrypted by the application; use operating-system encryption if needed.
