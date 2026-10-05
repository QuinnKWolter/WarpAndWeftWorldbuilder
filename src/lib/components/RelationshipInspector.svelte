<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Relationship } from '#lib/domain/model';
  import { resolveRelationshipState } from '#lib/domain/state';
  import ThreadMemberships from './ThreadMemberships.svelte';
  let {
    ws,
    relationship: r,
    onstate
  }: { ws: Workspace; relationship: Relationship; onstate: () => void } = $props();
  const history = $derived(
    ws.bundle?.relationshipStates
      .filter((s) => s.relationshipId === r.id)
      .sort((a, b) => a.from - b.from) ?? []
  );
  const current = $derived(
    ws.bundle ? resolveRelationshipState(ws.bundle, r.id, ws.at, ws.atOrder) : undefined
  );
  function update(patch: Partial<Relationship>) {
    ws.mutate((b) => {
      const value = b.relationships.find((v) => v.id === r.id);
      if (value) Object.assign(value, patch);
    }, 'Relationship updated');
  }
</script>

<div class="inspector-body">
  <div class="relationship-people">
    <button onclick={() => ws.navigate({ kind: 'entity', id: r.sourceId })}
      >{ws.bundle?.entities.find((e) => e.id === r.sourceId)?.name}</button
    ><span>{r.directed ? '→' : '↔'}</span><button
      onclick={() => ws.navigate({ kind: 'entity', id: r.targetId })}
      >{ws.bundle?.entities.find((e) => e.id === r.targetId)?.name}</button
    >
  </div>
  <div class="current-state">
    <span class="eyebrow">{ws.temporal ? `AT STORY POINT ${ws.at}` : 'ACROSS THE WHOLE STORY'}</span
    >
    <h3>
      {ws.temporal
        ? current?.label || (history.length ? 'Not yet modeled' : r.label) || 'Not yet modeled'
        : history.map((s) => s.label).join(' → ') || r.label}
    </h3>
  </div>
  <label
    >Label<input
      value={r.label}
      onchange={(e) => update({ label: e.currentTarget.value })}
    /></label
  ><label
    >Type<input value={r.type} onchange={(e) => update({ type: e.currentTarget.value })} /></label
  >
  <label
    >Description<textarea
      rows="3"
      value={r.description}
      onchange={(e) => update({ description: e.currentTarget.value })}></textarea></label
  >
  <label class="check-label"
    ><input
      type="checkbox"
      checked={r.directed}
      onchange={(e) => update({ directed: e.currentTarget.checked })}
    /> Directed relationship</label
  >
  <ThreadMemberships {ws} objectId={r.id} />
  <div class="section-heading">
    <span>A HISTORY OF CHANGE</span><button
      class="icon-button"
      aria-label="Add relationship state"
      onclick={onstate}><Plus size={15} /></button
    >
  </div>
  <div class="relationship-history">
    {#each history as s (s.id)}<div class:active={s.id === current?.id}>
        <span class="history-dot"></span>
        <div>
          <input
            aria-label="Relationship state label"
            value={s.label}
            onchange={(e) =>
              ws.mutate((b) => {
                const state = b.relationshipStates.find((v) => v.id === s.id);
                if (state) state.label = e.currentTarget.value;
              }, 'Relationship state updated')}
          />
          <div class="form-row">
            <label
              >From<input
                type="number"
                step="any"
                value={s.from}
                onchange={(e) =>
                  ws.mutate((b) => {
                    const state = b.relationshipStates.find((v) => v.id === s.id);
                    if (state) state.from = Number(e.currentTarget.value);
                  })}
              /></label
            ><label
              >Until (exclusive)<input
                type="number"
                step="any"
                value={s.until ?? ''}
                onchange={(e) =>
                  ws.mutate((b) => {
                    const state = b.relationshipStates.find((v) => v.id === s.id);
                    if (state)
                      state.until = e.currentTarget.value ? Number(e.currentTarget.value) : null;
                  })}
              /></label
            >
          </div>
          {#if s.unitId}<button
              class="text-button small"
              onclick={() => ws.navigate({ kind: 'unit', id: s.unitId! })}
              >{ws.bundle?.units.find((u) => u.id === s.unitId)?.title} ↗</button
            >{/if}
          <p>{s.note}</p>
          {#if s.eventId}<button
              class="text-button small"
              onclick={() => ws.select({ kind: 'event', id: s.eventId! })}
              >{ws.bundle?.events.find((e) => e.id === s.eventId)?.title} ↗</button
            >{/if}
          <button
            class="text-button small"
            onclick={() => {
              ws.at = s.from;
              ws.atOrder = ws.bundle?.events.find((e) => e.id === s.eventId)?.order ?? Infinity;
            }}>Inspect this point</button
          >
        </div>
        <button
          class="icon-button"
          aria-label="Delete relationship state"
          onclick={() =>
            ws.mutate(
              (b) => (b.relationshipStates = b.relationshipStates.filter((v) => v.id !== s.id)),
              'State removed'
            )}><X size={13} /></button
        >
      </div>{/each}
  </div>
  <button class="secondary full" onclick={onstate}><Plus size={15} /> Add a change of heart</button>
</div>
