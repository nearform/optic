'use strict'

async function redirectRoutes(server) {
  server.route({
    method: 'GET',
    url: '/',
    handler: async (_, reply) => {
      reply.redirect('https://expo.dev/@nearform/optic-expo')
    }
  })
}

module.exports = redirectRoutes
