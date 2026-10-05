# Domain model and temporal rules

All canonical records use UUIDs. Each belongs to one project. Core fields are relational; metadata and custom JSON values supplement them rather than replacing the schema.

| Concept              | Meaning                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| Project              | Story title, description, local owner, settings, save revision                      |
| Entity + facets      | World object with multiple built-in or custom identities                            |
| Narrative unit       | Arbitrarily nested authored structure, sibling rank, labeled story time, POV/status |
| Event                | World occurrence with time, scene, within-point order, requirements                 |
| Relationship         | First-class connection, participants, direction, type, description                  |
| Relationship state   | Effective interval, qualitative label, optional dimensions, cause and note          |
| State change         | Subject/property/target, JSON previous/new values, time/order and cause             |
| Membership           | Typed entity participation/setting in a scene                                       |
| Thread + membership  | Overlapping cross-cutting grouping of entities, units, events or relationships      |
| Semantic link        | Causality, setup, payoff, reveal or resolution between addressable objects          |
| Document + reference | ProseMirror JSON, plain text, and explicit entity references                        |
| View layout          | Lens-scoped positions independent of canonical story semantics                      |

## Two independent orders

Sibling `rank` controls reading order. Tree traversal gives the complete authored sequence. Insert/reorder chooses the midpoint of neighboring ranks; tight ranks are rebalanced within the sibling group. A unit may contain any other narrative kind. Hierarchy cycles are rejected.

`storyTime` is a finite scalar: ordinal, relative duration, or a timestamp chosen by the author. `timeLabel` supplies fictional calendars and human descriptions. `storyEnd` is optional. Reordering never changes these values. Changing a scene time does not implicitly rewrite its events; the inspector has an explicit alignment action.

## State interpretation

The story snapshot applies changes whose story point is at or before the selected point, ordered by time, within-point order, then stable ID. Unknown/unmodeled properties remain absent. An explicit `false` is distinct from unknown. Optional previous-value corrections affect diff presentation; canonical snapshots apply new values.

For each relationship, the latest effective transition supersedes earlier transitions. `until` is exclusive. An expired latest transition yields unmodeled state; older states do not resume. Without an explicit end, a transition lasts until the next transition. Equal-time transitions use causing-event order (zero without an event), then stable UUID ordering. Qualitative labels are sufficient; dimensions are optional.

The timeline can include event steps at the same story point. A selected event includes changes at or below that event's order; a scene point includes all changes there. “Inspect world before this scene” excludes all changes/transitions at the scene's point. It does not move narrative order. Changes caused by an event copy its time/order on creation; later alignment is explicit.

Resolving an unknown into an entity or event retains its narrative envelope, attached prose and connections, and adds the corresponding participant/event. Merging an unknown into an existing unit redirects scene references and semantic links, deduplicates memberships, appends children and prose, and archives the original unit metadata in `mergedNarrativeUnits`. Targets inside the source are rejected. Immediate undo restores separate prose if it has not subsequently been rewritten; later prose is preserved.

For possession transfer, record the former holder's possession as false and the recipient's as true. For knowledge, use `knowledge` with the secret as target. For location, a descriptive value is sufficient. Custom properties use the same mechanism.

Event requirements are checked against changes that happen earlier, or at the same point with a lower within-point order. Reader-order observations compare the establishing scene's narrative position with the event's scene, without confusing that with an actual world contradiction. Intentional delayed reveals are information, not errors.

Deletion previews affected record counts. Validated removal cascades dependent histories, changes, membership, references, and nested units; POV references are cleared. The workspace keeps an immediate undo snapshot. Export before deleting an entire project.
