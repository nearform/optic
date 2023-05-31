'use strict'

const uniqid = require('uniqid')

const approvalLimit = 60e3

const generateOtpHandler = (server) => async (request, reply) => {
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

    const { name, version } = body.packageInfo

    const notification = {
      subscription: subscription.data(),
      secretId,
      uniqueId,
      token
    }

    const hasPackageInfo = !!name || !!version

    if (hasPackageInfo) {
      notification.packageInfo = {
        ...(version && { version }),
        ...(name && { name })
      }
    }

    push.send(notification)

    const timeout = setTimeout(completeRequest, approvalLimit)
  })
}

async function otpRoutes(server) {
  server.route({
    method: 'POST',
    url: '/api/generate/:token',
    handler: generateOtpHandler(server)
  })

  /**
   * @deprecated From now on the generate otp route will be a POST request
   * allowing the user to send more information about the OTP request such
   * as package name and version being deployed.
   * The GET request is here just to maintain backwards compatibility
   */
  server.route({
    method: 'GET',
    url: '/api/generate/:token',
    handler: generateOtpHandler(server)
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
