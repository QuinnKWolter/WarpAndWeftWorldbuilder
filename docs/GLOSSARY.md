# Warp & Weft Worldbuilder glossary

## World & identity

### Entity

Anything that exists in the world: person, place, object, faction, secret, creature, or concept. An entity can have several facets.

### Facet

A composable label describing an aspect of an entity: character, location, item, faction, or your own category. A city can be both a location and a political actor without being duplicated.

### Default facets

Facets applied to bulk-created entities unless a row overrides them. Leave the facets column blank, or enable “Use default facets for every row” to enter summaries and descriptions directly.

### Summary

A short description used on cards, search results, and planning references.

### Description

Longer background information, separate from the short summary and manuscript prose.

### Custom metadata

Additional structured JSON information attached to a story object. Appearance and organization settings also use metadata.

### Object identity

An object’s stable identifier. Renaming or recoloring preserves its connections and references.

### Unresolved entity

An entity whose identity or details remain uncertain. Its unresolved marker is a planning aid.

### World state

The modeled locations, possessions, knowledge, and other properties true at a selected story point.

## Narrative & organization

### Narrative unit

A structural piece of the story: act, chapter, scene, sequence, beat, conversation, transition, flashback, or note. The interface also calls these “moments.”

### Moment

The friendly name for a narrative unit. It may contain smaller moments and have its own prose.

### Act

A broad narrative container, often holding chapters or sequences.

### Chapter

A narrative unit used to group scenes and other moments. Manuscript chapters and graph chapters are the same objects.

### Scene

A moment with optional participants, events, changes, threads, synopsis, and prose.

### Beat

A small narrative action, reaction, or reveal, often nested inside a scene.

### Sequence

A group of related narrative moments, which can be nested.

### Conversation

A narrative unit for an exchange or discussion, optionally inside a scene.

### Transition

A moment connecting larger parts of the story.

### Flashback

A moment whose reading position differs from its in-world time. Set narrative order and chronology independently.

### Note

A narrative unit for an idea or annotation. It can have prose and connections.

### Nested narrative

Moments inside other moments: act → chapter → scene → conversation, with further nesting allowed.

### Parent

The unit or folder containing another item. Narrative parents and shelf folders serve different purposes.

### Sibling

An item sharing the same parent with another. Reading order is stored among sibling moments.

### Outline

The hierarchy and reading order of narrative units. Reordering here changes reading order; dragging graph boxes changes layout.

### Synopsis

The short plan for a moment, shown on its graph card and in its graph summary.

### Status

Writing progress: idea, draft, revised, or complete. It does not alter time or world state.

### POV / viewpoint

The optional entity whose perspective frames a moment. It is separate from scene participation.

### Unplaced idea

A narrative unit kept outside reading order until placed. Find it on the Ideas shelf.

### Placeholder / ghost moment

An unresolved graph moment representing something undecided. It can be resolved into a scene, entity, or event.

### Resolve

Turn an unresolved moment into a concrete idea while preserving compatible connections and its narrative envelope.

### Merge

Combine an unresolved moment with an existing moment while keeping compatible prose, children, membership, and history.

### Folder

A named, colored, icon-associated shelf container. Folder organization does not change narrative meaning.

### Collapse / expand

Hide or show a folder, outline branch, or detail section. Nothing is deleted.

### Reading order / narrative order

The order readers encounter moments. Changing it leaves their story timestamps unchanged.

### Rank

An internal sorting position among siblings. Use dragging or move buttons to change order.

## Time & change

### Story chronology

The in-world order of events, which can differ from reading order.

### Story point

A numeric position in your story’s time scale: days, years, hours, or any relative scale.

### Time label

A readable name such as “Winter” or “Before the Fall.” The numeric story point determines ordering.

### Timeline / time rail

The control for selecting story points and event positions and inspecting modeled state.

### At this moment / temporal mode

Evaluate relationships and modeled properties at the selected story point.

### Whole story / atemporal mode

View across the entire story, with relationship labels optionally summarizing their history.

### Event

Something happening in the world: meeting, battle, discovery, transfer, or another action. It may belong to a moment and cause changes.

### Event order

Order among events sharing a timestamp, allowing same-time changes to be inspected in sequence.

### State change / world change

A change to an entity property, optionally associated with a scene and causing event.

### Subject

The entity whose property changes or is checked by a requirement.

### Target

An optional entity involved in a relationship, change, or requirement, such as an owned key or learned secret.

### Property key

A tracked property’s name, such as location, possession, knowledge, status, or a custom name.

### Knowledge

A modeled property recording whether an entity knows something. Acquisition and event requirements can drive continuity checks.

### Possession

A modeled property recording whether an entity owns or holds an item.

### Location

A modeled property recording where an entity is. Location facets describe places; location changes track movement.

### Before / after

The previous and resulting values of a change, shown as readable transitions in the scene diff.

### Value

A stored property result: text, number, true/false, null, or another supported JSON value.

### Requirement

A condition needed by an event, such as having a key. Diagnostics compare it with modeled state.

### State diff / what changes

A readable comparison of modeled properties before and after a scene’s changes.

### Snapshot / state resolver

The deterministic result of applying recorded changes up to the selected time and event order.

## Connections & threads

### Node

A graph box representing an entity, moment, event, or thread. Position and color are presentation choices.

### Edge / connection

A line joining objects: reading progression, relationship, or semantic link.

### Connection anchor / handle

A point where a line starts or ends. Move anchors to any side or add up to four per direction.

### Incoming / target anchor

Where a connection ends. Moving it changes routing, not meaning.

### Outgoing / source anchor

Where a connection starts. Connect it to another anchor or release on empty canvas to create a connected object.

### Sequence connection

A projected line between adjacent moments. Deleting that line retains reading order; undo restores it.

### Relationship

A first-class connection between entities, with its own identity, type, description, direction, and history.

### Directed relationship

A connection with source-to-target direction, such as a faction controlling a city.

### Relationship type

A relationship category such as alliance, ownership, rivalry, or a custom type.

### Relationship state

A qualitative condition during an interval, such as strangers, friends, or enemies.

### Relationship history

The progression of states, with optional causing scenes and events.

### Effective from / until

The interval where a state applies. Until is exclusive; an empty end means no specified end.

### Dimensions

Optional numeric measures in a relationship state, such as trust or fear. Descriptive states need no numbers.

### Semantic link

A typed connection explaining how objects affect each other, distinct from a relationship or reading order.

### Causes

The source brings about the target.

### Enables

The source makes the target possible. This is an editable default when creating connected non-entity objects.

### Prevents

The source blocks the target.

### Foreshadows

The source hints at the target before it occurs.

### Sets up / setup

A link or moment marker recording a preparation, question, or promise that may need a payoff.

### Pays off / payoff

The fulfillment of an earlier setup.

### Reveals

The source exposes information represented by the target.

### Resolves

The source settles a question or unresolved idea represented by the target.

### Plot thread

A storyline, theme, mystery, relationship arc, or through-line spanning multiple kinds of objects.

### Thread membership

An object’s participation in a thread. It can belong to several.

### Follow / unfollow

Apply or remove a thread filter. Unfollowing does not delete a thread or remove memberships.

### All threads

Clear followed-thread filters to view relevant objects across all threads.

### Scene membership / participant

An entity’s role in a moment: present, setting, involved, or a custom role.

## Writing

### Manuscript

The chapter-and-scene writing workspace, sharing the graph’s hierarchy and documents.

### Document / prose

Writing attached to a narrative unit. Rich text, Markdown, and scene writing edit the same content.

### Markdown

A plain-text format for headings, emphasis, lists, quotes, links, and code. Switch modes to edit its source.

### Rich text

A formatted writing surface with toolbar and keyboard editing. Supported formatting is retained when switching modes.

### Read mode

A formatted page with editing disabled. Hide placeholders to read only story text.

### Story placeholder / planning reference

An inline linked reminder for any moment, entity, event, relationship, or thread. It differs from an unresolved graph moment and does not count as prose.

### Reference token

The durable Markdown syntax {{story:kind:identifier|encoded-label}}. Keep it intact to preserve the object link.

### Mention

A tracked entity reference in a document. Entity placeholders synchronize mention records.

### Insert placeholder

Search every story-object type and insert a linked reminder at your cursor.

### Populate from outline

Append child-moment placeholders in reading order, retaining prose and previously inserted references.

### Expand placeholders

Replace references with current object names and summaries or descriptions as draft text. This is not AI generation. Graph undo can restore references.

### Hide placeholders

Temporarily remove references from the formatted page without deleting them. Markdown source retains tokens to preserve links.

### Writing notes

Optional planning text attached to a moment or chapter, excluded from clean manuscript export.

### Live graph summary

Current synopsis, descendants, participants, events, relationships, and threads, derived from your project without AI.

### Word count

Approximate whitespace-separated prose word count. Planning references are excluded.

### Clean Markdown export

Story text in reading order with formatting, excluding planning placeholders and writing notes.

### Find / replace

Locate text or replace the next match in the current page. Read mode permits finding but not replacement.

## Workspace & data

### Lens / projection

A view emphasizing different objects or ordering in the same project. Switching lenses does not duplicate data.

### Narrative lens

Sibling moments in reading order, with nesting available through breadcrumbs and double-click.

### World lens

World entities and their relationships.

### Relationship lens

Entities participating in relationships and the selected time’s state.

### Thread lens

Moments, entities, events, and relationships associated with followed threads.

### Chronology lens

Moments sorted by in-world time, leaving reading order unchanged.

### Entities shelf

The left drawer for entities, threads, the outline, and unresolved or unplaced ideas.

### Inspector

The right drawer containing editable details, history, memberships, and changes.

### Canvas / layout

The graph’s pan-and-zoom surface and node positions, saved separately by lens and narrative context.

### Arrange

Automatically position visible nodes without changing narrative order.

### Fit view

Adjust pan and zoom to show visible graph objects.

### Fullscreen / focus view

Expand the shelf, inspector, graph, or manuscript to the window. Exit with its button or Escape.

### Command palette

Search objects and actions with Ctrl/Cmd+K, including manuscript, glossary, creation, lenses, export, and unfollow.

### Bulk add

Create up to 500 entities, one per line, with validation and equivalent-name/facet duplicate skipping.

### Favorite icon

A starred icon stored in this browser, separate from project data.

### Continuity diagnostic

A deterministic warning or information message based on explicitly modeled data, not an AI judgment.

### Loose thread

An informational diagnostic for unresolved ideas, unplaced content, or missing modeled payoffs.

### Autosave

Queue changes to the installation’s database. The header reports pending, saving, saved, or error states.

### Browser recovery draft

A local browser copy of pending changes supplementing the saved database.

### Revision / save conflict

A saved-version number detects another window’s edits and preserves pending work rather than overwriting newer changes.

### Undo / redo

Restore graph and organization changes in this session. The prose editor has separate text undo; later writing is preserved across graph undo where possible.

### Delete

Delete/Backspace removes the selected graph node or connection with undo. Inputs keep normal editing behavior. Inspector deletion offers an impact preview.

### Export / import

Save or restore portable project JSON containing objects, prose, history, organization, and layouts.

### JSON

A structured text format used for exports and custom metadata: double-quoted strings, brace-delimited objects, and bracket-delimited arrays.

### SQLite database

The installation’s durable project storage, requiring no external cloud database.

### Local-first / private by default

Writing stays in your installation unless you explicitly export or configure external features. Browser preferences and the project database are separate.

### AI provider

An optional future integration boundary. Current summaries and diagnostics are derived locally without AI.
