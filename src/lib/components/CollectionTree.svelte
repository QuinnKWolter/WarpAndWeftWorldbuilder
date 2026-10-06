<script lang="ts">
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { ChevronRight, Plus, Pencil, GripVertical, Info, Layers } from '@lucide/svelte';
  import FolderIcon from './FolderIcon.svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Selection } from '#lib/domain/model';
  import {
    organization,
    writeOrganization,
    moveShelfObject,
    moveFolder,
    type FolderSection,
    type StoryFolder
  } from '#lib/domain/organization';
  import { motionDuration } from '#lib/application/motion';
  export type ShelfItem = {
    id: string;
    name: string;
    detail: string;
    summary: string;
    kind: Selection['kind'];
    color?: string;
    icon?: StoryFolder['icon'];
  };
  let {
    ws,
    section,
    items,
    query = '',
    sort = 'manual',
    onmanual = () => {},
    onsummary,
    oninspect,
    onfolder
  }: {
    ws: Workspace;
    section: FolderSection;
    items: ShelfItem[];
    query?: string;
    sort?: string;
    onmanual?: () => void;
    onsummary: (selection: Selection) => void;
    oninspect: (selection: Selection) => void;
    onfolder: (id: string | null, section: FolderSection, parentId?: string | null) => void;
  } = $props();
  const o = $derived(
    ws.bundle ? organization(ws.bundle) : { folders: [], placements: [], collapsedUnits: [] }
  );
  let over = $state('');
  let dragging = $state('');
  const matches = (item: ShelfItem) =>
    `${item.name} ${item.detail} ${item.summary}`.toLowerCase().includes(query.toLowerCase());
  function members(parentId: string | null) {
    const placement = new Map(o.placements.map((p) => [p.objectId, p]));
    return items
      .filter((item) => (placement.get(item.id)?.folderId ?? null) === parentId && matches(item))
      .toSorted((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name)
          : sort === 'facet'
            ? a.detail.localeCompare(b.detail)
            : (placement.get(a.id)?.rank ?? items.findIndex((i) => i.id === a.id) * 1024) -
              (placement.get(b.id)?.rank ?? items.findIndex((i) => i.id === b.id) * 1024)
      );
  }
  function folders(parentId: string | null): StoryFolder[] {
    return o.folders
      .filter((f) => f.parentId === parentId && f.section === section)
      .toSorted((a, b) => a.rank - b.rank);
  }
  function folderMatches(folder: StoryFolder): boolean {
    return (
      !query ||
      folder.name.toLowerCase().includes(query.toLowerCase()) ||
      members(folder.id).length > 0 ||
      folders(folder.id).some(folderMatches)
    );
  }
  function count(folderId: string): number {
    return (
      items.filter(
        (item) => o.placements.find((p) => p.objectId === item.id)?.folderId === folderId
      ).length + folders(folderId).reduce((total, child) => total + count(child.id), 0)
    );
  }
  function toggle(id: string) {
    ws.mutate(
      (b) => {
        const value = organization(b);
        const folder = value.folders.find((f) => f.id === id);
        if (folder) folder.collapsed = !folder.collapsed;
        writeOrganization(b, value);
      },
      'Folder view updated',
      false
    );
  }
  function begin(event: DragEvent, id: string, folder = false) {
    dragging = id;
    if (folder) event.dataTransfer?.setData('storygraph/folder', id);
    else {
      const kind = items.find((item) => item.id === id)?.kind;
      if (kind) event.dataTransfer?.setData(`storygraph/${kind}`, id);
    }
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }
  function drop(
    event: DragEvent,
    parent: string | null,
    before: string | null = null,
    beforeFolder: string | null = null
  ) {
    event.preventDefault();
    event.stopPropagation();
    over = '';
    dragging = '';
    const folderId = event.dataTransfer?.getData('storygraph/folder');
    const id = event.dataTransfer?.getData(
      section === 'entities'
        ? 'storygraph/entity'
        : section === 'threads'
          ? 'storygraph/thread'
          : 'storygraph/unit'
    );
    if (folderId && folderId !== parent && folderId !== beforeFolder)
      ws.mutate((b) => moveFolder(b, folderId, parent, beforeFolder), 'Folder moved');
    else if (id && id !== before) {
      onmanual();
      ws.mutate((b) => moveShelfObject(b, id, parent, before), 'Item moved. Undo is available.');
    }
  }
  function keyboard(event: KeyboardEvent, item: ShelfItem, parent: string | null) {
    if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const list = members(parent);
    const index = list.findIndex((i) => i.id === item.id);
    if (
      (event.key === 'ArrowUp' && index === 0) ||
      (event.key === 'ArrowDown' && index === list.length - 1)
    )
      return;
    onmanual();
    ws.mutate(
      (b) =>
        moveShelfObject(
          b,
          item.id,
          parent,
          event.key === 'ArrowUp' ? (list[index - 1]?.id ?? null) : (list[index + 2]?.id ?? null)
        ),
      'Item reordered'
    );
  }
</script>

{#snippet tree(parent: string | null)}
  {#each folders(parent).filter(folderMatches) as folder (folder.id)}
    <div class="collection-folder" animate:flip={{ duration: motionDuration(320) }}>
      <div
        class="folder-row"
        class:drop-inside={over === folder.id}
        class:drop-before={over === `before:${folder.id}`}
        class:is-dragging={dragging === folder.id}
        style:--folder-color={folder.color}
        role="group"
        aria-label={`${folder.name} folder`}
        draggable="true"
        ondragstart={(e) => begin(e, folder.id, true)}
        ondragend={() => {
          dragging = '';
          over = '';
        }}
        ondragover={(e) => {
          e.preventDefault();
          e.stopPropagation();
          over =
            e.clientY - e.currentTarget.getBoundingClientRect().top < 9
              ? `before:${folder.id}`
              : folder.id;
        }}
        ondragleave={() => (over = '')}
        ondrop={(e) => {
          const before = e.clientY - e.currentTarget.getBoundingClientRect().top < 9;
          drop(e, before ? parent : folder.id, null, before ? folder.id : null);
        }}
      >
        <button
          class="folder-toggle"
          aria-expanded={!folder.collapsed || !!query}
          onclick={() => toggle(folder.id)}
          ondblclick={() => onfolder(folder.id, section)}
          ><ChevronRight
            class={!folder.collapsed || !!query ? 'rotated' : ''}
            size={13}
          /><FolderIcon name={folder.icon} /><strong>{folder.name}</strong><span
            >{count(folder.id)}</span
          ></button
        >
        <button
          class="icon-button folder-action"
          aria-label={`New folder inside ${folder.name}`}
          onclick={() => onfolder(null, section, folder.id)}><Plus size={12} /></button
        ><button
          class="icon-button folder-action"
          aria-label={`Edit folder ${folder.name}`}
          onclick={() => onfolder(folder.id, section)}><Pencil size={12} /></button
        >
      </div>
      {#if !folder.collapsed || query}<div
          class="folder-contents"
          transition:slide={{ duration: motionDuration(320) }}
          inert={folder.collapsed && !query}
        >
          {@render tree(folder.id)}{#if !members(folder.id).length && !folders(folder.id).length}<p
              class="folder-empty"
              role="group"
              aria-label={`Drop into ${folder.name}`}
              ondragover={(e) => e.preventDefault()}
              ondrop={(e) => drop(e, folder.id)}
            >
              Drop an item here
            </p>{/if}
        </div>{/if}
    </div>
  {/each}
  {#each members(parent) as item (item.id)}
    <div
      class="collection-item"
      class:drop-before={over === item.id}
      class:is-dragging={dragging === item.id}
      animate:flip={{ duration: motionDuration(320) }}
      role="group"
      aria-label={item.name}
      ondragover={(e) => {
        e.preventDefault();
        e.stopPropagation();
        over = item.id;
      }}
      ondragleave={() => (over = '')}
      ondrop={(e) => drop(e, parent, item.id)}
    >
      <button
        class="shelf-item"
        class:active={ws.selection?.id === item.id}
        draggable="true"
        ondragstart={(e) => begin(e, item.id)}
        ondragend={() => {
          dragging = '';
          over = '';
        }}
        onclick={() => oninspect({ kind: item.kind, id: item.id })}
        ondblclick={() => onsummary({ kind: item.kind, id: item.id })}
        onkeydown={(e) => {
          keyboard(e, item, parent);
          if (e.key === 'Enter' && e.altKey) onsummary({ kind: item.kind, id: item.id });
        }}
        title="Click to inspect · Double-click for summary · Alt+↑/↓ to reorder"
      >
        <GripVertical class="drag-grip" size={11} /><span
          class="entity-icon"
          style:color={item.color}
          >{#if item.kind === 'unit'}<FolderIcon
              name={item.icon ?? 'book'}
              size={14}
            />{:else if item.kind === 'thread'}<Layers size={14} />{:else}<FolderIcon
              name={item.icon ?? 'users'}
              size={14}
            />{/if}</span
        ><span><strong>{item.name}</strong><small>{item.detail}</small></span>
      </button><button
        class="item-summary icon-button"
        aria-label={`Summary of ${item.name}`}
        onclick={() => onsummary({ kind: item.kind, id: item.id })}><Info size={13} /></button
      >
    </div>
  {/each}
{/snippet}
<div
  class="collection-tree"
  role="group"
  aria-label={section === 'entities'
    ? 'Entity folders and items'
    : section === 'threads'
      ? 'Plot thread folders and items'
      : 'Idea folders and items'}
>
  {@render tree(null)}
  <div
    class="collection-root-drop"
    class:drop-inside={over === 'root'}
    role="group"
    aria-label={`Move to ${section} top level`}
    ondragover={(e) => {
      e.preventDefault();
      over = 'root';
    }}
    ondragleave={() => (over = '')}
    ondrop={(e) => drop(e, null)}
  >
    {dragging ? 'Drop here to move to top level' : 'Drag to organize · Double-click to explore'}
  </div>
</div>
