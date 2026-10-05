import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
  optimizeDeps: {
    include: ['@xyflow/svelte', '@tiptap/core', '@tiptap/starter-kit', 'elkjs/lib/elk.bundled.js']
  },
  server: {
    watch: {
      ignored: ['**/data/**', '**/build/**', '**/test-results/**', '**/playwright-report/**']
    }
  },
  plugins: [tailwindcss(), sveltekit({ adapter: adapter(), preprocess: vitePreprocess() })]
});
