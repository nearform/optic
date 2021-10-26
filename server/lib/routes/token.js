'use strict'

const uniqid = require('uniqid')

async function tokenRoutes(server) {
  server.route({
    method: 'PUT',
    url: '/api/token/:secretId',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { secretId } = request.params

      const db = firebaseAdmin.firestore()

      const token = uniqid()

      await db
        .collection('tokens')
        .doc(secretId)
        .set({
          token,
          userId: request.user
        })
      reply.send({ token })
    }
  })

  server.route({
    method: 'DELETE',
    url: '/api/token/:secretId',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { secretId } = request.params

      const db = firebaseAdmin.firestore()

      await db
        .collection('tokens')
        .doc(secretId)
        .delete()

      return reply.code(204).send()
    }
  })
}

module.exports = tokenRoutes
