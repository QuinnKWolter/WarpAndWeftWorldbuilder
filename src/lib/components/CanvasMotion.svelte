<script lang="ts">
  import { tick } from 'svelte';
  import { useSvelteFlow, useNodesInitialized } from '@xyflow/svelte';
  import { motionDuration } from '#lib/application/motion';
  import type { GraphNode } from '#lib/domain/projections';
  let { request, context, targets }: { request: number; context: string; targets: GraphNode[] } =
    $props();
  const { fitBounds, getNode } = useSvelteFlow();
  const initialized = useNodesInitialized();
  $effect(() => {
    const signature = `${request}:${context}`;
    if (initialized.current && signature)
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
  });
</script>
