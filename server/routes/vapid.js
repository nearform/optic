exports.register = router => {
  const { VAPID_PUBLIC_KEY } = process.env
  router.get('/vapidPublicKey', (_, res) => res.send(VAPID_PUBLIC_KEY))
}
