<script lang="ts">
  import { onMount } from 'svelte';
  let preference = $state('system');
  onMount(() => (preference = document.documentElement.dataset.motion ?? 'system'));
  function update() {
    document.documentElement.dataset.motion = preference;
    localStorage.setItem('warp-weft:motion', preference);
  }
</script>

<label
  >Animation style<select bind:value={preference} onchange={update}
    ><option value="system">Follow device preference</option><option value="full"
      >Smooth motion</option
    ><option value="reduced">Reduced motion</option></select
  ></label
>
<p class="field-help">
  Smooth motion animates panes, folders, lists, and the canvas. Follow device preference respects
  your system’s reduced-motion setting.
</p>
