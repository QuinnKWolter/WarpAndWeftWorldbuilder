<script lang="ts">
  import { untrack } from 'svelte';
  import Modal from './Modal.svelte';
  import {
    base,
    entitySchema,
    unitSchema,
    eventSchema,
    relationshipSchema,
    relationshipStateSchema,
    changeSchema,
    threadSchema,
    type ObjectKind
  } from '#lib/domain/model';
  import { siblings, rankBetween, placeUnit } from '#lib/domain/order';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import { addMembership } from '#lib/domain/operations';
  export type CreateKind = ObjectKind | 'state' | 'change' | 'placeholder';
  let {
    ws,
    kind,
    onclose,
    beforeId = null,
    sourceId = '',
    targetId = '',
    unitId = null,
    presetType = 'scene',
    placement,
    connectionFrom,
    connectionAnchors
  }: {
    ws: Workspace;
    kind: CreateKind;
    onclose: () => void;
    beforeId?: string | null;
    sourceId?: string;
    targetId?: string;
    unitId?: string | null;
    presetType?: string;
    placement?: { x: number; y: number };
    connectionFrom?: { nodeId: string; handleId: string | null; type: 'source' | 'target' };
    connectionAnchors?: { sourceHandle: string | null; targetHandle: string | null };
  } = $props();
  let title = $state('');
  let summary = $state('');
  let facets = $state('character');
  let type = $state(untrack(() => (kind === 'relationship' ? 'relationship' : presetType)));
  let parentId = $state(untrack(() => unitId ?? ws.parentId ?? ''));
  let time = $state(untrack(() => ws.at));
  let timeLabel = $state('');
  let source = $state(untrack(() => sourceId || ws.bundle?.entities[0]?.id || ''));
  let target = $state(untrack(() => targetId || ws.bundle?.entities[1]?.id || ''));
  let scene = $state(
    untrack(() => unitId ?? (ws.selection?.kind === 'unit' ? ws.selection.id : ''))
  );
  let relationship = $state(
    untrack(() =>
      ws.selection?.kind === 'relationship'
        ? ws.selection.id
        : (ws.bundle?.relationships[0]?.id ?? '')
    )
  );
  let key = $state('possession');
  let value = $state('true');
  let color = $state('#50856e');
  let eventId = $state('');
  let directed = $state(false);
  let unplaced = $state(false);
  let error = $state('');
  function save() {
    if (!title.trim() && kind !== 'change') {
      error = 'Give this idea a name.';
      return;
    }
    const id = crypto.randomUUID();
    try {
      ws.mutate(
        (b) => {
          const core = {
            ...base(),
            id,
            metadata: placement ? { canvasContext: ws.lens + ':' + (ws.parentId ?? 'root') } : {}
          };
          if (kind === 'entity')
            b.entities.push(
              entitySchema.parse({
                ...core,
                name: title,
                summary,
                facets: facets
                  .split(',')
                  .map((f) => f.trim())
                  .filter(Boolean)
              })
            );
          if (kind === 'entity' && unitId) addMembership(b, unitId, id);
          if (kind === 'unit' || kind === 'placeholder') {
            const list = siblings(b, parentId || null);
            const before = beforeId ? b.units.find((u) => u.id === beforeId) : undefined;
            const index = before ? list.indexOf(before) : list.length;
            const u = unitSchema.parse({
              ...core,
              title,
              synopsis: summary,
              type: kind === 'placeholder' ? 'placeholder' : type,
              parentId: parentId || null,
              rank: rankBetween(list[index - 1], before),
              storyTime: time,
              timeLabel: timeLabel || `Point ${time}`,
              unresolved: kind === 'placeholder',
              unplaced
            });
            b.units.push(u);
            if (!unplaced) placeUnit(b, id, parentId || null, beforeId);
          }
          if (kind === 'event')
            b.events.push(
              eventSchema.parse({
                ...core,
                title,
                description: summary,
                unitId: scene || null,
                storyTime: time
              })
            );
          if (kind === 'relationship')
            b.relationships.push(
              relationshipSchema.parse({
                ...core,
                sourceId: source,
                targetId: target,
                label: title,
                description: summary,
                type: type === 'scene' ? 'relationship' : type,
                directed,
                metadata: {
                  connection: connectionAnchors ?? { sourceHandle: null, targetHandle: null }
                }
              })
            );
          if (kind === 'state')
            b.relationshipStates.push(
              relationshipStateSchema.parse({
                ...core,
                relationshipId: relationship,
                label: title,
                from: time,
                unitId: scene || null,
                eventId: eventId || null,
                note: summary
              })
            );
          if (kind === 'change') {
            let newValue: unknown;
            try {
              newValue = JSON.parse(value);
            } catch {
              newValue = value;
            }
            const c = changeSchema.parse({
              ...core,
              subjectId: source,
              key,
              targetId: target || null,
              value: newValue,
              storyTime: time,
              order: b.events.find((e) => e.id === eventId)?.order ?? 0,
              unitId: scene || null,
              eventId: eventId || null,
              note: summary
            });
            b.changes.push(c);
          }
          if (kind === 'thread')
            b.threads.push(
              threadSchema.parse({ ...core, name: title, description: summary, color })
            );
          if (placement)
            b.layouts.push({
              ...base(),
              objectId: id,
              lens: ws.lens + ':' + (ws.parentId ?? 'root'),
              ...placement
            });
          if (connectionFrom) {
            const from = connectionFrom.type === 'source';
            const sourceId = from ? connectionFrom.nodeId : id;
            const targetId = from ? id : connectionFrom.nodeId;
            const metadata = {
              connection: {
                sourceHandle: from ? connectionFrom.handleId : null,
                targetHandle: from ? null : connectionFrom.handleId
              }
            };
            if (
              b.entities.some((e) => e.id === sourceId) &&
              b.entities.some((e) => e.id === targetId)
            )
              b.relationships.push(
                relationshipSchema.parse({
                  ...base(),
                  sourceId,
                  targetId,
                  label: 'connected',
                  metadata
                })
              );
            else b.links.push({ ...base(), sourceId, targetId, type: 'enables', metadata });
            for (const threadId of ws.threadIds)
              if (!b.threadMemberships.some((m) => m.threadId === threadId && m.objectId === id))
                b.threadMemberships.push({ ...base(), threadId, objectId: id });
          }
          if (kind === 'thread') {
            for (const objectId of [sourceId, targetId].filter(Boolean))
              b.threadMemberships.push({ ...base(), threadId: id, objectId });
          }
        },
        kind === 'unit' ? 'Moment added to your story' : 'Story updated'
      );
      if (ws.error) {
        error = ws.error;
        return;
      }
      if (['entity', 'unit', 'event', 'relationship', 'thread'].includes(kind))
        ws.select({ kind: kind as ObjectKind, id });
      if (kind === 'placeholder') ws.select({ kind: 'unit', id });
      onclose();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unable to create this object.';
    }
  }
  const labels: Record<CreateKind, string> = {
    entity: 'New world entity',
    unit: 'Add a moment',
    event: 'Record an event',
    relationship: 'Connect two entities',
    state: 'Add relationship state',
    change: 'Record a world change',
    thread: 'New plot thread',
    placeholder: 'Leave room for an unknown'
  };
</script>

<Modal title={labels[kind]} {onclose}>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
    class="dialog-form"
  >
    {#if kind !== 'change'}<label
        >{kind === 'state'
          ? 'State'
          : kind === 'relationship'
            ? 'Relationship label'
            : 'Name'}<input
          bind:value={title}
          placeholder={kind === 'unit'
            ? 'What happens here?'
            : kind === 'state'
              ? 'Friends, suspicious, allies…'
              : 'Give your idea a name'}
          required
          maxlength="240"
        /></label
      >{/if}
    {#if kind === 'entity'}<label
        >Facets <span class="muted">separate with commas</span><input
          bind:value={facets}
          list="facets"
        /><datalist id="facets"
          ><option>character</option><option>location</option><option>item</option><option
            >faction</option
          ><option>secret</option><option>concept</option></datalist
        ></label
      >{/if}
    {#if kind === 'unit' || kind === 'placeholder'}
      <div class="form-row">
        <label
          >Kind<select aria-label="Kind" bind:value={type}
            >{#each ['scene', 'act', 'chapter', 'sequence', 'beat', 'conversation', 'transition', 'flashback', 'note'] as t (t)}<option
                >{t}</option
              >{/each}</select
          ></label
        ><label
          >Inside<select aria-label="Inside" bind:value={parentId}
            ><option value="">Story root</option>{#each ws.bundle?.units ?? [] as u (u.id)}<option
                value={u.id}>{u.title}</option
              >{/each}</select
          ></label
        >
      </div>
      {#if !beforeId}<label class="check-label"
          ><input type="checkbox" bind:checked={unplaced} /> Keep in the idea inbox for now</label
        >{/if}
    {/if}
    {#if ['relationship', 'change'].includes(kind)}
      <label
        >{kind === 'change' ? 'Who changes?' : 'From'}<select
          aria-label={kind === 'change' ? 'Who changes?' : 'From'}
          bind:value={source}
          required
          >{#each ws.bundle?.entities ?? [] as e (e.id)}<option value={e.id}>{e.name}</option
            >{/each}</select
        ></label
      >
      <label
        >{kind === 'change' ? 'Target object (optional)' : 'To'}<select
          bind:value={target}
          aria-label={kind === 'change' ? 'Target object (optional)' : 'To'}
          required={kind === 'relationship'}
          >{#if kind === 'change'}<option value="">No target object</option
            >{/if}{#each ws.bundle?.entities ?? [] as e (e.id)}<option value={e.id}>{e.name}</option
            >{/each}</select
        ></label
      >
    {/if}
    {#if kind === 'relationship'}<label
        >Relationship type<input bind:value={type} placeholder="relationship" /></label
      ><label class="check-label"
        ><input type="checkbox" bind:checked={directed} /> Directed connection</label
      >{/if}
    {#if kind === 'state'}<label
        >Relationship<select aria-label="Relationship" bind:value={relationship} required
          >{#each ws.bundle?.relationships ?? [] as r (JSON.stringify(r))}<option value={r.id}
              >{ws.bundle?.entities.find((e) => e.id === r.sourceId)?.name} ↔ {ws.bundle?.entities.find(
                (e) => e.id === r.targetId
              )?.name}</option
            >{/each}</select
        ></label
      >{/if}
    {#if kind === 'change'}<div class="form-row">
        <label
          >Property<input bind:value={key} list="properties" /><datalist id="properties"
            ><option>possession</option><option>knowledge</option><option>location</option><option
              >status</option
            ><option>belief</option></datalist
          ></label
        ><label>New value<input bind:value placeholder="true, false, or a description" /></label>
      </div>
      <p class="field-help">
        The previous modeled value is filled in automatically. Use true / false for possession and
        knowledge.
      </p>{/if}
    {#if ['unit', 'placeholder', 'event', 'state', 'change'].includes(kind)}
      <div class="form-row">
        <label>Story point<input type="number" step="any" bind:value={time} required /></label
        >{#if kind === 'unit' || kind === 'placeholder'}<label
            >Time label<input bind:value={timeLabel} placeholder="Day 4 · at dusk" /></label
          >{:else}<label
            >Causing scene<select aria-label="Causing scene" bind:value={scene}
              ><option value="">Not attached</option
              >{#each ws.bundle?.units ?? [] as u (u.id)}<option value={u.id}>{u.title}</option
                >{/each}</select
            ></label
          >{/if}
      </div>
      {#if kind === 'state' || kind === 'change'}<label
          >Causing event<select
            aria-label="Causing event"
            bind:value={eventId}
            onchange={() => {
              const event = ws.bundle?.events.find((e) => e.id === eventId);
              if (event) time = event.storyTime;
            }}
            ><option value="">No event recorded</option
            >{#each ws.bundle?.events.filter((e) => !scene || e.unitId === scene) ?? [] as e (e.id)}<option
                value={e.id}>{e.title}</option
              >{/each}</select
          ></label
        >{/if}
    {/if}
    {#if kind === 'thread'}<label>Thread color<input type="color" bind:value={color} /></label>{/if}
    <label
      >{kind === 'state' || kind === 'change'
        ? 'Why does it change?'
        : 'A few words about it'}<textarea
        bind:value={summary}
        rows="3"
        placeholder="Leave a little context for your future self."></textarea></label
    >
    {#if error}<p class="error-text" role="alert">{error}</p>{/if}
    <footer>
      <button type="button" class="quiet" onclick={onclose}>Cancel</button><button
        class="primary"
        type="submit">{kind === 'state' || kind === 'change' ? 'Record change' : 'Create'}</button
      >
    </footer>
  </form>
</Modal>
