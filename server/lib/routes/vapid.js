'use strict'

const fp = require('fastify-plugin')

async function vapidRoutes(server, options) {
  server.get('/api/vapidPublicKey', async (_, reply) =>
    reply.send(options.vapid.vapidPublicKey)
  )
}

module.exports = fp(vapidRoutes, {
  name: 'vapid-routes'
})
