'use strict'

const S = require('fluent-json-schema')

const bodySchema = S.object()
  .prop('type', S.string().pattern('\\b(expo)\\b').required())
  .prop('token', S.string().required())

const schema = {
  body: bodySchema
}

async function subscriptionRoutes(server) {
  server.route({
    method: 'POST',
    url: '/api/register',
    preHandler: server.auth([server.authenticate]),
    schema,
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const db = firebaseAdmin.firestore()

      try {
        const subscriptionRef = await db
          .collection('subscriptions')
          .where('userId', '==', request.user)
          .where('expo', '==', request.body.token)
          .get()

        const subscription = subscriptionRef.empty
          ? await db.collection('subscriptions').add({
              userId: request.user,
              ...request.body
            })
          : await db
              .collection('subscriptions')
              .doc(subscriptionRef.docs[0].id)
              .update({
                ...request.body
              })

        reply.code(201).send({
          subscriptionId: subscription.id || subscriptionRef.docs[0].id
        })
      } catch (error) {
        request.log.error(`Failed to register. Error-${error.message}`)
        return reply.internalServerError()
      }
    }
  })
}

module.exports = subscriptionRoutes
