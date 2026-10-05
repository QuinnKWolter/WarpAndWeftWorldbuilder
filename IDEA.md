The core idea I would build around is not “Obsidian for fiction.” It is a temporal knowledge graph + narrative sequencing workspace where the graph itself changes as the story progresses.
The fundamental abstraction should be:
The story is a graph whose state is a function of narrative time. Scenes/events modify that state.

That solves the problem you are describing much more cleanly than trying to make ordinary static nodes increasingly complicated.
1. The conceptual model
I would separate four things that traditional writing/worldbuilding software tends to collapse together:
Concept	What it represents	Examples
Entity	Something that exists in the world	Character, city, faction, sword, secret, religion
Narrative Unit	Something in the structure of the work	Chapter, scene, sequence, arc, act
Event	Something that happens	Betrayal, discovery, battle, conversation
State / Relationship	Something that is true during some interval	A trusts B, A owns sword, B is in London


These can all appear as nodes depending on the current lens, but they should not be the same thing internally.
That distinction gives you enormous flexibility.
Alice is an entity.
“Dinner at the Black Swan” is a scene.
“Alice learns Bob lied” is an event.
“Alice trusts Bob = 30%” is state.
And:
Dinner at the Black Swan → causes → Alice learns Bob lied → changes → Alice trusts Bob.

That is the system.
2. Make time a first-class dimension
The top of the application could contain a persistent narrative time rail.
Not necessarily literal dates. It could display:
Act I → Sequence 2 → Chapter 4 → Scene 3
or:
April 14 → April 15 → April 18
or:
T+0 → T+3 hours → T+2 days
The writer can choose.
Dragging the timeline changes the graph snapshot underneath it.
At Chapter 1:
Alice ──friend── Bob

Alice     Carol
(no connection)

At Chapter 12:
Alice ──enemy── Bob
Alice ──ally── Carol

But importantly, the application shouldn't store two separate relationship edges.
It stores something conceptually like:
Alice ↔ Bob

t0–t3: strangers
t4–t8: acquaintances
t9–t15: friends
t16–t18: distrust
t19+: enemies

Then each scene/event explains why the edge changed.
This becomes one of the killer features.
3. Relationship edges should have histories
Clicking an Alice ↔ Bob edge should open something like a mini relationship timeline.
STRANGERS
    │
    │ Scene 4 — Meet
    ▼
ACQUAINTANCES
    │
    │ Scene 9 — Bob saves Alice
    ▼
TRUST
    │
    │ Scene 23 — Alice discovers the letter
    ▼
SUSPICION
    │
    │ Scene 27 — Confrontation
    ▼
HOSTILITY

The user could define custom dimensions:
Trust       ███████░░░
Affection   █████░░░░░
Fear        ██░░░░░░░░
Knowledge   ████████░░
Authority   ████░░░░░░

But these should remain optional. A writer who hates quantified relationships can simply use descriptive states.
The key is that relationship changes belong to events/scenes, not merely arbitrary timestamps.
4. Scenes should be containers for change
Your “viewport” idea is particularly strong.
I would formalize it as a Scene Frame.
A scene frame contains four fundamental things:
WHERE
Location / environment

WHO
Characters/entities present

WHAT HAPPENS
Events/actions/revelations

WHAT CHANGES
Relationships, knowledge, possessions,
goals, statuses, locations, conditions

The writer could therefore open:
Chapter 7 — Dinner at the Embassy

and see a little local graph:
        Embassy
           │
     ┌─────┼─────┐
     │     │     │
   Alice   Bob   Minister
     │
     │ learns
     ▼
   Secret X

The scene's state changes might say:
Alice knows Secret X
Alice distrusts Bob
Bob loses possession of Key
Minister becomes suspicious of Alice
Alice moves Embassy → Hotel

These deltas become enormously valuable later.
5. The canvas should be infinitely decomposable
Your idea about inserting into edges is probably the most interesting interaction.
Imagine you begin with:
START ───────────────────────────── END

You know only that your protagonist begins at home and eventually destroys the empire.
Double-click the edge.
START ───── INCITING INCIDENT ───── END

Double-click again.
START
   │
Inciting Incident
   │
First Failure
   │
Discovery
   │
Reversal
   │
END

Later:
Discovery
     │
     ├── Political storyline
     │       │
     │       ├─ Embassy
     │       └─ Coup
     │
     ├── Alice/Bob relationship
     │       │
     │       ├─ Confession
     │       └─ Betrayal
     │
     └── Artifact storyline
             │
             ├─ Sword discovered
             └─ Sword destroyed

Any connection can therefore be expanded into additional narrative structure.
A visual cue like:
────── + ──────

could appear when hovering over any edge.
Click +, then choose:
Scene · Event · Character · Location · Item · Plot thread · Note
This would feel extremely natural.
6. Nodes need multiple identities
I would absolutely avoid rigid typing such as:
City = Location node.

A node should instead have facets.
For example:
King's Landing
Internally:
Entity
├─ Location
├─ Political Actor
├─ Setting
├─ Organizational Container
└─ Narrative Motif

Because a city can:
contain characters,
be controlled by factions,
have relationships with other cities,
change ownership,
be destroyed,
represent something thematically,
and act as the setting of scenes.
Similarly:
The Crown

could simultaneously be:
Object
Symbol
Political Office
MacGuffin
Source of Authority

Instead of enforcing a taxonomy, give users composable traits/tags/schema fields.
7. The app should be lens-driven
This is where it could become genuinely exceptional.
The same underlying story could appear completely differently depending on the selected Lens.
Lens	What becomes prominent
Narrative	Scenes, chapters, sequences
Chronology	Events by in-world time
Character	Character journeys and encounters
Relationship	Changing interpersonal connections
Location	Movement and spatial structure
Knowledge	Who knows what, and when
Object	Ownership/provenance of important objects
Faction	Alliances, control, conflicts
Plot Thread	Parallel narrative threads
Causality	Event → consequence chains
POV	What each viewpoint character experiences
Theme	Motifs/themes across narrative units


You aren't creating twelve databases.
You are creating twelve projections of the same graph.
That distinction matters tremendously.
8. Timeline-agnostic mode
Your timeline toggle should switch between two fundamentally different interpretations.
Temporal mode
Show:
What exists/is true here?

The graph is a snapshot.
Atemporal mode
Show:
What exists/is true anywhere in the story?

Edges become summaries.
For example:
Alice ───────── Bob
       complex

Hovering reveals:
Strangers → Friends → Rivals → Enemies → Allies

Clicking opens the entire relationship history.
This gives the Obsidian-like exploratory network without sacrificing temporal correctness.
9. Distinguish story time from narrative order
This is essential for nonlinear fiction.
You need two timelines:
STORY TIME
1914 ───── 1918 ───── 1922 ───── 1937

NARRATIVE ORDER
Ch1 ─ Ch2 ─ Ch3 ─ Ch4 ─ Ch5 ─ Ch6

Chapter 1 could occur in 1937.
Chapter 2 could occur in 1918.
Chapter 8 might reveal something from 1922.
The application should therefore support:
When did this happen?

versus
When does the reader learn this?

That immediately enables flashbacks, mysteries, unreliable narrators, nonlinear narratives, nested storytelling, and delayed reveals.
10. Knowledge should be modeled explicitly
For complex stories this could become extraordinarily useful.
Suppose Secret X exists.
Its graph might be:
Secret X
│
├─ Alice learns → Chapter 4
├─ Bob already knew → Before story
├─ Carol learns → Chapter 17
└─ Reader learns → Chapter 12

Now the app can warn:
Carol references Secret X in Chapter 9, but she does not learn it until Chapter 17.

That is a very practical writing assistant feature.
You could similarly track:
beliefs, not just knowledge.
Actual:
Bob killed Marcus

Alice believes:
Carol killed Marcus

Reader believes:
Unknown

Extremely useful for mysteries.
11. Scenes within scenes should become nested narrative units
Don't special-case them.
Just allow narrative units to contain narrative units.
Chapter
  Scene
    Conversation
      Story being told
        Flashback scene
    Transition
    Arrival

Zoom level controls what is visible.
Zoomed out:
Chapter 12

Zoom slightly:
Meeting → Journey → Confrontation

Zoom in:
Meeting
├─ Greeting
├─ Argument
├─ Revelation
└─ Departure

This produces a fractal outline rather than the rigid Chapter → Scene hierarchy common in writing software.
12. Plot threads should behave almost like colored circuitry
A scene can belong to multiple threads.
For example:
               ┌─ Romance ────────────────┐
               │                          │
Scene 1 ─ Scene 2 ─ Scene 3 ─ Scene 4 ─ Scene 5
               │              │
               └─ Mystery ────┴───────────

Threads could include:
Main Plot
Alice/Bob Relationship
Political Coup
Missing Artifact
Family Conflict
Theme: Identity

Then a "Thread View" could suppress everything else.
This would solve the “four plotlines deep” problem directly.
13. The sidebar should be a universal object shelf
Your sidebar idea should effectively function as an inventory of the story world.
Something like:
⌕ Search anything

CHARACTERS
Alice
Bob
Carol

LOCATIONS
Black Swan Tavern
Embassy
Northern City

OBJECTS
Red Key
Crown
Letter

THREADS
Rebellion
Romance
Murder

UNPLACED
Scene Idea 7
Character concept
Cool dialogue fragment

Dragging Alice into a scene means:
Alice participates in this scene.

Dragging Embassy might mean:
This is the scene's setting.

Dragging Red Key onto an edge between scenes might prompt:
What happens here?

Then:
○ introduced
○ transferred
○ discovered
○ lost
○ destroyed
○ custom...

That is powerful interaction design.
14. Add an "unresolved" workspace
Writers constantly have things like:
Someone betrays Alice here.

Need better reason Bob goes to city.

Character introduced around here.

Instead of forcing resolution, let users create ghost nodes.
[ ??? Betrayal ]

or:
[ Unassigned antagonist ]

Later they can drag an existing character onto it.
The system resolves:
??? Antagonist
      ↓
     Carol

without destroying any previously planned connections.
This would make planning much less brittle.
15. The graph should support semantic zoom
At different zoom levels:
Far out
Act I ─ Act II ─ Act III

Medium
Arrival ─ Investigation ─ Betrayal ─ War

Near
Alice
Bob
Embassy
Letter

Very near
Alice tells Bob X
Bob hides Letter
Trust −2
Bob learns Secret Y

This prevents the classic graph-app problem where you eventually create an unusable plate of spaghetti.
16. I would make the primary interface three-dimensional conceptually, not visually
The fundamental coordinates are:
X = narrative progression
Y = plot thread / conceptual grouping
Z = detail

The screen itself remains normal 2D.
Horizontal position answers:
When?

Vertical position answers:
Which storyline/context?

Zoom answers:
How much detail?

That's an extremely intuitive mental model.
17. The writing editor should coexist with the graph
I would not make this only a planning tool.
Selecting a scene should be capable of opening a writing surface.
Something like:
┌──────────────────── CANVAS ──────────────────┐
│                                             │
│ Scene 12 ─── Scene 13 ─── Scene 14          │
│                  ▲                          │
└──────────────────┼──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│ Chapter 5 · Scene 13                        │
│ Embassy Confrontation                       │
│                                             │
│ Alice closed the door behind her...         │
│                                             │
│                                             │
└─────────────────────────────────────────────┘

Then a compact context bar might show:
Alice · Bob · Embassy · Red Key
POV: Alice
Thread: Main / Betrayal
Story time: Day 18 · 21:40
2 unresolved continuity warnings

This keeps writing and planning from becoming separate applications.
18. The assistant should understand the graph
This is where the "assistant" portion becomes much more interesting than a generic writing chatbot.
You could ask:
Where does Alice's distrust of Bob actually start?

And receive:
Scene 14 is the first explicit decrease in trust, caused by Bob concealing the letter. Scene 9 contains foreshadowing but no recorded relationship-state change.

Or:
Show me unresolved setup that doesn't pay off.

Or:
Which characters disappear for more than five chapters?

Or:
What does Bob know immediately before Scene 37?

Or:
Find continuity problems if I move Scene 22 after Scene 26.

That last one is particularly important.
19. Rearrangement should trigger dependency analysis
Suppose the user drags:
Scene 22

after:
Scene 30

The system could show:
Move Scene 22 → after Scene 30

Potential conflicts:

⚠ Alice obtains Red Key in Scene 22
  but uses it in Scene 25.

⚠ Bob learns about the rebellion in Scene 22
  but discusses it in Scene 27.

⚠ Scene 29 references injuries sustained in Scene 22.

Then offer:
Move anyway
Move dependent scenes
Review conflicts
Cancel

That feels like refactoring tools for narrative.
Which is exactly the territory I would aim for.
20. Treat changes like commits
One subtle feature I think would be excellent:
Scenes can have an optional state diff.
Before:
Alice.location = Embassy
Alice.trustBob = high
Bob.hasKey = true

After:
Alice.location = Hotel
Alice.trustBob = low
Bob.hasKey = false
Alice.hasKey = true

Displayed to the user more naturally:
CHANGES

Alice
Embassy → Hotel
Trusts Bob → Distrusts Bob
Obtains Red Key

Bob
Loses Red Key

This makes the story computationally understandable without forcing the writer to think like a programmer.
21. UI direction
I would strongly avoid making this look like Jira, Notion, or a database.
Visually I'd target something between:
Linear + Figma + Obsidian Canvas + Arc + modern game skill-tree interfaces.
Very restrained UI chrome.
Large canvas.
Floating translucent controls.
Rounded but not excessively pill-shaped surfaces.
Thin semantic connection lines.
Soft depth.
Minimal permanent borders.
Information revealed progressively through hover, focus, and zoom.
The screen could fundamentally look like:
┌──────────────────────────────────────────────────────────────┐
│ Novel ▾     Story  Graph  Outline          Day 12 ━●━━━━━━ │
├──────┬───────────────────────────────────────────────────────┤
│      │                                                       │
│  ⌕   │       Alice                                          │
│      │         │                                             │
│  ◉   │         │ distrusts                                  │
│  ◉   │         ▼                                             │
│  ◉   │        Bob ─────── Red Key                           │
│      │         │                                             │
│      │         │ Scene 14                                   │
│      │         ▼                                             │
│      │      Embassy ─────────── Scene 15                    │
│      │                                                       │
│      │                                                       │
│      │                     +                                 │
│      │                                                       │
├──────┴───────────────────────────────────────────────────────┤
│ Scene 14 · Embassy Confrontation         Alice POV     842w │
└──────────────────────────────────────────────────────────────┘

And most panels should slide/fade away when writing.
22. A command palette would be essential
⌘/Ctrl + K
Then:
Create scene
Create character
Jump to Alice
Show Alice/Bob relationship
Go to Chapter 17
Show unresolved nodes
View continuity issues
Switch to relationship lens
Switch to story chronology
Focus thread: Rebellion
Insert scene before current

For a complex system, this prevents interaction complexity from becoming menu complexity.
23. Every object should be addressable
You could eventually support @ references everywhere:
@Alice
@Red Key
@Embassy
@Scene 17
@Rebellion

And slash commands:
/scene
/event
/relationship
/timeline
/thread
/reveal
/transition

This gives users both visual and keyboard-centric workflows.
24. A particularly useful view: character swimlanes
For example:
               Ch1    Ch2    Ch3    Ch4    Ch5    Ch6

Alice          ●──────●──────●────────────●──────●
                      │                   │
Bob                   ●──────●──────●────●
                             │      │
Carol                          ●──────●──────●

Where intersections indicate encounters.
Zooming in might reveal:
Alice ──[argument]── Bob

and relationship-state changes could appear as tiny colored markers.
This lets you immediately see:
Alice disappears for four chapters.

or:
These characters weirdly never interact.

25. Another useful view: causality
Instead of chronological sequence:
King assassinated
      │
      ├── causes → rebellion
      │               │
      │               └→ army mobilized
      │
      └── causes → Alice returns home
                      │
                      └→ Alice meets Bob

This could expose plot problems where an event:
has no cause
or
has no consequence.
26. Another useful view: promises and payoffs
The writer could tag something as:
Setup
Question
Mystery
Promise
Foreshadowing
Chekhov object

Then connect it to:
Reveal
Resolution
Payoff
Subversion

So:
Mysterious scar ──────────────► Reveal
       Ch2                       Ch19

The application could surface:
7 unresolved narrative promises.

That is incredibly useful.
27. Don't build an ontology prison
One danger with this concept would be overengineering the metadata.
The default interaction should remain:
Make node. Connect node. Write stuff.

Everything more structured should appear gradually.
A beginner could simply make:
Alice → Tavern → Murder → Escape

A power user could eventually encode:
Actor
Location
Event
Knowledge state
Story chronology
Narrative chronology
Causal dependency
Relationship delta
POV accessibility
Theme
Plot thread

Both should be valid.
Think progressive formalization.
28. The underlying data model
Conceptually I would use something close to:
Project
Entity
NarrativeUnit
Event
Relationship
RelationshipState
Property
PropertyState
Thread
Timeline
Membership
Reference
Document

With temporal structures centered around:
validFrom
validUntil

and narrative location centered around something like:
narrativeUnitId
sequenceIndex
storyTimestamp

Relationships then become objects themselves rather than mere graph-table rows.
That means:
Relationship
Alice ↔ Bob

can contain:
states[]
events[]
notes[]
sources[]
scenes[]
dimensions[]

This will save you enormous architectural pain later.
29. The product metaphor
I would probably frame the whole thing internally as:
A story IDE.

Not just a writing app.
You have:
source code → manuscript
symbols → characters/entities
references → mentions
dependency graph → causality/knowledge
version history → revisions
compiler errors → continuity errors
refactoring → rearranging scenes
debugger → inspect world state at Scene 32
tests → consistency assertions
IDE navigation → jump to appearances/relationships/events
That metaphor gives you a surprisingly clear product roadmap.
30. The strongest possible central interaction
If I reduced your idea to one distinctive experience, I would make it this:
You begin with:
[Beginning] ─────────────────────── [Ending]

You hover over the line.
A + appears.
You click it.
What happens between these?

You create:
[Betrayal]

Now:
[Beginning] ───── [Betrayal] ───── [Ending]

Click either connection and expand again.
Meanwhile, selecting any moment reveals the world-state graph at that instant.
You can then zoom into a scene and see:
who is here, what they know, what they want, what they possess, how they relate, what happens, and what changes.

That feels like the central product idea.
Everything else—timeline, character sheets, maps, writing editor, AI assistance, outlines, continuity checking—can grow naturally around it.
The most important architectural decision is therefore: do not model this primarily as documents with links. Model it as a temporally versioned story graph, with documents attached to that graph. That is what would make this materially different from Obsidian, Scrivener, Campfire, World Anvil, Plottr, or ordinary node-canvas systems.