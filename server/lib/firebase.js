const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:
      process.env.FIREBASE_PRIVATE_KEY ||
      Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString()
  })
})

module.exports = admin
