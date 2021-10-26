'use strict'

async function configRoutes(server, options) {
  server.get('/api/config', async (_, reply) => {
    reply.send({
      apiKey: options.react.reactAppApiKey,
      authDomain: options.react.reactAppAuthDomain,
      databaseURL: options.react.reactAppDatabaseUrl,
      messagingSenderId: options.react.reactAppMessagingSenderId,
      projectId: options.react.reactAppProjectId,
      storageBucket: options.react.reactAppStorageBucket
    })
  })
}

module.exports = configRoutes
