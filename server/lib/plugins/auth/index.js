'use strict'

const fp = require('fastify-plugin')
const fastifyAuth = require('fastify-auth')

const errors = require('../../errors')

async function authPlugin(server) {
  server.register(fastifyAuth)

  const { firebase } = server

  const authenticate = async (request) => {
    const authHeader = (request.headers || {}).authorization || ''

    if (!authHeader.startsWith('Bearer ')) {
      throw errors.unauthorized('Id token not found')
    }

    const idToken = authHeader.substr(7)

    if (!idToken) throw errors.unauthorized('Id token not found')

    try {
      const token = await firebase.auth().verifyIdToken(idToken)
      request.user = token.uid
    } catch (err) {
      request.log.error(err.message)
      throw errors.unauthorized('Error verifying Id token')
    }
  }

  server.decorate('authenticate', authenticate)
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: ['firebase-plugin']
})
