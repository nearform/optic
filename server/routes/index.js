const Router = require('express-promise-router')
const auth = require('./auth')
const config = require('./config')
const subscriptions = require('./subscriptions')
const tokens = require('./tokens')
const otp = require('./otp')
const vapid = require('./vapid')

exports.registerProtected = () => {
  const router = new Router()
  auth.register(router)
  subscriptions.register(router)
  tokens.register(router)
  return router
}

exports.registerPublic = () => {
  const router = new Router()
  config.register(router)
  otp.register(router)
  vapid.register(router)
  return router
}
