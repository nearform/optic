const uniqid = require('uniqid')
const webPush = require('web-push')
const admin = require('../lib/firebase')

const approvalLimit = 60e3

exports.register = router => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env

  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  router.get('/generate/:token', async (req, res) => {
    const db = admin.firestore()

    const secret = await db
      .collection('tokens')
      .where('token', '==', req.params.token)
      .get()

    if (secret.empty) {
      console.warn('Token not found')
      return res.sendStatus(404)
    }

    const { userId, token } = secret.docs[0].data()
    const secretId = secret.docs[0].id

    const subscriptions = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .get()

    if (subscriptions.empty) {
      console.warn(`No subscription found for user ${userId}`)
      return res.sendStatus(404)
    }

    const uniqueId = uniqid()

    const completeRequest = (err, otp) => {
      unsubscribe()
      clearTimeout(timeout)
      if (err) {
        console.log(`Encountered error: ${err}`)
        return res.sendStatus(403)
      }
      if (!otp) {
        console.log('Request was not approved')
        return res.sendStatus(403)
      }
      console.log('Request approved, sending back OTP')
      res.send(otp)
    }

    const request = db.collection('requests').doc(uniqueId)
    await request.set({ createdAt: new Date() })
    const unsubscribe = request.onSnapshot(update => {
      const approved = update.get('approved')
      if (approved === undefined) {
        // update due to object creation
        return
      }
      completeRequest(null, update.get('otp'))
    }, completeRequest)

    // fire the notification to all available subscription
    Promise.all(
      subscriptions.docs.map(doc => {
        return (async () => {
          const subscription = doc.data()

          try {
            console.log(
              `Sending notification to subscription ${subscription.endpoint}`
            )
            await webPush.sendNotification(
              subscription,
              JSON.stringify({ uniqueId, token, secretId })
            )
          } catch (err) {
            console.error('Could not send push notification to client')
            request.delete()

            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log('Subscription is not valid, removing')
              subscriptions.ref.delete()
            } else {
              console.log('Subscription is not valid but dunno why')
            }
            return
          }
        })()
      })
    )
    const timeout = setTimeout(completeRequest, approvalLimit)
  })

  router.post('/respond', async (req, res) => {
    const db = admin.firestore()
    const { uniqueId, otp, approved } = req.body

    const request = db.collection('requests').doc(uniqueId)
    if (!(await request.get()).exists) {
      return res.sendStatus(404)
    }
    await request.update({ otp: otp || null, approved })
    res.sendStatus(201)
  })
}
