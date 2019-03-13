async function getServerPublicKey(pushServerUrl) {
  try {
    const publicKeyResponse = await fetch(`${pushServerUrl}/vapidPublicKey`)

    return await publicKeyResponse.text()
  } catch (err) {
    console.error('Cannot retrieve push server public key')
    throw err
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export default async function subscribe(pushServerUrl, idToken) {
  if (!PushManager) {
    throw new Error('PushManager not supported')
  }

  const registration = await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    console.log('Subscription exists', JSON.stringify(subscription))
  } else {
    const vapidPublicKey = await getServerPublicKey(pushServerUrl)

    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    }

    subscription = await registration.pushManager.subscribe(subscribeOptions)

    console.log('Created new subscription', subscription)
  }

  const response = await fetch(`${pushServerUrl}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(subscription)
  })

  if (!response.ok) {
    return console.error('Cannot send subscription to server')
  }

  const responseData = await response.json()

  console.log('Sent subscription to server and received response', responseData)
}
