'use strict'

const fp = require('fastify-plugin')
const fastifyAuth = require('fastify-auth')

async function authPlugin(server) {
  server.register(fastifyAuth)

  const authenticate = async (request, reply) => {
    try {
      const token = await request.jwtVerify()
      request.user = token.user_id
    } catch (err) {
      request.log.error(err.message)
      return reply.unauthorized('Error verifying Id token')
    }
  }

  server.decorate('authenticate', authenticate)
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin'
})
