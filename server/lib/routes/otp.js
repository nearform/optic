'use strict'

const uniqid = require('uniqid')

const defaultApprovalLimit = 60e3

async function otpRoutes(server, options = {}) {
  const otpApprovalTimeout = options.otpApprovalTimeout ?? defaultApprovalLimit
  const generateTokenHandler = async (request, reply) => {
    const { firebaseAdmin, push } = server
    const {
      params: { token },
      log,
      body = { packageInfo: {} }
    } = request

    const db = firebaseAdmin.firestore()

    const tokenData = await db.collection('tokens').doc(token).get()

    if (!tokenData.exists) {
      log.error('Token not found in tokens collection')
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

      const notification = {
        subscription: subscription.data(),
        secretId,
        uniqueId,
        token
      }

      if (body.packageInfo) {
        notification.packageInfo = { ...body.packageInfo }
      }

      push.send(notification)

      const timeout = setTimeout(completeRequest, otpApprovalTimeout)
    })
  }

  /**
   * @deprecated GET /api/generate/:token
   *
   * From now on the generate otp route will be a POST request
   * allowing the user to send more information about the OTP request such
   * as package name and version being deployed.
   * The GET request is here just to maintain backwards compatibility and
   * should be removed in the future.
   */
  server.route({
    method: 'GET',
    url: '/api/generate/:token',
    handler: generateTokenHandler
  })

  server.route({
    method: 'POST',
    url: '/api/generate/:token',
    handler: generateTokenHandler,
    schema: {
      body: {
        type: ['object', 'null'],
        properties: {
          packageInfo: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' }
            },
            required: ['name', 'version'],
            additionalProperties: false
          }
        },
        additionalProperties: false
      }
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
