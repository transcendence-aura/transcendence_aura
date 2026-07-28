// Frontend ESLint config (self-contained).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  { ignores: ['**/node_modules/**', '**/.next/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  {
    settings: {
      react: {
        version: '19.2',
      },
    },
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
]);
