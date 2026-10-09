<script lang="ts">
  import { Search, Plus, FolderPlus, Maximize2, Minimize2 } from '@lucide/svelte';
  import { fly } from 'svelte/transition';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Selection } from '#lib/domain/model';
  import type { CreateKind } from './CreateDialog.svelte';
  import type { FolderSection } from '#lib/domain/organization';
  import { motionDuration } from '#lib/application/motion';
  import { dragScroll } from '#lib/application/interactions';
  import CollectionTree from './CollectionTree.svelte';
  import OutlineTree from './OutlineTree.svelte';
  import { facetIcon, presentation } from '#lib/domain/presentation';
  let {
    ws,
    oncreate,
    onbulkadd,
    oninspect,
    onsummary,
    onfolder,
    onfocus,
    expanded = false
  }: {
    ws: Workspace;
    oncreate: (kind: CreateKind) => void;
    onbulkadd: () => void;
    onfocus: () => void;
    expanded?: boolean;
    oninspect: (selection: Selection) => void;
    onsummary: (selection: Selection) => void;
    onfolder: (id: string | null, section: FolderSection, parentId?: string | null) => void;
  } = $props();
  let tab = $state('world');
  let query = $state('');
  let sort = $state('manual');
  const entities = $derived(
    (ws.bundle?.entities ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      detail: e.facets.join(' · '),
      summary: e.summary + ' ' + e.description,
      kind: 'entity' as const,
      ...presentation(e.metadata, facetIcon(e.facets))
    }))
  );
  const threads = $derived(
    (ws.bundle?.threads ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      detail: 'Plot thread',
      summary: t.description,
      kind: 'thread' as const,
      ...presentation(t.metadata, 'flag', t.color)
    }))
  );
  const ideas = $derived(
    (ws.bundle?.units.filter((u) => u.unplaced || u.unresolved) ?? []).map((u) => ({
      id: u.id,
      name: u.title,
      detail: u.unplaced ? 'Unplaced idea' : 'Unresolved moment',
      summary: u.synopsis,
      kind: 'unit' as const,
      ...presentation(u.metadata)
    }))
  );
</script>

<aside class="shelf" aria-label="Entities and outline">
  <header class="panel-header">
    <span class="eyebrow">WORLD ENTITIES</span>
    <div>
      <button
        class="icon-button"
        aria-label={expanded ? 'Exit entities fullscreen' : 'Fullscreen entities'}
        onclick={onfocus}
        >{#if expanded}<Minimize2 size={16} />{:else}<Maximize2 size={16} />{/if}</button
      ><button
        class="icon-button"
        aria-label="Create world entity"
        onclick={() => oncreate('entity')}><Plus size={17} /></button
      >
    </div>
  </header>
  <div class="shelf-search">
    <Search size={15} /><input
      aria-label="Search entities and outline"
      bind:value={query}
      placeholder="Search names, notes, facets…"
    />
  </div>
  <div class="shelf-tabs" role="tablist" aria-label="Entities and outline sections">
    {#each ['world', 'outline', 'ideas'] as t (t)}<button
        role="tab"
        aria-selected={tab === t}
        class:active={tab === t}
        onclick={() => (tab = t)}>{t === 'world' ? 'Entities' : t}</button
      >{/each}
  </div>
  <div class="shelf-scroll" use:dragScroll>
    {#key tab}<div class="shelf-tab-content" in:fly={{ y: 10, duration: motionDuration(260) }}>
        {#if tab === 'world'}
          <div class="entity-list-tools">
            <select class="shelf-sort small" aria-label="Sort entities" bind:value={sort}
              ><option value="manual">Your order</option><option value="name">A–Z</option><option
                value="facet">By facet</option
              ></select
            ><button class="text-button" onclick={onbulkadd}><Plus size={13} /> Bulk add</button>
          </div>
          <div class="collection-heading">
            <span class="eyebrow">ENTITIES</span><button
              class="icon-button"
              aria-label="New entity folder"
              onclick={() => onfolder(null, 'entities')}><FolderPlus size={15} /></button
            >
          </div>
          <CollectionTree
            {ws}
            section="entities"
            items={entities}
            {query}
            {sort}
            onmanual={() => (sort = 'manual')}
            {oninspect}
            {onsummary}
            {onfolder}
          />
          <div class="collection-heading">
            <span class="eyebrow">PLOT THREADS</span>
            <div>
              <button
                class="icon-button"
                aria-label="New plot thread folder"
                onclick={() => onfolder(null, 'threads')}><FolderPlus size={14} /></button
              ><button
                class="icon-button"
                aria-label="Create plot thread"
                onclick={() => oncreate('thread')}><Plus size={14} /></button
              >
            </div>
          </div>
          <CollectionTree
            {ws}
            section="threads"
            items={threads}
            {query}
            {oninspect}
            {onsummary}
            {onfolder}
          />
        {:else if tab === 'outline'}
          <p class="field-help shelf-hint">
            Drag an edge to reorder; drag the center to nest. Story time stays put.
          </p>
          <OutlineTree {ws} {query} {oninspect} {onsummary} />
          <button class="text-button shelf-add" onclick={() => oncreate('unit')}
            ><Plus size={14} /> Add a moment</button
          >
        {:else}
          <div class="collection-heading">
            <span class="eyebrow">POSSIBILITIES</span><button
              class="icon-button"
              aria-label="New idea folder"
              onclick={() => onfolder(null, 'ideas')}><FolderPlus size={15} /></button
            >
          </div>
          <p class="field-help shelf-hint">Ideas can live here until you know where they belong.</p>
          <CollectionTree
            {ws}
            section="ideas"
            items={ideas}
            {query}
            {oninspect}
            {onsummary}
            {onfolder}
          />
          <button class="text-button shelf-add" onclick={() => oncreate('placeholder')}
            ><Plus size={14} /> Capture an unknown</button
          >
        {/if}
      </div>{/key}
  </div>
  <footer class="shelf-footer">
    <span class="seed-mark">✧</span>
    <p>Loose threads welcome.<br /><span>Your world grows at your pace.</span></p>
  </footer>
</aside>
