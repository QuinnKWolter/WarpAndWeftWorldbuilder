<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  let { children } = $props();
  onMount(() => {
    document.documentElement.dataset.theme = localStorage.getItem('storygraph:theme') ?? 'light';
    document.documentElement.dataset.motion = localStorage.getItem('warp-weft:motion') ?? 'system';
  });
</script>

{@render children()}
