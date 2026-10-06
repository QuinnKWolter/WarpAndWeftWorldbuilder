<script lang="ts">
  import { X, Trash2 } from '@lucide/svelte';
  import { fly } from 'svelte/transition';
  import { motionDuration } from '#lib/application/motion';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { CreateKind } from './CreateDialog.svelte';
  import SceneInspector from './SceneInspector.svelte';
  import EntityInspector from './EntityInspector.svelte';
  import RelationshipInspector from './RelationshipInspector.svelte';
  import EventInspector from './EventInspector.svelte';
  import { objectName, objectSelection } from '#lib/domain/objects';
  let {
    ws,
    oncreate,
    onwrite,
    ondelete,
    onclose
  }: {
    ws: Workspace;
    oncreate: (kind: CreateKind, unitId?: string) => void;
    onwrite: () => void;
    ondelete: () => void;
    onclose: () => void;
  } = $props();
  const unit = $derived(
    ws.bundle?.units.find((u) => ws.selection?.kind === 'unit' && u.id === ws.selection.id)
  );
  const entity = $derived(
    ws.bundle?.entities.find((e) => ws.selection?.kind === 'entity' && e.id === ws.selection.id)
  );
  const relationship = $derived(
    ws.bundle?.relationships.find(
      (r) => ws.selection?.kind === 'relationship' && r.id === ws.selection.id
    )
  );
  const event = $derived(
    ws.bundle?.events.find((e) => ws.selection?.kind === 'event' && e.id === ws.selection.id)
  );
  const thread = $derived(
    ws.bundle?.threads.find((t) => ws.selection?.kind === 'thread' && t.id === ws.selection.id)
  );
</script>

<aside class="inspector" aria-label="Story inspector">
  <header class="panel-header">
    <span class="eyebrow">{ws.selection?.kind ?? 'INSPECTOR'}</span>
    <div>
      {#if ws.selection}<button
          class="icon-button"
          aria-label="Delete selected object"
          onclick={ondelete}><Trash2 size={15} /></button
        >{/if}<button class="icon-button" aria-label="Close inspector" onclick={onclose}
        ><X size={17} /></button
      >
    </div>
  </header>
  {#key ws.selection?.id}<div
      class="inspector-content"
      in:fly={{ x: 14, duration: motionDuration(260) }}
    >
      {#if unit}<SceneInspector {ws} {unit} {oncreate} {onwrite} />{:else if entity}<EntityInspector
          {ws}
          {entity}
          onconnect={() => oncreate('relationship')}
        />{:else if relationship}<RelationshipInspector
          {ws}
          {relationship}
          onstate={() => oncreate('state')}
        />{:else if event}<EventInspector {ws} {event} />{:else if thread}
        <div class="inspector-body">
          <label
            >Name<input
              value={thread.name}
              onchange={(e) =>
                ws.mutate((b) => {
                  const t = b.threads.find((t) => t.id === thread.id);
                  if (t) t.name = e.currentTarget.value;
                })}
            /></label
          ><label
            >Description<textarea
              rows="4"
              value={thread.description}
              onchange={(e) =>
                ws.mutate((b) => {
                  const t = b.threads.find((t) => t.id === thread.id);
                  if (t) t.description = e.currentTarget.value;
                })}></textarea></label
          ><label
            >Color<input
              type="color"
              value={thread.color}
              onchange={(e) =>
                ws.mutate((b) => {
                  const t = b.threads.find((t) => t.id === thread.id);
                  if (t) t.color = e.currentTarget.value;
                })}
            /></label
          ><button
            class="primary full"
            onclick={() => {
              ws.lens = 'threads';
              ws.threadIds = [thread.id];
            }}>Follow this thread</button
          >
          <div class="section-heading"><span>ON THIS THREAD</span></div>
          {#each ws.bundle?.threadMemberships.filter((m) => m.threadId === thread.id) ?? [] as m (m.id)}<button
              class="detail-row"
              onclick={() => {
                const selection = ws.bundle && objectSelection(ws.bundle, m.objectId);
                if (selection) ws.navigate(selection);
              }}>{ws.bundle ? objectName(ws.bundle, m.objectId) : 'Story object'}</button
            >{/each}
        </div>
      {:else}<div class="inspector-empty">
          <span class="ornament">✧</span>
          <h3>A closer look</h3>
          <p>Select a moment, an entity, or a connection to explore the details.</p>
        </div>{/if}
    </div>{/key}
</aside>
