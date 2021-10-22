'use strict'

const crypto = require('crypto')

const fp = require('fastify-plugin')

const approvalLimit = 60e3

async function otpRoutes(server) {
  server.route({
    method: 'GET',
    url: '/api/generate',
    preHandler: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { firebaseAdmin, push } = server
      const { log } = request
      const { token } = request.query

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

      const uniqueId = crypto.randomBytes(16).toString('hex')

      const completeRequest = (otp) => {
        unsubscribe()
        clearTimeout(timeout)

        if (!otp) {
          log.error('Request was not approved')
          return reply.code(403).send()
        }

        log.info('Request approved, sending back OTP')
        reply.send(otp)
      }

      const req = db.collection('requests').doc(uniqueId)
      await req.set({ createdAt: new Date() })

      const unsubscribe = request.onSnapshot(
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
      push.send(subscriptions.docs, secretId, uniqueId, request)

      const timeout = setTimeout(completeRequest, approvalLimit)
    }
  })

  server.route({
    method: 'POST',
    url: '/respond',
    handler: async (request, reply) => {
      const { firebaseAdmin } = server
      const db = firebaseAdmin.firestore()
      const { uniqueId, otp, approved } = request.body

      const req = db.collection('requests').doc(uniqueId)
      if (!(await request.get()).exists) {
        return reply.code(404).send()
      }

      await req.update({ otp: otp || null, approved })
      reply.code(201).send()
    }
  })
}

module.exports = fp(otpRoutes, {
  name: 'otp-routes'
})
