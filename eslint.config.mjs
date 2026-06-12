import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import spokeRules from '@spoke/eslint-rules';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '.nx/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['libs/ui-web/**/*.{ts,tsx}', 'libs/ui-native/**/*.{ts,tsx}'],
    ignores: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.stories.tsx'],
    plugins: { spoke: spokeRules },
    rules: {
      'spoke/no-raw-colors': 'error',
      'no-magic-numbers': [
        'error',
        { ignore: [-1, 0, 1, 2, 100], ignoreArrayIndexes: true, ignoreDefaultValues: true },
      ],
    },
  },
);
