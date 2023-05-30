'use strict'

const fp = require('fastify-plugin')
const { Expo } = require('expo-server-sdk')

async function sendExpoPush(
  log,
  expo,
  { subscription, secretId, uniqueId, token, packageInfo }
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
        data: { uniqueId, token, secretId, packageInfo }
      }
    ])
  } catch (error) {
    log.error(error, `Failed to send Push notification for token ${token}`)
  }
}

async function pushPlugin(server, options) {
  const { log } = server

  // init expo for mobile notifications
  const expo = new Expo()

  const push = {
    send: async ({ subscription, secretId, uniqueId, token, packageInfo }) => {
      const params = { subscription, secretId, uniqueId, token, packageInfo }
      sendExpoPush(log, expo, params)
    }
  }

  server.decorate('push', push)
}

module.exports = fp(pushPlugin, {
  name: 'push-plugin'
})
