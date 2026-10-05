<script lang="ts">
  import {
    SvelteFlow,
    SvelteFlowProvider,
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
    type Connection
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import StoryNode from './StoryNode.svelte';
  import SequenceEdge from './SequenceEdge.svelte';
  import SemanticEdge from './SemanticEdge.svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { GraphNode } from '#lib/domain/projections';
  import { addMembership } from '#lib/domain/operations';
  import { placeUnit } from '#lib/domain/order';
  let {
    ws,
    oncreate,
    onconnect,
    onedge,
    onwrite
  }: {
    ws: Workspace;
    oncreate: () => void;
    onconnect: (c: Connection) => void;
    onedge: (edge: Edge) => void;
    onwrite: () => void;
  } = $props();
  let nodes = $state.raw<Node<GraphNode['data']>[]>([]);
  let edges = $state.raw<Edge[]>([]);
  const nodeTypes = { story: StoryNode };
  const edgeTypes = { sequence: SequenceEdge, semantic: SemanticEdge };
  let previousProjection = '';
  $effect(() => {
    const graph = ws.graph;
    const fingerprint = JSON.stringify([graph, ws.selection]);
    if (fingerprint === previousProjection) return;
    previousProjection = fingerprint;
    nodes = graph.nodes.map((n) => ({ ...n, type: 'story', selected: ws.selection?.id === n.id }));
    edges = graph.edges.map((e) => ({
      ...e,
      type: e.type,
      label: e.type === 'semantic' ? e.data.label : undefined,
      style: 'stroke: var(--edge); stroke-width: 1.4;'
    }));
  });
  function drop(event: DragEvent) {
    event.preventDefault();
    const droppedUnit = event.dataTransfer?.getData('storygraph/unit');
    if (droppedUnit) {
      const target =
        event.target instanceof Element
          ? event.target.closest('.svelte-flow__node')?.getAttribute('data-id')
          : null;
      const before = ws.bundle?.units.find((u) => u.id === target);
      ws.mutate(
        (b) => placeUnit(b, droppedUnit, before?.parentId ?? ws.parentId, before?.id ?? null),
        'Idea placed. Reading order updated.'
      );
      return;
    }
    const entityId = event.dataTransfer?.getData('storygraph/entity');
    if (!entityId) return;
    const edgeId =
      event.target instanceof Element
        ? (event.target.closest('[data-edge-id]')?.getAttribute('data-edge-id') ??
          event.target.closest('.svelte-flow__edge')?.getAttribute('data-id'))
        : null;
    if (edgeId) {
      window.dispatchEvent(
        new CustomEvent('storygraph:edge-drop', { detail: { edgeId, entityId } })
      );
      return;
    }
    const target =
      event.target instanceof Element ? event.target.closest('.svelte-flow__node') : null;
    const unitId = target?.getAttribute('data-id');
    if (unitId && ws.bundle?.units.some((u) => u.id === unitId))
      ws.mutate((b) => addMembership(b, unitId, entityId), 'Entity added to scene');
    else {
      ws.lens = 'world';
      ws.select({ kind: 'entity', id: entityId });
      ws.message = 'World entity selected. Drop onto a scene to add it as a participant.';
    }
  }
</script>

<div
  class="graph-canvas"
  role="region"
  aria-label="Story graph"
  ondragover={(e) => e.preventDefault()}
  ondrop={drop}
>
  {#if nodes.length}
    <SvelteFlowProvider>
      <SvelteFlow
        bind:nodes
        bind:edges
        {nodeTypes}
        {edgeTypes}
        fitView
        minZoom={0.15}
        maxZoom={1.6}
        deleteKey={[]}
        connectionRadius={35}
        onnodedragstop={({ nodes: dragged }) => {
          for (const node of dragged) ws.setLayout(node.id, node.position.x, node.position.y);
        }}
        onnodeclick={({ node, event }) => {
          ws.select({ kind: node.data.kind, id: node.id });
          if (event instanceof MouseEvent && event.detail === 2) {
            if (node.data.kind === 'unit' && ws.bundle?.units.some((u) => u.parentId === node.id))
              ws.parentId = node.id;
            else if (node.data.kind === 'unit') onwrite();
          }
        }}
        onedgeclick={({ edge }) => onedge(edge)}
        {onconnect}
        onpaneclick={() => (ws.selection = null)}
        onmoveend={(_event, viewport) => {
          ws.detail = viewport.zoom < 0.55 ? 1 : 2;
        }}
      >
        <Background gap={24} size={1} patternColor="var(--dot)" />
        <Controls showLock={false} />
        <MiniMap pannable zoomable nodeColor="var(--accent-soft)" maskColor="transparent" />
      </SvelteFlow>
    </SvelteFlowProvider>
  {:else}
    <div class="canvas-empty">
      <span class="eyebrow">EVERY STORY STARTS SOMEWHERE</span>
      <h2>Make room for a possibility.</h2>
      <p>
        Add a moment, connect two ideas, or follow a thread.<br />You can work out the details as
        you go.
      </p>
      <button class="primary" onclick={oncreate}>+ Add a moment</button>
    </div>
  {/if}
</div>
