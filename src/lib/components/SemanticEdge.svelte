<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getSmoothStepPath,
    type EdgeProps,
    type Edge
  } from '@xyflow/svelte';
  import type { GraphEdge } from '#lib/domain/projections';
  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    data
  }: EdgeProps<Edge<GraphEdge['data']>> = $props();
  const path = $derived(
    getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      offset: 28,
      borderRadius: 16
    })
  );
  // EdgeLabel portals this button outside the edge subtree. Bind before delegated pane events.
  function activate(node: HTMLButtonElement) {
    const click = (event: MouseEvent) => {
      event.stopPropagation();
      window.dispatchEvent(
        new CustomEvent(event.detail === 0 ? 'storygraph:edge' : 'storygraph:select-edge', {
          detail: { edgeId: id }
        })
      );
    };
    const doubleClick = (event: MouseEvent) => {
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('storygraph:edge', { detail: { edgeId: id } }));
    };
    node.addEventListener('click', click);
    node.addEventListener('dblclick', doubleClick);
    return {
      destroy() {
        node.removeEventListener('click', click);
        node.removeEventListener('dblclick', doubleClick);
      }
    };
  }
</script>

<BaseEdge {id} path={path[0]} {markerEnd} {style} />
<EdgeLabel x={path[1]} y={path[2]}
  ><button
    class="semantic-edge-label nodrag nopan"
    aria-label={`Inspect connection: ${data?.label}`}
    title="Click to select · Double-click or press Enter to inspect"
    use:activate>{data?.label}</button
  ></EdgeLabel
>
