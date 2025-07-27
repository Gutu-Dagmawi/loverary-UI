module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['import', 'prettier'],
  rules: {
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-unused-vars': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'dot-notation': 'error',

    // Import
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'off',
    'import/extensions': 'off',

    // Prettier
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
    {
      files: ['**/*.html'],
      extends: ['plugin:prettier/recommended'],
      rules: {
        'prettier/prettier': [
          'error',
          {
            parser: 'html',
            printWidth: 120,
            tabWidth: 2,
            useTabs: false,
            singleQuote: true,
            bracketSameLine: false,
            singleAttributePerLine: true,
          },
        ],
      },
    },
  ],
};
