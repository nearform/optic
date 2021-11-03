'use strict'

const fp = require('fastify-plugin')
const fastifyAuth = require('fastify-auth')

async function authPlugin(server) {
  server.register(fastifyAuth)

  const { firebaseAdmin } = server

  const authenticate = async (request, reply) => {
    const authHeader = (request.headers || {}).authorization || ''

    if (!authHeader.startsWith('Bearer ')) {
      return reply.unauthorized('Id token not found')
    }

    const idToken = authHeader.substr(7)

    if (!idToken) return reply.unauthorized('Id token not found')

    try {
      const token = await firebaseAdmin.auth().verifyIdToken(idToken)
      request.user = token.uid
    } catch (err) {
      request.log.error(err.message)
      return reply.unauthorized('Error verifying Id token')
    }
  }

  server.decorate('authenticate', authenticate)
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: ['firebase-plugin']
})
