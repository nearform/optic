'use strict'

const fp = require('fastify-plugin')
const { Expo } = require('expo-server-sdk')
const webPush = require('web-push')

async function sendWebPush(log, { subscription, secretId, uniqueId }) {
  try {
    log.info(`Sending notification to sub: ${subscription.endpoint}`)

    await webPush.sendNotification(
      subscription,
      JSON.stringify({ uniqueId, secretId })
    )
  } catch (err) {
    log.error(err, 'Could not send push notification to client')

    if (err.statusCode === 410 || err.statusCode === 404) {
      log.info('Subscription is not valid, removing')
      subscription.ref.delete()
    } else {
      log.info('Subscription is not valid but dunno why')
    }
  }
}

async function sendExpoPush(
  log,
  expo,
  { subscription, secretId, uniqueId, token }
) {
  if (!Expo.isExpoPushToken(subscription.token)) {
    log.error(`Push token ${subscription.token} is not a valid Expo push token`)
    return
  }

  try {
    await expo.sendPushNotificationsAsync([
      {
        to: subscription.token,
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

  webPush.setVapidDetails(
    options.vapid.vapidSubject,
    options.vapid.vapidPublicKey,
    options.vapid.vapidPrivateKey
  )

  // init expo for mobile notifications
  const expo = new Expo()

  const push = {
    send: async ({ subscription, secretId, uniqueId, token }) => {
      const params = { subscription, secretId, uniqueId, token }
      subscription.type === 'expo'
        ? sendExpoPush(log, expo, params)
        : sendWebPush(log, params)
    }
  }

  server.decorate('push', push)
}

module.exports = fp(pushPlugin, {
  name: 'push-plugin'
})
