'use strict'

const S = require('fluent-json-schema')
const uniqid = require('uniqid')

const bodySchema = S.object()
  .prop('subscriptionId', S.string().required())
  .prop('secretId', S.string().required())

const schema = {
  body: bodySchema
}

async function tokenRoutes(server) {
  server.route({
    method: 'PUT',
    url: '/api/token',
    schema,
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { subscriptionId, secretId } = request.body

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

      if (!secretRef.exists) {
        return reply.code(404).send('Secret not found')
      }

      const subscriptionId = secretRef.get('subscriptionId')

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
