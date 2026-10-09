<script lang="ts">
  import { onMount } from 'svelte';
  import { Editor, type JSONContent } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Markdown } from '@tiptap/markdown';
  import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Undo2,
    Redo2,
    Maximize2,
    Minimize2,
    X,
    Link,
    Minus,
    Download,
    Search,
    Plus
  } from '@lucide/svelte';
  import { type Json, type Selection } from '#lib/domain/model';
  import type { Workspace } from '#lib/application/workspace.svelte';
  import { StoryReference } from '#lib/application/story-reference';
  import {
    saveDocument,
    references,
    expandReferences,
    documentMarkdown,
    referenceSyntax,
    referenceSelection
  } from '#lib/domain/manuscript';
  import { download } from '#lib/application/files';
  import ReferencePicker from './ReferencePicker.svelte';
  let {
    ws,
    unitId,
    expanded,
    onexpand,
    onclose,
    onreference
  }: {
    ws: Workspace;
    unitId: string;
    expanded: boolean;
    onexpand: () => void;
    onclose: () => void;
    onreference?: (selection: Selection) => void;
  } = $props();
  let surface: HTMLDivElement;
  let source = $state<HTMLTextAreaElement>();
  let editor = $state.raw<Editor>();
  let version = $state(0);
  let mode = $state<'write' | 'markdown' | 'read'>('write');
  let markdown = $state('');
  let hidden = $state(false);
  let picker = $state(false);
  let findOpen = $state(false);
  let needle = $state('');
  let replacement = $state('');
  let findMessage = $state('');
  let linkOpen = $state(false);
  let url = $state('');
  const unit = $derived(ws.bundle?.units.find((u) => u.id === unitId));
  const document = $derived(ws.bundle?.documents.find((d) => d.unitId === unitId));
  const refs = $derived(document ? references(document.content) : []);
  const words = $derived(document?.text.trim() ? document.text.trim().split(/\s+/).length : 0);
  function sync() {
    if (!editor) return;
    const content = editor.getJSON() as Json;
    const currentMarkdown = editor.getMarkdown();
    if (mode !== 'markdown') markdown = currentMarkdown;
    ws.mutate((b) => saveDocument(b, unitId, content, currentMarkdown), 'Prose updated', false);
    version++;
  }
  function sourceChanged() {
    if (!editor) return;
    editor.commands.setContent(markdown, { contentType: 'markdown' });
  }
  function view(next: typeof mode) {
    if (!editor) return;
    if (mode !== 'markdown') markdown = editor.getMarkdown();
    mode = next;
    editor.setEditable(next !== 'read');
  }
  function insert(object: { id: string; kind: Selection['kind']; label: string }) {
    if (!editor) return;
    if (mode === 'markdown') {
      const start = source?.selectionStart ?? markdown.length;
      const end = source?.selectionEnd ?? start;
      markdown =
        markdown.slice(0, start) +
        referenceSyntax(object.kind, object.id, object.label.slice(0, 240)) +
        markdown.slice(end);
      sourceChanged();
      source?.focus();
    } else {
      if (mode === 'read') view('write');
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'storyReference',
          attrs: { objectId: object.id, kind: object.kind, label: object.label.slice(0, 240) }
        })
        .run();
    }
    picker = false;
  }
  function expand() {
    if (!document || !ws.bundle || !editor) return;
    const content = expandReferences(ws.bundle, document.content);
    ws.mutate(
      (b) => saveDocument(b, unitId, content),
      'Placeholders expanded into draft text. Undo is available.'
    );
    markdown = documentMarkdown(content, true);
  }
  function find(replace = false) {
    if (!editor || !needle) {
      findMessage = 'Enter text to find.';
      return;
    }
    if (mode === 'markdown') {
      const index = markdown.indexOf(needle);
      if (index < 0) {
        findMessage = 'No matches.';
        return;
      }
      if (replace) {
        markdown = markdown.slice(0, index) + replacement + markdown.slice(index + needle.length);
        sourceChanged();
      } else {
        source?.focus();
        source?.setSelectionRange(index, index + needle.length);
      }
      findMessage = replace ? 'Replaced one match.' : 'Match selected.';
      return;
    }
    const start = editor.state.selection.to;
    const matches: { from: number; to: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText) {
        let i = node.text!.indexOf(needle);
        while (i >= 0) {
          matches.push({ from: pos + i, to: pos + i + needle.length });
          i = node.text!.indexOf(needle, i + needle.length);
        }
      }
    });
    const match = matches.find((m) => m.from >= start) ?? matches[0] ?? null;
    if (!match) {
      findMessage = 'No matches.';
      return;
    }
    if (replace && mode !== 'read')
      editor
        .chain()
        .focus()
        .insertContentAt(match, replacement ? { type: 'text', text: replacement } : '')
        .run();
    else editor.chain().focus().setTextSelection(match).run();
    findMessage = replace ? 'Replaced one match.' : 'Match selected.';
  }
  function addLink() {
    if (!editor || !/^https?:\/\//i.test(url)) {
      findMessage = 'Use an http or https URL.';
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    linkOpen = false;
  }
  const active = (mark: string) => {
    void version;
    return editor?.isActive(mark) ?? false;
  };
  $effect(() => {
    if (
      editor &&
      document &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(document.content)
    ) {
      editor.commands.setContent(document.content as JSONContent, { emitUpdate: false });
      markdown = editor.getMarkdown();
      version++;
    }
  });
  onMount(() => {
    editor = new Editor({
      element: surface,
      extensions: [
        StarterKit.configure({ link: { openOnClick: false } }),
        StoryReference,
        Markdown
      ],
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
        },
        handleClick: (_view, _pos, event) => {
          const element =
            event.target instanceof Element ? event.target.closest('[data-story-reference]') : null;
          const id = element?.getAttribute('data-story-reference');
          if (id && ws.bundle && event.detail === 2) {
            const selection = referenceSelection(ws.bundle, id);
            if (selection) onreference?.(selection);
            return true;
          }
          return false;
        }
      },
      onUpdate: sync,
      onSelectionUpdate: () => version++,
      onBlur: () => void ws.flush()
    });
    markdown = editor.getMarkdown();
    return () => editor?.destroy();
  });
</script>

<section
  class="writing-panel"
  class:expanded
  class:hide-placeholders={hidden}
  aria-label="Scene writing workspace"
>
  <header>
    <div>
      <span class="eyebrow">THE PAGE · {unit?.type ?? 'scene'}</span>
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
  <div class="manuscript-modes" role="group" aria-label="Editor mode">
    {#each ['write', 'markdown', 'read'] as tab (tab)}<button
        class:active={mode === tab}
        aria-pressed={mode === tab}
        onclick={() => view(tab as typeof mode)}
        >{tab === 'write' ? 'Rich text' : tab === 'markdown' ? 'Markdown' : 'Read'}</button
      >{/each}<button aria-pressed={hidden} onclick={() => (hidden = !hidden)}
      >{hidden ? 'Show placeholders' : 'Hide placeholders'}</button
    ><button
      onclick={() =>
        download(
          documentMarkdown((editor?.getJSON() ?? { type: 'doc', content: [] }) as Json, !hidden),
          (unit?.title ?? 'Scene') + '.md',
          'text/markdown'
        )}><Download size={14} /> Export page</button
    >
  </div>
  <div class="editor-toolbar" role="toolbar" aria-label="Prose formatting">
    {#if mode === 'write'}
      <select
        aria-label="Text style"
        value={String(active('heading') ? (editor?.getAttributes('heading').level ?? 0) : 0)}
        onchange={(e) => {
          const level = Number(e.currentTarget.value);
          if (level)
            editor
              ?.chain()
              .focus()
              .toggleHeading({ level: level as 1 | 2 | 3 })
              .run();
          else editor?.chain().focus().setParagraph().run();
        }}
        ><option value="0">Paragraph</option><option value="1">Heading 1</option><option value="2"
          >Heading 2</option
        ><option value="3">Heading 3</option></select
      >
      <button
        class="icon-button"
        aria-label="Bold"
        aria-pressed={active('bold')}
        onclick={() => editor?.chain().focus().toggleBold().run()}><Bold size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Italic"
        aria-pressed={active('italic')}
        onclick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Strikethrough"
        aria-pressed={active('strike')}
        onclick={() => editor?.chain().focus().toggleStrike().run()}
        ><Strikethrough size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Inline code"
        onclick={() => editor?.chain().focus().toggleCode().run()}><Code size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Bullet list"
        aria-pressed={active('bulletList')}
        onclick={() => editor?.chain().focus().toggleBulletList().run()}><List size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Numbered list"
        aria-pressed={active('orderedList')}
        onclick={() => editor?.chain().focus().toggleOrderedList().run()}
        ><ListOrdered size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Block quote"
        onclick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Horizontal rule"
        onclick={() => editor?.chain().focus().setHorizontalRule().run()}
        ><Minus size={15} /></button
      >
      <button class="icon-button" aria-label="Add link" onclick={() => (linkOpen = !linkOpen)}
        ><Link size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Undo prose"
        onclick={() => editor?.chain().focus().undo().run()}><Undo2 size={15} /></button
      >
      <button
        class="icon-button"
        aria-label="Redo prose"
        onclick={() => editor?.chain().focus().redo().run()}><Redo2 size={15} /></button
      >
    {/if}
    <button class="secondary compact" onclick={() => (picker = true)}
      ><Plus size={14} /> Insert placeholder</button
    >
    <button
      class="icon-button"
      aria-label="Find and replace prose"
      onclick={() => (findOpen = !findOpen)}><Search size={15} /></button
    >
    {#if refs.length && mode !== 'read'}<button class="text-button small" onclick={expand}
        >Expand placeholders ({refs.length})</button
      >{/if}
  </div>
  {#if linkOpen}<div class="editor-find">
      <label>Link URL<input aria-label="Link URL" bind:value={url} placeholder="https://…" /></label
      ><button class="secondary" onclick={addLink}>Apply link</button><button
        class="quiet"
        onclick={() => {
          editor?.chain().focus().unsetLink().run();
          linkOpen = false;
        }}>Remove link</button
      >
      <span class="small muted" role="status">{findMessage}</span>
    </div>{/if}
  {#if findOpen}<div class="editor-find">
      <label>Find<input bind:value={needle} /></label><label
        >Replace with<input bind:value={replacement} /></label
      ><button class="secondary" onclick={() => find()}>Find next</button><button
        class="secondary"
        disabled={mode === 'read'}
        onclick={() => find(true)}>Replace next</button
      ><span class="small muted" aria-live="polite">{findMessage}</span>
    </div>{/if}
  <div class="prose-scroll">
    <div style:display={mode === 'markdown' ? 'none' : 'block'} bind:this={surface}></div>
    {#if mode === 'markdown'}<label class="markdown-source-label"
        ><span class="sr-only">Markdown source</span><textarea
          class="markdown-source"
          aria-label="Markdown source"
          bind:this={source}
          bind:value={markdown}
          oninput={sourceChanged}
          spellcheck="true"></textarea></label
      >
      <p class="field-help source-help">
        Markdown supports headings, lists, quotes, links, code and formatting. Story tokens preserve
        linked placeholders when switching back to rich text.
      </p>{/if}
  </div>
  {#if refs.length && !hidden}<footer class="reference-links">
      <span class="small muted">Planning references</span>{#each refs as ref, i (i)}<button
          class="text-button small"
          onclick={() => {
            if (!ws.bundle) return;
            const selection = referenceSelection(ws.bundle, ref.objectId);
            if (selection) onreference?.(selection);
            else
              ws.message =
                'This referenced object was removed. Its placeholder label is preserved.';
          }}
          >{ref.label}{ws.bundle && referenceSelection(ws.bundle, ref.objectId)
            ? ''
            : ' (missing)'}</button
        >{/each}
    </footer>{/if}
</section>
{#if picker && ws.bundle}<ReferencePicker
    bundle={ws.bundle}
    onchoose={insert}
    onclose={() => (picker = false)}
  />{/if}
