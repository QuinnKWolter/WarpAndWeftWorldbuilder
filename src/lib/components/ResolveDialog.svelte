<script lang="ts">
  import { untrack } from 'svelte';
  import Modal from './Modal.svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Unit, Selection } from '#lib/domain/model';
  import { resolvePlaceholder, mergePlaceholder } from '#lib/domain/placeholders';
  let { ws, unit, onclose }: { ws: Workspace; unit: Unit; onclose: () => void } = $props();
  let kind = $state<'scene' | 'entity' | 'event' | 'existing'>('scene');
  let name = $state(untrack(() => unit.title));
  let targetId = $state('');
  let facets = $state('character');
  function resolve() {
    let selection: Selection = { kind: 'unit', id: unit.id };
    ws.mutate((b) => {
      if (kind === 'existing') {
        mergePlaceholder(b, unit.id, targetId);
        selection = { kind: 'unit', id: targetId };
      } else
        selection = resolvePlaceholder(
          b,
          unit.id,
          kind,
          name,
          facets
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
    }, 'Idea resolved. Its connections and writing are preserved.');
    if (!ws.error) {
      ws.navigate(selection);
      onclose();
    }
  }
</script>

<Modal title="Make this possibility concrete" {onclose}>
  <form
    class="dialog-form"
    onsubmit={(e) => {
      e.preventDefault();
      resolve();
    }}
  >
    <label
      >Resolve as<select aria-label="Resolve as" bind:value={kind}
        ><option value="scene">A scene</option><option value="entity">A new world entity</option
        ><option value="event">A new event</option><option value="existing"
          >An existing narrative moment</option
        ></select
      ></label
    >
    {#if kind === 'existing'}
      <label
        >Merge into<select aria-label="Merge into" bind:value={targetId} required
          ><option value="">Choose a moment…</option
          >{#each ws.bundle?.units.filter((u) => u.id !== unit.id) ?? [] as u (u.id)}<option
              value={u.id}>{u.title}</option
            >{/each}</select
        ></label
      >
      <p class="field-help">
        This joins prose and notes, moves children and modeled changes, and reconnects threads and
        semantic links. Story timestamps stay intact. Immediate undo is available.
      </p>
    {:else}
      <label>Name<input bind:value={name} required maxlength="240" /></label>
      {#if kind === 'entity'}<label>Facets<input bind:value={facets} /></label>{/if}
      <p class="field-help">
        Connections, prose, and chronology remain in this narrative moment. Entities become
        participants; events are attached to the moment.
      </p>
    {/if}
    {#if ws.error}<p class="error-text" role="alert">{ws.error}</p>{/if}
    <footer>
      <button type="button" class="quiet" onclick={onclose}>Keep exploring</button><button
        class="primary"
        type="submit">Resolve idea</button
      >
    </footer>
  </form>
</Modal>
