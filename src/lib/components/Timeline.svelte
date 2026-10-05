<script lang="ts">
  import { ChevronLeft, ChevronRight, Clock3 } from '@lucide/svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import { narrativeOrder, storyOrder } from '#lib/domain/order';
  import { tick } from 'svelte';
  let { ws }: { ws: Workspace } = $props();
  let mode = $state('story');
  let events = $state(false);
  let rail: HTMLDivElement;
  const units = $derived(
    ws.bundle
      ? mode === 'story'
        ? storyOrder(ws.bundle)
        : narrativeOrder(ws.bundle).filter((u) => u.storyTime !== null)
      : []
  );
  const points = $derived(
    [
      ...units.map((u) => ({
        id: u.id,
        title: u.title,
        label: u.timeLabel || `Point ${u.storyTime}`,
        time: u.storyTime ?? 0,
        order: Infinity,
        kind: 'unit' as const
      })),
      ...(mode === 'story' && events
        ? (ws.bundle?.events.map((e) => ({
            id: e.id,
            title: e.title,
            label: `Event · ${e.storyTime}`,
            time: e.storyTime,
            order: e.order,
            kind: 'event' as const
          })) ?? [])
        : [])
    ].sort((a, b) =>
      mode === 'story' ? a.time - b.time || (a.order === b.order ? 0 : a.order - b.order) : 0
    )
  );
  const index = $derived(points.findIndex((u) => u.time === ws.at && u.order === ws.atOrder));
  function step(direction: number) {
    const next = points[Math.max(0, Math.min(points.length - 1, index + direction))];
    if (next) {
      ws.at = next.time;
      ws.atOrder = next.order;
    }
  }
  function jump() {
    const unit = ws.bundle?.units.find((u) => u.id === ws.selection?.id);
    const event = ws.bundle?.events.find((e) => e.id === ws.selection?.id);
    if (event) {
      events = true;
      mode = 'story';
      ws.at = event.storyTime;
      ws.atOrder = event.order;
    } else if (unit?.storyTime !== null && unit?.storyTime !== undefined) {
      ws.at = unit.storyTime;
      ws.atOrder = Infinity;
    }
  }
  function keys(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      step(e.key === 'ArrowLeft' ? -1 : 1);
    }
  }
  $effect(() => {
    const selected = points.find((p) => p.time === ws.at && p.order === ws.atOrder);
    if (selected)
      void tick().then(() =>
        rail
          ?.querySelector(`[data-point-id="${selected.id}"]`)
          ?.scrollIntoView({ block: 'nearest', inline: 'center' })
      );
  });
</script>

<section class="timeline" aria-label="Story timeline">
  <div class="timeline-label">
    <Clock3 size={15} /><select aria-label="Timeline order" bind:value={mode}
      ><option value="story">Story time</option><option value="narrative">Reading order</option
      ></select
    ><button
      class="timeline-events text-button small"
      aria-pressed={events}
      onclick={() => (events = !events)}
      >{events ? 'Scene & event steps' : 'Include event steps'}</button
    >
  </div>
  <button class="icon-button" aria-label="Previous story point" onclick={() => step(-1)}
    ><ChevronLeft size={17} /></button
  >
  <div class="timeline-rail" bind:this={rail} role="group" aria-label="Timeline points">
    {#each points as p (p.id)}<button
        data-point-id={p.id}
        onkeydown={keys}
        class:active={p.time === ws.at && p.order === ws.atOrder}
        onclick={() => {
          ws.at = p.time;
          ws.atOrder = p.order;
        }}
        title={p.title}><i></i><span>{p.label}</span><small>{p.title}</small></button
      >{/each}{#if !points.length}<p class="field-help">
        Add a story point to a scene to watch your world change.
      </p>{/if}
  </div>
  <button
    class="icon-button"
    aria-label="Jump to selected moment"
    title="Jump to selected moment"
    onclick={jump}><Clock3 size={15} /></button
  >
  <button class="icon-button" aria-label="Next story point" onclick={() => step(1)}
    ><ChevronRight size={17} /></button
  >
  <label class="timeline-point"
    >Point<input
      aria-label="Current story point"
      type="number"
      step="any"
      bind:value={ws.at}
      onchange={() => (ws.atOrder = Infinity)}
    /></label
  >
</section>
