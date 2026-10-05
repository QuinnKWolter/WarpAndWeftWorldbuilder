<script lang="ts">
  import { untrack } from 'svelte';
  import { Plus, X } from '@lucide/svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { StoryEvent } from '#lib/domain/model';
  import ThreadMemberships from './ThreadMemberships.svelte';
  let { ws, event }: { ws: Workspace; event: StoryEvent } = $props();
  let subject = $state(untrack(() => ws.bundle?.entities[0]?.id ?? ''));
  let target = $state('');
  let key = $state('knowledge');
  let value = $state('true');
  function update(patch: Partial<StoryEvent>) {
    ws.mutate((b) => {
      const item = b.events.find((e) => e.id === event.id);
      if (item) Object.assign(item, patch);
    }, 'Event updated');
  }
  function add() {
    let val;
    try {
      val = JSON.parse(value);
    } catch {
      val = value;
    }
    update({
      requirements: [
        ...event.requirements,
        { subjectId: subject, targetId: target || null, key, value: val }
      ]
    });
  }
</script>

<div class="inspector-body">
  <label
    >Event title<input
      value={event.title}
      onchange={(e) => update({ title: e.currentTarget.value })}
    /></label
  ><label
    >What happens?<textarea
      rows="4"
      value={event.description}
      onchange={(e) => update({ description: e.currentTarget.value })}></textarea></label
  >
  <div class="form-row">
    <label
      >Story point<input
        type="number"
        step="any"
        value={event.storyTime}
        onchange={(e) => update({ storyTime: Number(e.currentTarget.value) })}
      /></label
    ><label
      >Order at this point<input
        type="number"
        step="any"
        value={event.order}
        onchange={(e) => update({ order: Number(e.currentTarget.value) })}
      /></label
    >
  </div>
  <label
    >In scene<select
      value={event.unitId ?? ''}
      onchange={(e) => update({ unitId: e.currentTarget.value || null })}
      ><option value="">Not attached</option>{#each ws.bundle?.units ?? [] as u (u.id)}<option
          value={u.id}>{u.title}</option
        >{/each}</select
    ></label
  >
  <button
    class="text-button small"
    onclick={() =>
      ws.mutate((b) => {
        for (const c of b.changes)
          if (c.eventId === event.id) {
            c.storyTime = event.storyTime;
            c.order = event.order;
          }
        for (const s of b.relationshipStates) if (s.eventId === event.id) s.from = event.storyTime;
      }, 'Linked changes aligned to this event')}>Align linked changes to this event</button
  >
  <ThreadMemberships {ws} objectId={event.id} />
  <div class="section-heading"><span>WHAT MUST ALREADY BE TRUE?</span></div>
  <p class="field-help">
    These requirements power continuity checks. Changes at the same point need a lower order to
    happen first.
  </p>
  {#each event.requirements as r, i (i)}<div class="detail-row">
      <span
        >{ws.bundle?.entities.find((e) => e.id === r.subjectId)?.name} · {r.key}
        {r.targetId ? ws.bundle?.entities.find((e) => e.id === r.targetId)?.name : ''} = {String(
          r.value
        )}</span
      ><button
        class="icon-button"
        aria-label="Remove requirement"
        onclick={() =>
          update({ requirements: event.requirements.filter((_, index) => index !== i) })}
        ><X size={14} /></button
      >
    </div>{/each}
  <label
    >Subject<select bind:value={subject}
      >{#each ws.bundle?.entities ?? [] as e (e.id)}<option value={e.id}>{e.name}</option
        >{/each}</select
    ></label
  >
  <label
    >Target<select bind:value={target}
      ><option value="">No target</option>{#each ws.bundle?.entities ?? [] as e (e.id)}<option
          value={e.id}>{e.name}</option
        >{/each}</select
    ></label
  >
  <div class="form-row">
    <label>Property<input bind:value={key} /></label><label
      >Required value<input bind:value /></label
    >
  </div>
  <button class="secondary full" disabled={!subject || !key} onclick={add}
    ><Plus size={15} /> Add requirement</button
  >
</div>
