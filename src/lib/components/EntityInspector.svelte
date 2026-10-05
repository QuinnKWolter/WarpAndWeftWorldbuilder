<script lang="ts">
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Entity } from '#lib/domain/model';
  import { base } from '#lib/domain/model';
  import { resolveStoryState, stateKey } from '#lib/domain/state';
  let { ws, entity, onconnect }: { ws: Workspace; entity: Entity; onconnect: () => void } =
    $props();
  const snapshot = $derived(
    ws.bundle ? resolveStoryState(ws.bundle, ws.at, false, ws.atOrder) : null
  );
  const properties = $derived(
    ws.bundle?.changes
      .filter((c) => c.subjectId === entity.id)
      .filter(
        (c, i, a) => a.findIndex((v) => v.key === c.key && v.targetId === c.targetId) === i
      ) ?? []
  );
  function update(patch: Partial<Entity>) {
    ws.mutate((b) => {
      const e = b.entities.find((e) => e.id === entity.id);
      if (e) Object.assign(e, patch);
    }, 'World entity updated');
  }
  let metadataError = $state('');
</script>

<div class="inspector-body">
  <label
    >Name<input
      value={entity.name}
      onchange={(e) => update({ name: e.currentTarget.value })}
    /></label
  >
  <label
    >Facets <span class="muted">comma separated</span><input
      value={entity.facets.join(', ')}
      onchange={(e) =>
        update({
          facets: e.currentTarget.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        })}
    /></label
  >
  <label
    >Summary<textarea
      rows="2"
      value={entity.summary}
      onchange={(e) => update({ summary: e.currentTarget.value })}></textarea></label
  >
  <label
    >Notes<textarea
      rows="5"
      value={entity.description}
      onchange={(e) => update({ description: e.currentTarget.value })}
      placeholder="What should you remember about them?"></textarea></label
  >
  <div class="section-heading">
    <span
      >{ws.atOrder === -Infinity ? 'BEFORE' : 'AT'} STORY POINT {ws.at}{Number.isFinite(ws.atOrder)
        ? ` · EVENT ORDER ${ws.atOrder}`
        : ''}</span
    >
  </div>
  {#each properties as p (p.id)}<div class="detail-row">
      <span
        >{p.key}{p.targetId
          ? ` · ${ws.bundle?.entities.find((e) => e.id === p.targetId)?.name}`
          : ''}</span
      ><strong
        >{String(
          snapshot?.properties[stateKey(entity.id, p.key, p.targetId)] ?? 'unmodeled'
        )}</strong
      >
    </div>{/each}
  {#if !properties.length}<p class="field-help">
      No world-state properties modeled yet. Record changes in a scene to track location, knowledge,
      and possessions.
    </p>{/if}
  <div class="section-heading"><span>APPEARANCES</span></div>
  {#each ws.bundle?.memberships.filter((m) => m.entityId === entity.id) ?? [] as m (m.id)}<button
      class="detail-row"
      onclick={() => ws.navigate({ kind: 'unit', id: m.unitId })}
      >{ws.bundle?.units.find((u) => u.id === m.unitId)?.title}<small>{m.role}</small></button
    >{/each}
  <div class="section-heading"><span>RELATIONSHIPS</span></div>
  {#each ws.bundle?.relationships.filter((r) => r.sourceId === entity.id || r.targetId === entity.id) ?? [] as r (JSON.stringify(r))}<button
      class="detail-row"
      onclick={() => ws.navigate({ kind: 'relationship', id: r.id })}
      >{ws.bundle?.entities.find(
        (e) => e.id === (r.sourceId === entity.id ? r.targetId : r.sourceId)
      )?.name}<small>{snapshot?.relationships[r.id]?.label || r.label}</small></button
    >{/each}
  <button class="secondary full" onclick={onconnect}>+ Connect to an entity</button>
  <div class="section-heading"><span>THREADS</span></div>
  {#each ws.bundle?.threads ?? [] as t (typeof t === 'string' ? t : t.id)}<label class="check-label"
      ><input
        type="checkbox"
        checked={ws.bundle?.threadMemberships.some(
          (m) => m.threadId === t.id && m.objectId === entity.id
        )}
        onchange={(e) =>
          ws.mutate((b) => {
            if (e.currentTarget.checked)
              b.threadMemberships.push({ ...base(), threadId: t.id, objectId: entity.id });
            else
              b.threadMemberships = b.threadMemberships.filter(
                (m) => m.threadId !== t.id || m.objectId !== entity.id
              );
          })}
      />{t.name}</label
    >{/each}
  <details>
    <summary>Custom fields</summary><label
      >Metadata (JSON object)<textarea
        rows="5"
        value={JSON.stringify(entity.metadata, null, 2)}
        onchange={(e) => {
          try {
            update({ metadata: JSON.parse(e.currentTarget.value) });
            metadataError = '';
          } catch {
            metadataError = 'Use a valid JSON object.';
          }
        }}></textarea></label
    >{#if metadataError}<p class="error-text">{metadataError}</p>{/if}
  </details>
  {#if entity.unresolved}<button class="primary full" onclick={() => update({ unresolved: false })}
      >Resolve this entity</button
    >{/if}
</div>
