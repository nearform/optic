'use strict'

async function secretRoutes(server) {
  server.route({
    method: 'DELETE',
    url: '/api/secret/:secretId',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { secretId } = request.params

      const db = firebaseAdmin.firestore()

      const tokensForSecretRef = await db
        .collection('allTokens')
        .where('secretId', '==', secretId)
        .get()

      if (tokensForSecretRef.empty) {
        return reply.notFound('Secret not found')
      }

      // TODO will need to iterate over each token and remove where matches secret
      // const subscriptionId = tokensForSecretRef.get('subscriptionId')
      //
      // const subscriptionRef = await db
      //   .collection('subscriptions')
      //   .where(
      //     firebaseAdmin.firestore.FieldPath.documentId(),
      //     '==',
      //     subscriptionId
      //   )
      //   .where('userId', '==', request.user)
      //   .get()
      //
      // if (subscriptionRef.empty) {
      //   return reply.forbidden('Not authorized')
      // }
      //
      // await db
      //   .collection('allTokens')
      //   .where('secretId', '==', secretId)
      //   .delete()

      reply.code(204).send()
    }
  })
}

module.exports = secretRoutes
