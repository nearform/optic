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
        await db
          .collection('allTokens')
          .doc(existingToken)
          .delete()
        await db
          .collection('secrets')
          .doc(secretId)
          .collection('tokens')
          .doc(token)
          .delete()
      }

      // Tokens are stored by secret in a sub collection
      await db
        .collection('secrets')
        .doc(secretId)
        .collection('tokens')
        .doc(token)
        .set({
          subscriptionId
        })

      // Store tokens as a top level object to allow easy access via `secretId`
      await db
        .collection('allTokens')
        .doc(token)
        .set({
          secretId
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
        .collection('secrets')
        .doc(secretId)
        .get()

      if (!secretRef.exists) {
        return reply.notFound('Secret not found')
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
        return reply.forbidden('Not authorized')
      }

      await db
        .collection('secrets')
        .doc(secretId)
        .delete()

      await db
        .collection('allTokens')
        .where('secretId', '==', secretId)
        .delete()

      reply.code(204).send()
    }
  })
}

module.exports = tokenRoutes
