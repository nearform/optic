'use strict'

const fp = require('fastify-plugin')

async function configRoutes(server, options) {
  server.route({
    method: 'GET',
    url: '/api/config',
    preHandler: server.auth([server.authenticate]),
    handler: async (_, reply) => {
      reply.send({
        apiKey: options.react.reactAppApiKey,
        authDomain: options.react.reactAppAuthDomain,
        databaseURL: options.react.reactAppDatabaseUrl,
        messagingSenderId: options.react.reactAppMessagingSenderId,
        projectId: options.react.reactAppProjectId,
        storageBucket: options.react.reactAppStorageBucket
      })
    }
  })
}

module.exports = fp(configRoutes, {
  name: 'config-routes'
})
