export const glossaryEntries = [
  {
    category: 'World & identity',
    term: 'Entity',
    definition:
      'Anything that exists in the world: person, place, object, faction, secret, creature, or concept. An entity can have several facets.'
  },
  {
    category: 'World & identity',
    term: 'Facet',
    definition:
      'A composable label describing an aspect of an entity: character, location, item, faction, or your own category. A city can be both a location and a political actor without being duplicated.'
  },
  {
    category: 'World & identity',
    term: 'Default facets',
    definition:
      'Facets applied to bulk-created entities unless a row overrides them. Leave the facets column blank, or enable “Use default facets for every row” to enter summaries and descriptions directly.'
  },
  {
    category: 'World & identity',
    term: 'Summary',
    definition: 'A short description used on cards, search results, and planning references.'
  },
  {
    category: 'World & identity',
    term: 'Description',
    definition:
      'Longer background information, separate from the short summary and manuscript prose.'
  },
  {
    category: 'World & identity',
    term: 'Custom metadata',
    definition:
      'Additional structured JSON information attached to a story object. Appearance and organization settings also use metadata.'
  },
  {
    category: 'World & identity',
    term: 'Object identity',
    definition:
      'An object’s stable identifier. Renaming or recoloring preserves its connections and references.'
  },
  {
    category: 'World & identity',
    term: 'Unresolved entity',
    definition:
      'An entity whose identity or details remain uncertain. Its unresolved marker is a planning aid.'
  },
  {
    category: 'World & identity',
    term: 'World state',
    definition:
      'The modeled locations, possessions, knowledge, and other properties true at a selected story point.'
  },
  {
    category: 'Narrative & organization',
    term: 'Narrative unit',
    definition:
      'A structural piece of the story: act, chapter, scene, sequence, beat, conversation, transition, flashback, or note. The interface also calls these “moments.”'
  },
  {
    category: 'Narrative & organization',
    term: 'Moment',
    definition:
      'The friendly name for a narrative unit. It may contain smaller moments and have its own prose.'
  },
  {
    category: 'Narrative & organization',
    term: 'Act',
    definition: 'A broad narrative container, often holding chapters or sequences.'
  },
  {
    category: 'Narrative & organization',
    term: 'Chapter',
    definition:
      'A narrative unit used to group scenes and other moments. Manuscript chapters and graph chapters are the same objects.'
  },
  {
    category: 'Narrative & organization',
    term: 'Scene',
    definition:
      'A moment with optional participants, events, changes, threads, synopsis, and prose.'
  },
  {
    category: 'Narrative & organization',
    term: 'Beat',
    definition: 'A small narrative action, reaction, or reveal, often nested inside a scene.'
  },
  {
    category: 'Narrative & organization',
    term: 'Sequence',
    definition: 'A group of related narrative moments, which can be nested.'
  },
  {
    category: 'Narrative & organization',
    term: 'Conversation',
    definition: 'A narrative unit for an exchange or discussion, optionally inside a scene.'
  },
  {
    category: 'Narrative & organization',
    term: 'Transition',
    definition: 'A moment connecting larger parts of the story.'
  },
  {
    category: 'Narrative & organization',
    term: 'Flashback',
    definition:
      'A moment whose reading position differs from its in-world time. Set narrative order and chronology independently.'
  },
  {
    category: 'Narrative & organization',
    term: 'Note',
    definition: 'A narrative unit for an idea or annotation. It can have prose and connections.'
  },
  {
    category: 'Narrative & organization',
    term: 'Nested narrative',
    definition:
      'Moments inside other moments: act → chapter → scene → conversation, with further nesting allowed.'
  },
  {
    category: 'Narrative & organization',
    term: 'Parent',
    definition:
      'The unit or folder containing another item. Narrative parents and shelf folders serve different purposes.'
  },
  {
    category: 'Narrative & organization',
    term: 'Sibling',
    definition:
      'An item sharing the same parent with another. Reading order is stored among sibling moments.'
  },
  {
    category: 'Narrative & organization',
    term: 'Outline',
    definition:
      'The hierarchy and reading order of narrative units. Reordering here changes reading order; dragging graph boxes changes layout.'
  },
  {
    category: 'Narrative & organization',
    term: 'Synopsis',
    definition: 'The short plan for a moment, shown on its graph card and in its graph summary.'
  },
  {
    category: 'Narrative & organization',
    term: 'Status',
    definition:
      'Writing progress: idea, draft, revised, or complete. It does not alter time or world state.'
  },
  {
    category: 'Narrative & organization',
    term: 'POV / viewpoint',
    definition:
      'The optional entity whose perspective frames a moment. It is separate from scene participation.'
  },
  {
    category: 'Narrative & organization',
    term: 'Unplaced idea',
    definition:
      'A narrative unit kept outside reading order until placed. Find it on the Ideas shelf.'
  },
  {
    category: 'Narrative & organization',
    term: 'Placeholder / ghost moment',
    definition:
      'An unresolved graph moment representing something undecided. It can be resolved into a scene, entity, or event.'
  },
  {
    category: 'Narrative & organization',
    term: 'Resolve',
    definition:
      'Turn an unresolved moment into a concrete idea while preserving compatible connections and its narrative envelope.'
  },
  {
    category: 'Narrative & organization',
    term: 'Merge',
    definition:
      'Combine an unresolved moment with an existing moment while keeping compatible prose, children, membership, and history.'
  },
  {
    category: 'Narrative & organization',
    term: 'Folder',
    definition:
      'A named, colored, icon-associated shelf container. Folder organization does not change narrative meaning.'
  },
  {
    category: 'Narrative & organization',
    term: 'Collapse / expand',
    definition: 'Hide or show a folder, outline branch, or detail section. Nothing is deleted.'
  },
  {
    category: 'Narrative & organization',
    term: 'Reading order / narrative order',
    definition:
      'The order readers encounter moments. Changing it leaves their story timestamps unchanged.'
  },
  {
    category: 'Narrative & organization',
    term: 'Rank',
    definition:
      'An internal sorting position among siblings. Use dragging or move buttons to change order.'
  },
  {
    category: 'Time & change',
    term: 'Story chronology',
    definition: 'The in-world order of events, which can differ from reading order.'
  },
  {
    category: 'Time & change',
    term: 'Story point',
    definition:
      'A numeric position in your story’s time scale: days, years, hours, or any relative scale.'
  },
  {
    category: 'Time & change',
    term: 'Time label',
    definition:
      'A readable name such as “Winter” or “Before the Fall.” The numeric story point determines ordering.'
  },
  {
    category: 'Time & change',
    term: 'Timeline / time rail',
    definition:
      'The control for selecting story points and event positions and inspecting modeled state.'
  },
  {
    category: 'Time & change',
    term: 'At this moment / temporal mode',
    definition: 'Evaluate relationships and modeled properties at the selected story point.'
  },
  {
    category: 'Time & change',
    term: 'Whole story / atemporal mode',
    definition:
      'View across the entire story, with relationship labels optionally summarizing their history.'
  },
  {
    category: 'Time & change',
    term: 'Event',
    definition:
      'Something happening in the world: meeting, battle, discovery, transfer, or another action. It may belong to a moment and cause changes.'
  },
  {
    category: 'Time & change',
    term: 'Event order',
    definition:
      'Order among events sharing a timestamp, allowing same-time changes to be inspected in sequence.'
  },
  {
    category: 'Time & change',
    term: 'State change / world change',
    definition:
      'A change to an entity property, optionally associated with a scene and causing event.'
  },
  {
    category: 'Time & change',
    term: 'Subject',
    definition: 'The entity whose property changes or is checked by a requirement.'
  },
  {
    category: 'Time & change',
    term: 'Target',
    definition:
      'An optional entity involved in a relationship, change, or requirement, such as an owned key or learned secret.'
  },
  {
    category: 'Time & change',
    term: 'Property key',
    definition:
      'A tracked property’s name, such as location, possession, knowledge, status, or a custom name.'
  },
  {
    category: 'Time & change',
    term: 'Knowledge',
    definition:
      'A modeled property recording whether an entity knows something. Acquisition and event requirements can drive continuity checks.'
  },
  {
    category: 'Time & change',
    term: 'Possession',
    definition: 'A modeled property recording whether an entity owns or holds an item.'
  },
  {
    category: 'Time & change',
    term: 'Location',
    definition:
      'A modeled property recording where an entity is. Location facets describe places; location changes track movement.'
  },
  {
    category: 'Time & change',
    term: 'Before / after',
    definition:
      'The previous and resulting values of a change, shown as readable transitions in the scene diff.'
  },
  {
    category: 'Time & change',
    term: 'Value',
    definition:
      'A stored property result: text, number, true/false, null, or another supported JSON value.'
  },
  {
    category: 'Time & change',
    term: 'Requirement',
    definition:
      'A condition needed by an event, such as having a key. Diagnostics compare it with modeled state.'
  },
  {
    category: 'Time & change',
    term: 'State diff / what changes',
    definition: 'A readable comparison of modeled properties before and after a scene’s changes.'
  },
  {
    category: 'Time & change',
    term: 'Snapshot / state resolver',
    definition:
      'The deterministic result of applying recorded changes up to the selected time and event order.'
  },
  {
    category: 'Connections & threads',
    term: 'Node',
    definition:
      'A graph box representing an entity, moment, event, or thread. Position and color are presentation choices.'
  },
  {
    category: 'Connections & threads',
    term: 'Edge / connection',
    definition: 'A line joining objects: reading progression, relationship, or semantic link.'
  },
  {
    category: 'Connections & threads',
    term: 'Connection anchor / handle',
    definition:
      'A point where a line starts or ends. Move anchors to any side or add up to four per direction.'
  },
  {
    category: 'Connections & threads',
    term: 'Incoming / target anchor',
    definition: 'Where a connection ends. Moving it changes routing, not meaning.'
  },
  {
    category: 'Connections & threads',
    term: 'Outgoing / source anchor',
    definition:
      'Where a connection starts. Connect it to another anchor or release on empty canvas to create a connected object.'
  },
  {
    category: 'Connections & threads',
    term: 'Sequence connection',
    definition:
      'A projected line between adjacent moments. Deleting that line retains reading order; undo restores it.'
  },
  {
    category: 'Connections & threads',
    term: 'Relationship',
    definition:
      'A first-class connection between entities, with its own identity, type, description, direction, and history.'
  },
  {
    category: 'Connections & threads',
    term: 'Directed relationship',
    definition:
      'A connection with source-to-target direction, such as a faction controlling a city.'
  },
  {
    category: 'Connections & threads',
    term: 'Relationship type',
    definition: 'A relationship category such as alliance, ownership, rivalry, or a custom type.'
  },
  {
    category: 'Connections & threads',
    term: 'Relationship state',
    definition:
      'A qualitative condition during an interval, such as strangers, friends, or enemies.'
  },
  {
    category: 'Connections & threads',
    term: 'Relationship history',
    definition: 'The progression of states, with optional causing scenes and events.'
  },
  {
    category: 'Connections & threads',
    term: 'Effective from / until',
    definition:
      'The interval where a state applies. Until is exclusive; an empty end means no specified end.'
  },
  {
    category: 'Connections & threads',
    term: 'Dimensions',
    definition:
      'Optional numeric measures in a relationship state, such as trust or fear. Descriptive states need no numbers.'
  },
  {
    category: 'Connections & threads',
    term: 'Semantic link',
    definition:
      'A typed connection explaining how objects affect each other, distinct from a relationship or reading order.'
  },
  {
    category: 'Connections & threads',
    term: 'Causes',
    definition: 'The source brings about the target.'
  },
  {
    category: 'Connections & threads',
    term: 'Enables',
    definition:
      'The source makes the target possible. This is an editable default when creating connected non-entity objects.'
  },
  {
    category: 'Connections & threads',
    term: 'Prevents',
    definition: 'The source blocks the target.'
  },
  {
    category: 'Connections & threads',
    term: 'Foreshadows',
    definition: 'The source hints at the target before it occurs.'
  },
  {
    category: 'Connections & threads',
    term: 'Sets up / setup',
    definition:
      'A link or moment marker recording a preparation, question, or promise that may need a payoff.'
  },
  {
    category: 'Connections & threads',
    term: 'Pays off / payoff',
    definition: 'The fulfillment of an earlier setup.'
  },
  {
    category: 'Connections & threads',
    term: 'Reveals',
    definition: 'The source exposes information represented by the target.'
  },
  {
    category: 'Connections & threads',
    term: 'Resolves',
    definition: 'The source settles a question or unresolved idea represented by the target.'
  },
  {
    category: 'Connections & threads',
    term: 'Plot thread',
    definition:
      'A storyline, theme, mystery, relationship arc, or through-line spanning multiple kinds of objects.'
  },
  {
    category: 'Connections & threads',
    term: 'Thread membership',
    definition: 'An object’s participation in a thread. It can belong to several.'
  },
  {
    category: 'Connections & threads',
    term: 'Follow / unfollow',
    definition:
      'Apply or remove a thread filter. Unfollowing does not delete a thread or remove memberships.'
  },
  {
    category: 'Connections & threads',
    term: 'All threads',
    definition: 'Clear followed-thread filters to view relevant objects across all threads.'
  },
  {
    category: 'Connections & threads',
    term: 'Scene membership / participant',
    definition: 'An entity’s role in a moment: present, setting, involved, or a custom role.'
  },
  {
    category: 'Writing',
    term: 'Manuscript',
    definition:
      'The chapter-and-scene writing workspace, sharing the graph’s hierarchy and documents.'
  },
  {
    category: 'Writing',
    term: 'Document / prose',
    definition:
      'Writing attached to a narrative unit. Rich text, Markdown, and scene writing edit the same content.'
  },
  {
    category: 'Writing',
    term: 'Markdown',
    definition:
      'A plain-text format for headings, emphasis, lists, quotes, links, and code. Switch modes to edit its source.'
  },
  {
    category: 'Writing',
    term: 'Rich text',
    definition:
      'A formatted writing surface with toolbar and keyboard editing. Supported formatting is retained when switching modes.'
  },
  {
    category: 'Writing',
    term: 'Read mode',
    definition: 'A formatted page with editing disabled. Hide placeholders to read only story text.'
  },
  {
    category: 'Writing',
    term: 'Story placeholder / planning reference',
    definition:
      'An inline linked reminder for any moment, entity, event, relationship, or thread. It differs from an unresolved graph moment and does not count as prose.'
  },
  {
    category: 'Writing',
    term: 'Reference token',
    definition:
      'The durable Markdown syntax {{story:kind:identifier|encoded-label}}. Keep it intact to preserve the object link.'
  },
  {
    category: 'Writing',
    term: 'Mention',
    definition:
      'A tracked entity reference in a document. Entity placeholders synchronize mention records.'
  },
  {
    category: 'Writing',
    term: 'Insert placeholder',
    definition: 'Search every story-object type and insert a linked reminder at your cursor.'
  },
  {
    category: 'Writing',
    term: 'Populate from outline',
    definition:
      'Append child-moment placeholders in reading order, retaining prose and previously inserted references.'
  },
  {
    category: 'Writing',
    term: 'Expand placeholders',
    definition:
      'Replace references with current object names and summaries or descriptions as draft text. This is not AI generation. Graph undo can restore references.'
  },
  {
    category: 'Writing',
    term: 'Hide placeholders',
    definition:
      'Temporarily remove references from the formatted page without deleting them. Markdown source retains tokens to preserve links.'
  },
  {
    category: 'Writing',
    term: 'Writing notes',
    definition:
      'Optional planning text attached to a moment or chapter, excluded from clean manuscript export.'
  },
  {
    category: 'Writing',
    term: 'Live graph summary',
    definition:
      'Current synopsis, descendants, participants, events, relationships, and threads, derived from your project without AI.'
  },
  {
    category: 'Writing',
    term: 'Word count',
    definition:
      'Approximate whitespace-separated prose word count. Planning references are excluded.'
  },
  {
    category: 'Writing',
    term: 'Clean Markdown export',
    definition:
      'Story text in reading order with formatting, excluding planning placeholders and writing notes.'
  },
  {
    category: 'Writing',
    term: 'Find / replace',
    definition:
      'Locate text or replace the next match in the current page. Read mode permits finding but not replacement.'
  },
  {
    category: 'Workspace & data',
    term: 'Lens / projection',
    definition:
      'A view emphasizing different objects or ordering in the same project. Switching lenses does not duplicate data.'
  },
  {
    category: 'Workspace & data',
    term: 'Narrative lens',
    definition:
      'Sibling moments in reading order, with nesting available through breadcrumbs and double-click.'
  },
  {
    category: 'Workspace & data',
    term: 'World lens',
    definition: 'World entities and their relationships.'
  },
  {
    category: 'Workspace & data',
    term: 'Relationship lens',
    definition: 'Entities participating in relationships and the selected time’s state.'
  },
  {
    category: 'Workspace & data',
    term: 'Thread lens',
    definition: 'Moments, entities, events, and relationships associated with followed threads.'
  },
  {
    category: 'Workspace & data',
    term: 'Chronology lens',
    definition: 'Moments sorted by in-world time, leaving reading order unchanged.'
  },
  {
    category: 'Workspace & data',
    term: 'Entities shelf',
    definition:
      'The left drawer for entities, threads, the outline, and unresolved or unplaced ideas.'
  },
  {
    category: 'Workspace & data',
    term: 'Inspector',
    definition: 'The right drawer containing editable details, history, memberships, and changes.'
  },
  {
    category: 'Workspace & data',
    term: 'Canvas / layout',
    definition:
      'The graph’s pan-and-zoom surface and node positions, saved separately by lens and narrative context.'
  },
  {
    category: 'Workspace & data',
    term: 'Arrange',
    definition: 'Automatically position visible nodes without changing narrative order.'
  },
  {
    category: 'Workspace & data',
    term: 'Fit view',
    definition: 'Adjust pan and zoom to show visible graph objects.'
  },
  {
    category: 'Workspace & data',
    term: 'Fullscreen / focus view',
    definition:
      'Expand the shelf, inspector, graph, or manuscript to the window. Exit with its button or Escape.'
  },
  {
    category: 'Workspace & data',
    term: 'Command palette',
    definition:
      'Search objects and actions with Ctrl/Cmd+K, including manuscript, glossary, creation, lenses, export, and unfollow.'
  },
  {
    category: 'Workspace & data',
    term: 'Bulk add',
    definition:
      'Create up to 500 entities, one per line, with validation and equivalent-name/facet duplicate skipping.'
  },
  {
    category: 'Workspace & data',
    term: 'Favorite icon',
    definition: 'A starred icon stored in this browser, separate from project data.'
  },
  {
    category: 'Workspace & data',
    term: 'Continuity diagnostic',
    definition:
      'A deterministic warning or information message based on explicitly modeled data, not an AI judgment.'
  },
  {
    category: 'Workspace & data',
    term: 'Loose thread',
    definition:
      'An informational diagnostic for unresolved ideas, unplaced content, or missing modeled payoffs.'
  },
  {
    category: 'Workspace & data',
    term: 'Autosave',
    definition:
      'Queue changes to the installation’s database. The header reports pending, saving, saved, or error states.'
  },
  {
    category: 'Workspace & data',
    term: 'Browser recovery draft',
    definition: 'A local browser copy of pending changes supplementing the saved database.'
  },
  {
    category: 'Workspace & data',
    term: 'Revision / save conflict',
    definition:
      'A saved-version number detects another window’s edits and preserves pending work rather than overwriting newer changes.'
  },
  {
    category: 'Workspace & data',
    term: 'Undo / redo',
    definition:
      'Restore graph and organization changes in this session. The prose editor has separate text undo; later writing is preserved across graph undo where possible.'
  },
  {
    category: 'Workspace & data',
    term: 'Delete',
    definition:
      'Delete/Backspace removes the selected graph node or connection with undo. Inputs keep normal editing behavior. Inspector deletion offers an impact preview.'
  },
  {
    category: 'Workspace & data',
    term: 'Export / import',
    definition:
      'Save or restore portable project JSON containing objects, prose, history, organization, and layouts.'
  },
  {
    category: 'Workspace & data',
    term: 'JSON',
    definition:
      'A structured text format used for exports and custom metadata: double-quoted strings, brace-delimited objects, and bracket-delimited arrays.'
  },
  {
    category: 'Workspace & data',
    term: 'SQLite database',
    definition: 'The installation’s durable project storage, requiring no external cloud database.'
  },
  {
    category: 'Workspace & data',
    term: 'Local-first / private by default',
    definition:
      'Writing stays in your installation unless you explicitly export or configure external features. Browser preferences and the project database are separate.'
  },
  {
    category: 'Workspace & data',
    term: 'AI provider',
    definition:
      'An optional future integration boundary. Current summaries and diagnostics are derived locally without AI.'
  }
];
