# Portable export schema v1

Filename: `<story title>.storygraph.json`. UTF-8 JSON with `format: "storygraph"` and `version: 1`.

Top-level keys: `project`, `entities`, `units`, `events`, `relationships`, `relationshipStates`, `changes`, `threads`, `memberships`, `threadMemberships`, `links`, `documents`, `mentions`, and `layouts`. Definitions and defaults are centralized in `src/lib/domain/model.ts`.

Each collection contains stable UUID records. Relationships reference entities; relationship states reference their relationship and optionally a causing scene/event. State changes reference subjects and optional targets/causes. Parent IDs and fractional ranks preserve hierarchy and ordering. Story scalars and labels preserve chronology. Documents contain restricted ProseMirror JSON and plain text. Layouts use lens/scope keys and canvas coordinates. Metadata remains JSON compatible.

Record array order is not significant. Narrative rank, story time, event order and stable IDs define deterministic semantic order.

## Import

Imports accept up to 20 MB. The client previews a validated file and record counts; the server validates again before writing anything. Unknown export versions, duplicate identifiers, invalid/cyclic hierarchy, missing references, invalid intervals, and unsupported rich-document nodes/URL schemes are rejected.

Import always creates a separate project. All record IDs and typed reference fields are remapped consistently; the new project begins at revision zero. Prose and custom metadata are preserved verbatim. Embedded arbitrary strings are not interpreted as references; integrations should use typed reference fields.

No path extraction, executable files, or archives are accepted. Assets/ZIP exports are a future extension. The schema version is independent of the app version. Additive schema changes may use defaults; incompatible semantics must increment export version and provide an explicit migration.

## Markdown

The manuscript export traverses reading order, emits nested headings, and includes scene plain text or its synopsis if no prose exists. It is a readable portability option, not a full project backup: it omits relationships, state, layouts, and detailed rich formatting.
