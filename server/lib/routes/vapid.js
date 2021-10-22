'use strict'

const fp = require('fastify-plugin')

/**
 * @param server {import('fastify').FastifyInstance}
 */
async function vapidRoutes(server, options) {
  server.route({
    method: 'GET',
    url: '/api/vapidPublicKey',
    handler: async (_, reply) => {
      reply.send(options.vapid.vapidPublicKey)
    }
  })
}

module.exports = fp(vapidRoutes, {
  name: 'vapid-routes'
})
