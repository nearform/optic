'use strict'

const js = require('@eslint/js')
const globals = require('globals')
const importX = require('eslint-plugin-import-x')
const prettierRecommended = require('eslint-plugin-prettier/recommended')

module.exports = [
  {
    ignores: ['build/**', 'node_modules/**']
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      // Match the previous `standard` config: unused function arguments and
      // caught errors are allowed (they are often kept for signatures).
      'no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
          vars: 'all'
        }
      ],
      // Correctness rules previously provided by eslint-config-standard,
      // not covered by @eslint/js recommended. Prettier still owns style.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-throw-literal': 'error',
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
      'no-unused-expressions': 'error',
      'no-return-assign': ['error', 'except-parens'],
      'no-self-compare': 'error',
      'no-unmodified-loop-condition': 'error'
    }
  },
  {
    files: ['server/**/*.js'],
    plugins: {
      'import-x': importX
    },
    rules: {
      'import-x/order': ['error', { 'newlines-between': 'always' }]
    }
  },
  prettierRecommended
]
