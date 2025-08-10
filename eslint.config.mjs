import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules', '.next', 'coverage', 'dist', 'prisma/seed.cjs']
  },
  { ...js.configs.recommended, languageOptions: { ...js.configs.recommended.languageOptions, sourceType: 'module' } },
  // TypeScript rules only for TS files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...tseslint.configs.recommended[1].rules,
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  // Node JS config files
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs', 'next.config.mjs', 'eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    },
    rules: { '@typescript-eslint/no-var-requires': 'off' }
  },
  // Service worker file
  {
    files: ['public/sw.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.serviceworker
    }
  },
  prettier
];
