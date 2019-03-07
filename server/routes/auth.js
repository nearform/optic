const admin = require('../lib/firebase')

exports.register = router => {
  router.use(async (req, res, next) => {
    const [, idToken] = (req.header('authorization') || '').split(/bearer /i)
    if (!idToken) {
      return res.sendStatus(401)
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.user = decodedToken.uid
    next()
  })
}
