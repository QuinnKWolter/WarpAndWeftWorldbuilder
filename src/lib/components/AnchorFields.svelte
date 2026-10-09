<script lang="ts">
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { Selection } from '#lib/domain/model';
  import { anchors, sides, type Anchors } from '#lib/domain/anchors';
  let { ws, selection }: { ws: Workspace; selection: Selection } = $props();
  const object = $derived(
    [
      ...(ws.bundle?.units ?? []),
      ...(ws.bundle?.entities ?? []),
      ...(ws.bundle?.events ?? []),
      ...(ws.bundle?.threads ?? [])
    ].find((o) => o.id === selection.id)
  );
  const config = $derived(anchors(object?.metadata ?? {}));
  function update(patch: Partial<Anchors>) {
    ws.mutate((b) => {
      const record = [...b.units, ...b.entities, ...b.events, ...b.threads].find(
        (o) => o.id === selection.id
      );
      if (record) record.metadata.anchors = { ...config, ...patch };
    }, 'Connection anchors updated');
  }
</script>

<details class="anchor-settings">
  <summary>Connection anchors</summary>
  <p class="field-help">
    Move incoming and outgoing connection points, or add up to four of each. Existing links stay
    connected; removed extra anchors return to the first point.
  </p>
  <div class="form-row">
    <label
      >Incoming side<select
        aria-label="Incoming anchor side"
        value={config.targetSide}
        onchange={(e) => update({ targetSide: e.currentTarget.value as Anchors['targetSide'] })}
        >{#each sides as side (side)}<option>{side}</option>{/each}</select
      ></label
    >
    <label
      >Outgoing side<select
        aria-label="Outgoing anchor side"
        value={config.sourceSide}
        onchange={(e) => update({ sourceSide: e.currentTarget.value as Anchors['sourceSide'] })}
        >{#each sides as side (side)}<option>{side}</option>{/each}</select
      ></label
    >
  </div>
  <label
    >Anchors per direction<select
      aria-label="Anchors per direction"
      value={config.count}
      onchange={(e) => update({ count: Number(e.currentTarget.value) })}
      >{#each [1, 2, 3, 4] as count (count)}<option value={count}>{count}</option>{/each}</select
    ></label
  >
</details>
