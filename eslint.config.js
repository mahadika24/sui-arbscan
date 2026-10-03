import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', '*.log'],
  },
];
