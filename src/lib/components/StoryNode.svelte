<script lang="ts">
  import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
  import { CircleHelp } from '@lucide/svelte';
  import FolderIcon from './FolderIcon.svelte';
  import type { GraphNode } from '#lib/domain/projections';
  import { fly } from 'svelte/transition';
  import { motionDuration } from '#lib/application/motion';
  let { data, selected }: NodeProps<Node<GraphNode['data']>> = $props();
</script>

<Handle type="target" position={Position.Left} />
<div
  class="story-node"
  in:fly={{ y: 16, duration: motionDuration(320) }}
  class:selected
  class:ghost={data.unresolved}
  class:current={data.current}
  title={data.summary}
  style:border-top-color={data.accent}
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
<Handle type="source" position={Position.Right} />
