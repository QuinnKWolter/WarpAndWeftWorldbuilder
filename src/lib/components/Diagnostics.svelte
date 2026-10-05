<script lang="ts">
  import { TriangleAlert, CircleHelp, ArrowUpRight } from '@lucide/svelte';
  import Modal from './Modal.svelte';
  import type { Workspace } from '#lib/application/workspace.svelte';
  let { ws, onclose }: { ws: Workspace; onclose: () => void } = $props();
</script>

<Modal title="A little continuity check" {onclose} wide>
  <p class="dialog-intro">
    These observations come from the state you’ve modeled. A delayed reveal or an unanswered
    question may be exactly what your story needs.
  </p>
  <div class="diagnostics-list">
    {#each ws.issues as issue (issue.id)}<button
        onclick={() => {
          ws.navigate(issue.selection);
          onclose();
        }}
        >{#if issue.severity === 'warning'}<TriangleAlert size={19} />{:else}<CircleHelp
            size={19}
          />{/if}
        <div>
          <span class="eyebrow"
            >{issue.severity === 'warning' ? 'REVIEW CONTINUITY' : 'A LOOSE THREAD'} · {issue.rule}</span
          >
          <p>{issue.message}</p>
        </div>
        <ArrowUpRight size={16} /></button
      >{/each}{#if !ws.issues.length}<div class="inspector-empty">
        <span class="ornament">✧</span>
        <h3>The modeled pieces line up.</h3>
        <p>No issues found by the current rules.</p>
      </div>{/if}
  </div>
</Modal>
