module.exports = {
  env: {
    browser: true,
    node: true,
  },

  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },

  plugins: [
    'svelte3',
    '@typescript-eslint',
  ],

  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  rules: {
    'import/no-mutable-exports': 0,
    'import/prefer-default-export': 0,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
      },
    ],
  },

  settings: {
    'svelte3/typescript': true,
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
