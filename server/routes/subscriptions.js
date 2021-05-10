const admin = require('../lib/firebase')

const isValidSaveRequest = (req, res) => {
  // Check the request body has at least an endpoint if type is not expo.
  if (!req.body || (req.body.type !== 'expo' && !req.body.endpoint)) {
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

exports.register = router => {
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
        ...req.body
      })
    } else {
      subscriptionRef.forEach(s => {
        updateArray.push(
          db
            .collection('subscriptions')
            .doc(s.id)
            .update({
              userId: req.user,
              ...req.body
            })
        )
      })
      await Promise.all(updateArray)
    }

    res.status(201).send(subscription)
  })
}
