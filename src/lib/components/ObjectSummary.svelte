<script lang="ts">
  import { untrack } from 'svelte';
  import { PenLine, ArrowUpRight } from '@lucide/svelte';
  import Modal from './Modal.svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Selection } from '#lib/domain/model';
  import { objectName, objectSelection } from '#lib/domain/objects';
  import { organization, moveShelfObject, objectSection } from '#lib/domain/organization';
  let {
    ws,
    selection,
    onclose,
    onedit,
    onwrite,
    onfocus
  }: {
    ws: Workspace;
    selection: Selection;
    onclose: () => void;
    onedit: (selection: Selection) => void;
    onwrite: () => void;
    onfocus: () => void;
  } = $props();
  const b = $derived(ws.bundle!);
  const entity = $derived(b.entities.find((e) => e.id === selection.id));
  const unit = $derived(b.units.find((u) => u.id === selection.id));
  const event = $derived(b.events.find((e) => e.id === selection.id));
  const thread = $derived(b.threads.find((t) => t.id === selection.id));
  const relationship = $derived(b.relationships.find((r) => r.id === selection.id));
  const text = $derived(
    entity?.summary ||
      unit?.synopsis ||
      event?.description ||
      thread?.description ||
      relationship?.description ||
      'This possibility is waiting for its first words.'
  );
  const o = $derived(organization(b));
  let folder = $state(
    untrack(
      () =>
        organization(ws.bundle!).placements.find((p) => p.objectId === selection.id)?.folderId ?? ''
    )
  );
  const connections = $derived(
    b.relationships.filter((r) => r.sourceId === selection.id || r.targetId === selection.id)
  );
  const members = $derived(
    unit
      ? b.memberships.filter((m) => m.unitId === unit.id).map((m) => m.entityId)
      : thread
        ? b.threadMemberships.filter((m) => m.threadId === thread.id).map((m) => m.objectId)
        : entity
          ? b.memberships.filter((m) => m.entityId === entity.id).map((m) => m.unitId)
          : []
  );
  function related(id: string) {
    const selected = objectSelection(b, id);
    if (selected) {
      onclose();
      onedit(selected);
    }
  }
</script>

<Modal title={objectName(b, selection.id)} {onclose} wide>
  <div class="dialog-form object-summary">
    <div class="summary-tags">
      <span>{selection.kind}</span>{#each entity?.facets ?? [] as facet (facet)}<span>{facet}</span
        >{/each}{#if unit}<span>{unit.status}</span><span
          >{unit.timeLabel ||
            (unit.storyTime !== null ? `Story point ${unit.storyTime}` : 'Untimed')}</span
        >{/if}
    </div>
    <p class="summary-copy">{text}</p>
    {#if entity?.description}<div class="summary-notes">
        <span class="eyebrow">NOTES</span>
        <p>{entity.description}</p>
      </div>{/if}
    {#if members.length}<section>
        <h3>{unit ? 'In this moment' : entity ? 'Appears in' : 'On this thread'}</h3>
        <div class="summary-related">
          {#each [...new Set(members)] as id (id)}<button
              class="secondary compact"
              onclick={() => related(id)}>{objectName(b, id)}<ArrowUpRight size={12} /></button
            >{/each}
        </div>
      </section>{/if}
    {#if connections.length}<section>
        <h3>Connections</h3>
        <div class="summary-related">
          {#each connections as r (r.id)}<button
              class="secondary compact"
              onclick={() => related(r.id)}
              >{objectName(b, r.sourceId === selection.id ? r.targetId : r.sourceId)} · {r.label ||
                r.type}</button
            >{/each}
        </div>
      </section>{/if}
    {#if objectSection(b, selection.id) && (!unit || unit.unplaced || unit.unresolved)}<label
        >Organize in folder<select
          bind:value={folder}
          onchange={() =>
            ws.mutate(
              (bundle) => moveShelfObject(bundle, selection.id, folder || null),
              'Item moved to folder'
            )}
          ><option value="">Top level</option
          >{#each o.folders.filter((f) => f.section === objectSection(b, selection.id)) as f (f.id)}<option
              value={f.id}>{f.name}</option
            >{/each}</select
        ></label
      >{/if}
    <footer>
      <button class="quiet" onclick={onclose}>Close</button
      >{#if unit && b.units.some((u) => u.parentId === unit.id)}<button
          class="secondary"
          onclick={onfocus}>Open inside<ArrowUpRight size={14} /></button
        >{/if}{#if unit}<button class="secondary" onclick={onwrite}
          ><PenLine size={14} />Write moment</button
        >{/if}<button
        class="primary"
        onclick={() => {
          onedit(selection);
          onclose();
        }}>Edit details<ArrowUpRight size={14} /></button
      >
    </footer>
  </div>
</Modal>
