import blitzPlugin from '@blitz/eslint-plugin';
import { jsFileExtensions } from '@blitz/eslint-plugin/dist/configs/javascript.js';
import { getNamingConventionRule, tsFileExtensions } from '@blitz/eslint-plugin/dist/configs/typescript.js';

export default [
  // 1. Global ignore patterns
  {
    ignores: ['**/dist', '**/build', '**/node_modules', '**/.wrangler', '**/bolt/build'],
  },

  // 2. Core Blitz recommended base
  ...blitzPlugin.configs.recommended(),

  // 3. Global rule overrides
  {
    rules: {
      // Disable stylistic / redundant rules
      '@blitz/comment-syntax': 'off', // Allow capitalized comments
      '@blitz/catch-error-name': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // 4. TSX-specific naming conventions
  {
    files: ['**/*.tsx'],
    rules: {
      ...getNamingConventionRule({}, true),
    },
  },

  // 5. Type definition files
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // 6. Import hygiene rules
  {
    files: [...tsFileExtensions, ...jsFileExtensions, '**/*.tsx'],
    ignores: ['functions/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../'],
              message: 'Relative imports are not allowed. Use the "~/” alias instead.',
            },
          ],
        },
      ],
    },
  },
];
