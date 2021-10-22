'use strict'

const fp = require('fastify-plugin')

async function subscriptionRoutes(server) {
  server.route({
    method: 'POST',
    url: '/api/register',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { type, endpoint } = request.body

      const db = firebaseAdmin.firestore()

      if (type !== 'expo' && !endpoint) {
        // Not a valid subscription.
        reply.code(400).send({
          error: {
            id: 'no-endpoint',
            message: 'Subscription must have an endpoint.'
          }
        })
      }

      const subscriptionRef = await db
        .collection('subscriptions')
        .where('userId', '==', request.user)
        .get()

      const updateArray = []
      if (subscriptionRef.empty) {
        await db.collection('subscriptions').add({
          userId: request.user,
          ...request.body
        })
      } else {
        subscriptionRef.forEach((s) => {
          updateArray.push(
            db
              .collection('subscriptions')
              .doc(s.id)
              .update({
                userId: request.user,
                ...request.body
              })
          )
        })
        await Promise.all(updateArray)
      }

      reply.status(201).send()
    }
  })
}

module.exports = fp(subscriptionRoutes, {
  name: 'subscription-routes'
})
