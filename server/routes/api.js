const Router = require('express-promise-router')
const otp = require('otplib')
const uniqid = require('uniqid')
const ObjectID = require('mongodb').ObjectID
const webPush = require('web-push')

const admin = require('../lib/firebase')

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_MAILTO } = process.env

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.log(
    'You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY ' +
      'environment variables. You can use the following ones:'
  )
  console.log(webPush.generateVAPIDKeys())
  return
}

webPush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

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

var router = new Router()

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
  const db = req.app.get('db')

  const secret = await db
    .collection('secrets')
    .findOne({ token: req.params.token })

  if (!secret) {
    console.warn('Secret not found')
    return res.sendStatus(404)
  }

  const subscription = await db
    .collection('subscriptions')
    .findOne({ userId: secret.userId })

  if (!subscription) {
    console.warn('Subscription not found')
    return res.sendStatus(404)
  }

  const uniqueId = uniqid()

  const request = await db.collection('requests').insertOne({
    secret,
    uniqueId,
    createdAt: new Date()
  })

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
      await db.collection('subscriptions').remove({ _id: subscription._id })
    } else {
      console.log('Subscription is not valid but dunno why')
    }

    return
  }

  let wait = 0

  while (wait < 10000) {
    const start = Date.now()

    console.log('Checking if request has been responded to')

    const found = await db
      .collection('requests')
      .findOne({ _id: request.insertedId })

    if ('result' in found) {
      // delete request asynchronously, we don't want to delay the response
      db.collection('requests').deleteOne({ _id: request.insertedId })

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

  await db.collection('requests').deleteOne({ _id: request.insertedId })

  console.warn('Request was not approved or rejected in time')

  res.sendStatus(403)
})

router.post('/respond', async (req, res) => {
  const { uniqueId, result } = req.body

  const db = req.app.get('db')

  const request = await db.collection('requests').findOne({ uniqueId })

  if (!request) {
    return res.sendStatus(404)
  }

  await db
    .collection('requests')
    .updateOne({ _id: request._id }, { $set: { result } })
})

router.get('/vapidPublicKey', (_, res) => res.send(VAPID_PUBLIC_KEY))

router.use(auth)

router.get('/secrets', async (req, res) => {
  const result = await req.app
    .get('db')
    .collection('secrets')
    .find({
      userId: req.user
    })
    .toArray()

  res.send(result)
})

router.post('/secrets', async (req, res) => {
  const result = await req.app
    .get('db')
    .collection('secrets')
    .insertOne({
      ...req.body,
      userId: req.user
    })

  res.send(result)
})

router.delete('/secrets/:secretId', async (req, res) => {
  const result = await req.app
    .get('db')
    .collection('secrets')
    .deleteOne({
      _id: new ObjectID(req.params.secretId),
      userId: req.user
    })

  res.send(result)
})

router.put('/token/:secretId', async (req, res) => {
  const secrets = req.app.get('db').collection('secrets')

  const secret = await secrets.findOne({
    _id: new ObjectID(req.params.secretId),
    userId: req.user
  })

  if (!secret) {
    res.sendStatus(404)
  }

  res.send(
    await secrets.updateOne({ _id: secret._id }, { $set: { token: uniqid() } })
  )
})

router.post('/register', async (req, res) => {
  if (!isValidSaveRequest(req, res)) {
    console.error('Bad register request payload')
    return res.sendStatus(400)
  }

  const subscription = await req.app
    .get('db')
    .collection('subscriptions')
    .updateOne(
      { userId: req.user },
      {
        $set: {
          userId: req.user,
          subscription: req.body
        }
      },
      { upsert: true }
    )

  res.status(201).send(subscription)
})

module.exports = router
