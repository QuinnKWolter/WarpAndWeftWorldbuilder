# Mission

You are the lead engineer and product-minded implementation agent for a new open-source web application for fiction writers, worldbuilders, game writers, screenwriters, and other narrative designers.

You have also been given a separate product-vision document describing the application concept in detail. Treat that vision as authoritative regarding the intended user experience and conceptual direction. Treat this prompt as the implementation contract governing architecture, scope, quality, repository structure, testing, documentation, and release readiness.

The application is not primarily a note-taking tool, static knowledge graph, wiki, or prose editor.

Its central abstraction is:

> A story is a temporally changing knowledge graph. Narrative units and events modify the state of that graph over time.

The application should function increasingly like an **IDE for stories**:

- entities are symbols,
- mentions are references,
- scenes are executable narrative units,
- events cause state changes,
- relationships have histories,
- narrative restructuring resembles refactoring,
- continuity problems resemble diagnostics,
- story-state inspection resembles debugging,
- views/lenses resemble alternate projections of the same underlying model.

The initial release must be polished enough to distribute publicly through GitHub as FOSS and usable enough for real testers to create, edit, save, export, reopen, and meaningfully explore a story project.

Do not build a visual prototype that merely looks convincing.

Build a coherent application.

---

# 1. Product Objective

The application must make it significantly easier to answer questions such as:

- What is happening at this point in the story?
- What does the world look like at this moment?
- How does Alice's relationship with Bob change over time?
- When did Alice learn this information?
- Where was this object before this scene?
- Which characters are involved in this plot thread?
- What happens between these two narrative events?
- What breaks if I move this scene?
- Which setups have no payoff?
- Which plotlines disappear for too long?
- What is the difference between chronological order and reader-facing narrative order?
- What changed during this scene?
- What does this character know immediately before this scene?
- What unresolved ideas have I not yet placed?

The system must support both loose creative exploration and increasingly formal narrative modeling.

The guiding principle is:

> Progressive formalization.

A new user should be able to create a few nodes, connect them, arrange scenes, and write notes without understanding the deeper model.

A power user should eventually be able to model:

- story chronology,
- narrative chronology,
- relationships,
- changing relationship states,
- knowledge,
- possession,
- character location,
- plot threads,
- causality,
- setups/payoffs,
- scene membership,
- POV,
- custom attributes,
- world-state changes.

Do not force users to model all of these.

---

# 2. Working Product Identity

Use a configurable working name rather than scattering a hardcoded product name throughout the codebase.

Default working name:

**Storygraph**

Centralize product metadata so renaming later is trivial.

Do not spend significant time on branding.

Prioritize functionality, visual coherence, usability, and extensibility.

---

# 3. Required Technical Stack

Unless an existing repository already has a well-justified equivalent stack, use:

- SvelteKit
- TypeScript
- strict TypeScript configuration
- current active-LTS Node.js release at implementation time
- pnpm
- Tailwind CSS
- CSS custom properties for semantic design tokens
- Drizzle ORM
- SQLite as the default self-hosted/local database
- Svelte Flow / `@xyflow/svelte` or the currently maintained Svelte Flow equivalent for graph interaction
- ELK.js or equivalent maintained graph-layout utility where automated layout is required
- Zod for validation
- Vitest for unit/integration testing
- Playwright for end-to-end/browser testing
- ESLint
- Prettier

Use maintained libraries rather than implementing foundational graph/editor infrastructure manually.

For rich-text or structured prose editing, select a maintained Svelte-compatible editor library. Prefer a ProseMirror-based solution if appropriate, but isolate the editor behind an internal adapter/component boundary so the package can be replaced later.

Avoid adding major dependencies casually.

Every major dependency should solve a real problem.

---

# 4. Deployment Philosophy

The application must work well for:

1. a developer cloning the repository,
2. a nonexpert tester running it locally,
3. a Docker deployment,
4. a future publicly hosted deployment.

The default release should not require PostgreSQL, Redis, external authentication, cloud storage, or third-party APIs.

The application should work entirely with SQLite.

Architect persistence cleanly enough that PostgreSQL support can be introduced later without rewriting the domain layer.

Do not prematurely implement horizontal scaling or distributed infrastructure.

---

# 5. Privacy Philosophy

Writing projects can be highly private.

Therefore:

- no telemetry by default,
- no analytics by default,
- no third-party tracking,
- no advertising infrastructure,
- no writing sent to external AI services unless the user explicitly configures and invokes such a service,
- no secrets embedded in client bundles,
- clear documentation of any network behavior.

The core application must remain fully useful without AI.

AI is an enhancement, not a dependency.

---

# 6. Repository Expectations

Create a clean professional repository suitable for GitHub.

At minimum include:

```text
/
├─ src/
├─ static/
├─ tests/
├─ docs/
├─ drizzle/
├─ scripts/
├─ .github/
│  └─ workflows/
├─ .env.example
├─ .gitignore
├─ .editorconfig
├─ LICENSE
├─ README.md
├─ CONTRIBUTING.md
├─ CODE_OF_CONDUCT.md
├─ SECURITY.md
├─ CHANGELOG.md
├─ package.json
├─ pnpm-lock.yaml
├─ tsconfig.json
├─ vite.config.*
├─ svelte.config.*
├─ drizzle.config.*
├─ Dockerfile
└─ docker-compose.yml
```

Use **Apache-2.0** as the initial license unless the repository already specifies another license.

Maintain a sensible separation between:

```text
domain
persistence
application/services
UI/components
graph projections
state derivation
assistant/provider integration
```

Do not put application logic directly into Svelte components when it belongs in reusable services or domain functions.

---

# 7. Core Domain Model

The data model must reflect the product concept instead of mirroring whatever happens to be easiest to render.

Use stable UUID identifiers.

At minimum model the following concepts.

## Project

Represents one story/world project.

Suggested fields:

- id
- title
- description
- createdAt
- updatedAt
- settings
- metadata

---

## Entity

Represents something that exists conceptually in the story world.

Examples:

- character
- location
- item
- faction
- organization
- secret
- concept
- creature
- culture
- institution

Suggested core fields:

- id
- projectId
- name
- summary
- description
- createdAt
- updatedAt
- metadata

Do not force exactly one entity type.

---

## Entity Facet

Entities should support composable facets.

Example:

```text
King's Landing
- location
- political actor
- setting
- organizational container
```

Or:

```text
The Crown
- item
- symbol
- office
- source of authority
```

Facets should support:

- built-in defaults,
- user-defined facets,
- multiple facets per entity.

---

## Narrative Unit

Represents structural pieces of the authored narrative.

Examples:

- act
- sequence
- chapter
- scene
- beat
- conversation
- transition
- flashback
- nested story

Narrative units must support arbitrary nesting.

Do not hardcode:

```text
Book > Chapter > Scene
```

as the only hierarchy.

Use a parent-child structure and sortable ordering.

Suggested fields:

- id
- projectId
- parentId
- type
- title
- synopsis
- prose/document reference
- narrativeOrder
- storyTimeStart
- storyTimeEnd
- POV entity
- status
- metadata

Use a ranking/order strategy that handles drag-reordering without fragile global integer renumbering where practical.

---

## Event

Represents something that happens.

Examples:

- character meets another character,
- object transfers ownership,
- secret is learned,
- battle occurs,
- betrayal occurs,
- character travels,
- government collapses.

Events should be attachable to narrative units.

Suggested fields:

- id
- projectId
- narrativeUnitId
- title
- description
- storyTime
- orderWithinUnit
- metadata

---

## Relationship

Relationships must be first-class objects.

Do not represent them only as anonymous graph edges.

Examples:

```text
Alice ↔ Bob
Rome controls Province
Alice owns Sword
Faction A opposes Faction B
```

At minimum:

- id
- projectId
- relationshipType
- sourceEntityId
- targetEntityId
- directionality
- label
- description
- metadata

The design should permit expansion toward n-ary relationships later without requiring it in the alpha.

---

## Relationship State

A relationship can change.

Example:

```text
Alice ↔ Bob

strangers
→ acquaintances
→ friends
→ suspicious
→ enemies
→ allies
```

A RelationshipState should associate:

- relationship,
- effective story point,
- optionally ending story point,
- qualitative state,
- optional custom numeric dimensions,
- causing event,
- narrative unit,
- note.

Do not require numeric scoring.

Users should be able to use plain descriptive states.

---

## Thread

Represents a cross-cutting storyline or conceptual line.

Examples:

- Main Plot
- Alice/Bob Relationship
- Rebellion
- Missing Artifact
- Murder Mystery
- Theme: Identity

A narrative unit, event, entity, or relationship may belong to multiple threads.

---

## Temporal State Change

Implement a general mechanism capable of representing world-state transitions.

Examples:

```text
Alice.location:
Embassy → Hotel

Bob.possession.RedKey:
true → false

Alice.knowledge.SecretX:
false → true

Alice.status:
healthy → injured
```

Do not build an enormous philosophical ontology.

A practical state-change representation should include concepts equivalent to:

- subject
- category/key
- previous value
- new value
- optional target entity
- effective story point
- causing event
- narrative unit
- metadata

Use JSON-compatible values where useful.

The purpose is to derive story snapshots and power continuity checks.

Do not event-source the entire application merely because state changes exist.

CRUD data may remain CRUD data.

---

## Presence / Scene Membership

The system must know which entities participate in a narrative unit.

Examples:

- character present,
- location setting,
- object involved,
- faction referenced.

Use typed memberships rather than burying this only inside prose.

---

## Document / Prose

Narrative units may have attached prose or notes.

Keep the prose/editor layer separate from graph metadata.

Avoid storing essential story state exclusively inside rich-text HTML.

---

## Custom Metadata

Allow users to add flexible custom fields without migrations for every conceivable worldbuilding category.

Use structured JSON metadata where appropriate, but do not turn the entire schema into JSON blobs.

Core semantics should remain relational and queryable.

---

# 8. Story Time vs Narrative Order

This distinction is mandatory.

The app must separately model:

### Story chronology

When events happen inside the fictional world.

### Narrative chronology

When scenes/events are presented to the reader.

Example:

```text
Story time:
1914 → 1918 → 1922 → 1937

Narrative order:
1937 → 1918 → 1914 → 1922
```

The UI must make this distinction understandable rather than merely representing it in the database.

A scene can therefore have:

- structural/narrative position,
- story timestamp or story-order position.

Support stories without literal calendar dates.

Story time should permit:

- actual date/time,
- ordinal/relative ordering,
- human-facing labels.

Examples:

```text
Day 1
T+4 hours
Year 143, Winter
Before the Fall
```

Do not assume Gregorian chronology is always available.

---

# 9. Story-State Derivation

Implement a deterministic service capable of answering:

> What is the known modeled state of the project at story point X?

Do not compute this inside UI components.

Create a domain/application service.

For the alpha, deriving state can reasonably include:

- active relationship states,
- entity locations,
- possessions,
- knowledge states,
- custom tracked properties.

Provide unit tests for state derivation.

Given the same stored data and story point, the result must be deterministic.

---

# 10. Primary Application Shell

Desktop should use approximately:

```text
┌─────────────────────────────────────────────────────────┐
│ project / mode controls / timeline / search / commands │
├────────────┬───────────────────────────────┬────────────┤
│            │                               │            │
│ entity     │                               │ inspector  │
│ shelf      │          main canvas          │ / details  │
│            │                               │            │
│            │                               │            │
├────────────┴───────────────────────────────┴────────────┤
│ contextual editor / scene information when appropriate │
└─────────────────────────────────────────────────────────┘
```

The canvas should visually dominate.

Panels should be collapsible.

Do not make the interface resemble an enterprise admin dashboard.

---

# 11. Visual Direction

Desired character:

- modern,
- calm,
- precise,
- sophisticated,
- minimal,
- creative-tool aesthetic,
- dark and light themes,
- high information density without visual noise.

Reference qualities:

- Figma
- Linear
- Obsidian Canvas
- Arc
- high-quality game skill trees
- modern visual development tools

Avoid copying any product directly.

Use:

- semantic design tokens,
- restrained border usage,
- subtle elevation,
- compact typography,
- high-quality spacing,
- careful hover/focus states,
- progressive disclosure.

Do not fill the interface with huge cards and excessive padding.

Do not use pill shapes everywhere.

Do not use gradients merely to make the UI appear “modern.”

Graph edges and nodes should remain visually legible in both light and dark modes.

---

# 12. Responsive Behavior

The application must remain usable at:

- large desktop,
- laptop,
- tablet,
- phone.

Do not attempt to display three permanent columns on mobile.

At narrow widths:

- entity shelf becomes a drawer,
- inspector becomes a drawer/sheet,
- timeline remains horizontally scrollable,
- primary canvas remains pan/zoom capable,
- scene editor may take over most of the viewport,
- contextual controls collapse into compact menus.

Test at common mobile widths in Playwright.

---

# 13. Graph Canvas

The graph canvas is one of the core product surfaces.

Required interactions:

- pan,
- zoom,
- fit view,
- select node,
- multi-select where practical,
- drag node,
- connect nodes,
- click edge,
- drag/drop entity from shelf,
- open node details,
- create connected node,
- delete with confirmation/undo semantics,
- edge labels,
- keyboard navigation where practical.

Store user layout positions separately from domain semantics.

A node's manually chosen screen position must not become part of the narrative domain model.

Allow distinct layouts by lens/view.

---

# 14. Node Interaction Model

A node should support:

### Hover

Show compact information.

Examples:

- title/name,
- facets/type,
- short summary,
- scene/story position,
- relationship status.

### Click

Select and open richer inspector content.

### Double-click

Open/edit primary content.

### Connection handle / perimeter affordance

Launch creation of a new connected node or connection.

### Drag

Move spatially.

Where the current view represents sequence, dragging into a sequence location may instead reorder.

Be explicit in the UI about whether drag means spatial movement or narrative reordering.

Do not create ambiguous interactions.

---

# 15. Edge Interaction Model

Edges are not decorative.

They can represent:

- relationship,
- narrative progression,
- causality,
- thread continuity,
- containment,
- knowledge,
- ownership,
- other semantic links.

Clicking an edge must allow inspection of its meaning.

Hovering over an expandable narrative edge should reveal an insertion affordance.

Conceptually:

```text
Scene A ───── + ───── Scene B
```

Selecting `+` should allow creation/insertion of:

- Scene
- Event
- Transition
- Existing entity
- New entity
- Note
- Placeholder
- Thread branch

For sequence edges, insertion should update narrative ordering correctly.

This interaction is a signature feature. Treat it as important.

---

# 16. Progressive Decomposition

Users should be able to begin with:

```text
Beginning ───────── Ending
```

and progressively insert structure:

```text
Beginning
→ Inciting Incident
→ Betrayal
→ Resolution
→ Ending
```

Then decompose further.

The user should not need to define the entire story hierarchy before working.

Support gradual expansion.

---

# 17. Semantic Zoom

Design toward semantic zoom.

The alpha does not need every possible zoom mode, but architecture must not preclude it.

Desired eventual behavior:

### Far zoom

```text
Act I → Act II → Act III
```

### Mid zoom

```text
Arrival → Investigation → Betrayal
```

### Close zoom

Entities and scene participants.

### Very close

Fine-grained events/state changes.

For the first tester release, implement at least two meaningful levels of detail if practical.

Otherwise ensure the component system and graph projection architecture can later support them.

---

# 18. Timeline

Provide a persistent or readily accessible timeline control.

Users should be able to move through narrative/story positions and watch the projected graph change.

The current story point should be visually obvious.

The timeline should support:

- scene-level positions,
- event-level positions,
- labels,
- clicking,
- keyboard stepping,
- horizontal scrolling,
- jump-to-current selection.

Avoid making the timeline dependent exclusively on literal timestamps.

---

# 19. Temporal vs Atemporal View

Provide a clear mode toggle.

### Temporal

Show the modeled world/story graph at the selected point in story time.

### Atemporal

Show entities and relationships existing anywhere in the project.

In atemporal mode, relationships can summarize their history.

Example:

```text
Alice — Bob
Strangers → Friends → Enemies → Allies
```

This mode provides the Obsidian-like whole-project graph.

---

# 20. Required Lenses / Views

Do not build every imagined view fully before the alpha.

Implement the projection architecture so views consume the same domain model.

The first release should include at minimum:

## Narrative Lens

Focus:

- narrative units,
- sequence,
- hierarchy,
- transitions.

## Entity / World Lens

Focus:

- characters,
- locations,
- items,
- factions,
- relationships.

## Relationship Lens

Focus:

- entities,
- interpersonal/world relationships,
- relationship state at selected time.

## Thread Lens

Focus:

- selected plot thread,
- participating scenes/events/entities.

Provide a clearly visible lens selector.

Architect additional lenses as plug-like graph projections.

Future lenses may include:

- chronology,
- knowledge,
- location,
- possession,
- faction,
- causality,
- POV,
- theme,
- promises/payoffs.

---

# 21. Entity Shelf

Create a persistent/collapsible shelf for story objects.

Example categories:

```text
Characters
Locations
Items
Factions
Threads
Scenes
Unplaced
```

Provide:

- search,
- filtering,
- sorting,
- create button,
- drag onto canvas,
- drag onto compatible scene/node/edge,
- compact entity cards.

Dragging an entity should invoke context-sensitive behavior.

Example:

Dragging Alice onto a scene:

> add Alice as a participant.

Dragging Embassy onto a scene:

> set/add Embassy as location.

Dragging Red Key onto a transition/edge:

> optionally create an event/state change involving the key.

Do not silently perform ambiguous destructive actions. Use a small action chooser where meaning is unclear.

---

# 22. Scene Workspace

Scenes are central.

Selecting a scene should expose a structured scene workspace containing approximately:

## Identity

- title
- parent unit
- narrative position
- story time
- POV
- status

## Participants

- characters
- locations
- objects
- factions

## Threads

Plot threads touching the scene.

## Events

What happens.

## Changes

What changes because of this scene.

## Prose

The actual written text or notes.

A scene's state-diff view should be capable of presenting:

```text
Alice
Embassy → Hotel
Trusts Bob → Distrusts Bob
Obtains Red Key

Bob
Loses Red Key
```

The user should not be forced to manually enter before/after values when the system can infer a previous modeled value.

Allow explicit override/correction.

---

# 23. Relationship Inspector

Clicking a relationship edge should open a dedicated relationship inspector.

Display:

- participants,
- relationship type,
- current state,
- description,
- history,
- associated scenes/events,
- relevant threads,
- notes.

Relationship history should visually show progression.

Example:

```text
Strangers
   ↓ Scene 4
Acquaintances
   ↓ Scene 9
Friends
   ↓ Scene 23
Suspicious
   ↓ Scene 27
Enemies
```

Support custom qualitative states.

Optionally allow user-defined dimensions such as:

- trust,
- affection,
- fear,
- authority.

Numeric dimensions must remain optional.

---

# 24. Nested Narrative Units

Support recursive containment.

Examples:

```text
Chapter
└─ Scene
   ├─ Conversation
   ├─ Flashback
   │  └─ Memory Scene
   └─ Transition
```

Provide breadcrumb navigation.

Avoid UI assumptions that scenes can never contain finer narrative units.

---

# 25. Threads

A narrative unit/event/entity can belong to multiple threads.

Thread view should allow focusing one or more threads.

Provide visually restrained thread indicators.

Do not turn the entire canvas into uncontrolled rainbow spaghetti.

Colors must be supplemented with text/icon/shape cues where necessary for accessibility.

---

# 26. Placeholder / Ghost Nodes

Writers frequently know that something must happen without knowing exactly what.

Support unresolved placeholders.

Examples:

```text
??? Betrayal

Unknown antagonist

Need reason to travel here

Unresolved reveal
```

A placeholder should later be resolvable into:

- an existing node,
- a new entity,
- a new event,
- a new scene.

Resolving it should preserve associated graph connections wherever logically possible.

---

# 27. Unplaced / Inbox Area

Provide a home for ideas that do not yet have narrative placement.

Examples:

- scene idea,
- character,
- event,
- quote,
- object,
- research note,
- unresolved plot idea.

Users should be able to drag these into the narrative later.

This prevents the tool from requiring premature organization.

---

# 28. Writing Editor

The application must support actual writing, not only planning.

At minimum provide:

- plain/rich text scene editor,
- autosave,
- word count,
- basic formatting,
- undo/redo,
- scene title,
- distraction-reduced writing mode,
- linking/mentioning story entities using `@`.

Do not attempt to reproduce Microsoft Word.

Prioritize reliable long-form writing.

The writing editor and graph should reference the same narrative-unit identity.

---

# 29. Mentions

Implement or architect toward entity mentions:

```text
@Alice
@Embassy
@RedKey
@Scene12
```

A mention should link to the relevant story object.

If rich editor integration makes full mention autocomplete unreasonable for the first pass, build the underlying entity-reference mechanism first and clearly document the limitation.

Do not fake unsupported functionality.

---

# 30. Command Palette

Implement:

```text
Ctrl/Cmd + K
```

Initial commands should include:

- Create scene
- Create entity
- Create thread
- Search project
- Jump to scene
- Jump to entity
- Switch lens
- Toggle temporal/atemporal mode
- Open unresolved items
- Fit graph
- Export project

Design command registration so new commands can be added cleanly.

---

# 31. Search

Provide fast project-wide search across:

- entity names,
- scene titles,
- summaries,
- notes,
- prose where practical,
- threads.

Search results must distinguish result type.

Selecting a result should navigate intelligently to the relevant view/object.

---

# 32. Undo / Redo

Users will rearrange things experimentally.

Support undo/redo for important UI/domain actions wherever reasonable, especially:

- node movement,
- sequence reorder,
- link creation/deletion,
- scene insertion,
- relationship changes.

Do not build a massive bespoke event-sourcing system just for undo.

A practical command/transaction history is sufficient.

At minimum destructive actions should support immediate restoration or confirmation.

---

# 33. Continuity Diagnostics

Implement a small but real first version.

Do not build an AI-powered fake warning panel.

Create deterministic checks where the modeled data supports them.

Initial checks can include:

### Knowledge contradiction

Character refers to/uses knowledge before its modeled acquisition.

### Possession contradiction

Entity uses or transfers an item it does not currently possess.

### Location contradiction

Character participates in incompatible locations at the same story point where modeled chronology makes that impossible.

### Dangling relationship transition

A relationship state change references missing/deleted entities/events.

### Unplaced narrative content

Narrative unit has no valid narrative position where one is required.

Diagnostics should contain:

- severity,
- affected objects,
- explanation,
- navigation action.

Architecture should allow future diagnostic plugins.

---

# 34. Move / Refactor Analysis

When a scene is reordered, provide groundwork for dependency analysis.

For the first release, after a reorder, run deterministic diagnostics and surface potential conflicts.

Example:

```text
Scene moved.

Potential continuity conflicts:

Alice obtains Red Key in Scene 22
but uses it in Scene 25.

Bob learns about the rebellion in Scene 22
but references it earlier after this move.
```

Do not block every move.

The writer remains authoritative.

Allow:

- keep move,
- review issues,
- undo.

---

# 35. Causality and Setup/Payoff

Architect support for semantic links such as:

- causes,
- enables,
- prevents,
- foreshadows,
- sets up,
- pays off,
- reveals,
- resolves.

For the alpha, these can use typed links rather than a completely separate subsystem.

Allow a user to mark unresolved setups.

Provide an "Unresolved" view/panel listing items with no payoff/resolution link.

---

# 36. AI Assistant Architecture

The application is a writer/worldbuilder **assistant**, but AI must be optional and provider-independent.

Create an internal provider interface.

Support at least a clean path toward:

- Ollama/local OpenAI-compatible endpoint,
- generic OpenAI-compatible endpoint.

Do not tightly couple core code to one commercial vendor.

AI configuration should be off by default.

If implementing assistant functionality in the first release, prioritize graph-aware operations such as:

- summarize selected scene,
- explain character state at current point,
- identify relevant scenes,
- brainstorm events between selected nodes,
- inspect relationship progression,
- explain continuity diagnostic.

The assistant should receive structured story context, not the entire database indiscriminately.

Never silently modify canonical project state from AI output.

AI-suggested changes should enter a review/apply workflow.

If AI integration threatens the stability of the core alpha, implement the provider boundary, settings UI, and a small demonstrator rather than delaying the core application.

---

# 37. Import / Export and Data Ownership

This is mandatory for FOSS tester readiness.

Implement full project export to a documented portable format.

Preferred:

```text
project-name.storygraph.zip
```

containing approximately:

```text
project.json
entities.json
relationships.json
narrative-units.json
events.json
threads.json
state-changes.json
documents/
assets/
manifest.json
```

Exact structure may differ if there is a better coherent design.

Also provide a single JSON export where practical.

Implement import of the application's own export format.

The user must not be locked into the SQLite database.

Provide Markdown export of written scenes/chapters where practical.

Document the format in:

```text
docs/EXPORT_FORMAT.md
```

Version the export schema.

---

# 38. Autosave and Persistence

The app must never feel unsafe to write in.

Requirements:

- autosave,
- visible save state where appropriate,
- transactions for multi-record operations,
- graceful validation errors,
- migration handling,
- useful failure messages.

Avoid silently discarding unsaved editor content during navigation.

Test refresh/reopen behavior.

---

# 39. Seed / Demo Project

Ship a well-designed example project.

Do not use copyrighted fictional universes.

Create an original small story demonstrating:

- several characters,
- locations,
- an item,
- multiple scenes,
- nested narrative structure,
- relationship change,
- knowledge acquisition,
- object possession change,
- two plot threads,
- story chronology differing slightly from narrative order,
- a placeholder,
- at least one continuity diagnostic.

A first-time tester should understand the value of the application within minutes.

Provide an option to:

- create blank project,
- open demo project.

---

# 40. Project Dashboard

The landing page should allow:

- create project,
- open project,
- duplicate project,
- rename project,
- delete project,
- import project,
- open demo.

Keep this screen simple.

The core application should receive the bulk of design attention.

---

# 41. Accessibility

Target WCAG 2.2 AA where practical.

At minimum:

- keyboard focus visibility,
- correct semantic controls,
- labels,
- tooltips where needed,
- sufficient contrast,
- reduced-motion awareness,
- no color-only critical meaning,
- accessible dialogs,
- graph actions available through non-pointer mechanisms where reasonably possible.

Graph interfaces are inherently difficult for accessibility. Document known gaps honestly.

---

# 42. Performance Targets

The graph should remain interactive for realistically complex projects.

Design/testing targets for the first release:

- hundreds of entities,
- hundreds of scenes,
- thousands of links/state records.

Avoid rerendering the entire graph for unrelated sidebar edits.

Use derived stores/selectors carefully.

Do not optimize imaginary million-node workloads at the expense of maintainability.

Measure before introducing exotic optimization.

---

# 43. Error Handling

No raw stack traces in normal UI.

Provide:

- contextual error messages,
- retry where meaningful,
- safe failure states,
- logging in development,
- error boundaries where supported,
- database failure handling,
- corrupt import handling.

Imports must validate before mutating an existing project.

---

# 44. Security

Even though the default installation is local/self-hosted, follow normal secure engineering practices.

At minimum:

- validate server inputs,
- escape/sanitize rich content correctly,
- avoid arbitrary HTML execution,
- protect file import paths,
- restrict uploaded asset handling,
- never expose configured AI/API secrets to the browser unnecessarily,
- audit dependencies before release.

Add:

```text
SECURITY.md
```

with a responsible disclosure policy.

---

# 45. Authentication

Do **not** make authentication a prerequisite for the first local/self-hosted release.

The default deployment can be single-user.

Architect project ownership so authentication/multi-user support can be added later.

Do not spend the alpha building OAuth.

---

# 46. Collaboration

Real-time collaboration is explicitly out of scope for the initial release.

Do not add CRDT/WebSocket collaboration unless the core product is already complete and stable.

Design data structures so collaboration would not be impossible later.

---

# 47. Assets

Allow projects to eventually associate images/files with entities or scenes.

For the first release, lightweight image attachment support is optional.

Do not let asset management derail the core release.

If implemented, store assets safely and include them in project exports.

---

# 48. Testing Requirements

Treat tests as part of the implementation, not cleanup.

## Unit tests

Cover:

- story-state derivation,
- relationship-state resolution,
- narrative ordering,
- story chronology ordering,
- temporal queries,
- import/export validation,
- diagnostics,
- graph projection logic.

## Integration tests

Cover:

- database CRUD,
- scene insertion,
- relationship history,
- state-change persistence,
- project export/import round trip.

## Playwright E2E

At minimum test:

1. create project,
2. create character,
3. create scene,
4. add character to scene,
5. create second character,
6. create relationship,
7. change relationship state,
8. insert narrative node between two nodes,
9. reorder scenes,
10. add a thread,
11. write scene prose,
12. reload application and verify persistence,
13. export project,
14. import project,
15. verify imported project contents,
16. switch lens,
17. move timeline and observe state change,
18. open diagnostics,
19. basic mobile viewport navigation.

Avoid tests that merely assert implementation details.

---

# 49. CI

Configure GitHub Actions.

A pull request should run at minimum:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm check
pnpm test
pnpm build
pnpm test:e2e
```

Exact commands may differ, but provide equivalent functionality.

Keep CI reproducible.

Pin the active Node LTS major version.

---

# 50. Developer Experience

A new contributor should be able to clone and run roughly:

```bash
git clone ...
cd ...
pnpm install
pnpm db:migrate
pnpm dev
```

Prefer an even simpler setup if practical.

Provide:

```bash
pnpm setup
```

if useful to initialize database + seed/demo data.

Document Windows, macOS, and Linux considerations.

Do not assume Docker is installed.

Docker is an alternative path, not the only path.

---

# 51. Docker

Provide a working Dockerfile and docker-compose setup.

The SQLite database must use a persistent volume.

Document:

- start,
- stop,
- upgrade,
- backup.

Do not require an unnecessarily complex multi-container architecture.

---

# 52. Database Migrations

Use Drizzle migrations.

Do not rely on deleting/recreating the tester database after every schema change.

Create a migration strategy suitable for alpha users retaining projects across releases.

Document backup recommendations before upgrade.

---

# 53. README

The README must be useful to an actual GitHub visitor.

Include:

1. concise product explanation,
2. screenshots or screenshot placeholders if images cannot yet be captured,
3. major features,
4. current alpha status,
5. installation,
6. Docker setup,
7. development commands,
8. privacy statement,
9. export/data ownership,
10. AI integration status,
11. roadmap,
12. contributing,
13. license,
14. known limitations.

Avoid marketing fluff.

---

# 54. Documentation

Create at minimum:

```text
docs/
├─ ARCHITECTURE.md
├─ DOMAIN_MODEL.md
├─ EXPORT_FORMAT.md
├─ DEVELOPMENT.md
├─ TESTING.md
├─ DEPLOYMENT.md
├─ PRIVACY.md
├─ ROADMAP.md
└─ DESIGN_PRINCIPLES.md
```

Architecture documentation must explain why the domain model is structured as it is.

---

# 55. Code Quality

Use:

- strict TypeScript,
- small cohesive modules,
- descriptive naming,
- minimal unnecessary comments,
- typed service boundaries,
- no `any` except where unavoidable and justified,
- schema validation at trust boundaries.

Do not produce huge all-purpose files.

Avoid premature abstraction but extract repeated domain logic.

No dead placeholder code left pretending a feature works.

TODOs should be specific and discoverable.

---

# 56. UI State vs Domain State

Maintain a strong distinction.

Examples of UI state:

- selected node,
- panel open/closed,
- zoom,
- current graph layout,
- inspector tab,
- transient drag state.

Examples of domain state:

- Alice exists,
- Scene 4 occurs after Scene 3,
- Alice knows Secret X,
- Alice/Bob are enemies at time T.

Do not store transient UI state in narrative domain tables.

Persist user view/layout preferences separately where desirable.

---

# 57. Graph Projection Architecture

Do not query the database independently inside every graph view.

Create projection functions/services.

Conceptually:

```ts
projectNarrativeGraph(...)
projectEntityGraph(...)
projectRelationshipGraph(...)
projectThreadGraph(...)
```

Input should include relevant context such as:

```text
project
selected story point
selected thread
temporal/atemporal mode
filters
```

Output should be a normalized UI graph representation.

Write tests for projections.

This is essential for adding future lenses cleanly.

---

# 58. State Reducer / Resolver

Similarly centralize temporal interpretation.

Conceptually:

```text
resolveStoryState(projectId, storyPoint)
resolveRelationshipState(relationshipId, storyPoint)
resolveEntityState(entityId, storyPoint)
```

Do not let each component invent its own temporal rules.

---

# 59. Narrative Reordering

Scene/narrative-unit drag reordering must be transactionally safe.

After reorder:

1. persist the new narrative ordering,
2. recalculate relevant projections,
3. run affected diagnostics,
4. display newly introduced warnings,
5. allow undo.

Story timestamps should **not** automatically change simply because narrative order changes.

That separation is critical.

---

# 60. Deletion Semantics

Deleting an entity with references must never silently corrupt the project.

If deleting Alice would affect:

- relationships,
- scene membership,
- state changes,
- mentions,

show the impact.

Offer sensible choices where appropriate.

Use foreign-key constraints.

Prefer soft deletion only where it genuinely simplifies restoration/history; otherwise use transactional validated hard deletion with undo/import backup strategy.

Do not create inconsistent dangling references.

---

# 61. Empty States

Design useful empty states.

A blank canvas should teach the product.

Example:

```text
Start with:

[Beginning] ───────── [Ending]

+ Add a scene
+ Add a character
+ Import project
```

The empty state should invite exploration without being a tutorial wall.

---

# 62. First-Run Experience

The first run should offer:

```text
Create blank story
Explore demo story
Import story
```

The demo story should lead directly into the actual interface.

Avoid a mandatory multi-step onboarding wizard.

Provide lightweight contextual hints instead.

---

# 63. Keyboard Interaction

At minimum support:

- Cmd/Ctrl+K command palette,
- Cmd/Ctrl+S harmlessly triggering save/acknowledgment,
- Cmd/Ctrl+Z undo,
- Cmd/Ctrl+Shift+Z redo,
- Delete/Backspace selected graph item with safe semantics,
- Escape close modal/deselect,
- arrow-key stepping along timeline where focus context permits.

Document shortcuts.

---

# 64. Design for Extensibility Without Plugin Overengineering

The code should make it straightforward to add:

- new entity facets,
- graph lenses,
- diagnostic rules,
- assistant actions,
- relationship types,
- state-change categories.

Do not build a public plugin SDK in the first release.

Internal registries/interfaces are sufficient.

---

# 65. Alpha Scope

The first public tester release should prioritize a coherent end-to-end workflow.

A tester must be able to:

1. install/run the app,
2. create a project,
3. create characters/locations/items,
4. create nested narrative units,
5. place scenes in narrative order,
6. define story chronology,
7. connect entities,
8. create changing relationships,
9. create events,
10. record state changes,
11. add entities to scenes,
12. create plot threads,
13. navigate the graph,
14. insert scenes/events between existing sequence nodes,
15. move along the timeline,
16. observe relationship/world state change,
17. switch between several graph lenses,
18. write prose,
19. search,
20. use the command palette,
21. create unresolved placeholders,
22. see deterministic continuity diagnostics,
23. export the project,
24. import it again,
25. close/reopen without losing work.

If these flows are not solid, do not spend time implementing novelty features.

---

# 66. Explicitly Out of Scope for Alpha

Unless the core scope is already complete and tested, do not prioritize:

- multiplayer,
- real-time collaboration,
- mobile native apps,
- complex permissions,
- marketplace/plugins,
- public story publishing,
- OAuth ecosystem,
- social features,
- comprehensive manuscript formatting,
- generative image tooling,
- vector database infrastructure,
- graph database migration,
- massive ontology systems,
- sophisticated simulation engines,
- full Git-style branching UI,
- Scrivener-level compile/export formatting.

---

# 67. Suggested Implementation Sequence

Work approximately in this order.

## Phase 0 — Repository foundation

- scaffold app,
- lint/check/test/build,
- design tokens,
- SQLite + Drizzle,
- migrations,
- project model,
- GitHub Actions,
- base docs.

## Phase 1 — Domain foundation

Implement:

- Project
- Entity
- EntityFacet
- NarrativeUnit
- Event
- Relationship
- RelationshipState
- Thread
- membership
- state changes

Add tests.

## Phase 2 — Application shell

Implement:

- project dashboard,
- app shell,
- entity shelf,
- inspector,
- top navigation,
- responsive drawers,
- theme.

## Phase 3 — Narrative graph

Implement:

- Svelte Flow canvas,
- narrative projection,
- node creation,
- edge insertion,
- drag/reorder,
- nested units,
- persistence.

## Phase 4 — World graph

Implement:

- entity projection,
- relationships,
- relationship inspector,
- entity creation/editing,
- drag/drop.

## Phase 5 — Time

Implement:

- story time,
- narrative order distinction,
- timeline UI,
- state reducer,
- temporal graph filtering,
- temporal/atemporal toggle.

## Phase 6 — Threads and scene state

Implement:

- threads,
- scene workspace,
- participants,
- events,
- state changes,
- state diff.

## Phase 7 — Writing

Implement:

- scene prose editor,
- autosave,
- word count,
- distraction-free mode,
- entity references if feasible.

## Phase 8 — Diagnostics/refactoring

Implement:

- deterministic diagnostic engine,
- first continuity checks,
- post-reorder warnings,
- unresolved items.

## Phase 9 — Portability

Implement:

- export,
- import,
- Markdown export,
- validation,
- format documentation.

## Phase 10 — Tester hardening

- demo project,
- responsive pass,
- accessibility pass,
- error handling,
- performance profiling,
- E2E suite,
- installation testing,
- Docker verification,
- documentation,
- alpha release preparation.

Do not treat phases as isolated waterfall steps. Keep the application runnable throughout.

---

# 68. UX Acceptance Scenarios

Before calling the alpha ready, manually verify these stories.

## Scenario A — Relationship progression

Create Alice and Bob.

At Scene 1:

```text
relationship = strangers
```

At Scene 4:

```text
relationship = friends
```

At Scene 9:

```text
relationship = enemies
```

Moving the story timeline must update the relationship state visibly.

Atemporal mode must summarize the history.

---

## Scenario B — Scene insertion

Start with:

```text
Beginning → Ending
```

Insert Betrayal into the edge.

Result:

```text
Beginning → Betrayal → Ending
```

Ordering persists after refresh.

Undo restores the previous sequence.

---

## Scenario C — Narrative chronology differs from story chronology

Create:

```text
Scene A
narrative position 1
story time Day 10

Scene B
narrative position 2
story time Day 2
```

Both views must remain valid.

Reordering scenes must not silently alter story chronology.

---

## Scenario D — State changes

Alice possesses Key.

Scene 6 transfers Key to Bob.

Before Scene 6:

```text
Alice has Key
Bob does not
```

After Scene 6:

```text
Bob has Key
Alice does not
```

The state resolver must produce the correct result.

---

## Scenario E — Continuity diagnostic

Bob attempts to use Key before acquiring it.

The deterministic diagnostic engine should flag this.

---

## Scenario F — Thread filtering

Create:

```text
Main Plot
Romance
Mystery
```

Attach several scenes to overlapping threads.

Selecting Mystery should project the relevant narrative path without deleting/hiding underlying data permanently.

---

## Scenario G — Portable data

Export a populated project.

Delete the local copy.

Import the export.

The reconstructed project should preserve:

- entities,
- relationships,
- relationship history,
- narrative hierarchy,
- narrative ordering,
- story chronology,
- threads,
- prose,
- state changes,
- saved layout where exported.

---

# 69. Release Criteria

Do not label a build tester-ready until:

- clean install works,
- migrations work,
- demo loads,
- no known data-loss bug remains,
- autosave works,
- export/import round trip works,
- core graph operations persist,
- timeline state works,
- responsive navigation works,
- lint passes,
- typecheck passes,
- unit tests pass,
- E2E tests pass,
- production build succeeds,
- Docker build succeeds,
- README is accurate,
- known limitations are documented.

If a feature is unfinished, say so.

Do not disguise unfinished features with inactive buttons unless clearly labeled experimental/coming soon.

---

# 70. Engineering Decision Log

For consequential architectural choices, maintain:

```text
docs/DECISIONS.md
```

Use lightweight entries:

```text
## Decision: SQLite for initial release

Context:
...

Decision:
...

Consequences:
...
```

Record only important decisions.

Do not bureaucratize trivial implementation details.

---

# 71. Changelog and Versioning

Use semantic versioning.

Initial tester builds can be:

```text
0.1.0-alpha.1
```

Maintain `CHANGELOG.md`.

Include migration or breaking-data-format notes.

Version the export schema independently if necessary.

---

# 72. Git Discipline

Make coherent commits.

Examples:

```text
feat(domain): add temporal relationship states
feat(canvas): support edge insertion
feat(timeline): derive graph at selected story point
test(state): cover possession transition resolution
docs(export): document portable project format
```

Do not create one enormous final commit.

Do not commit:

- `.env`,
- secrets,
- databases containing personal writing,
- build output,
- package caches.

---

# 73. Agent Behavior

You are expected to make implementation decisions autonomously.

Do not repeatedly ask the user to choose between equivalent libraries, naming conventions, icons, schema field names, or other reversible technical details.

When a decision is:

- reversible,
- low risk,
- conventional,

make it.

When a decision materially changes the product vision, data ownership, licensing, or safety of stored writing, document the choice prominently.

If the repository already exists:

1. inspect it,
2. understand its conventions,
3. preserve good existing work,
4. migrate rather than blindly replace.

Do not rewrite working infrastructure merely to match personal preference.

---

# 74. Avoid These Failure Modes

Do not reduce the product to:

### A static Obsidian clone

Time and state transitions are central.

### A mind-map app

Nodes and edges carry narrative semantics.

### A database form builder

The graph/canvas must remain the primary exploratory workspace.

### A giant ontology

Writers must not need knowledge-representation expertise.

### An AI chat wrapper

The structured narrative system is the product.

### A pretty prototype

Persistence, import/export, testing, and data integrity matter.

### A scene-only outline

World entities and changing state matter.

### A static relationship graph

Relationships change through story time.

### A desktop-only canvas

Responsive behavior matters.

### A cloud-dependent SaaS

The FOSS version must run independently.

---

# 75. Core Product Principle

When choosing between alternatives, prefer the one that strengthens this model:

> A writer can inspect a story at any narrative or chronological point, see what exists and what is true, understand why it became true, rearrange the narrative, and receive useful feedback about the consequences.

---

# 76. Initial Deliverables

Your first substantial implementation milestone should leave the repository containing:

1. functional SvelteKit application,
2. database schema + migrations,
3. project dashboard,
4. demo project,
5. entity CRUD,
6. narrative-unit CRUD,
7. relationship CRUD,
8. temporal relationship states,
9. graph canvas,
10. narrative lens,
11. world/entity lens,
12. timeline,
13. temporal/atemporal toggle,
14. scene inspector,
15. initial state-change infrastructure,
16. autosave,
17. tests for temporal logic,
18. GitHub Actions,
19. Docker setup,
20. initial documentation.

Once that foundation is verified, continue toward the complete alpha scope above.

---

# 77. Definition of Success

The product succeeds when a tester can construct something like:

```text
Beginning
    ↓
Arrival
    ↓
Investigation
    ↓
Betrayal
    ↓
War
    ↓
Ending
```

then zoom into Betrayal and see:

```text
Characters:
Alice
Bob
Carol

Location:
Embassy

Objects:
Red Key

Threads:
Main Plot
Alice/Bob
Political Coup
```

inspect Alice ↔ Bob and see:

```text
Strangers
→ Friends
→ Suspicious
→ Enemies
```

move backward on the timeline and see the earlier relationship,

inspect the scene and see:

```text
Alice:
learns Secret X
obtains Red Key
begins distrusting Bob

Bob:
loses Red Key
```

move the scene somewhere else,

receive meaningful continuity warnings,

write the scene,

save it,

close the application,

reopen it,

and find the project intact.

That end-to-end experience matters more than the sheer number of features.

Build the foundation as if this application may eventually become a serious long-lived open-source creative tool.

Do not build a disposable demo.