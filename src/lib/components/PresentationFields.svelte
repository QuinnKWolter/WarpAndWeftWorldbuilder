<script lang="ts">
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Selection } from '#lib/domain/model';
  import { folderIcons } from '#lib/domain/organization';
  import { facetIcon, presentation } from '#lib/domain/presentation';
  let { ws, selection }: { ws: Workspace; selection: Selection } = $props();
  const object = $derived(
    selection.kind === 'entity'
      ? ws.bundle?.entities.find((e) => e.id === selection.id)
      : ws.bundle?.units.find((u) => u.id === selection.id)
  );
  const style = $derived(
    presentation(
      object?.metadata ?? {},
      object && 'facets' in object ? facetIcon(object.facets) : 'book'
    )
  );
  function update(patch: Partial<typeof style>) {
    ws.mutate((b) => {
      const record =
        selection.kind === 'entity'
          ? b.entities.find((e) => e.id === selection.id)
          : b.units.find((u) => u.id === selection.id);
      if (record) record.metadata.presentation = { ...style, ...patch };
    }, 'Appearance updated');
  }
</script>

<div class="form-row">
  <label
    >Accent color<input
      type="color"
      value={style.color}
      onchange={(e) => update({ color: e.currentTarget.value })}
    /></label
  ><label
    >Icon<select
      aria-label="Icon"
      value={style.icon}
      onchange={(e) => update({ icon: e.currentTarget.value as typeof style.icon })}
      >{#each folderIcons as icon (icon)}<option>{icon}</option>{/each}</select
    ></label
  >
</div>
