<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Plus,
    ArrowUpRight,
    Upload,
    MoreHorizontal,
    Sun,
    Moon,
    Feather,
    ArrowRight,
    FolderOpen
  } from '@lucide/svelte';
  import Modal from '#lib/components/Modal.svelte';
  import { product } from '#lib/product';
  import { dismissMenu } from '#lib/application/interactions';
  import { api, readImport } from '#lib/application/files';
  import { validateBundle, type Bundle } from '#lib/domain/model';
  type ProjectSummary = { id: string; title: string; description: string; updatedAt: string };
  let projects = $state<ProjectSummary[]>([]);
  let loading = $state(true);
  let busy = $state(false);
  let error = $state('');
  let modal = $state<'create' | 'rename' | 'delete' | 'import' | null>(null);
  let selected = $state<ProjectSummary | null>(null);
  let title = $state('');
  let importBundle = $state<Bundle | null>(null);
  let fileInput: HTMLInputElement;
  async function refresh() {
    try {
      projects = await api<ProjectSummary[]>('/api/projects');
      error = '';
    } catch (e) {
      error = String(e);
    }
    loading = false;
  }
  onMount(() => {
    void refresh();
  });
  async function create(mode: 'blank' | 'demo' | 'import') {
    busy = true;
    error = '';
    try {
      const b = await api<Bundle>('/api/projects', 'POST', {
        mode,
        title: mode === 'demo' ? undefined : title || undefined,
        bundle: mode === 'import' ? importBundle : undefined
      });
      await goto(`/project/${b.project.id}`);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    busy = false;
  }
  async function rename() {
    if (!selected) return;
    busy = true;
    try {
      const b = await api<Bundle>(`/api/projects/${selected.id}`);
      b.project.title = title;
      await api(`/api/projects/${selected.id}`, 'PUT', { bundle: b, revision: b.project.revision });
      modal = null;
      await refresh();
    } catch (e) {
      error = String(e);
    }
    busy = false;
  }
  async function duplicate(p: ProjectSummary) {
    busy = true;
    try {
      const b = await api<Bundle>(`/api/projects/${p.id}`);
      await api('/api/projects', 'POST', { mode: 'import', title: `${p.title} (copy)`, bundle: b });
      await refresh();
    } catch (e) {
      error = String(e);
    }
    busy = false;
  }
  async function remove() {
    if (!selected) return;
    busy = true;
    try {
      await api(`/api/projects/${selected.id}`, 'DELETE');
      localStorage.removeItem(`storygraph:draft:${selected.id}`);
      modal = null;
      await refresh();
    } catch (e) {
      error = String(e);
    }
    busy = false;
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      importBundle = validateBundle(await readImport(file));
      title = importBundle.project.title;
      modal = 'import';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    fileInput.value = '';
  }
  function theme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('storygraph:theme', next);
  }
</script>

<svelte:head
  ><title>{product.name} · Your stories</title><meta
    name="description"
    content="A private, thoughtful workspace for stories, worlds, and the ways they change."
  /></svelte:head
>
<div class="dashboard">
  <header class="dashboard-header">
    <a href="/" class="brand" aria-label={product.name}
      ><img src="/favicon.svg" alt="" width="34" height="34" /><span
        >Warp &amp; Weft<small>Worldbuilder</small></span
      ></a
    >
    <div>
      <span class="small muted desktop-only">A private space for your imagination</span><button
        class="icon-button"
        aria-label="Switch color theme"
        onclick={theme}
        ><Sun size={18} class="light-icon" /><Moon size={18} class="dark-icon" /></button
      >
    </div>
  </header>
  <main class="dashboard-main">
    <section class="welcome">
      <div>
        <span class="eyebrow"><span class="little-star">✧</span> THE NEXT CHAPTER IS YOURS</span>
        <h1>Every world begins<br />with a <em>what if.</em></h1>
        <p>
          Gather the people, places, and possibilities.<br />See how they change. Give your story
          room to grow.
        </p>
        <div class="welcome-actions">
          <button
            class="primary"
            disabled={busy || loading}
            onclick={() => {
              title = '';
              modal = 'create';
            }}><Plus size={17} /> Start a story</button
          ><button class="text-button" disabled={busy || loading} onclick={() => create('demo')}
            >Explore the demo <ArrowUpRight size={17} /></button
          >
        </div>
      </div>
      <div class="welcome-art" aria-hidden="true">
        <svg viewBox="0 0 430 310" fill="none"
          ><path
            d="M47 230C47 160 95 180 142 143S215 132 244 82 335 50 383 100"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-dasharray="4 6"
          /><path
            d="M142 143C180 215 226 201 275 242"
            stroke="currentColor"
            stroke-width="1.4"
          /><circle cx="142" cy="143" r="30" fill="var(--bg)" stroke="currentColor" /><circle
            cx="244"
            cy="82"
            r="24"
            fill="var(--bg)"
            stroke="currentColor"
          /><circle cx="275" cy="242" r="18" fill="var(--bg)" stroke="currentColor" /><path
            d="m132 143 10-13 10 13-10 10zM236 82h16M244 74v16M267 242h16M275 234v16"
            stroke="currentColor"
            stroke-width="1.5"
          /><circle cx="47" cy="230" r="4" fill="currentColor" /><circle
            cx="383"
            cy="100"
            r="4"
            fill="currentColor"
          /><text
            x="105"
            y="199"
            fill="currentColor"
            font-family="Georgia"
            font-size="15"
            font-style="italic">a beginning</text
          ><text
            x="284"
            y="70"
            fill="currentColor"
            font-family="Georgia"
            font-size="15"
            font-style="italic">a possibility</text
          ><text
            x="302"
            y="248"
            fill="currentColor"
            font-family="Georgia"
            font-size="15"
            font-style="italic">a little unknown</text
          ></svg
        >
      </div>
    </section>
    <section class="project-section">
      <header>
        <div>
          <h2>Your stories</h2>
          <span class="small muted">All the worlds you’re making.</span>
        </div>
        <button class="secondary" onclick={() => fileInput.click()}
          ><Upload size={15} /> Import a story</button
        >
      </header>
      {#if error}<div class="error-banner" role="alert">
          {error}<button onclick={refresh}>Retry</button>
        </div>{/if}
      {#if loading}<p class="muted">Opening your story shelf…</p>{:else if projects.length}
        <div class="project-grid">
          {#each projects as p (p.id)}<article class="project-card">
              <div class="project-card-top">
                <span class="project-emblem"><Feather size={22} /></span>
                <details class="project-menu" use:dismissMenu>
                  <summary aria-label={`Options for ${p.title}`}
                    ><MoreHorizontal size={19} /></summary
                  >
                  <div>
                    <button
                      onclick={() => {
                        selected = p;
                        title = p.title;
                        modal = 'rename';
                      }}>Rename</button
                    ><button disabled={busy || loading} onclick={() => duplicate(p)}
                      >Duplicate</button
                    ><button
                      class="danger-text"
                      onclick={() => {
                        selected = p;
                        modal = 'delete';
                      }}>Delete</button
                    >
                  </div>
                </details>
              </div>
              <a href={`/project/${p.id}`}
                ><h3>{p.title}</h3>
                <p>{p.description || 'A world waiting for its first words.'}</p>
                <footer>
                  <span
                    >Edited {new Date(p.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}</span
                  ><ArrowRight size={17} />
                </footer></a
              >
            </article>{/each}<button
            class="new-project-card"
            onclick={() => {
              title = '';
              modal = 'create';
            }}><Plus size={24} /><span>A new possibility</span></button
          >
        </div>
      {:else}<div class="dashboard-empty">
          <FolderOpen size={25} />
          <div>
            <h3>A shelf ready for your first story.</h3>
            <p>Start with a blank canvas, explore the demo, or bring a worldbuilder export.</p>
          </div>
        </div>{/if}
    </section>
    <section class="dashboard-note">
      <span>✧</span>
      <p>
        Start small. A character, a place, a moment.<br /><strong>The connections will come.</strong
        >
      </p>
      <span class="small muted">Local by default. Yours, always.</span>
    </section>
  </main>
  <footer class="dashboard-footer">
    <span>{product.name} · {product.version}</span><span
      >No accounts. No tracking. Just your story.</span
    >
  </footer>
</div>
<input
  class="visually-hidden"
  type="file"
  accept=".json,application/json"
  bind:this={fileInput}
  onchange={(e) => importFile(e.currentTarget.files?.[0])}
  aria-label="Import worldbuilder file"
/>
{#if modal}<Modal
    title={modal === 'create'
      ? 'A new story'
      : modal === 'rename'
        ? 'Rename your story'
        : modal === 'import'
          ? 'Bring your story home'
          : 'Delete this story?'}
    onclose={() => (modal = null)}
    ><form
      class="dialog-form"
      onsubmit={(e) => {
        e.preventDefault();
        if (modal === 'create') void create('blank');
        if (modal === 'rename') void rename();
        if (modal === 'delete') void remove();
        if (modal === 'import') void create('import');
      }}
    >
      {#if modal === 'delete'}<p>
          “{selected?.title}” and all its writing will be removed from this database. Export a copy
          first if you want to keep it.
        </p>{:else}<label
          >Story title<input
            bind:value={title}
            required
            maxlength="240"
            placeholder="What will you call this world?"
          /></label
        >{/if}
      {#if modal === 'import' && importBundle}<p class="field-help">
          Validated format v1 · {importBundle.entities.length} entities · {importBundle.units
            .length} moments · {importBundle.documents.length} documents. This creates a separate project
          and preserves all story references and layouts.
        </p>{/if}
      {#if error}<p class="error-text" role="alert">{error}</p>{/if}
      <footer>
        <button type="button" class="quiet" onclick={() => (modal = null)}>Cancel</button><button
          class={modal === 'delete' ? 'danger' : 'primary'}
          disabled={busy || loading}
          type="submit"
          >{busy
            ? 'Working…'
            : modal === 'delete'
              ? 'Delete story'
              : modal === 'rename'
                ? 'Save name'
                : modal === 'import'
                  ? 'Import story'
                  : 'Create story'}</button
        >
      </footer>
    </form></Modal
  >{/if}
