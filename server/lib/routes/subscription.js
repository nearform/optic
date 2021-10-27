'use strict'

async function subscriptionRoutes(server) {
  server.route({
    method: 'POST',
    url: '/api/register',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { type = null, endpoint = null, token = null } = request.body

      const db = firebaseAdmin.firestore()

      if (!type) request.body.type = 'web'

      if ((type !== 'expo' && !endpoint) || (type === 'expo' && !token)) {
        // Not a valid subscription.
        reply.code(400).send({
          error: {
            id: 'no-endpoint',
            message: 'Subscription must have an endpoint or token.'
          }
        })
      }

      try {
        const destinationType = type === 'expo' ? 'token' : 'endpoint'
        const destination = type === 'expo' ? token : endpoint

        const subscriptionRef = await db
          .collection('subscriptions')
          .where('userId', '==', request.user)
          .where(destinationType, '==', destination)
          .get()

        let newSubscription = {}
        let updatedSubscription = {}
        const updateArray = []
        if (subscriptionRef.empty) {
          newSubscription = await db.collection('subscriptions').add({
            userId: request.user,
            ...request.body
          })
        } else {
          subscriptionRef.forEach((s) => {
            updatedSubscription = s
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
        reply.code(201).send({
          subscriptionId: newSubscription.id || updatedSubscription.id
        })
      } catch (error) {
        request.log.error(`Failed to register. Error-${error.message}`)
        return reply.code(500).send('Failed to register')
      }
    }
  })
}

module.exports = subscriptionRoutes
