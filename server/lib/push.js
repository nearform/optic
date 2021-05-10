const { Expo } = require('expo-server-sdk')
const webPush = require('web-push')
const uniqid = require('uniqid')

let expo

exports.init = async function init({
  vapidPrivateKey,
  vapidPublicKey,
  vapidSubject
}) {
  // initialize web push for browser notifications
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  // initialise expo for mobile notifications
  expo = new Expo()
}

async function sendWebPush(subscription, secret) {
  try {
    console.log('Sending notification to sub:', subscription.endpoint)

    await webPush.sendNotification(
      subscription
      // JSON.stringify({ uniqueId, token, secretId })
    )
  } catch (err) {
    console.error('Could not send push notification to client')
    // request.delete()

    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log('Subscription is not valid, removing')
      // subscriptions.ref.delete()
    } else {
      console.log('Subscription is not valid but dunno why')
    }
    return
  }
}

async function sendExpoPush({ token }, secret) {
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`)
    return
  }

  const uniqueId = uniqid()

  const message = [
    {
      to: token,
      sound: 'default',
      body: 'One Time Password requested',
      data: { uniqueId, token, secret }
    }
  ]

  return await expo.sendPushNotificationsAsync(message)
}

exports.send = async function send(subscriptions, secretId) {
  return Promise.all(
    subscriptions.map(async doc => {
      const subscription = doc.data()

      if (subscription.type === 'expo') {
        return sendExpoPush(subscription, secretId)
      }

      // if type if web push
      return sendWebPush(subscription, secretId)
    })
  )
}
