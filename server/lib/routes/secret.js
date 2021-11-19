'use strict'

async function deleteTokenIfAuthorized(
  firebaseAdmin,
  tokenId,
  subscriptionId,
  user
) {
  const db = firebaseAdmin.firestore()
  const subscriptionRef = await db
    .collection('subscriptions')
    .where(firebaseAdmin.firestore.FieldPath.documentId(), '==', subscriptionId)
    .where('userId', '==', user)
    .get()

  if (subscriptionRef.empty) {
    return false
  }

  await db
    .collection('tokens')
    .doc(tokenId)
    .delete()

  return true
}

async function secretRoutes(server) {
  server.route({
    method: 'DELETE',
    url: '/api/secret/:secretId',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { secretId } = request.params

      const db = firebaseAdmin.firestore()

      const tokensForSecret = await db
        .collection('tokens')
        .where('secretId', '==', secretId)
        .get()

      if (tokensForSecret.empty) {
        return reply.notFound('Secret not found')
      }

      let deletedError = false

      for await (const didDelete of await tokensForSecret.docs.map((doc) =>
        deleteTokenIfAuthorized(
          firebaseAdmin,
          doc.id,
          doc.data().subscriptionId,
          request.user
        )
      )) {
        if (!didDelete) {
          deletedError = true
        }
      }

      if (deletedError) {
        return reply.forbidden('Not authorized')
      } else {
        reply.code(204).send()
      }
    }
  })
}

module.exports = secretRoutes
