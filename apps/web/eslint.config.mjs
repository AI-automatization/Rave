import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'tests/**', '**/*.spec.ts', '**/*.spec.js'],
  },
  {
    // The application (merged in from apps/app-web, which ran on Next 14 / eslint 8) was never
    // linted by eslint-plugin-react-hooks v7's React-Compiler rules. They flag 90+ existing
    // patterns (ref-in-render, setState-in-effect) that need a human checking behaviour in a
    // browser per fix, not a blind edit. Warn, not error, for the ported files only — landing
    // code keeps the strict setting. Remove this block as those files get cleaned up.
    files: [
      'src/app/(webapp)/**', 'src/hooks/**',
      'src/components/{friends,home,messages,party,profile,rooms,ui,common}/**',
    ],
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
    },
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
