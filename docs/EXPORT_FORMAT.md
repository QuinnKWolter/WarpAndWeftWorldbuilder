# Portable export schema v1

Filename: `<story title>.warp-weft.json`. UTF-8 JSON with `format: "storygraph"` and `version: 1`. The format identifier stays unchanged for compatibility; legacy `.storygraph.json` files continue to import.

Top-level keys: `project`, `entities`, `units`, `events`, `relationships`, `relationshipStates`, `changes`, `threads`, `memberships`, `threadMemberships`, `links`, `documents`, `mentions`, and `layouts`. Definitions and defaults are centralized in `src/lib/domain/model.ts`.

Each collection contains stable UUID records. Relationships reference entities; relationship states reference their relationship and optionally a causing scene/event. State changes reference subjects and optional targets/causes. Parent IDs and fractional ranks preserve hierarchy and ordering. Story scalars and labels preserve chronology. Documents contain restricted ProseMirror JSON and plain text. Layouts use lens/scope keys and canvas coordinates. Metadata remains JSON compatible.

Record array order is not significant. Narrative rank, story time, event order and stable IDs define deterministic semantic order.

## Organization and appearance

`project.settings.organization` optionally contains `folders`, `placements`, and `collapsedUnits`. Folders have UUID `id`, nullable `parentId`, section (`entities`, `ideas`, or `threads`), name, hex color, named icon, rank, optional facet default, and collapsed state. Placements have a canonical `objectId`, nullable `folderId`, and independent rank. `collapsedUnits` contains narrative unit IDs. Validation rejects folder cycles, cross-section placement, duplicate placement, and missing references. Import/duplication remaps these typed IDs along with canonical records. Deleting a folder retains its objects and promotes child folders.

Existing projects without organization receive editable facet folders when opened; no database migration is required. Organization does not alter narrative hierarchy or story time. Entity/unit `metadata.presentation` optionally stores a hex color and named icon. Device theme and motion preferences remain local to the browser.

## Import

Imports accept up to 20 MB. The client previews a validated file and record counts; the server validates again before writing anything. Unknown export versions, duplicate identifiers, invalid/cyclic hierarchy, missing references, invalid intervals, and unsupported rich-document nodes/URL schemes are rejected.

Import always creates a separate project. All record IDs and typed reference fields are remapped consistently; the new project begins at revision zero. Prose and custom metadata are preserved. Typed `storyReference` nodes remap their `attrs.objectId` during import/duplication. Other arbitrary strings are not interpreted as references.

No path extraction, executable files, or archives are accepted. Assets/ZIP exports are a future extension. The schema version is independent of the app version. Additive schema changes may use defaults; incompatible semantics must increment export version and provide an explicit migration.

## Markdown

The manuscript export traverses reading order, emits nested headings, and serializes supported rich formatting or a synopsis if no document exists. Planning references and writing notes are excluded. It omits graph relationships, state, and layouts; JSON remains the full backup.

## Manuscript and connection metadata

Documents accept the additional inline `storyReference` node, with `attrs.objectId`, `attrs.kind` (entity/unit/event/relationship/thread), and `attrs.label`. Deleted objects leave readable missing-reference labels rather than erasing prose. Older alpha builds do not recognize this new node; upgrade before importing projects containing manuscript references. Existing documents remain valid without migration.

Narrative-unit `metadata.writingNotes` stores optional manuscript notes. Object `metadata.anchors` contains sourceSide, targetSide (left/right/top/bottom), and count (1–4). Relationship/link `metadata.connection` stores optional sourceHandle/targetHandle identities; removing an extra anchor routes its links through the first anchor. Narrative-unit `metadata.sequenceBreaks` records hidden automatic connections to target unit IDs; deleting a line retains reading order. `metadata.canvasContext` preserves a connected object’s creation view. Icon favorites are browser preferences, not project data.
