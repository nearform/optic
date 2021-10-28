'use strict'

const uniqid = require('uniqid')

const validationSchema = {
  body: {
    type: 'object',
    properties: {
      subscriptionId: { type: 'string' },
      secretId: { type: 'string' }
    },
    required: ['subscriptionId', 'secretId']
  }
}

async function tokenRoutes(server) {
  server.route({
    method: 'PUT',
    url: '/api/token',
    schema: validationSchema,
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { subscriptionId = null, secretId = null } = request.body

      const db = firebaseAdmin.firestore()

      const token = uniqid()

      await db
        .collection('tokens')
        .doc(secretId)
        .set({
          token,
          subscriptionId
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

      const secretRef = await db
        .collection('tokens')
        .doc(secretId)
        .get()

      if (secretRef.empty) {
        return reply.code(404).send('Secret not found')
      }

      const { subscriptionId } = secretRef.docs[0].data()

      const subscriptionRef = await db
        .collection('subscriptions')
        .where(
          firebaseAdmin.firestore.FieldPath.documentId(),
          '==',
          subscriptionId
        )
        .where('userId', '==', request.user)
        .get()

      if (subscriptionRef.empty) {
        return reply.code(403).send('Not authorized')
      }

      await db
        .collection('tokens')
        .doc(secretId)
        .delete()

      reply.code(204).send()
    }
  })
}

module.exports = tokenRoutes
