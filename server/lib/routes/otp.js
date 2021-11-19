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

      const tokenData = await db
        .collection('allTokens')
        .doc(token)
        .get()

      if (!tokenData.exists) {
        log.error('Token not found in allTokens collection')
        return reply.notFound('Token not found')
      }

      const { secretId, subscriptionId } = tokenData.data()

      const subscription = await db
        .collection('subscriptions')
        .doc(subscriptionId)
        .get()

      if (!subscription.exists) {
        log.error(`Subscription not found - ${subscriptionId}`)
        return reply.notFound('Subscription not found')
      }

      const uniqueId = uniqid()

      return new Promise(() => {
        const requestObj = db.collection('requests').doc(uniqueId)
        requestObj.set({ createdAt: new Date() })

        const completeRequest = (error, otp) => {
          requestObj.delete()
          if (error) {
            log.error(error.message)
            return reply.internalServerError()
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
            return reply.internalServerError()
          }
        )

        push.send({
          subscription: subscription.data(),
          secretId,
          uniqueId,
          token
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
      return reply.internalServerError()
    }
  })
}

module.exports = otpRoutes
