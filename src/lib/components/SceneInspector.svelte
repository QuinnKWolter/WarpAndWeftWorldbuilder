<script lang="ts">
  import { Plus, X, ArrowUp, ArrowDown, PenLine, Layers } from '@lucide/svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Unit, Change, Json } from '#lib/domain/model';
  import { base } from '#lib/domain/model';
  import { siblings, placeUnit, breadcrumbs } from '#lib/domain/order';
  import { addMembership } from '#lib/domain/operations';
  import { sceneDiff } from '#lib/domain/state';
  import type { CreateKind } from './CreateDialog.svelte';
  import ResolveDialog from './ResolveDialog.svelte';
  import PresentationFields from './PresentationFields.svelte';
  let {
    ws,
    unit,
    oncreate,
    onwrite
  }: {
    ws: Workspace;
    unit: Unit;
    oncreate: (kind: CreateKind, unitId?: string) => void;
    onwrite: () => void;
  } = $props();
  let participant = $state('');
  let resolving = $state(false);
  const members = $derived(ws.bundle?.memberships.filter((m) => m.unitId === unit.id) ?? []);
  const diffs = $derived(ws.bundle ? sceneDiff(ws.bundle, unit.id) : []);
  function update(patch: Partial<Unit>) {
    ws.mutate((b) => {
      const u = b.units.find((u) => u.id === unit.id);
      if (u) Object.assign(u, patch);
    }, 'Scene updated');
  }
  function move(direction: number) {
    ws.mutate((b) => {
      const list = siblings(b, unit.parentId);
      const index = list.findIndex((u) => u.id === unit.id);
      const target = direction < 0 ? list[index - 1] : list[index + 2];
      if ((direction < 0 && index === 0) || (direction > 0 && index === list.length - 1)) return;
      placeUnit(b, unit.id, unit.parentId, target?.id ?? null);
    }, 'Scene reordered. Continuity checks updated.');
  }
  function change(id: string, patch: Partial<Change>) {
    ws.mutate((b) => {
      const c = b.changes.find((c) => c.id === id);
      if (c) Object.assign(c, patch);
    }, 'World change updated');
  }
  function jsonValue(value: string): Json {
    try {
      return JSON.parse(value) as Json;
    } catch {
      return value;
    }
  }
  function align() {
    ws.mutate((b) => {
      if (unit.storyTime === null) return;
      for (const e of b.events) if (e.unitId === unit.id) e.storyTime = unit.storyTime;
      for (const c of b.changes) if (c.unitId === unit.id) c.storyTime = unit.storyTime;
      for (const s of b.relationshipStates) if (s.unitId === unit.id) s.from = unit.storyTime;
    }, 'Linked events and changes moved to this story point');
  }
</script>

<div class="inspector-body">
  <div class="breadcrumbs small">
    {#each ws.bundle ? breadcrumbs(ws.bundle, unit.id).slice(0, -1) : [] as ancestor (ancestor.id)}<button
        onclick={() => {
          ws.parentId = ancestor.id;
          ws.select({ kind: 'unit', id: ancestor.id });
        }}>{ancestor.title}</button
      ><span> / </span>{/each}<span>{unit.type}</span>
  </div>
  <label class="field-label"
    >Title<input
      value={unit.title}
      onchange={(e) => update({ title: e.currentTarget.value })}
    /></label
  >
  <div class="form-row">
    <label
      >Kind<input
        value={unit.type}
        onchange={(e) => update({ type: e.currentTarget.value })}
      /></label
    ><label
      >Status<select
        value={unit.status}
        onchange={(e) => update({ status: e.currentTarget.value as Unit['status'] })}
        >{#each ['idea', 'draft', 'revised', 'complete'] as status (status)}<option>{status}</option
          >{/each}</select
      ></label
    >
  </div>
  <label
    >Synopsis<textarea
      rows="3"
      value={unit.synopsis}
      onchange={(e) => update({ synopsis: e.currentTarget.value })}
      placeholder="What makes this moment matter?"></textarea></label
  >
  <PresentationFields {ws} selection={{ kind: 'unit', id: unit.id }} />
  <div class="section-heading">
    <span>NARRATIVE ORDER</span>
    <div>
      <button class="icon-button" aria-label="Move scene earlier" onclick={() => move(-1)}
        ><ArrowUp size={15} /></button
      ><button class="icon-button" aria-label="Move scene later" onclick={() => move(1)}
        ><ArrowDown size={15} /></button
      >
    </div>
  </div>
  <label
    >Inside<select
      value={unit.parentId ?? ''}
      onchange={(e) =>
        ws.mutate(
          (b) => placeUnit(b, unit.id, e.currentTarget.value || null, null),
          'Scene moved into a new container'
        )}
      ><option value="">Story root</option
      >{#each ws.bundle?.units.filter((u) => u.id !== unit.id) ?? [] as u (u.id)}<option
          value={u.id}>{u.title}</option
        >{/each}</select
    ></label
  >
  {#if unit.unplaced}<button class="secondary full" onclick={() => update({ unplaced: false })}
      >Place in narrative</button
    >{/if}
  <div class="section-heading">
    <span>STORY CHRONOLOGY</span><span class="muted">Independent of reading order</span>
  </div>
  <div class="form-row">
    <label
      >Story point<input
        type="number"
        step="any"
        value={unit.storyTime ?? ''}
        onchange={(e) =>
          update({
            storyTime: e.currentTarget.value === '' ? null : Number(e.currentTarget.value)
          })}
      /></label
    ><label
      >Time label<input
        value={unit.timeLabel}
        onchange={(e) => update({ timeLabel: e.currentTarget.value })}
      /></label
    >
  </div>
  <button class="text-button small" onclick={align}
    >Align linked events & changes to this point</button
  >
  <button
    class="text-button small"
    disabled={unit.storyTime === null}
    onclick={() => {
      ws.at = unit.storyTime!;
      ws.atOrder = -Infinity;
      ws.temporal = true;
      ws.message =
        'Inspecting the world before this scene’s changes. Select an entity for its snapshot.';
    }}>Inspect world before this scene</button
  >
  <label
    >Point of view<select
      value={unit.povId ?? ''}
      onchange={(e) => update({ povId: e.currentTarget.value || null })}
      ><option value="">Unassigned</option>{#each ws.bundle?.entities ?? [] as e (e.id)}<option
          value={e.id}>{e.name}</option
        >{/each}</select
    ></label
  >
  <div class="section-heading">
    <span>WHO & WHERE</span><span class="muted">{members.length}</span>
  </div>
  <div class="participant-list">
    {#each members as m (m.id)}<div>
        <button onclick={() => ws.navigate({ kind: 'entity', id: m.entityId })}
          >{ws.bundle?.entities.find((e) => e.id === m.entityId)?.name}<small>{m.role}</small
          ></button
        ><button
          class="icon-button"
          aria-label="Remove participant"
          onclick={() =>
            ws.mutate(
              (b) => (b.memberships = b.memberships.filter((x) => x.id !== m.id)),
              'Participant removed'
            )}><X size={13} /></button
        >
      </div>{/each}
  </div>
  <div class="inline-create">
    <select aria-label="Entity to add to scene" bind:value={participant}
      ><option value="">Add from your world…</option
      >{#each ws.bundle?.entities.filter((e) => !members.some((m) => m.entityId === e.id)) ?? [] as e (e.id)}<option
          value={e.id}>{e.name}</option
        >{/each}</select
    ><button
      class="icon-button"
      aria-label="Add participant"
      disabled={!participant}
      onclick={() => {
        ws.mutate((b) => addMembership(b, unit.id, participant), 'Entity added to scene');
        participant = '';
      }}><Plus size={16} /></button
    >
  </div>
  <div class="section-heading">
    <span>THREADS</span><button
      class="icon-button"
      aria-label="Create thread"
      onclick={() => oncreate('thread')}><Plus size={15} /></button
    >
  </div>
  {#each ws.bundle?.threads ?? [] as t (typeof t === 'string' ? t : t.id)}<label class="check-label"
      ><input
        type="checkbox"
        checked={ws.bundle?.threadMemberships.some(
          (m) => m.threadId === t.id && m.objectId === unit.id
        )}
        onchange={(e) =>
          ws.mutate((b) => {
            if (e.currentTarget.checked)
              b.threadMemberships.push({ ...base(), threadId: t.id, objectId: unit.id });
            else
              b.threadMemberships = b.threadMemberships.filter(
                (m) => m.threadId !== t.id || m.objectId !== unit.id
              );
          }, 'Thread membership updated')}
      /><i class="thread-dot" style:background={t.color}></i>{t.name}</label
    >{/each}
  <div class="section-heading">
    <span>WHAT HAPPENS</span><button
      class="icon-button"
      aria-label="Add event"
      onclick={() => oncreate('event', unit.id)}><Plus size={15} /></button
    >
  </div>
  {#each ws.bundle?.events.filter((e) => e.unitId === unit.id) ?? [] as event (event.id)}<button
      class="detail-row"
      onclick={() => ws.select({ kind: 'event', id: event.id })}
      ><span>{event.title}</span><small>Point {event.storyTime} →</small></button
    >{/each}
  <div class="section-heading">
    <span>WHAT CHANGES</span><button
      class="icon-button"
      aria-label="Add world change"
      onclick={() => oncreate('change', unit.id)}><Plus size={15} /></button
    >
  </div>
  {#each diffs as c (c.id)}<div class="diff-row">
      <div>
        <strong>{ws.bundle?.entities.find((e) => e.id === c.subjectId)?.name}</strong><span
          >{c.key}
          {c.targetId
            ? `· ${ws.bundle?.entities.find((e) => e.id === c.targetId)?.name}`
            : ''}</span
        >
        <p>{String(c.previous ?? 'unmodeled')} <span>→</span> {String(c.value)}</p>
        <label class="small"
          >Previous value override<input
            value={c.before === null ? '' : String(c.before)}
            placeholder="Infer from history"
            onchange={(e) =>
              ws.mutate((b) => {
                const change = b.changes.find((d) => d.id === c.id);
                if (change) {
                  try {
                    change.before = e.currentTarget.value
                      ? JSON.parse(e.currentTarget.value)
                      : null;
                  } catch {
                    change.before = e.currentTarget.value;
                  }
                }
              }, 'Previous value updated')}
          /></label
        >
        <details class="change-details">
          <summary>Edit this change</summary>
          <label
            >New value<input
              value={typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value)}
              onchange={(e) => change(c.id, { value: jsonValue(e.currentTarget.value) })}
            /></label
          >
          <label
            >Property<input
              value={c.key}
              onchange={(e) => change(c.id, { key: e.currentTarget.value })}
            /></label
          >
          <div class="form-row">
            <label
              >Effective point<input
                type="number"
                step="any"
                value={c.storyTime}
                onchange={(e) => change(c.id, { storyTime: Number(e.currentTarget.value) })}
              /></label
            ><label
              >Order at point<input
                type="number"
                step="any"
                value={c.order}
                onchange={(e) => change(c.id, { order: Number(e.currentTarget.value) })}
              /></label
            >
          </div>
          <label
            >Reason<textarea
              value={c.note}
              rows="2"
              onchange={(e) => change(c.id, { note: e.currentTarget.value })}></textarea></label
          >
        </details>
      </div>
      <button
        class="icon-button"
        aria-label="Remove world change"
        onclick={() =>
          ws.mutate(
            (b) => (b.changes = b.changes.filter((x) => x.id !== c.id)),
            'World change removed'
          )}><X size={13} /></button
      >
    </div>{/each}
  {#each ws.bundle?.relationshipStates.filter((s) => s.unitId === unit.id) ?? [] as state (state.id)}<button
      class="detail-row"
      onclick={() => ws.select({ kind: 'relationship', id: state.relationshipId })}
      ><span>Relationship → {state.label}</span><small>History →</small></button
    >{/each}
  {#if !diffs.length}<p class="field-help">
      Record a revelation, a transfer, or a change of heart.
    </p>{/if}
  <div class="section-heading">
    <span>WITHIN THIS MOMENT</span><button
      class="icon-button"
      aria-label="Create nested moment"
      onclick={() => oncreate('unit', unit.id)}><Plus size={15} /></button
    >
  </div>
  {#each ws.bundle?.units.filter((u) => u.parentId === unit.id) ?? [] as child (child.id)}<button
      class="detail-row"
      onclick={() => ws.select({ kind: 'unit', id: child.id })}
      >{child.title}<small>{child.type}</small></button
    >{/each}
  <button class="secondary full" onclick={() => (ws.parentId = unit.id)}
    ><Layers size={15} /> Explore inside</button
  >
  <label class="check-label"
    ><input
      type="checkbox"
      checked={unit.setup}
      onchange={(e) => update({ setup: e.currentTarget.checked })}
    /> This moment sets up a future payoff</label
  >
  {#if unit.unresolved}<button class="secondary full" onclick={() => (resolving = true)}
      >Resolve this possibility</button
    >{/if}
  <button class="primary full" onclick={onwrite}><PenLine size={16} /> Write this moment</button>
</div>
{#if resolving}<ResolveDialog {ws} {unit} onclose={() => (resolving = false)} />{/if}
