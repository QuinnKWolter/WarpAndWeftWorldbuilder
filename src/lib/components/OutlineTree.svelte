<script lang="ts">
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { ChevronRight, GripVertical, Info } from '@lucide/svelte';
  import FolderIcon from './FolderIcon.svelte';
  import { presentation } from '#lib/domain/presentation';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Unit, Selection } from '#lib/domain/model';
  import { siblings, placeUnit } from '#lib/domain/order';
  import { organization, writeOrganization } from '#lib/domain/organization';
  import { motionDuration } from '#lib/application/motion';
  let {
    ws,
    query = '',
    oninspect,
    onsummary
  }: {
    ws: Workspace;
    query?: string;
    oninspect: (selection: Selection) => void;
    onsummary: (selection: Selection) => void;
  } = $props();
  const collapsed = $derived(ws.bundle ? organization(ws.bundle).collapsedUnits : []);
  let over = $state('');
  let dragging = $state('');
  function children(parent: string | null): Unit[] {
    return ws.bundle ? siblings(ws.bundle, parent) : [];
  }
  function matches(unit: Unit): boolean {
    return (
      !query ||
      `${unit.title} ${unit.synopsis}`.toLowerCase().includes(query.toLowerCase()) ||
      children(unit.id).some(matches)
    );
  }
  function toggle(id: string) {
    ws.mutate(
      (b) => {
        const o = organization(b);
        o.collapsedUnits = o.collapsedUnits.includes(id)
          ? o.collapsedUnits.filter((key) => key !== id)
          : [...o.collapsedUnits, id];
        writeOrganization(b, o);
      },
      'Outline view updated',
      false
    );
  }
  function drop(event: DragEvent, unit: Unit | null) {
    event.preventDefault();
    event.stopPropagation();
    const id = event.dataTransfer?.getData('storygraph/unit');
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (event.clientY - box.top) / box.height;
    const position = unit ? (ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside') : 'root';
    over = '';
    dragging = '';
    if (!id || id === unit?.id) return;
    ws.mutate((b) => {
      const parent = position === 'inside' && unit ? unit.id : (unit?.parentId ?? null);
      const list = siblings(b, parent);
      const before =
        !unit || position === 'inside'
          ? null
          : position === 'after'
            ? (list[list.findIndex((u) => u.id === unit.id) + 1]?.id ?? null)
            : unit.id;
      placeUnit(
        b,
        id,
        parent,
        before === id ? (list[list.findIndex((u) => u.id === id) + 1]?.id ?? null) : before
      );
      const o = organization(b);
      o.collapsedUnits = o.collapsedUnits.filter((key) => key !== parent);
      writeOrganization(b, o);
    }, 'Narrative reordered. Story chronology preserved.');
  }
  function keys(event: KeyboardEvent, unit: Unit) {
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      if (!ws.bundle) return;
      const list = siblings(ws.bundle, unit.parentId);
      const index = list.findIndex((u) => u.id === unit.id);
      if (
        (event.key === 'ArrowUp' && index === 0) ||
        (event.key === 'ArrowDown' && index === list.length - 1)
      )
        return;
      ws.mutate(
        (b) =>
          placeUnit(
            b,
            unit.id,
            unit.parentId,
            event.key === 'ArrowUp' ? list[index - 1].id : (list[index + 2]?.id ?? null)
          ),
        'Moment reordered'
      );
    }
  }
</script>

{#snippet tree(parent: string | null)}
  {#each children(parent).filter(matches) as unit (unit.id)}
    {@const nested = children(unit.id).length > 0}
    {@const style = presentation(unit.metadata)}
    <div class="outline-branch" animate:flip={{ duration: motionDuration(320) }}>
      <div
        class="outline-row"
        class:drop-before={over === `before:${unit.id}`}
        class:drop-after={over === `after:${unit.id}`}
        class:drop-inside={over === `inside:${unit.id}`}
        class:is-dragging={dragging === unit.id}
        role="group"
        aria-label={unit.title}
        ondragover={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientY - box.top) / box.height;
          over = `${ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside'}:${unit.id}`;
        }}
        ondragleave={() => (over = '')}
        ondrop={(event) => drop(event, unit)}
      >
        {#if nested}<button
            class="outline-toggle icon-button"
            aria-label={`${collapsed.includes(unit.id) ? 'Expand' : 'Collapse'} ${unit.title}`}
            aria-expanded={!collapsed.includes(unit.id) || !!query}
            onclick={() => toggle(unit.id)}
            ><ChevronRight
              class={!collapsed.includes(unit.id) || !!query ? 'rotated' : ''}
              size={13}
            /></button
          >{:else}<span class="outline-spacer"></span>{/if}
        <button
          class="shelf-item outline-item"
          class:active={ws.selection?.id === unit.id}
          draggable="true"
          ondragstart={(e) => {
            dragging = unit.id;
            e.dataTransfer?.setData('storygraph/unit', unit.id);
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          }}
          ondragend={() => {
            dragging = '';
            over = '';
          }}
          onclick={() => oninspect({ kind: 'unit', id: unit.id })}
          ondblclick={() => onsummary({ kind: 'unit', id: unit.id })}
          onkeydown={(e) => {
            keys(e, unit);
            if (e.altKey && e.key === 'Enter') onsummary({ kind: 'unit', id: unit.id });
          }}
          title="Drag upper/lower edge to reorder · Drag center to nest · Double-click for summary"
          ><GripVertical class="drag-grip" size={11} /><span style:color={style.color}
            ><FolderIcon name={style.icon} size={14} /></span
          ><span
            ><strong>{unit.title}</strong><small
              >{unit.type}{unit.timeLabel ? ` · ${unit.timeLabel}` : ''}</small
            ></span
          ></button
        >
        <button
          class="item-summary icon-button"
          aria-label={`Summary of ${unit.title}`}
          onclick={() => onsummary({ kind: 'unit', id: unit.id })}><Info size={13} /></button
        >
        {#if over === `inside:${unit.id}`}<span class="drop-caption">Move inside {unit.title}</span
          >{/if}
      </div>
      {#if nested && (!collapsed.includes(unit.id) || query)}<div
          class="outline-children"
          transition:slide={{ duration: motionDuration(320) }}
        >
          {@render tree(unit.id)}
        </div>{/if}
    </div>
  {/each}
{/snippet}
<div class="outline-tree" role="group" aria-label="Narrative outline">
  {@render tree(null)}
  <div
    class="collection-root-drop"
    role="group"
    aria-label="Move moment to story root"
    ondragover={(e) => {
      e.preventDefault();
      over = 'root';
    }}
    ondrop={(e) => drop(e, null)}
  >
    Drop here for story root
  </div>
</div>
