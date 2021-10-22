'use strict'

const fp = require('fastify-plugin')

/**
 * @param server {import('fastify').FastifyInstance}
 */
async function vapidRoutes(server, options) {
  server.route({
    method: 'GET',
    url: '/api/vapidPublicKey',
    preHandler: server.auth([server.authenticate]),
    handler: async (_, reply) => {
      reply.send(options.vapid.vapidPublicKey)
    }
  })
}

module.exports = fp(vapidRoutes, {
  name: 'vapid-routes'
})
