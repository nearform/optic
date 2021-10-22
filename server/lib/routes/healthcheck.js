'use strict'

const fp = require('fastify-plugin')

async function healthcheckRoutes(server) {
  server.get('/healthcheck', async (_, reply) => reply.code(204).send())
}

module.exports = fp(healthcheckRoutes, {
  name: 'healthcheck-routes'
})
