'use strict'

const S = require('fluent-json-schema')
const uniqid = require('uniqid')

const bodySchema = S.object()
  .prop('subscriptionId', S.string().required())
  .prop('secretId', S.string().required())
  .prop('existingToken', S.string())

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
      const { subscriptionId, secretId, existingToken } = request.body

      const db = firebaseAdmin.firestore()

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
        return reply.forbidden()
      }

      const token = uniqid()

      // Remove the existing token if specified (refreshing token)
      if (existingToken) {
        await db.collection('tokens').doc(existingToken).delete()
      }

      await db.collection('tokens').doc(token).set({
        secretId,
        subscriptionId
      })

      reply.send({ token })
    }
  })

  server.route({
    method: 'DELETE',
    url: '/api/token/:tokenId',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { tokenId } = request.params

      const db = firebaseAdmin.firestore()

      const tokenRef = await db.collection('tokens').doc(tokenId).get()

      if (tokenRef.empty) {
        return reply.notFound('Token not found')
      }

      const subscriptionId = tokenRef.get('subscriptionId')

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
        return reply.forbidden('Not authorized')
      }

      await db.collection('tokens').doc(tokenId).delete()

      reply.code(204).send()
    }
  })
}

module.exports = tokenRoutes
