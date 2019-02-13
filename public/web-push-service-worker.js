self.addEventListener('push', function(event) {
  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification('npm publish request', {
      body: `For secret issued by ${data.secret.issuer} to ${
        data.secret.account
      }`,
      data,
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
  )
})

self.addEventListener('notificationclick', function(event) {
  if (!event.action) {
    // Was a normal notification click
    console.log('Notification Click.')
    return
  }

  console.log(event.notification)

  switch (event.action) {
    case 'approve':
      fetch('/api/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uniqueId: event.notification.data.uniqueId,
          result: true
        })
      })
      break
    case 'reject':
      fetch('/api/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uniqueId: event.notification.data.uniqueId,
          result: false
        })
      })
      break
    default:
      console.log(`Unknown action clicked: '${event.action}'`)
      break
  }
})
