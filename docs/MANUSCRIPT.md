# From graph to manuscript

Open **Manuscript** in the project header or run **Open manuscript editor** from Ctrl/Cmd+K. **Write this moment** in the inspector opens the same workspace at that moment. There is one document per narrative unit; graph writing and manuscript writing never create competing copies.

The manuscript outline uses your graph's reading order and nesting. Add chapters or scenes, rename moments, choose a parent chapter, and use move arrows to reorder siblings. Story timestamps remain unchanged. Use **Show in graph** to return to the selected moment and its inspector.

## Write and read

Rich text offers headings, emphasis, strike, code, lists, quotes, rules, links, undo/redo, and find/replace. Markdown mode edits the same document as source; Read mode disables editing. Autosave and browser draft recovery apply in every editing mode.

Supported Markdown covers the editor's headings, paragraphs, emphasis, strike, inline/block code, ordered/bullet lists, quotes, rules, and links. Arbitrary HTML, images, tables, footnotes, and advanced publishing layout are not supported. Switching modes normalizes supported formatting; it is not a byte-for-byte Markdown file editor. Keep large manuscripts divided into scenes because each document remains bounded by the existing validation limits.

Expand **Notes & graph summary** for optional writing notes, the current synopsis, participating entities, events, relationships, and plot threads. Notes remain attached to the moment and are excluded from clean export. Summaries are derived from modeled data, without AI.

## Planning placeholders

**Insert placeholder** opens a searchable picker for moments, entities, events, relationships, and threads. Insert a linked reminder at the cursor, then continue writing around it. References retain stable object IDs, survive renaming and export/import, and have readable fallback labels if their objects are deleted.

**Populate from outline** appends references to the current moment's descendants in reading order. It preserves existing text and skips references already present. This is useful on a chapter with several planned scenes.

**Expand placeholders** replaces the current page's references with current names and summaries or descriptions as draft text. It does not generate narrative prose or alter the graph. Graph undo restores references if you have not subsequently rewritten that expanded text.

**Hide placeholders** removes planning tokens from the formatted page and reference footer, leaving true prose visible. Markdown source retains tokens intentionally so source editing cannot silently drop links. Placeholders do not count as prose words.

The durable source form is `{{story:kind:UUID|encoded-label}}`. The picker creates it for you. Preserve tokens when editing source. Double-click a visible reference, or use its reference-footer button, to visit the corresponding graph object.

## Focus and export

Fullscreen manuscript, entities, inspector, and graph views use the available application window. Their exit buttons and Escape restore the normal workspace. Fullscreen keyboard focus stays inside the active surface.

**Export page** follows the current Show/Hide placeholders setting. **Export manuscript** produces clean Markdown in reading order, preserving supported formatting while excluding planning references and writing notes. Project JSON export remains the complete backup, including notes, rich documents, references, graph data, and layout.

For terminology, see the in-app question-mark button or [glossary](GLOSSARY.md).
