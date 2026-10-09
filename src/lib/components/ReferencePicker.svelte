<script lang="ts">
  import { Search } from '@lucide/svelte';
  import Modal from './Modal.svelte';
  import type { Bundle, Selection } from '#lib/domain/model';
  import { storyObjects } from '#lib/domain/manuscript';
  let {
    bundle,
    onchoose,
    onclose
  }: {
    bundle: Bundle;
    onchoose: (object: { id: string; kind: Selection['kind']; label: string }) => void;
    onclose: () => void;
  } = $props();
  let query = $state('');
  let category = $state('all');
  const kinds = ['all', 'unit', 'entity', 'event', 'relationship', 'thread'];
  const matches = $derived(
    storyObjects(bundle).filter(
      (o) =>
        (category === 'all' || category === o.kind) &&
        (o.label + ' ' + o.summary).toLowerCase().includes(query.toLowerCase())
    )
  );
</script>

<Modal title="Insert a story placeholder" {onclose} wide>
  <div class="dialog-form">
    <p class="field-help">
      Leave a linked reminder at your cursor. It can point to any moment, entity, event,
      relationship, or thread. Expand reminders into draft text later, or hide them to read your
      prose.
    </p>
    <label class="picker-search"
      ><Search size={17} /><input
        aria-label="Search story placeholders"
        placeholder="Search your entire world…"
        bind:value={query}
      /></label
    >
    <div class="icon-categories" role="group" aria-label="Placeholder categories">
      {#each kinds as kind (kind)}<button
          type="button"
          class:active={category === kind}
          aria-pressed={category === kind}
          onclick={() => (category = kind)}
          >{kind === 'all'
            ? 'All'
            : kind === 'unit'
              ? 'Moments'
              : kind === 'entity'
                ? 'Entities'
                : kind === 'relationship'
                  ? 'Relationships'
                  : kind === 'event'
                    ? 'Events'
                    : 'Threads'}</button
        >{/each}
    </div>
    <div class="reference-results">
      {#each matches.slice(0, 100) as object (object.id)}<button
          type="button"
          class="reference-result"
          onclick={() => onchoose(object)}
          ><strong>{object.label}</strong><span class="eyebrow">{object.kind}</span>
          <p>{object.summary || 'A possibility waiting to be written.'}</p></button
        >{:else}<p class="field-help">
          No matches. Create story objects in the graph first.
        </p>{/each}
    </div>
    {#if matches.length > 100}<p class="field-help">
        Showing the first 100 matches. Search to narrow the list.
      </p>{/if}
  </div>
</Modal>
