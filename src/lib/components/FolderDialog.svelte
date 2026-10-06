<script lang="ts">
  import { untrack } from 'svelte';
  import Modal from './Modal.svelte';
  import FolderIcon from './FolderIcon.svelte';
  import {
    folderSchema,
    folderIcons,
    organization,
    writeOrganization,
    removeFolder,
    moveFolder,
    type FolderSection
  } from '#lib/domain/organization';
  import type { Workspace } from '#lib/application/workspace.svelte';
  let {
    ws,
    id = null,
    section,
    parentId = null,
    onclose
  }: {
    ws: Workspace;
    id?: string | null;
    section: FolderSection;
    parentId?: string | null;
    onclose: () => void;
  } = $props();
  const initial = untrack(
    () => ws.bundle && organization(ws.bundle).folders.find((f) => f.id === id)
  );
  let name = $state(initial?.name ?? '');
  let color = $state(initial?.color ?? '#50856e');
  let icon = $state(initial?.icon ?? 'folder');
  let parent = $state(untrack(() => initial?.parentId ?? parentId ?? ''));
  let error = $state('');
  const folders = $derived(
    ws.bundle
      ? organization(ws.bundle).folders.filter((f) => f.section === section && f.id !== id)
      : []
  );
  function save() {
    ws.mutate(
      (b) => {
        const o = organization(b);
        let folder = o.folders.find((f) => f.id === id);
        if (folder) Object.assign(folder, { name: name.trim(), color, icon });
        else {
          folder = folderSchema.parse({
            id: crypto.randomUUID(),
            section,
            name,
            color,
            icon,
            rank: (o.folders.length + 1) * 1024
          });
          o.folders.push(folder);
        }
        writeOrganization(b, o);
        if (folder.parentId !== (parent || null)) moveFolder(b, folder.id, parent || null);
      },
      id ? 'Folder updated' : 'Folder created'
    );
    if (ws.error) {
      error = ws.error;
      return;
    }
    onclose();
  }
</script>

<Modal title={id ? 'Edit folder' : 'New folder'} {onclose}>
  <form
    class="dialog-form"
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
  >
    <div class="folder-preview" style:color>
      <FolderIcon name={icon} size={25} /><strong>{name || 'A place for possibilities'}</strong>
    </div>
    <label
      >Folder name<input
        bind:value={name}
        required
        maxlength="240"
        placeholder="People of the northern coast…"
      /></label
    >
    <div class="form-row">
      <label>Folder color<input type="color" bind:value={color} /></label><label
        >Folder icon<select bind:value={icon}
          >{#each folderIcons as value (value)}<option>{value}</option>{/each}</select
        ></label
      >
    </div>
    <label
      >Parent folder<select bind:value={parent}
        ><option value="">Top level</option>{#each folders as folder (folder.id)}<option
            value={folder.id}>{folder.name}</option
          >{/each}</select
      ></label
    >
    <p class="field-help">
      Drag items into folders. Drag a folder onto another to nest it, or onto its upper edge to
      reorder it.
    </p>
    {#if error}<p class="error-text" role="alert">{error}</p>{/if}
    <footer>
      {#if id}<button
          type="button"
          class="danger"
          onclick={() => {
            ws.mutate((b) => removeFolder(b, id!), 'Folder removed. Its contents were kept.');
            if (!ws.error) onclose();
            else error = ws.error;
          }}>Remove folder, keep contents</button
        >{/if}<button class="quiet" type="button" onclick={onclose}>Cancel</button><button
        class="primary"
        type="submit">{id ? 'Save folder' : 'Create folder'}</button
      >
    </footer>
  </form>
</Modal>
