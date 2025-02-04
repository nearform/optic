const assert = require('node:assert/strict')
const { test, after, describe } = require('node:test')

const redirectRoutes = require('../lib/routes/redirect')

const { buildServer } = require('./test-util.js')

describe('redirect route', async (t) => {
  const server = await buildServer([{ plugin: redirectRoutes }])

  after(() => server.close())

  test('it should redirect the user to expo mobile app page when accessing root', async () => {
    const response = await server.inject({
      url: '/',
      method: 'GET'
    })

    assert.deepStrictEqual(
      response.headers.location,
      'https://expo.dev/@nearform/optic-expo'
    )
    assert.deepStrictEqual(response.statusCode, 302)
  })
})
