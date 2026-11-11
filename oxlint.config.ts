import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'unicorn'],
  env: {
    browser: true,
    node: true,
  },
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  rules: {
    'typescript/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'unicorn/prefer-global-this': 'error',
  },
  ignorePatterns: ['**/dist/**', '**/.astro/**', 'coverage'],
});
