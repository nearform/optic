const { test, describe } = require('node:test')

process.env = {
  ...process.env,
  HOST: 'whatever',
  PORT: 1,
  FIREBASE_PROJECT_ID: 'whatever',
  FIREBASE_CLIENT_EMAIL: 'whatever',
  FIREBASE_PRIVATE_KEY_BASE64: 'whatever'
}

describe('config', () => {
  test('can load', () => {
    require('../config')
  })
})
