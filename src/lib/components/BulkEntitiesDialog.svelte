<script lang="ts">
  import Modal from './Modal.svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import { base } from '#lib/domain/model';
  import { parseEntityBatch } from '#lib/domain/entity-batch';
  let { ws, onclose }: { ws: Workspace; onclose: () => void } = $props();
  let text = $state('');
  let facets = $state('character');
  let error = $state('');
  const example =
    'Mira Vale\nThe Starwell | location | A spring that remembers\nSilver Compass | item | Always points home';
  const preview = $derived(parseEntityBatch(text, facets, ws.bundle?.entities));
  function save() {
    if (!preview.rows.length || preview.errors.length) return;
    const batch = preview.rows.map(({ entity }) => ({ ...base(), ...entity }));
    ws.mutate((b) => b.entities.push(...batch), `${batch.length} entities added to your world`);
    if (ws.error) {
      error = ws.error;
      return;
    }
    ws.select({ kind: 'entity', id: batch[0].id });
    onclose();
  }
</script>

<Modal title="Bulk add entities" {onclose} wide>
  <form
    class="dialog-form"
    onsubmit={(event) => {
      event.preventDefault();
      save();
    }}
  >
    <p class="field-help">
      Give your world a few new names. Add one entity per line, or include facets and a short
      summary.
    </p>
    <label
      >Default facets <input
        bind:value={facets}
        placeholder="character, faction…"
        maxlength="1000"
      /></label
    >
    <label
      >Entities <textarea
        class="batch-input"
        bind:value={text}
        rows="7"
        maxlength="200000"
        spellcheck="false"
        placeholder={example}></textarea></label
    >
    <p class="field-help">
      Format: <code>Name | facets, separated by commas | summary</code>. Names with the same facets
      are skipped if already listed or in your world.
    </p>
    {#if preview.errors.length}<div class="batch-errors" role="alert">
        {#each preview.errors as message (message)}<p>{message}</p>{/each}
      </div>{/if}
    <section class="batch-preview" aria-label="Entity preview" aria-live="polite">
      <div class="batch-preview-heading">
        <strong>{preview.rows.length} ready to add</strong>{#if preview.skipped}<span class="muted"
            >{preview.skipped} duplicates skipped</span
          >{/if}
      </div>
      {#if preview.rows.length}<ul>
          {#each preview.rows as row (row.line)}<li>
              <div>
                <strong>{row.entity.name}</strong><span
                  >{row.entity.facets.join(' · ') || 'No facets'}</span
                >
              </div>
              {#if row.entity.summary}<p>{row.entity.summary}</p>{/if}
            </li>{/each}
        </ul>{:else}<p class="field-help">Your new entities will appear here.</p>{/if}
    </section>
    {#if error}<p class="error-text" role="alert">{error}</p>{/if}
    <footer>
      <button class="quiet" type="button" onclick={onclose}>Cancel</button><button
        class="primary"
        type="submit"
        disabled={!preview.rows.length || !!preview.errors.length}
        >Add {preview.rows.length} {preview.rows.length === 1 ? 'entity' : 'entities'}</button
      >
    </footer>
  </form>
</Modal>
