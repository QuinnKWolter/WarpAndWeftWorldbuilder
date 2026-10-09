<script lang="ts">
  import { untrack, onDestroy } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
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
  import CanvasMotion from './CanvasMotion.svelte';
  import { motionDuration } from '#lib/application/motion';
  import type { Selection } from '#lib/domain/model';
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
    onwrite,
    onsummary,
    oninspect,
    onconnectempty,
    fitRequest = 0
  }: {
    ws: Workspace;
    oncreate: () => void;
    onconnect: (c: Connection) => void;
    onedge: (edge: Edge) => void;
    onconnectempty: (start: {
      nodeId: string;
      handleId: string | null;
      type: 'source' | 'target';
      x: number;
      y: number;
    }) => void;
    onwrite: () => void;
    onsummary: (selection: Selection) => void;
    oninspect: (selection: Selection) => void;
    fitRequest?: number;
  } = $props();
  let nodes = $state.raw<Node<GraphNode['data']>[]>([]);
  let edges = $state.raw<Edge[]>([]);
  const nodeTypes = { story: StoryNode };
  const edgeTypes = { sequence: SequenceEdge, semantic: SemanticEdge };
  let previousProjection = '';
  let toFlow: ((point: { x: number; y: number }) => { x: number; y: number }) | undefined;
  let dragging = $state(false);
  let frame = 0;
  let targets = $state.raw<GraphNode[]>([]);
  onDestroy(() => cancelAnimationFrame(frame));
  function animatePositions(next: Node<GraphNode['data']>[]) {
    cancelAnimationFrame(frame);
    const previous = new Map(nodes.map((node) => [node.id, node.position]));
    const duration = dragging ? 0 : motionDuration(400);
    const changed = next.some(
      (n) =>
        previous.has(n.id) &&
        (previous.get(n.id)!.x !== n.position.x || previous.get(n.id)!.y !== n.position.y)
    );
    if (!duration || !changed) {
      nodes = next;
      return;
    }
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = cubicInOut(t);
      nodes = next.map((node) => {
        const from = previous.get(node.id) ?? node.position;
        return {
          ...node,
          position: {
            x: from.x + (node.position.x - from.x) * eased,
            y: from.y + (node.position.y - from.y) * eased
          }
        };
      });
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }
  $effect(() => {
    const graph = ws.graph;
    const fingerprint = JSON.stringify(graph);
    if (fingerprint === previousProjection) return;
    previousProjection = fingerprint;
    targets = graph.nodes;
    const next = graph.nodes.map((n) => ({
      ...n,
      type: 'story',
      selected: ws.selection?.id === n.id
    }));
    untrack(() => animatePositions(next));
    edges = graph.edges.map((e) => ({
      ...e,
      type: e.type,
      label: e.type === 'semantic' ? e.data.label : undefined,
      selected: ws.edgeSelection === e.id || ws.selection?.id === e.id,
      style:
        ws.edgeSelection === e.id || ws.selection?.id === e.id
          ? 'stroke: var(--accent); stroke-width: 3;'
          : 'stroke: var(--edge); stroke-width: 1.4;'
    }));
  });
  $effect(() => {
    const selectedId = ws.selection?.id;
    const selectedEdge = ws.edgeSelection;
    // Selecting must preserve card data/measurements so labels stay under the pointer.
    untrack(() => {
      nodes = nodes.map((n) =>
        n.selected === (n.id === selectedId) ? n : { ...n, selected: n.id === selectedId }
      );
      edges = edges.map((e) => {
        const selected = e.id === selectedEdge || e.id === selectedId;
        return e.selected === selected
          ? e
          : {
              ...e,
              selected,
              style: selected
                ? 'stroke: var(--accent); stroke-width: 3;'
                : 'stroke: var(--edge); stroke-width: 1.4;'
            };
      });
    });
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
  class:is-dragging={dragging}
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
        fitViewOptions={{ duration: motionDuration(520), padding: 0.16 }}
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={1.6}
        deleteKey={[]}
        connectionRadius={35}
        onnodedragstart={() => {
          cancelAnimationFrame(frame);
          dragging = true;
        }}
        onnodedragstop={({ nodes: dragged }) => {
          dragging = false;
          for (const node of dragged) ws.setLayout(node.id, node.position.x, node.position.y);
        }}
        onnodeclick={({ node, event }) => {
          oninspect({ kind: node.data.kind, id: node.id });
          if (event instanceof MouseEvent && event.detail === 2) {
            if (node.data.kind === 'unit' && ws.bundle?.units.some((u) => u.parentId === node.id))
              ws.parentId = node.id;
            else if (node.data.kind === 'unit') onwrite();
            else onsummary({ kind: node.data.kind, id: node.id });
          }
        }}
        onedgeclick={({ edge, event }) => {
          ws.selection = null;
          ws.edgeSelection = edge.id;
          if (
            edge.data?.kind === 'relationship' ||
            (event instanceof MouseEvent && event.detail === 2)
          )
            onedge(edge);
        }}
        {onconnect}
        onconnectend={(event, state) => {
          if (state.isValid || !state.fromHandle || state.toNode || !toFlow) return;
          const target = event.target;
          if (!(target instanceof Element) || !target.closest('.svelte-flow')) return;
          const pointer = 'changedTouches' in event ? event.changedTouches[0] : event;
          if (!pointer) return;
          const point = toFlow({ x: pointer.clientX, y: pointer.clientY });
          onconnectempty({
            nodeId: state.fromHandle.nodeId,
            handleId: state.fromHandle.id ?? null,
            type: state.fromHandle.type,
            ...point
          });
        }}
        onpaneclick={() => {
          ws.selection = null;
          ws.edgeSelection = null;
        }}
        onmoveend={(_event, viewport) => {
          ws.detail = viewport.zoom < 0.55 ? 1 : 2;
        }}
      >
        <CanvasMotion
          onready={(convert) => (toFlow = convert)}
          request={fitRequest}
          context={`${ws.lens}:${ws.parentId}`}
          {targets}
        />
        <Background gap={24} size={1} patternColor="var(--dot)" />
        <Controls showLock={false} fitViewOptions={{ duration: motionDuration(520) }} />
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
