<script lang="ts">
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Selection } from '#lib/domain/model';
  import IconPicker from './IconPicker.svelte';
  import AnchorFields from './AnchorFields.svelte';
  import { facetIcon, presentation } from '#lib/domain/presentation';
  let { ws, selection }: { ws: Workspace; selection: Selection } = $props();
  const object = $derived(
    [
      ...(ws.bundle?.entities ?? []),
      ...(ws.bundle?.units ?? []),
      ...(ws.bundle?.events ?? []),
      ...(ws.bundle?.threads ?? [])
    ].find((o) => o.id === selection.id)
  );
  const style = $derived(
    presentation(
      object?.metadata ?? {},
      object && 'facets' in object
        ? facetIcon(object.facets)
        : selection.kind === 'thread'
          ? 'flag'
          : 'book',
      object && 'color' in object ? object.color : undefined
    )
  );
  function update(patch: Partial<typeof style>) {
    ws.mutate((b) => {
      const record = [...b.entities, ...b.units, ...b.events, ...b.threads].find(
        (o) => o.id === selection.id
      );
      if (record) {
        record.metadata.presentation = { ...style, ...patch };
        if (patch.color && 'color' in record) record.color = patch.color;
      }
    }, 'Appearance updated');
  }
</script>

<div class="form-row">
  <label
    >Node color<input
      type="color"
      value={style.color}
      onchange={(e) => update({ color: e.currentTarget.value })}
    /></label
  ><IconPicker value={style.icon} onchange={(icon) => update({ icon })} />
</div>

<AnchorFields {ws} {selection} />
