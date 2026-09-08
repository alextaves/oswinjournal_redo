import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'carousel/vendor']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // The carousel is classic scripts, not modules: covers.js, fiction_stories.js
    // and interviews.js are loaded with plain <script> tags and share one global
    // scope with the inline script in each page. Linted per file, anything the
    // HTML calls looks unused and anything the HTML defines looks undefined —
    // neither is true, and neither is something the linter can see.
    files: ['carousel/*.js'],
    languageOptions: { globals: globals.browser, sourceType: 'script' },
    rules: { 'no-unused-vars': 'off', 'no-undef': 'off' },
  },
])
