<script lang="ts">
  import {
    BookOpen,
    Plus,
    ArrowUp,
    ArrowDown,
    Download,
    Maximize2,
    Minimize2,
    X,
    Network,
    Undo2,
    Redo2
  } from '@lucide/svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import { base, unitSchema, type Selection } from '#lib/domain/model';
  import { narrativeOrder, breadcrumbs, siblings, placeUnit } from '#lib/domain/order';
  import { chapterSummary, populateOutline } from '#lib/domain/manuscript';
  import { markdownExport } from '#lib/domain/operations';
  import { download } from '#lib/application/files';
  import { focusScope } from '#lib/application/interactions';
  import ProseEditor from './ProseEditor.svelte';
  let {
    ws,
    unitId,
    expanded,
    onexpand,
    onclose,
    ongraph
  }: {
    ws: Workspace;
    unitId: string | null;
    expanded: boolean;
    onexpand: () => void;
    onclose: () => void;
    ongraph: (selection: Selection) => void;
  } = $props();
  let active = $state<string | null>(null);
  let query = $state('');
  let sidebar = $state(true);
  $effect(() => {
    if (unitId) active = unitId;
  });
  const units = $derived(ws.bundle ? narrativeOrder(ws.bundle) : []);
  const selected = $derived(ws.bundle?.units.find((u) => u.id === active));
  const chapter = $derived(
    selected && ws.bundle
      ? (breadcrumbs(ws.bundle, selected.id).findLast((u) => u.type === 'chapter') ?? selected)
      : null
  );
  const context = $derived(ws.bundle && selected ? chapterSummary(ws.bundle, selected) : null);
  const totalWords = $derived(
    ws.bundle?.documents.reduce(
      (sum, d) => sum + (d.text.trim() ? d.text.trim().split(/\s+/).length : 0),
      0
    ) ?? 0
  );
  function choose(id: string) {
    active = id;
    ws.select({ kind: 'unit', id });
  }
  function add(type: 'chapter' | 'scene') {
    const id = crypto.randomUUID();
    const parentId = type === 'scene' ? (chapter?.type === 'chapter' ? chapter.id : null) : null;
    ws.mutate((b) => {
      b.units.push(
        unitSchema.parse({
          ...base(),
          id,
          title: type === 'chapter' ? 'Untitled chapter' : 'Untitled scene',
          type,
          parentId,
          rank: (siblings(b, parentId).at(-1)?.rank ?? 0) + 1024
        })
      );
    }, 'Manuscript moment added');
    if (!ws.error) choose(id);
  }
  function move(direction: number) {
    if (!selected) return;
    ws.mutate((b) => {
      const list = siblings(b, selected.parentId);
      const index = list.findIndex((u) => u.id === selected.id);
      if ((direction < 0 && index === 0) || (direction > 0 && index === list.length - 1)) return;
      placeUnit(
        b,
        selected.id,
        selected.parentId,
        (direction < 0 ? list[index - 1] : list[index + 2])?.id ?? null
      );
    }, 'Reading order updated. Story chronology stays unchanged.');
  }
  function populate() {
    if (!active) return;
    let count = 0;
    ws.mutate((b) => {
      count = populateOutline(b, active!);
    }, 'Outline placeholders added. Undo is available.');
    ws.message = count
      ? `Added ${count} placeholders in reading order.`
      : 'No new child moments to add. Existing references were kept.';
  }
</script>

<section use:focusScope={expanded} class="manuscript" class:expanded aria-label="Manuscript editor">
  <header class="manuscript-header">
    <div>
      <BookOpen size={19} /><strong>Manuscript</strong><span class="small muted"
        >{totalWords} words</span
      >
    </div>
    <div>
      <button
        class="icon-button"
        aria-label="Undo story change"
        disabled={!ws.canUndo}
        onclick={() => ws.undo()}><Undo2 size={16} /></button
      >
      <button
        class="icon-button"
        aria-label="Redo story change"
        disabled={!ws.canRedo}
        onclick={() => ws.redo()}><Redo2 size={16} /></button
      >
      <button
        class="icon-button"
        aria-label="Toggle manuscript outline"
        aria-expanded={sidebar}
        onclick={() => (sidebar = !sidebar)}><BookOpen size={16} /></button
      ><button
        class="secondary compact"
        onclick={() =>
          ws.bundle &&
          download(markdownExport(ws.bundle), ws.bundle.project.title + '.md', 'text/markdown')}
        ><Download size={14} /> Export manuscript</button
      ><button
        class="icon-button"
        aria-label={expanded ? 'Exit manuscript fullscreen' : 'Fullscreen manuscript'}
        onclick={onexpand}
        >{#if expanded}<Minimize2 size={16} />{:else}<Maximize2 size={16} />{/if}</button
      ><button class="icon-button" aria-label="Close manuscript editor" onclick={onclose}
        ><X size={16} /></button
      >
    </div>
  </header>
  <div class="manuscript-body">
    {#if sidebar}<nav class="manuscript-outline" aria-label="Manuscript chapters and scenes">
        <label
          >Find a chapter or moment<input
            aria-label="Search manuscript outline"
            bind:value={query}
            placeholder="Chapter, scene, beat…"
          /></label
        >
        <div class="form-row">
          <button class="secondary compact" onclick={() => add('chapter')}
            ><Plus size={13} /> Chapter</button
          ><button class="secondary compact" onclick={() => add('scene')}
            ><Plus size={13} /> Scene</button
          >
        </div>
        <div class="manuscript-order">
          {#each units.filter((u) => (u.title + ' ' + u.synopsis)
              .toLowerCase()
              .includes(query.toLowerCase())) as unit (unit.id)}<button
              class:active={active === unit.id}
              aria-current={active === unit.id ? 'page' : undefined}
              style:padding-left={12 +
                (ws.bundle ? breadcrumbs(ws.bundle, unit.id).length - 1 : 0) * 12 +
                'px'}
              onclick={() => choose(unit.id)}
              ><span class="eyebrow">{unit.type}</span><strong>{unit.title}</strong><span
                class="small muted"
                >{ws.bundle?.documents
                  .find((d) => d.unitId === unit.id)
                  ?.text.trim()
                  .split(/\s+/)
                  .filter(Boolean).length ?? 0}w</span
              ></button
            >{/each}
        </div>
        <p class="field-help">
          This is your graph’s reading order. Chapters and scenes share the same text and autosave.
        </p>
      </nav>{/if}
    <div class="manuscript-page">
      {#if selected && ws.bundle}
        <div class="manuscript-context">
          <label
            >Moment title<input
              aria-label="Manuscript moment title"
              value={selected.title}
              onchange={(e) =>
                ws.mutate((b) => {
                  const unit = b.units.find((u) => u.id === selected.id);
                  if (unit) unit.title = e.currentTarget.value;
                }, 'Moment renamed')}
            /></label
          >
          <label
            >Parent chapter<select
              aria-label="Manuscript parent chapter"
              value={selected.parentId ?? ''}
              onchange={(e) =>
                ws.mutate(
                  (b) => placeUnit(b, selected.id, e.currentTarget.value || null, null),
                  'Moment moved to chapter; chronology preserved.'
                )}
              ><option value="">Top level</option
              >{#if selected.parentId && !units.some((u) => u.id === selected.parentId && u.type === 'chapter')}<option
                  value={selected.parentId}
                  >{units.find((u) => u.id === selected.parentId)?.title ?? 'Parent moment'}</option
                >{/if}<option disabled value="__chapters">Chapters</option
              >{#each units.filter((u) => u.type === 'chapter' && u.id !== selected.id && !breadcrumbs(ws.bundle!, u.id).some((p) => p.id === selected.id)) as parent (parent.id)}<option
                  value={parent.id}>{parent.title}</option
                >{/each}</select
            ></label
          >
          <button
            class="icon-button"
            aria-label="Move manuscript moment earlier"
            onclick={() => move(-1)}><ArrowUp size={16} /></button
          ><button
            class="icon-button"
            aria-label="Move manuscript moment later"
            onclick={() => move(1)}><ArrowDown size={16} /></button
          >
          <button
            class="secondary compact"
            onclick={() => ongraph({ kind: 'unit', id: selected.id })}
            ><Network size={14} /> Show in graph</button
          >
          <button class="secondary compact" onclick={populate}>Populate from outline</button>
        </div>
        <details class="manuscript-notes">
          <summary>Notes & graph summary</summary>
          <div class="manuscript-notes-grid">
            <label
              >Writing notes<textarea
                aria-label="Manuscript writing notes"
                rows="4"
                value={typeof selected.metadata.writingNotes === 'string'
                  ? selected.metadata.writingNotes
                  : ''}
                oninput={(e) =>
                  ws.mutate(
                    (b) => {
                      const unit = b.units.find((u) => u.id === selected.id);
                      if (unit) unit.metadata.writingNotes = e.currentTarget.value;
                    },
                    'Writing notes updated',
                    false
                  )}></textarea></label
            >
            <div class="graph-summary">
              <span class="eyebrow">LIVE GRAPH SUMMARY</span>
              <p>{selected.synopsis || 'Add a synopsis in the inspector to guide your writing.'}</p>
              {#if context}<p>
                  {context.units.length} moments · {context.events.length} events · {context
                    .relationships.length} relationships
                </p>
                <p>
                  {context.entities.map((e) => e.name).join(' · ') || 'No scene participants yet.'}
                </p>
                <p>{context.threads.map((t) => t.name).join(' · ') || 'No plot threads yet.'}</p>
                {#each context.events.slice(0, 8) as event (event)}<button
                    class="text-button small"
                    onclick={() => ongraph({ kind: 'event', id: event.id })}>{event.title}</button
                  >{/each}{/if}
            </div>
          </div>
          <p class="field-help">
            Populate from outline adds linked placeholders for every child moment in reading order,
            preserving existing prose. Expand placeholders in the editor to turn their current
            summaries into draft text. Hide placeholders for a clean reading view.
          </p>
        </details>
        {#key selected.id}<ProseEditor
            {ws}
            unitId={selected.id}
            {expanded}
            {onexpand}
            {onclose}
            onreference={ongraph}
          />{/key}
      {:else}<div class="manuscript-empty">
          <span class="eyebrow">FROM POSSIBILITIES TO PROSE</span>
          <h2>Give your world a voice.</h2>
          <p>
            Choose a moment from the outline, or start a chapter. Your manuscript and graph are two
            views of the same story.
          </p>
          <button class="primary" onclick={() => add('chapter')}>Create a chapter</button>
        </div>{/if}
    </div>
  </div>
</section>
