'use strict'

async function healthcheckRoutes(server) {
  server.get('/healthcheck', async (_, reply) =>
    reply.code(204).send('success')
  )
}

module.exports = healthcheckRoutes
