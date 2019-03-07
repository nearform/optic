/* eslint no-restricted-globals: "off" */
import { authenticator } from 'otplib'
import * as precaching from 'workbox-precaching'
import * as secretsManager from '../lib/secrets'

if (self.__precacheManifest) {
  precaching.precacheAndRoute(self.__precacheManifest)
}

const pushServerUrl = '/api'

async function closeNotifications() {
  const notifs = await self.registration.getNotifications({ tag: 'npm-otp' })
  notifs.forEach(notif => notif.close())
}

self.addEventListener('push', function(event) {
  const { secretId, uniqueId } = event.data.json()

  // displays notification with secret received from main window
  event.waitUntil(
    (async function() {
      await closeNotifications()

      const [details] = await secretsManager.fetch({ _id: secretId })
      if (!details) {
        console.error(`Failed to find secret with id ${secretId}`)
        return
      }
      const { secret, issuer, account } = details
      await self.registration.showNotification('One Time Password requested', {
        tag: 'npm-otp',
        body: `For secret issued by ${issuer} to ${account}`,
        data: { secret, uniqueId },
        requireInteraction: true,
        actions: [
          {
            action: 'approve',
            title: 'Approve'
          },
          {
            action: 'reject',
            title: 'Reject'
          }
        ]
      })
    })()
  )
})

self.addEventListener('notificationclick', function(event) {
  const {
    action,
    notification: {
      data: { secret, uniqueId }
    }
  } = event

  // was a normal notification click
  if (!action) {
    return
  }

  closeNotifications()

  // service worker got answer from user
  const approved = action === 'approve'
  event.waitUntil(
    fetch(`${pushServerUrl}/respond`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        uniqueId,
        approved,
        otp: approved ? authenticator.generate(secret) : undefined
      })
    })
  )
})
