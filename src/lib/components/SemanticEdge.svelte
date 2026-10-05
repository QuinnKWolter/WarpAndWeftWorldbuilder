<script lang="ts">
  import { BaseEdge, EdgeLabel, getBezierPath, type EdgeProps, type Edge } from '@xyflow/svelte';
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
    getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  );
</script>

<BaseEdge {id} path={path[0]} {markerEnd} {style} />
<EdgeLabel x={path[1]} y={path[2]}
  ><button
    class="semantic-edge-label nodrag nopan"
    aria-label={`Inspect connection: ${data?.label}`}
    title={data?.label}
    onclick={() =>
      window.dispatchEvent(new CustomEvent('storygraph:edge', { detail: { edgeId: id } }))}
    >{data?.label}</button
  ></EdgeLabel
>
