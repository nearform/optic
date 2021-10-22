'use strict'

const fp = require('fastify-plugin')
const admin = require('firebase-admin')

async function firebasePlugin(server, options) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: options.firebase.firebaseProjectId,
      clientEmail: options.firebase.firebaseClientEmail,
      privateKey:
        options.firebase.firebasePrivateKey ||
        Buffer.from(
          options.firebase.firebasePrivateKeyBase64,
          'base64'
        ).toString()
    })
  })

  server.decorate('firebaseAdmin', admin)
}

module.exports = fp(firebasePlugin, {
  name: 'firebase-plugin'
})
