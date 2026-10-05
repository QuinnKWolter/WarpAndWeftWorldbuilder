<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { X } from '@lucide/svelte';
  let {
    title,
    onclose,
    children,
    wide = false
  }: { title: string; onclose: () => void; children: Snippet; wide?: boolean } = $props();
  let dialog: HTMLDialogElement;
  onMount(() => {
    dialog.showModal();
    dialog.querySelector<HTMLElement>('input,textarea,select')?.focus();
    return () => dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  class:wide
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
  onclick={(e) => {
    if (e.target === dialog) onclose();
  }}
>
  <header>
    <h2>{title}</h2>
    <button class="icon-button" aria-label="Close dialog" onclick={onclose}><X size={18} /></button>
  </header>
  {@render children()}
</dialog>
