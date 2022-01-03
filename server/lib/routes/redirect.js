'use strict'

function redirectRoutes(server) {
  server.route({
    method: 'GET',
    url: '/',
    handler: (_, reply) => {
      reply.redirect('https://expo.dev/@nearform/optic-expo')
    }
  })
}

module.exports = redirectRoutes