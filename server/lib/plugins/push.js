'use strict'

const fp = require('fastify-plugin')
const { Expo } = require('expo-server-sdk')
const webPush = require('web-push')

async function sendWebPush(
  log,
  requestObj,
  { subscription, secretId, uniqueId }
) {
  try {
    log.info(`Sending notification to sub: ${subscription.endpoint}`)

    await webPush.sendNotification(
      subscription,
      JSON.stringify({ uniqueId, secretId })
    )
  } catch (err) {
    log.error('Could not send push notification to client')
    requestObj.delete()

    if (err.statusCode === 410 || err.statusCode === 404) {
      log.info('Subscription is not valid, removing')
      subscription.ref.delete()
    } else {
      log.info('Subscription is not valid but dunno why')
    }
  }
}

async function sendExpoPush(log, expo, { subscription, secretId, uniqueId }) {
  const { token } = subscription
  if (!Expo.isExpoPushToken(token)) {
    log.error(`Push token ${token} is not a valid Expo push token`)
    return
  }

  try {
    await expo.sendPushNotificationsAsync([
      {
        to: token,
        sound: 'default',
        body: 'One Time Password requested',
        data: { uniqueId, token, secretId }
      }
    ])
  } catch (error) {
    log.error(error, `Failed to send Push notification for token ${token}`)
  }
}

async function pushPlugin(server, options) {
  const { log } = server

  const {
    publicKey: vapidPublicKey,
    privateKey: vapidPrivateKey
  } = webPush.generateVAPIDKeys()
  webPush.setVapidDetails(
    options.vapid.vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )

  // init expo for mobile notifications
  const expo = new Expo()

  const push = {
    send: async ({ subscriptions, secretId, uniqueId, requestObj }) => {
      return Promise.all(
        subscriptions.map(async (doc) => {
          const subscription = doc.data()

          if (subscription.type === 'expo') {
            return sendExpoPush(log, expo, { subscription, secretId, uniqueId })
          }

          return sendWebPush(log, requestObj, {
            subscription,
            secretId,
            uniqueId
          })
        })
      )
    }
  }

  server.decorate('push', push)
}

module.exports = fp(pushPlugin, {
  name: 'push-plugin'
})
