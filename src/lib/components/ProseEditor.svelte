<script lang="ts">
  import { onMount } from 'svelte';
  import { Editor, type JSONContent } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Bold, Italic, List, Quote, Undo2, Redo2, Maximize2, Minimize2, X } from '@lucide/svelte';
  import { base, type Json } from '#lib/domain/model';
  import type { Workspace } from '#lib/application/workspace.svelte';
  let {
    ws,
    unitId,
    expanded,
    onexpand,
    onclose
  }: {
    ws: Workspace;
    unitId: string;
    expanded: boolean;
    onexpand: () => void;
    onclose: () => void;
  } = $props();
  let surface: HTMLDivElement;
  let editor = $state.raw<Editor>();
  let words = $state(0);
  let mention = $state('');
  let focused = $state(false);
  const unit = $derived(ws.bundle?.units.find((u) => u.id === unitId));
  function sync() {
    if (!editor) return;
    const content = editor.getJSON() as Json;
    const text = editor.getText();
    words = text.trim() ? text.trim().split(/\s+/).length : 0;
    ws.mutate(
      (b) => {
        let document = b.documents.find((d) => d.unitId === unitId);
        if (document) {
          document.content = content;
          document.text = text;
        } else {
          document = { ...base(), unitId, content, text };
          b.documents.push(document);
        }
      },
      'Prose saved',
      false
    );
  }
  function reference() {
    const entity = ws.bundle?.entities.find((e) => e.id === mention);
    if (!entity || !editor) return;
    editor.chain().focus().insertContent(`@${entity.name} `).run();
    ws.mutate(
      (b) => {
        const document = b.documents.find((d) => d.unitId === unitId);
        if (
          document &&
          !b.mentions.some((m) => m.documentId === document.id && m.entityId === entity.id)
        )
          b.mentions.push({ ...base(), documentId: document.id, entityId: entity.id });
      },
      'Entity reference added',
      false
    );
    mention = '';
  }
  $effect(() => {
    const document = ws.bundle?.documents.find((d) => d.unitId === unitId);
    if (
      editor &&
      document &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(document.content)
    ) {
      editor.commands.setContent(document.content as JSONContent, { emitUpdate: false });
      words = document.text.trim() ? document.text.trim().split(/\s+/).length : 0;
    }
  });
  onMount(() => {
    const document = ws.bundle?.documents.find((d) => d.unitId === unitId);
    editor = new Editor({
      element: surface,
      extensions: [StarterKit.configure({ link: { openOnClick: false } })],
      content: (document?.content as JSONContent) ?? {
        type: 'doc',
        content: [{ type: 'paragraph' }]
      },
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': 'Scene prose',
          'aria-multiline': 'true',
          class: 'prose-surface'
        }
      },
      onUpdate: sync,
      onFocus: () => (focused = true),
      onBlur: () => {
        focused = false;
        void ws.flush();
      }
    });
    words = document?.text.trim() ? document.text.trim().split(/\s+/).length : 0;
    return () => {
      editor?.destroy();
    };
  });
</script>

<section class="writing-panel" class:expanded aria-label="Scene writing workspace">
  <header>
    <div>
      <span class="eyebrow">THE PAGE</span>
      <h3>{unit?.title}</h3>
    </div>
    <div class="editor-meta">
      <span>{words} words</span><button
        class="icon-button"
        aria-label={expanded ? 'Leave focus writing' : 'Focus writing'}
        onclick={onexpand}
        >{#if expanded}<Minimize2 size={16} />{:else}<Maximize2 size={16} />{/if}</button
      ><button class="icon-button" aria-label="Close writing workspace" onclick={onclose}
        ><X size={16} /></button
      >
    </div>
  </header>
  <div class="editor-toolbar" role="toolbar" aria-label="Prose formatting">
    <button
      class="icon-button"
      aria-label="Bold"
      onclick={() => editor?.chain().focus().toggleBold().run()}><Bold size={15} /></button
    >
    <button
      class="icon-button"
      aria-label="Italic"
      onclick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={15} /></button
    >
    <button
      class="icon-button"
      aria-label="Bullet list"
      onclick={() => editor?.chain().focus().toggleBulletList().run()}><List size={15} /></button
    >
    <button
      class="icon-button"
      aria-label="Block quote"
      onclick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={15} /></button
    >
    <span class="toolbar-divider"></span>
    <button
      class="icon-button"
      aria-label="Undo prose"
      onclick={() => editor?.chain().focus().undo().run()}><Undo2 size={15} /></button
    ><button
      class="icon-button"
      aria-label="Redo prose"
      onclick={() => editor?.chain().focus().redo().run()}><Redo2 size={15} /></button
    >
    <select aria-label="Mention an entity" bind:value={mention} onchange={reference}
      ><option value="">@ Reference an entity</option
      >{#each ws.bundle?.entities ?? [] as e (e.id)}<option value={e.id}>{e.name}</option
        >{/each}</select
    ><span class="small muted"
      >{focused ? 'Let the story find its way.' : 'Your words save as you go.'}</span
    >
  </div>
  <div class="prose-scroll"><div bind:this={surface}></div></div>
  {#if ws.bundle?.mentions.some((m) => ws.bundle?.documents.find((d) => d.unitId === unitId)?.id === m.documentId)}<footer
      class="reference-links"
    >
      <span class="small muted">References</span
      >{#each ws.bundle.mentions.filter((m) => ws.bundle?.documents.find((d) => d.unitId === unitId)?.id === m.documentId) as m (m.id)}<button
          class="text-button small"
          onclick={() => ws.navigate({ kind: 'entity', id: m.entityId })}
          >@{ws.bundle.entities.find((e) => e.id === m.entityId)?.name}</button
        >{/each}
    </footer>{/if}
</section>
