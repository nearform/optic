const { test } = require('tap')

process.env = {
  ...process.env,
  HOST: 'whatever',
  PORT: 1,
  FIREBASE_PROJECT_ID: 'whatever',
  FIREBASE_CLIENT_EMAIL: 'whatever',
  FIREBASE_PRIVATE_KEY_BASE64: 'whatever'
}

test('config', async (t) => {
  t.test('can load', async () => {
    require('../config')
  })
})
