'use strict'

async function vapidRoutes(server, options) {
  server.get('/api/vapidPublicKey', async (_, reply) =>
    reply.send(options.vapid.vapidPublicKey)
  )
}

module.exports = vapidRoutes
