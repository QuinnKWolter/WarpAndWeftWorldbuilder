<script lang="ts">
  import { tick, onMount } from 'svelte';
  import { useSvelteFlow, useNodesInitialized } from '@xyflow/svelte';
  import { motionDuration } from '#lib/application/motion';
  import type { GraphNode } from '#lib/domain/projections';
  let {
    request,
    context,
    targets,
    onready
  }: {
    request: number;
    context: string;
    targets: GraphNode[];
    onready: (convert: (p: { x: number; y: number }) => { x: number; y: number }) => void;
  } = $props();
  const { fitBounds, getNode, screenToFlowPosition } = useSvelteFlow();
  onMount(() => {
    onready(screenToFlowPosition);
  });
  const initialized = useNodesInitialized();
  let lastFit = '';
  $effect(() => {
    const signature = JSON.stringify([request, context, targets.map((n) => n.id)]);
    if (initialized.current && signature !== lastFit) {
      lastFit = signature;
      void tick().then(() => {
        if (!targets.length) return;
        const x = Math.min(...targets.map((n) => n.position.x));
        const y = Math.min(...targets.map((n) => n.position.y));
        const right = Math.max(
          ...targets.map((n) => n.position.x + (getNode(n.id)?.measured?.width ?? 264))
        );
        const bottom = Math.max(
          ...targets.map((n) => n.position.y + (getNode(n.id)?.measured?.height ?? 180))
        );
        return fitBounds(
          { x, y, width: right - x, height: bottom - y },
          { duration: motionDuration(520), padding: 0.16 }
        );
      });
    }
  });
</script>
