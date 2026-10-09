<script lang="ts">
  import { onMount } from 'svelte';
  import { Star, Search, ChevronDown } from '@lucide/svelte';
  import { iconCatalog, type IconName } from '#lib/domain/icons';
  import FolderIcon from './FolderIcon.svelte';
  import { dismissMenu } from '#lib/application/interactions';
  let {
    value = 'folder',
    label = 'Icon',
    onchange
  }: { value?: IconName; label?: string; onchange: (icon: IconName) => void } = $props();
  let menu: HTMLDetailsElement;
  let query = $state('');
  let category = $state('All');
  let favorites = $state<IconName[]>([]);
  const categories = ['All', 'Favorites', ...new Set(iconCatalog.map((i) => i.category))];
  const chosen = $derived(iconCatalog.find((i) => i.id === value));
  const filtered = $derived(
    iconCatalog.filter(
      (i) =>
        (category === 'All' ||
          (category === 'Favorites' ? favorites.includes(i.id) : i.category === category)) &&
        (i.label + ' ' + i.id + ' ' + i.category).toLowerCase().includes(query.toLowerCase())
    )
  );
  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('warpweft:favorite-icons') ?? '[]');
      if (Array.isArray(saved))
        favorites = saved.filter((id: IconName) => iconCatalog.some((i) => i.id === id));
    } catch {
      favorites = [];
    }
  });
  function favorite(id: IconName) {
    favorites = favorites.includes(id) ? favorites.filter((i) => i !== id) : [...favorites, id];
    try {
      localStorage.setItem('warpweft:favorite-icons', JSON.stringify(favorites));
    } catch {
      /* Favorites remain available in this session. */
    }
  }
</script>

<div class="icon-picker">
  <span class="field-label">{label}</span>
  <details bind:this={menu} use:dismissMenu={{ closeOnAction: false }}>
    <summary aria-label={label}
      ><FolderIcon name={value} size={20} /><span>{chosen?.label ?? 'Folder'}</span><ChevronDown
        size={14}
      /></summary
    >
    <div class="icon-picker-popover">
      <label class="picker-search"
        ><Search size={15} /><input
          aria-label="Search icons"
          placeholder="Search icons, names, categories…"
          bind:value={query}
        /></label
      >
      <div class="icon-categories" role="group" aria-label="Icon categories">
        {#each categories as c (c)}<button
            type="button"
            class:active={category === c}
            aria-pressed={category === c}
            onclick={() => (category = c)}>{c}</button
          >{/each}
      </div>
      <span class="small muted">{filtered.length} icons · star to save a favorite</span>
      <div class="icon-grid">
        {#each filtered as icon (icon.id)}
          <div class="icon-choice">
            <button
              type="button"
              class:active={value === icon.id}
              aria-pressed={value === icon.id}
              aria-label={icon.label}
              title={icon.label}
              onclick={() => {
                onchange(icon.id);
                menu.open = false;
              }}><FolderIcon name={icon.id} size={23} /><span>{icon.label}</span></button
            >
            <button
              type="button"
              class="icon-favorite"
              class:active={favorites.includes(icon.id)}
              aria-label={`${favorites.includes(icon.id) ? 'Unfavorite' : 'Favorite'} ${icon.label}`}
              aria-pressed={favorites.includes(icon.id)}
              onclick={() => favorite(icon.id)}><Star size={11} /></button
            >
          </div>
        {:else}<p class="field-help">No icons match. Try another category or search.</p>{/each}
      </div>
    </div>
  </details>
</div>
