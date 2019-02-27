const Router = require('express-promise-router')
const otp = require('otplib')
const uniqid = require('uniqid')
const webPush = require('web-push')

const admin = require('../lib/firebase')

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env

if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.log(
    'You must set the VAPID_SUBJECT, VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY ' +
      'environment variables. You can use the following ones as keys:'
  )
  console.log(webPush.generateVAPIDKeys())
  return
}

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout))

const isValidSaveRequest = (req, res) => {
  // Check the request body has at least an endpoint.
  if (!req.body || !req.body.endpoint) {
    // Not a valid subscription.
    res.status(400)
    res.setHeader('Content-Type', 'application/json')
    res.send(
      JSON.stringify({
        error: {
          id: 'no-endpoint',
          message: 'Subscription must have an endpoint.'
        }
      })
    )
    return false
  }
  return true
}

const router = new Router()

const auth = async (req, res, next) => {
  const [, idToken] = (req.header('authorization') || '').split(/bearer /i)

  if (!idToken) {
    return res.sendStatus(401)
  }

  const decodedToken = await admin.auth().verifyIdToken(idToken)
  req.user = decodedToken.uid
  next()
}

router.get('/generate/:token', async (req, res) => {
  const db = admin.firestore()

  const secretRef = await db
    .collection('secrets')
    .where('token', '==', req.params.token)
    .get()

  if (secretRef.empty) {
    console.warn('Secret not found')
    return res.sendStatus(404)
  }

  let secret = {}
  secretRef.forEach(s => (secret = s.data()))

  const subscriptionRef = await db
    .collection('subscriptions')
    .where('userId', '==', secret.userId)
    .get()

  if (subscriptionRef.empty) {
    console.warn('Subscription not found')
    return res.sendStatus(404)
  }

  let subscription = {}
  subscriptionRef.forEach(s => (subscription = s.data()))

  const uniqueId = uniqid()

  const requestAdd = await db.collection('requests').add({
    secret,
    uniqueId,
    createdAt: new Date()
  })
  const request = await requestAdd.get()

  try {
    console.log('Sending notification to subscription')
    await webPush.sendNotification(
      subscription.subscription,
      JSON.stringify({ secret, uniqueId })
    )
  } catch (err) {
    console.error('Could not send push notification to client')

    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log('Subscription is not valid, removing')
      await db
        .collection('subscriptions')
        .doc(subscription.id)
        .delete()
    } else {
      console.log('Subscription is not valid but dunno why')
    }

    return
  }

  let wait = 0

  while (wait < 10000) {
    const start = Date.now()

    console.log('Checking if request has been responded to')

    const foundRef = await db
      .collection('requests')
      .doc(request.id)
      .get()

    const found = foundRef.data()

    if ('result' in found) {
      // delete request asynchronously, we don't want to delay the response
      db.collection('requests')
        .doc(request.id)
        .delete()

      if (found.result) {
        console.log('Request approved, sending back token')
        return res.send(otp.authenticator.generate(secret.secret))
      } else {
        console.log('Request rejected')
        return res.sendStatus(403)
      }
    }

    await delay(1000)

    wait += Date.now() - start
  }

  await db
    .collection('requests')
    .doc(request.id)
    .delete()

  console.warn('Request was not approved or rejected in time')

  res.sendStatus(403)
})

router.post('/respond', async (req, res) => {
  const db = admin.firestore()
  const { uniqueId, result } = req.body

  const requestRef = await db
    .collection('requests')
    .where('uniqueId', '==', uniqueId)
    .get()

  if (requestRef.empty) {
    return res.sendStatus(404)
  }

  let request = {}
  requestRef.forEach(r => (request = r))

  await db
    .collection('requests')
    .doc(request.id)
    .update({ result })
})

router.get('/vapidPublicKey', (_, res) => res.send(VAPID_PUBLIC_KEY))

router.use(auth)

router.get('/secrets', async (req, res) => {
  const db = admin.firestore()

  const result = await db
    .collection('secrets')
    .where('userId', '==', req.user)
    .get()

  const resultArray = []
  result.forEach(r => resultArray.push({ _id: r.id, ...r.data() }))
  res.send(resultArray)
})

router.post('/secrets', async (req, res) => {
  const db = admin.firestore()

  const result = await db.collection('secrets').add({
    ...req.body,
    userId: req.user
  })

  res.send(result)
})

router.delete('/secrets/:secretId', async (req, res) => {
  const db = admin.firestore()
  const result = await db
    .collection('secrets')
    .doc(req.params.secretId)
    .delete()

  res.send(result)
})

router.put('/token/:secretId', async (req, res) => {
  const db = admin.firestore()
  const secrets = db.collection('secrets')

  const secret = await secrets.doc(req.params.secretId).get()

  if (!secret.exists) {
    return res.sendStatus(404)
  }

  res.send(await secrets.doc(req.params.secretId).update({ token: uniqid() }))
})

router.post('/register', async (req, res) => {
  const db = admin.firestore()

  if (!isValidSaveRequest(req, res)) {
    console.error('Bad register request payload')
    return res.sendStatus(400)
  }

  const subscriptionRef = await db
    .collection('subscriptions')
    .where('userId', '==', req.user)
    .get()

  let subscription = {}
  const updateArray = []
  if (subscriptionRef.empty) {
    await db.collection('subscriptions').add({
      userId: req.user,
      subscription: req.body
    })
  } else {
    subscriptionRef.forEach(s => {
      updateArray.push(
        db
          .collection('subscriptions')
          .doc(s.id)
          .update({
            userId: req.user,
            subscription: req.body
          })
      )
    })
    await Promise.all(updateArray)
  }

  res.status(201).send(subscription)
})

module.exports = router
