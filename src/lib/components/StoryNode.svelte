<script lang="ts">
  import { tick } from 'svelte';
  import {
    Handle,
    Position,
    useUpdateNodeInternals,
    type NodeProps,
    type Node
  } from '@xyflow/svelte';
  import { CircleHelp } from '@lucide/svelte';
  import FolderIcon from './FolderIcon.svelte';
  import type { GraphNode } from '#lib/domain/projections';
  import { fly } from 'svelte/transition';
  import { motionDuration } from '#lib/application/motion';
  let { id, data, selected }: NodeProps<Node<GraphNode['data']>> = $props();
  const updateInternals = useUpdateNodeInternals();
  $effect(() => {
    const signature = JSON.stringify([data.anchors, data.detail]);
    if (signature) void tick().then(() => updateInternals(id));
  });
  function offset(type: 'source' | 'target', i: number) {
    const same = data.anchors.sourceSide === data.anchors.targetSide;
    return same
      ? ((i + 1 + (type === 'source' ? data.anchors.count : 0)) / (data.anchors.count * 2 + 1)) *
          100
      : ((i + 1) / (data.anchors.count + 1)) * 100;
  }
</script>

<div
  class="story-node"
  in:fly={{ y: 16, duration: motionDuration(320) }}
  class:selected
  class:ghost={data.unresolved}
  class:current={data.current}
  title={data.summary}
  style={`--node-accent: ${data.accent}`}
>
  <div class="node-eyebrow">
    <span style:color={data.accent}
      >{#if data.unresolved}<CircleHelp size={14} />{:else}<FolderIcon
          name={data.icon}
          size={14}
        />{/if}</span
    ><span>{data.subtitle}</span>{#if data.current}<span
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

{#each ['target', 'source'] as type (type)}
  {#each Array.from({ length: data.anchors.count }, (_, i) => i) as i (i)}
    <Handle
      type={type as 'source' | 'target'}
      id={i === 0 ? undefined : type + '-' + (i + 1)}
      position={data.anchors[type === 'source' ? 'sourceSide' : 'targetSide'] as Position}
      aria-label={type + ' connection ' + (i + 1)}
      style={['left', 'right'].includes(
        data.anchors[type === 'source' ? 'sourceSide' : 'targetSide']
      )
        ? 'top:' + offset(type as 'source' | 'target', i) + '%;'
        : 'left:' + offset(type as 'source' | 'target', i) + '%;'}
    />
  {/each}
{/each}
