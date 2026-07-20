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
      ]
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
