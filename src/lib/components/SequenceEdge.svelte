<script lang="ts">
  import { BaseEdge, EdgeLabel, getBezierPath, type EdgeProps } from '@xyflow/svelte';
  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style
  }: EdgeProps = $props();
  const path = $derived(
    getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  );
  function insert() {
    window.dispatchEvent(new CustomEvent('storygraph:insert', { detail: { edgeId: id } }));
  }
</script>

<BaseEdge {id} path={path[0]} {markerEnd} {style} />
<EdgeLabel x={path[1]} y={path[2]}
  ><button
    class="edge-insert nodrag nopan"
    aria-label="Insert between scenes"
    data-edge-id={id}
    title="What happens between these?"
    onclick={insert}>+</button
  ></EdgeLabel
>
