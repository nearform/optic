function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register(
      `${process.env.PUBLIC_URL}/web-push-service-worker.js`
    )

    console.log('Service worker successfully registered')

    return registration
  } catch (err) {
    console.error('Unable to register service worker', err)
  }
}

async function askPermission() {
  const permissionResult = await new Promise((resolve, reject) => {
    const permissionResult = Notification.requestPermission(result =>
      resolve(result)
    )

    if (permissionResult) {
      permissionResult.then(resolve, reject)
    }
  })

  if (permissionResult !== 'granted') {
    throw new Error("We weren't granted permission")
  }
}

async function getServerPublicKey(pushServerUrl) {
  try {
    const publicKeyResponse = await fetch(`${pushServerUrl}/vapidPublicKey`)

    return await publicKeyResponse.text()
  } catch (err) {
    console.error('Cannot retrieve push server public key')
    throw err
  }
}

async function subscribeToUserPush(registration, pushServerUrl, idToken) {
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

  await sendSubscriptionToBackend(pushServerUrl, idToken, subscription)
}

async function sendSubscriptionToBackend(pushServerUrl, idToken, subscription) {
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

export async function register() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service workers not supported')
    return
  }

  if (!('PushManager' in window)) {
    console.error('PushManager not supported')
    return
  }

  await registerServiceWorker()

  await askPermission()
}

export async function subscribe(pushServerUrl, idToken) {
  const registration = await navigator.serviceWorker.ready
  await subscribeToUserPush(registration, pushServerUrl, idToken)
}
