import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'tests/**', '**/*.spec.ts', '**/*.spec.js'],
  },
  {
    rules: {
      // src/app/uz/guides/* has real Uzbek apostrophes JSX read as unescaped entities without this.
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
];

export default eslintConfig;
