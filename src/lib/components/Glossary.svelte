<script lang="ts">
  import Modal from './Modal.svelte';
  import { glossaryEntries } from '#lib/domain/glossary';
  let { onclose }: { onclose: () => void } = $props();
  let query = $state('');
  let category = $state('All');
  const categories = ['All', ...new Set(glossaryEntries.map((e) => e.category))];
  const matches = $derived(
    glossaryEntries
      .filter(
        (e) =>
          (category === 'All' || category === e.category) &&
          (e.term + ' ' + e.definition).toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => a.term.localeCompare(b.term))
  );
</script>

<Modal title="A glossary for your world" {onclose} wide
  ><div class="dialog-form">
    <p class="field-help">
      Plain-language definitions for every system in Warp & Weft Worldbuilder. Start with entities,
      moments, facets, threads, and story time; the rest can grow with your story.
    </p>
    <label
      >Find a term<input
        aria-label="Search glossary"
        bind:value={query}
        placeholder="Facets, anchors, manuscripts…"
      /></label
    >
    <div class="icon-categories" role="group" aria-label="Glossary categories">
      {#each categories as c (c)}<button
          class:active={category === c}
          aria-pressed={category === c}
          onclick={() => (category = c)}>{c}</button
        >{/each}
    </div>
    <p class="small muted">{matches.length} terms</p>
    <dl class="glossary-list">
      {#each matches as entry (entry.term)}<div>
          <dt>{entry.term}<span class="eyebrow">{entry.category}</span></dt>
          <dd>{entry.definition}</dd>
        </div>{:else}<p>No matching terms. Try a broader search.</p>{/each}
    </dl>
  </div></Modal
>
