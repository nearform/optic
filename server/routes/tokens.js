const uniqid = require('uniqid')
const admin = require('../lib/firebase')

exports.register = router => {
  router.put(
    '/token/:secretId',
    async ({ params: { secretId }, user: userId }, res) => {
      const db = admin.firestore()
      const token = uniqid()

      await db
        .collection('tokens')
        .doc(secretId)
        .set({
          token,
          userId
        })
      res.send({ token })
    }
  )

  router.delete('/token/:secretId', async ({ params: { secretId } }, res) => {
    res.send(
      await admin
        .firestore()
        .collection('tokens')
        .doc(secretId)
        .delete()
    )
  })
}
