<script lang="ts">
  import { Search } from '@lucide/svelte';
  import Modal from './Modal.svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import type { CreateKind } from './CreateDialog.svelte';
  import { lenses } from '#lib/domain/projections';
  import { exportProject } from '#lib/application/files';
  let {
    ws,
    onclose,
    oncreate,
    onbulkadd,
    onissues,
    onfit
  }: {
    ws: Workspace;
    onclose: () => void;
    oncreate: (kind: CreateKind) => void;
    onbulkadd: () => void;
    onissues: () => void;
    onfit: () => void;
  } = $props();
  let query = $state('');
  const commands = $derived(
    [
      ...(['unit', 'entity', 'thread', 'placeholder', 'event', 'relationship'] as CreateKind[]).map(
        (kind) => ({
          title: `Create ${kind === 'unit' ? 'scene' : kind}`,
          type: 'Command',
          run: () => oncreate(kind)
        })
      ),
      ...lenses.map((lens) => ({
        title: `Switch to ${lens} lens`,
        type: 'Lens',
        run: () => (ws.lens = lens)
      })),
      { title: 'Bulk add entities', type: 'Command', run: onbulkadd },
      {
        title: 'Toggle temporal / whole story',
        type: 'View',
        run: () => (ws.temporal = !ws.temporal)
      },
      { title: 'Open unresolved items & continuity', type: 'Command', run: onissues },
      { title: 'Fit graph', type: 'View', run: onfit },
      {
        title: 'Export project',
        type: 'Command',
        run: () => {
          if (ws.bundle) exportProject(ws.bundle);
        }
      },
      ...(ws.bundle?.entities ?? []).map((e) => ({
        title: e.name,
        type: 'Entity',
        search: e.summary + ' ' + e.description,
        run: () => ws.navigate({ kind: 'entity', id: e.id })
      })),
      ...(ws.bundle?.units ?? []).map((u) => ({
        title: u.title,
        type: u.type,
        search:
          u.synopsis + ' ' + (ws.bundle?.documents.find((d) => d.unitId === u.id)?.text ?? ''),
        run: () => ws.navigate({ kind: 'unit', id: u.id })
      })),
      ...(ws.bundle?.events ?? []).map((e) => ({
        title: e.title,
        type: 'Event',
        search: e.description,
        run: () => ws.select({ kind: 'event', id: e.id })
      })),
      ...(ws.bundle?.threads ?? []).map((t) => ({
        title: t.name,
        type: 'Thread',
        search: t.description,
        run: () => ws.select({ kind: 'thread', id: t.id })
      }))
    ]
      .filter((c) =>
        `${c.title} ${'search' in c ? c.search : ''}`.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 80)
  );
  function run(index: number) {
    const c = commands[index];
    if (c) {
      onclose();
      c.run();
    }
  }
</script>

<Modal title="Find a thread. Follow a thought." {onclose}>
  <div class="command-search">
    <Search size={19} /><input
      aria-label="Search commands and story"
      bind:value={query}
      placeholder="Search your story or type a command…"
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          run(0);
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          document.querySelector<HTMLButtonElement>('.command-results button')?.focus();
        }
      }}
    /><kbd>esc</kbd>
  </div>
  <div class="command-results">
    {#each commands as command, i (i)}<button
        onclick={() => run(i)}
        onkeydown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.focus();
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            (e.currentTarget.previousElementSibling as HTMLButtonElement | null)?.focus();
          }
        }}><span>{command.title}</span><small>{command.type}</small></button
      >{/each}{#if !commands.length}<p class="field-help">No matches. Try a different word.</p>{/if}
  </div>
</Modal>
