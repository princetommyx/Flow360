import next from 'eslint-config-next';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'src/generated/**', 'next-env.d.ts'],
  },
  ...next,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Scripts intentionally report progress to the terminal.
    files: ['prisma/**/*.ts', 'scripts/**/*.{ts,mjs}', '*.mjs'],
    rules: { 'no-console': 'off' },
  },
];

export default eslintConfig;
