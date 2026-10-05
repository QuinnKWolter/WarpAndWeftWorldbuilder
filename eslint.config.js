import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
export default ts.config(
  {
    ignores: [
      'node_modules/**',
      '.svelte-kit/**',
      'build/**',
      'data/**',
      'drizzle/**',
      'playwright-report/**',
      'test-results/**'
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'svelte/no-navigation-without-resolve': 'off'
    }
  },
  { files: ['**/*.svelte'], languageOptions: { parserOptions: { parser: ts.parser } } },
  { files: ['**/*.svelte.ts'], languageOptions: { parser: ts.parser } }
);
