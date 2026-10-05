<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate, goto } from '$app/navigation';
  import {
    ArrowLeft,
    Search,
    PanelLeft,
    PanelRight,
    Plus,
    Undo2,
    Redo2,
    Download,
    MoreHorizontal,
    Sun,
    Moon,
    TriangleAlert,
    Layers,
    ChevronRight,
    Check,
    PenLine,
    LayoutGrid,
    X,
    Sparkles
  } from '@lucide/svelte';
  import type { PageData } from './$types';
  import type { Connection, Edge } from '@xyflow/svelte';
  import { Workspace } from '#lib/application/workspace.svelte';
  import { base } from '#lib/domain/model';
  import {
    removeObject,
    deleteImpact,
    markdownExport,
    addMembership
  } from '#lib/domain/operations';
  import { siblings, breadcrumbs } from '#lib/domain/order';
  import { lenses } from '#lib/domain/projections';
  import { exportProject, download } from '#lib/application/files';
  import { product } from '#lib/product';
  import Shelf from '#lib/components/Shelf.svelte';
  import GraphCanvas from '#lib/components/GraphCanvas.svelte';
  import Inspector from '#lib/components/Inspector.svelte';
  import Timeline from '#lib/components/Timeline.svelte';
  import CreateDialog, { type CreateKind } from '#lib/components/CreateDialog.svelte';
  import { arrangeGraph } from '#lib/application/layout';
  import CommandPalette from '#lib/components/CommandPalette.svelte';
  import Diagnostics from '#lib/components/Diagnostics.svelte';
  import Modal from '#lib/components/Modal.svelte';
  let { data }: { data: PageData } = $props();
  const ws = new Workspace();
  let ready = $state(false);
  let showShelf = $state(true);
  let showInspector = $state(true);
  let command = $state(false);
  let issues = $state(false);
  let settings = $state(false);
  let deleteDialog = $state(false);
  let create = $state<{
    kind: CreateKind;
    beforeId?: string | null;
    sourceId?: string;
    targetId?: string;
    unitId?: string | null;
    presetType?: string;
  } | null>(null);
  let writingId = $state<string | null>(null);
  let EditorComponent = $state<
    (typeof import('#lib/components/ProseEditor.svelte'))['default'] | null
  >(null);
  let focused = $state(false);
  let connecting = $state<Connection | null>(null);
  let editingLinkId = $state<string | null>(null);
  let linkType = $state<
    | 'causes'
    | 'enables'
    | 'prevents'
    | 'foreshadows'
    | 'sets up'
    | 'pays off'
    | 'reveals'
    | 'resolves'
  >('causes');
  let sequenceEdge = $state<Edge | null>(null);
  let edgeEntityId = $state('');
  let canvasVersion = $state(0);
  let requestLeave = $state(false);
  function oncreate(kind: CreateKind, unitId?: string) {
    create = {
      kind,
      unitId,
      sourceId:
        kind === 'relationship' && ws.selection?.kind === 'entity' ? ws.selection.id : undefined
    };
    ws.error = '';
  }
  async function write() {
    if (ws.selection?.kind === 'unit') {
      const id = ws.selection.id;
      EditorComponent ??= (await import('#lib/components/ProseEditor.svelte')).default;
      writingId = id;
      if (window.innerWidth < 760) focused = true;
    }
  }
  function onconnect(c: Connection) {
    editingLinkId = null;
    if (
      ws.bundle?.entities.some((e) => e.id === c.source) &&
      ws.bundle.entities.some((e) => e.id === c.target)
    )
      create = { kind: 'relationship', sourceId: c.source, targetId: c.target };
    else connecting = c;
  }
  function onedge(edge: Edge) {
    const graphEdge = ws.graph.edges.find((e) => e.id === edge.id);
    if (graphEdge?.data.kind === 'relationship') {
      ws.select({ kind: 'relationship', id: graphEdge.data.objectId! });
      showInspector = true;
    } else if (graphEdge?.data.kind === 'sequence') sequenceEdge = edge;
    else {
      const link = ws.bundle?.links.find((l) => l.id === edge.id);
      if (!link) return;
      editingLinkId = link.id;
      linkType = link.type;
      connecting = {
        source: edge.source,
        target: edge.target,
        sourceHandle: null,
        targetHandle: null
      };
    }
  }
  function insert(edgeId: string) {
    const edge = ws.graph.edges.find((e) => e.id === edgeId);
    if (!edge) return;
    edgeEntityId = '';
    sequenceEdge = edge;
  }
  function insertKind(type: string) {
    const edge = sequenceEdge;
    if (!edge) return;
    const target = ws.bundle?.units.find((u) => u.id === edge.target);
    create = {
      kind: type === 'placeholder' ? 'placeholder' : 'unit',
      beforeId: edge.target,
      unitId: target?.parentId ?? undefined,
      presetType: type
    };
    sequenceEdge = null;
  }
  async function leave() {
    await ws.flush();
    if (ws.saveState === 'saved') {
      requestLeave = true;
      await goto('/');
    }
  }
  beforeNavigate(({ cancel }) => {
    if (ready && !requestLeave && ws.saveState !== 'saved') {
      cancel();
      void ws.flush();
      ws.message = 'Saving your pending work. Navigate again when the save completes.';
    }
  });
  function keydown(e: KeyboardEvent) {
    const input =
      e.target instanceof Element &&
      !!e.target.closest('input,textarea,select,[contenteditable="true"]');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      command = !command;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      void ws.flush();
      ws.message = 'Your story is saved automatically.';
    }
    if (!input && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) ws.redo();
      else ws.undo();
    }
    if (!input && (e.key === 'Delete' || e.key === 'Backspace') && ws.selection) {
      e.preventDefault();
      deleteDialog = true;
    }
    if (e.key === 'Escape') {
      ws.selection = null;
      focused = false;
    }
    if (!input && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const points = [
        ...new Set(
          ws.bundle?.units.flatMap((u) => (u.storyTime === null ? [] : [u.storyTime])) ?? []
        )
      ].sort((a, b) => a - b);
      const index = points.indexOf(ws.at);
      ws.at =
        points[
          Math.max(0, Math.min(points.length - 1, index + (e.key === 'ArrowLeft' ? -1 : 1)))
        ] ?? ws.at;
      ws.atOrder = Infinity;
    }
  }
  function theme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('storygraph:theme', next);
  }
  function resize() {
    if (window.innerWidth < 1000) {
      showShelf = false;
      showInspector = false;
    }
    if (writingId && window.innerWidth < 760) focused = true;
  }
  onMount(() => {
    ws.load(data.bundle);
    ready = true;
    if (window.innerWidth < 1000) {
      showShelf = false;
      showInspector = false;
    }
    const initial = siblings(data.bundle, ws.parentId)[0];
    if (initial) ws.select({ kind: 'unit', id: initial.id });
    const insertion = (e: Event) => insert((e as CustomEvent<{ edgeId: string }>).detail.edgeId);
    const inspectEdge = (e: Event) => {
      const edge = ws.graph.edges.find(
        (edge) => edge.id === (e as CustomEvent<{ edgeId: string }>).detail.edgeId
      );
      if (edge) onedge(edge);
    };
    const dropEdge = (e: Event) => {
      const detail = (e as CustomEvent<{ edgeId: string; entityId: string }>).detail;
      const edge = ws.graph.edges.find((edge) => edge.id === detail.edgeId);
      if (edge?.data.kind === 'sequence') {
        sequenceEdge = edge;
        edgeEntityId = detail.entityId;
      } else ws.message = 'Drop an entity onto a narrative connection to choose its role.';
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (ws.saveState !== 'saved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') void ws.flush();
    };
    window.addEventListener('storygraph:insert', insertion);
    window.addEventListener('storygraph:edge', inspectEdge);
    window.addEventListener('storygraph:edge-drop', dropEdge);
    window.addEventListener('beforeunload', unload);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      ws.dispose();
      window.removeEventListener('storygraph:insert', insertion);
      window.removeEventListener('storygraph:edge', inspectEdge);
      window.removeEventListener('storygraph:edge-drop', dropEdge);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('visibilitychange', visibility);
    };
  });
  const selectedName = $derived(
    ws.selection
      ? (ws.bundle?.entities.find((e) => e.id === ws.selection?.id)?.name ??
          ws.bundle?.units.find((u) => u.id === ws.selection?.id)?.title ??
          ws.bundle?.events.find((e) => e.id === ws.selection?.id)?.title ??
          ws.bundle?.threads.find((e) => e.id === ws.selection?.id)?.name ??
          'this relationship')
      : 'this object'
  );
</script>

<svelte:head
  ><title>{ws.bundle?.project.title ?? data.bundle.project.title} · {product.name}</title
  ></svelte:head
>
<svelte:window onkeydown={keydown} onresize={resize} />
{#if ready && ws.bundle}
  <div class="workspace" class:focus-writing={focused}>
    <header class="workspace-header">
      <div class="project-title">
        <button class="icon-button" aria-label="Back to stories" onclick={leave}
          ><ArrowLeft size={18} /></button
        ><img src="/favicon.svg" alt="" width="25" height="25" />
        <div>
          <strong>{ws.bundle.project.title}</strong><span class="small muted"
            >A world in the making</span
          >
        </div>
      </div>
      <div class="workspace-tools">
        <span class="save-indicator" class:save-error={ws.saveState === 'error'} role="status"
          >{#if ws.saveState === 'saved'}<Check size={13} />{/if}{ws.saveState === 'saved'
            ? 'All changes saved'
            : ws.saveState === 'error'
              ? 'Save needs attention'
              : ws.saveState === 'saving'
                ? 'Saving…'
                : 'Unsaved changes'}</span
        ><button
          class="search-button"
          aria-label="Open command palette"
          onclick={() => (command = true)}
          ><Search size={16} /><span class="desktop-only">Search anything</span><kbd>Ctrl K</kbd
          ></button
        ><button class="icon-button" aria-label="Switch color theme" onclick={theme}
          ><Sun size={17} class="light-icon" /><Moon size={17} class="dark-icon" /></button
        >
        <details class="workspace-menu">
          <summary aria-label="Project menu"><MoreHorizontal size={20} /></summary>
          <div>
            <button onclick={() => exportProject(ws.bundle!)}
              ><Download size={15} /> Export project JSON</button
            ><button
              onclick={() =>
                download(
                  markdownExport(ws.bundle!),
                  `${ws.bundle!.project.title}.md`,
                  'text/markdown'
                )}><PenLine size={15} /> Export manuscript Markdown</button
            ><button onclick={() => (settings = true)}
              ><Sparkles size={15} /> Settings & shortcuts</button
            >
          </div>
        </details>
      </div>
    </header>
    {#if ws.error}<div class="error-banner" role="alert">
        <span>{ws.error}</span><button onclick={() => ws.flush()}>Retry save</button><button
          onclick={() => exportProject(ws.bundle!)}>Export pending work</button
        ><button class="icon-button" aria-label="Dismiss error" onclick={() => (ws.error = '')}
          ><X size={15} /></button
        >
      </div>{/if}
    <div class="workspace-middle">
      {#if showShelf && !focused}<div class="shelf-container">
          {#if window.innerWidth < 1000}<button
              class="drawer-close icon-button"
              aria-label="Close story shelf"
              onclick={() => (showShelf = false)}><X size={18} /></button
            >{/if}<Shelf {ws} {oncreate} />
        </div>{/if}
      <main class="canvas-column">
        <div class="canvas-toolbar">
          <div class="lens-controls">
            <button
              class="icon-button"
              aria-label="Toggle story shelf"
              onclick={() => (showShelf = !showShelf)}><PanelLeft size={17} /></button
            ><span class="toolbar-divider"></span><Layers size={16} /><select
              aria-label="Graph lens"
              bind:value={ws.lens}
              onchange={() => canvasVersion++}
              >{#each lenses as lens (JSON.stringify(lens))}<option value={lens}
                  >{lens === 'world'
                    ? 'World'
                    : lens === 'relationships'
                      ? 'Relationships'
                      : lens === 'chronology'
                        ? 'Chronology'
                        : lens === 'threads'
                          ? 'Plot threads'
                          : 'Narrative'}</option
                >{/each}</select
            >
          </div>
          <div>
            <button
              class="mode-toggle"
              class:active={ws.temporal}
              onclick={() => (ws.temporal = !ws.temporal)}
              >{ws.temporal ? 'At this moment' : 'Whole story'}</button
            ><button
              class="icon-button"
              aria-label="Undo story change"
              disabled={!ws.canUndo}
              onclick={() => ws.undo()}><Undo2 size={16} /></button
            ><button
              class="icon-button"
              aria-label="Redo story change"
              disabled={!ws.canRedo}
              onclick={() => ws.redo()}><Redo2 size={16} /></button
            ><button class="primary compact" onclick={() => oncreate('unit')}
              ><Plus size={15} /><span>Add moment</span></button
            ><button
              class="icon-button"
              aria-label="Toggle inspector"
              onclick={() => (showInspector = !showInspector)}><PanelRight size={17} /></button
            >
          </div>
        </div>
        <div class="canvas-context">
          <div class="breadcrumbs">
            <button
              onclick={() => {
                ws.parentId = null;
                canvasVersion++;
              }}>{ws.bundle.project.title}</button
            >{#each ws.parentId ? breadcrumbs(ws.bundle, ws.parentId) : [] as ancestor (ancestor.id)}<ChevronRight
                size={12}
              /><button
                onclick={() => {
                  ws.parentId = ancestor.id;
                  canvasVersion++;
                }}>{ancestor.title}</button
              >{/each}
          </div>
          <span class="canvas-hint"
            >{ws.lens === 'narrative'
              ? 'Hover a connection to add a possibility.'
              : ws.lens === 'chronology'
                ? 'In-world order. Reading order stays independent.'
                : 'Follow the connections at this story point.'}</span
          >
        </div>
        {#if ws.lens === 'threads'}<div class="thread-filters">
            <span class="small muted">Follow</span
            >{#each ws.bundle.threads as t (typeof t === 'string' ? t : t.id)}<button
                class:active={ws.threadIds.includes(t.id)}
                onclick={() =>
                  (ws.threadIds = ws.threadIds.includes(t.id)
                    ? ws.threadIds.filter((id) => id !== t.id)
                    : [...ws.threadIds, t.id])}
                ><i class="thread-dot" style:background={t.color}></i>{t.name}</button
              >{/each}<button onclick={() => (ws.threadIds = [])}>All threads</button>
          </div>{/if}
        <div class="canvas-area">
          {#key canvasVersion}<GraphCanvas
              {ws}
              oncreate={() => oncreate('unit')}
              {onconnect}
              {onedge}
              onwrite={write}
            />{/key}
          <div class="canvas-caption"><span>✧</span> A story is made of changes.</div>
          <button
            class="arrange-button secondary"
            onclick={async () => {
              try {
                await arrangeGraph(ws);
                canvasVersion++;
              } catch {
                ws.error = 'The graph could not be arranged. Your saved positions are preserved.';
              }
            }}>Arrange</button
          >
          <button class="fit-button secondary" onclick={() => canvasVersion++}
            ><LayoutGrid size={14} /> Fit view</button
          >
        </div>
        {#if writingId && EditorComponent && ws.bundle.units.some((u) => u.id === writingId)}{#key writingId}<EditorComponent
              {ws}
              unitId={writingId}
              expanded={focused}
              onexpand={() => (focused = !focused)}
              onclose={() => {
                writingId = null;
                focused = false;
              }}
            />{/key}{/if}
      </main>
      {#if showInspector && !focused}<Inspector
          {ws}
          {oncreate}
          onwrite={write}
          ondelete={() => (deleteDialog = true)}
          onclose={() => (showInspector = false)}
        />{/if}
    </div>
    {#if !focused}<Timeline {ws} />{/if}
    <footer class="workspace-status">
      <div>
        <span class="status-dot"></span><span>{ws.message || 'Your story. Your pace.'}</span>
      </div>
      <div>
        <span class="desktop-only"
          >{ws.bundle.entities.length} entities · {ws.bundle.units.length} moments</span
        ><button onclick={() => (issues = true)}
          ><TriangleAlert size={13} />{ws.issues.filter((i) => i.severity === 'warning').length} continuity
          · {ws.issues.filter((i) => i.severity === 'info').length} loose threads</button
        >
      </div>
    </footer>
  </div>
  {#if create}<CreateDialog {ws} {...create} onclose={() => (create = null)} />{/if}
  {#if command}<CommandPalette
      {ws}
      onclose={() => (command = false)}
      {oncreate}
      onissues={() => (issues = true)}
      onfit={() => canvasVersion++}
    />{/if}
  {#if issues}<Diagnostics {ws} onclose={() => (issues = false)} />{/if}
  {#if deleteDialog && ws.selection}<Modal
      title={`Delete ${selectedName}?`}
      onclose={() => (deleteDialog = false)}
      ><div class="dialog-form">
        <p>
          This also removes {deleteImpact(ws.bundle, ws.selection)} related records, including any dependent
          memberships, history, and nested content. You can undo this change while this workspace stays
          open.
        </p>
        <footer>
          <button class="quiet" onclick={() => (deleteDialog = false)}>Keep it</button><button
            class="danger"
            onclick={() => {
              const selection = ws.selection!;
              ws.mutate((b) => removeObject(b, selection), 'Object removed. Undo is available.');
              if (writingId === selection.id) writingId = null;
              if (ws.parentId === selection.id) ws.parentId = null;
              ws.selection = null;
              deleteDialog = false;
            }}>Delete & keep undo</button
          >
        </footer>
      </div></Modal
    >{/if}
  {#if sequenceEdge}<Modal title="What happens between these?" onclose={() => (sequenceEdge = null)}
      ><div class="dialog-form">
        <p>A connection is a little room for the story to grow.</p>
        <button class="primary full" onclick={() => insertKind('scene')}>Insert a new scene</button
        ><button class="secondary full" onclick={() => insertKind('transition')}
          >Insert a transition</button
        ><button class="secondary full" onclick={() => insertKind('note')}>Insert a note</button
        ><button class="secondary full" onclick={() => insertKind('placeholder')}
          >Leave an unresolved moment</button
        ><button
          class="secondary full"
          onclick={() => {
            create = { kind: 'event', unitId: sequenceEdge!.source };
            sequenceEdge = null;
          }}>Record an event in the earlier scene</button
        >
        <button
          class="secondary full"
          onclick={() => {
            create = { kind: 'entity', unitId: sequenceEdge!.source };
            sequenceEdge = null;
          }}>Create an entity in the earlier scene</button
        >
        <label
          >Add an existing entity<select
            aria-label="Entity for this connection"
            bind:value={edgeEntityId}
            ><option value="">Choose from your world…</option
            >{#each ws.bundle.entities as entity (entity.id)}<option value={entity.id}
                >{entity.name}</option
              >{/each}</select
          ></label
        >
        <div class="form-row">
          <button
            class="secondary"
            disabled={!edgeEntityId}
            onclick={() => {
              ws.mutate(
                (b) => addMembership(b, sequenceEdge!.source, edgeEntityId),
                'Entity added to earlier scene'
              );
              sequenceEdge = null;
            }}>Add to earlier scene</button
          ><button
            class="secondary"
            disabled={!edgeEntityId}
            onclick={() => {
              create = {
                kind: 'change',
                unitId: sequenceEdge!.source,
                sourceId: ws.bundle!.entities[0]?.id,
                targetId: edgeEntityId
              };
              sequenceEdge = null;
            }}>Record a change</button
          >
        </div>
        <button
          class="secondary full"
          onclick={() => {
            create = {
              kind: 'thread',
              sourceId: sequenceEdge!.source,
              targetId: sequenceEdge!.target
            };
            sequenceEdge = null;
          }}>Start a thread through these moments</button
        >
      </div></Modal
    >{/if}
  {#if connecting}<Modal
      title={editingLinkId ? 'Inspect this connection' : 'Give this connection a meaning'}
      onclose={() => (connecting = null)}
      ><div class="dialog-form">
        <p>
          {ws.graph.nodes.find((n) => n.id === connecting!.source)?.data.title ?? 'Story object'} → {ws.graph.nodes.find(
            (n) => n.id === connecting!.target
          )?.data.title ?? 'Story object'}
        </p>
        <label
          >Semantic link<select aria-label="Semantic link" bind:value={linkType}
            >{#each ['causes', 'enables', 'prevents', 'foreshadows', 'sets up', 'pays off', 'reveals', 'resolves'] as t (t)}<option
                >{t}</option
              >{/each}</select
          ></label
        >
        <footer>
          {#if editingLinkId}<button
              class="danger"
              onclick={() => {
                ws.mutate(
                  (b) => (b.links = b.links.filter((l) => l.id !== editingLinkId)),
                  'Connection removed. Undo is available.'
                );
                connecting = null;
              }}>Delete connection</button
            >{/if}
          <button class="quiet" onclick={() => (connecting = null)}>Cancel</button><button
            class="primary"
            onclick={() => {
              ws.mutate(
                (b) => {
                  const link = b.links.find((l) => l.id === editingLinkId);
                  if (link) link.type = linkType;
                  else
                    b.links.push({
                      ...base(),
                      sourceId: connecting!.source,
                      targetId: connecting!.target,
                      type: linkType
                    });
                },
                editingLinkId ? 'Semantic connection updated' : 'Semantic connection added'
              );
              connecting = null;
            }}>{editingLinkId ? 'Save connection' : 'Connect'}</button
          >
        </footer>
      </div></Modal
    >{/if}
  {#if settings}<Modal title="Your workspace" onclose={() => (settings = false)}
      ><div class="dialog-form">
        <span class="eyebrow">PRIVATE BY DEFAULT</span>
        <p>
          Your stories are saved in this installation’s SQLite database. There is no telemetry or
          external AI connection.
        </p>
        <h3>AI integration</h3>
        <p class="field-help">
          Off. A provider interface is available for future local or OpenAI-compatible integrations.
          AI requests and generation are not implemented in this alpha.
        </p>
        <h3>A few useful shortcuts</h3>
        <div class="shortcut-list">
          <span>Find anything / commands <kbd>Ctrl / ⌘ K</kbd></span><span
            >Save now <kbd>Ctrl / ⌘ S</kbd></span
          ><span>Undo story changes <kbd>Ctrl / ⌘ Z</kbd></span><span
            >Redo story changes <kbd>Ctrl / ⌘ Shift Z</kbd></span
          ><span>Step through story time <kbd>← →</kbd></span><span
            >Delete selected object <kbd>Delete</kbd></span
          >
        </div>
        <p class="field-help">
          Graph dragging changes layout. Drag in the outline or use scene arrows to change reading
          order. Double-click a moment to explore inside or write.
        </p>
      </div></Modal
    >{/if}
  {#if ws.recovery}<Modal
      title="A draft from another saved version"
      onclose={() => (ws.recovery = null)}
      ><div class="dialog-form">
        <p>
          This browser has pending writing based on an older saved version. Export it before
          deciding how to reconcile the two copies.
        </p>
        <button class="primary full" onclick={() => exportProject(ws.recovery!)}
          >Export recovery draft</button
        ><button
          class="secondary full"
          onclick={() => {
            localStorage.removeItem(`storygraph:draft:${ws.bundle!.project.id}`);
            localStorage.removeItem(`storygraph:recovery:${ws.bundle!.project.id}`);
            ws.recovery = null;
          }}>Keep database version</button
        >
      </div></Modal
    >{/if}
{:else}<main class="loading-page">
    <img src="/favicon.svg" alt="" width="36" />
    <p>Making room for your world…</p>
  </main>{/if}
