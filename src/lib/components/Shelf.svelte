<script lang="ts">
  import {
    Search,
    Plus,
    UserRound,
    MapPin,
    Diamond,
    Layers,
    BookOpen,
    CircleHelp,
    ChevronRight
  } from '@lucide/svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { CreateKind } from './CreateDialog.svelte';
  import { narrativeOrder, breadcrumbs, placeUnit } from '#lib/domain/order';
  let { ws, oncreate }: { ws: Workspace; oncreate: (kind: CreateKind) => void } = $props();
  let tab = $state('world');
  let query = $state('');
  let sort = $state('name');
  const entities = $derived(
    (ws.bundle?.entities ?? [])
      .filter((e) =>
        `${e.name} ${e.summary} ${e.description} ${e.facets.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .toSorted((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name)
          : a.facets.join().localeCompare(b.facets.join())
      )
  );
  const units = $derived(
    ws.bundle
      ? narrativeOrder(ws.bundle).filter((u) =>
          `${u.title} ${u.synopsis}`.toLowerCase().includes(query.toLowerCase())
        )
      : []
  );
  function reorder(event: DragEvent, beforeId: string) {
    event.preventDefault();
    const id = event.dataTransfer?.getData('storygraph/unit');
    const before = ws.bundle?.units.find((u) => u.id === beforeId);
    if (id && before)
      ws.mutate(
        (b) => placeUnit(b, id, before.parentId, before.id),
        'Scene reordered. Continuity checks updated.'
      );
  }
</script>

<aside class="shelf" aria-label="Story shelf">
  <header class="panel-header">
    <span class="eyebrow">YOUR STORY SHELF</span><button
      class="icon-button"
      aria-label="Create world entity"
      onclick={() => oncreate('entity')}><Plus size={17} /></button
    >
  </header>
  <div class="shelf-search">
    <Search size={15} /><input
      aria-label="Search story shelf"
      bind:value={query}
      placeholder="Find a little thing…"
    />
  </div>
  <div class="shelf-tabs" role="tablist" aria-label="Shelf sections">
    {#each ['world', 'outline', 'ideas'] as t (t)}<button
        role="tab"
        aria-selected={tab === t}
        class:active={tab === t}
        onclick={() => (tab = t)}>{t}</button
      >{/each}
  </div>
  <div class="shelf-scroll">
    {#if tab === 'world'}
      <select class="shelf-sort small" aria-label="Sort world shelf" bind:value={sort}
        ><option value="name">A–Z</option><option value="facet">By facet</option></select
      >
      {#each [{ facet: 'character', label: 'Characters', icon: UserRound }, { facet: 'location', label: 'Places', icon: MapPin }, { facet: 'item', label: 'Objects', icon: Diamond }, { facet: 'other', label: 'The rest of the world', icon: Layers }] as group (group.facet)}
        {@const items = entities.filter((e) =>
          group.facet === 'other'
            ? !e.facets.some((f) => ['character', 'location', 'item'].includes(f))
            : e.facets.includes(group.facet)
        )}
        <div class="shelf-group">
          <div class="shelf-heading"><span>{group.label}</span><span>{items.length}</span></div>
          {#each items as entity (entity.id)}<button
              class="shelf-item"
              class:active={ws.selection?.id === entity.id}
              draggable="true"
              ondragstart={(e) => e.dataTransfer?.setData('storygraph/entity', entity.id)}
              onclick={() => ws.select({ kind: 'entity', id: entity.id })}
              ><span class="entity-icon"><group.icon size={15} /></span><span
                ><strong>{entity.name}</strong><small>{entity.facets.join(' · ')}</small></span
              >{#if entity.unresolved}<CircleHelp size={13} />{/if}</button
            >{/each}
        </div>
      {/each}
      <div class="shelf-group">
        <div class="shelf-heading">
          <span>Plot threads</span><button
            class="icon-button"
            aria-label="Create plot thread"
            onclick={() => oncreate('thread')}><Plus size={14} /></button
          >
        </div>
        {#each ws.bundle?.threads.filter((t) => `${t.name} ${t.description}`
            .toLowerCase()
            .includes(query.toLowerCase())) ?? [] as t (typeof t === 'string' ? t : t.id)}<button
            class="shelf-item"
            onclick={() => ws.select({ kind: 'thread', id: t.id })}
            ><i class="thread-dot" style:background={t.color}></i><span
              ><strong>{t.name}</strong><small>Follow a storyline</small></span
            ></button
          >{/each}
      </div>
    {:else if tab === 'outline'}
      <p class="field-help shelf-hint">Reading order. Drag a moment above another to reorder it.</p>
      {#each units as u (u.id)}<div
          class="outline-drop"
          ondragover={(e) => e.preventDefault()}
          ondrop={(e) => reorder(e, u.id)}
          role="group"
          aria-label={u.title}
        >
          <button
            class="shelf-item outline-item"
            style:padding-left={`${12 + (ws.bundle ? breadcrumbs(ws.bundle, u.id).length - 1 : 0) * 12}px`}
            class:active={ws.selection?.id === u.id}
            draggable="true"
            ondragstart={(e) => e.dataTransfer?.setData('storygraph/unit', u.id)}
            onclick={() => ws.navigate({ kind: 'unit', id: u.id })}
            ><BookOpen size={14} /><span
              ><strong>{u.title}</strong><small
                >{u.type} {u.timeLabel ? `· ${u.timeLabel}` : ''}</small
              ></span
            >{#if ws.bundle?.units.some((v) => v.parentId === u.id)}<ChevronRight
                size={13}
              />{/if}</button
          >
        </div>{/each}
      <button class="text-button shelf-add" onclick={() => oncreate('unit')}
        ><Plus size={14} /> Add a moment</button
      >
    {:else}
      <p class="field-help shelf-hint">Ideas can live here until you know where they belong.</p>
      {#each ws.bundle?.units.filter((u) => (u.unplaced || u.unresolved) && `${u.title} ${u.synopsis}`
            .toLowerCase()
            .includes(query.toLowerCase())) ?? [] as u (u.id)}<button
          class="shelf-item"
          draggable="true"
          ondragstart={(e) => e.dataTransfer?.setData('storygraph/unit', u.id)}
          onclick={() => ws.select({ kind: 'unit', id: u.id })}
          ><CircleHelp size={16} /><span
            ><strong>{u.title}</strong><small
              >{u.unplaced ? 'Unplaced idea' : 'Unresolved moment'}</small
            ></span
          ></button
        >{/each}
      <button class="text-button shelf-add" onclick={() => oncreate('placeholder')}
        ><Plus size={14} /> Capture an unknown</button
      >
    {/if}
  </div>
  <footer class="shelf-footer">
    <span class="seed-mark">✧</span>
    <p>Loose threads welcome.<br /><span>Your world grows at your pace.</span></p>
  </footer>
</aside>
