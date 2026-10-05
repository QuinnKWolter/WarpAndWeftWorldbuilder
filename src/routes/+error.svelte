<script lang="ts">
  import { page } from '$app/state';
</script>

<main class="error-page">
  <span class="eyebrow">STORYGRAPH</span>
  <h1>That page slipped out of the story.</h1>
  <p>{page.error?.message ?? 'Something went wrong.'}</p>
  <a href="/" class="primary">Back to your stories</a>
</main>
