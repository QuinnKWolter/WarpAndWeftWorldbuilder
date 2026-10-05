<script lang="ts">
  import { base } from '#lib/domain/model';
  import type { Workspace } from '#lib/application/workspace.svelte';
  let { ws, objectId }: { ws: Workspace; objectId: string } = $props();
</script>

<div class="section-heading"><span>THREADS</span></div>
{#each ws.bundle?.threads ?? [] as t (t.id)}
  <label class="check-label"
    ><input
      type="checkbox"
      checked={ws.bundle?.threadMemberships.some(
        (m) => m.threadId === t.id && m.objectId === objectId
      )}
      onchange={(e) =>
        ws.mutate((b) => {
          if (e.currentTarget.checked)
            b.threadMemberships.push({ ...base(), threadId: t.id, objectId });
          else
            b.threadMemberships = b.threadMemberships.filter(
              (m) => m.threadId !== t.id || m.objectId !== objectId
            );
        }, 'Thread membership updated')}
    />
    <i class="thread-dot" style:background={t.color}></i>{t.name}</label
  >
{/each}
{#if !ws.bundle?.threads.length}<p class="field-help">
    Create a thread from the entities panel to follow this object across the story.
  </p>{/if}
