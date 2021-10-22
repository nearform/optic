'use strict'

const uniqid = require('uniqid')
const fp = require('fastify-plugin')

const approvalLimit = 60e3

async function otpRoutes(server) {
  server.route({
    method: 'GET',
    url: '/api/generate',
    handler: async (request, reply) => {
      const { firebaseAdmin, push } = server
      const {
        query: { token },
        log
      } = request

      const db = firebaseAdmin.firestore()

      const secret = await db
        .collection('tokens')
        .where('token', '==', token)
        .get()

      if (secret.empty) {
        log.error('Token not found')
        return reply.code(404).send('Token not found')
      }

      const { userId } = secret.docs[0].data()
      const secretId = secret.docs[0].id

      const subscriptions = await db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .get()

      if (subscriptions.empty) {
        log.error(`No subscription found for user ${userId}`)
        return reply.code(404).send(`No subscription found for user ${userId}`)
      }

      const uniqueId = uniqid()

      const completeRequest = (error, otp) => {
        if (error) {
          log.error(error.message)
          return reply.code(500).send(error.message)
        }

        unsubscribe()
        clearTimeout(timeout)

        if (!otp) {
          log.error('Request was not approved')
          return reply.code(403).send()
        }

        log.info('Request approved, sending back OTP')
        reply.send(otp)
      }

      const requestObj = db.collection('requests').doc(uniqueId)
      await requestObj.set({ createdAt: new Date() })

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
          return reply.code(500).send(error.message)
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
    }
  })

  server.route({
    method: 'POST',
    url: '/api/respond',
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const db = firebaseAdmin.firestore()
      const { uniqueId, otp, approved } = request.body

      const requestObj = db.collection('requests').doc(uniqueId)
      if (!(await requestObj.get()).exists) {
        return reply.code(404).send()
      }

      await requestObj.update({ otp: otp || null, approved })
      reply.code(201).send()
    }
  })
}

module.exports = fp(otpRoutes, {
  name: 'otp-routes'
})
