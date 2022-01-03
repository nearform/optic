const { test } = require('tap')

const redirectRoutes = require('../lib/routes/redirect')

const { buildServer } = require('./test-util.js')

test('redirect route', async (t) => {
  const server = await buildServer([{ plugin: redirectRoutes }])

  t.teardown(server.close.bind(server))

  t.test(
    'it should redirect the user to expo mobile app page when accessing root',
    async (t) => {
      const response = await server.inject({
        url: '/',
        method: 'GET'
      })

      t.equal(
        response.headers.location,
        'https://expo.dev/@nearform/optic-expo'
      )
      t.equal(response.statusCode, 302)
    }
  )
})
