'use strict'

const validationSchema = {
  body: {
    type: 'object',
    properties: {
      type: { type: 'string' },
      endpoint: { type: 'string' },
      token: { type: 'string' }
    },
    oneOf: [{ required: ['token'] }, { required: ['endpoint'] }],
    required: ['type']
  }
}

async function subscriptionRoutes(server) {
  server.route({
    method: 'POST',
    url: '/api/register',
    preHandler: server.auth([server.authenticate]),
    schema: validationSchema,
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const { type = null, endpoint = null, token = null } = request.body

      const db = firebaseAdmin.firestore()

      try {
        const subscriptionIdentifierType =
          type === 'expo' ? 'token' : 'endpoint'
        const subscriptionIdentifier = type === 'expo' ? token : endpoint

        const subscriptionRef = await db
          .collection('subscriptions')
          .where('userId', '==', request.user)
          .where(subscriptionIdentifierType, '==', subscriptionIdentifier)
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
                userId: request.user,
                ...request.body
              })

        reply.code(201).send({
          subscriptionId: subscription.id || subscriptionRef.docs[0].id
        })
      } catch (error) {
        request.log.error(`Failed to register. Error-${error.message}`)
        return reply.code(500).send('Failed to register')
      }
    }
  })
}

module.exports = subscriptionRoutes
