'use strict'

const uniqid = require('uniqid')

const approvalLimit = 60e3

async function otpRoutes(server) {
  server.route({
    method: 'GET',
    url: '/api/generate/:token',
    handler: async (request, reply) => {
      const { firebaseAdmin, push } = server
      const {
        params: { token },
        log
      } = request

      const db = firebaseAdmin.firestore()

      const secret = await db
        .collection('tokens')
        .where('token', '==', token)
        .get()

      if (secret.empty) {
        log.error('Token not found')
        return reply.notFound('Token not found')
      }

      const { userId, subscriptionId } = secret.docs[0].data()
      const secretId = secret.docs[0].id

      const subscriptions = await db
        .collection('subscriptions')
        .where(
          firebaseAdmin.firestore.FieldPath.documentId(),
          '==',
          subscriptionId
        )
        .get()

      if (subscriptions.empty) {
        log.error(`No subscription found for user ${userId}`)
        return reply.notFound(`No subscription found for user ${userId}`)
      }

      const uniqueId = uniqid()

      return new Promise(() => {
        const completeRequest = (error, otp) => {
          if (error) {
            log.error(error.message)
            return reply.internalServerError('An unexpected error occured')
          }

          unsubscribe()
          clearTimeout(timeout)

          if (!otp) {
            log.error('Request was not approved')
            return reply.forbidden('Request was not approved')
          }

          log.info('Request approved, sending back OTP')
          return reply.send(otp)
        }

        const requestObj = db.collection('requests').doc(uniqueId)
        requestObj.set({ createdAt: new Date() })

        const unsubscribe = requestObj.onSnapshot(
          (update) => {
            const approved = update.get('approved')
            if (approved === undefined) {
              // update due to object creation
              return
            }
            completeRequest(null, update.get('otp'))
          },
          (error) => {
            log.error(error.message)
            return reply.internalServerError('An unexpected error occured')
          }
        )

        // fire the notification to all available subscription
        push.send({
          subscriptions: subscriptions.docs,
          secretId,
          uniqueId,
          requestObj
        })

        const timeout = setTimeout(completeRequest, approvalLimit)
      })
    }
  })

  server.post('/api/respond', async (request, reply) => {
    const { firebaseAdmin } = server
    const db = firebaseAdmin.firestore()
    const { uniqueId, otp, approved } = request.body

    try {
      const requestObj = db.collection('requests').doc(uniqueId)
      const req = await requestObj.get()
      if (!req || !req.exists) {
        return reply.notFound('Request does not exist')
      }

      await requestObj.update({ otp: otp || null, approved })
      reply.code(201).send()
    } catch (error) {
      request.log.error(error.message)
      return reply.internalServerError('An unexpected error occured')
    }
  })
}

module.exports = otpRoutes
