<script lang="ts">
  import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
  import { BookOpen, MapPin, UserRound, Diamond, Layers, CircleHelp } from '@lucide/svelte';
  import type { GraphNode } from '#lib/domain/projections';
  let { data, selected }: NodeProps<Node<GraphNode['data']>> = $props();
  const Icon = $derived(
    data.unresolved
      ? CircleHelp
      : data.kind === 'unit'
        ? BookOpen
        : data.subtitle.includes('location')
          ? MapPin
          : data.subtitle.includes('character')
            ? UserRound
            : data.kind === 'thread'
              ? Layers
              : Diamond
  );
</script>

<Handle type="target" position={Position.Left} />
<div
  class="story-node"
  class:selected
  class:ghost={data.unresolved}
  class:current={data.current}
  title={data.summary}
>
  <div class="node-eyebrow">
    <Icon size={14} /><span>{data.subtitle}</span>{#if data.current}<span
        class="now-dot"
        aria-label="Selected story moment"
      ></span>{/if}
  </div>
  <h3>{data.title}</h3>
  {#if data.detail > 1}<p>{data.summary || 'A moment waiting to unfold.'}</p>{/if}
  {#if data.threads.length}<div class="node-threads">
      {#each data.threads as t (t.name)}<span title={t.name}
          ><i style:background={t.color}></i>{t.name}</span
        >{/each}
    </div>{/if}
</div>
<Handle type="source" position={Position.Right} />
