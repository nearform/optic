#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const webPush = require('web-push')

const root = path.resolve(__dirname, '..', '..')
const envFile = path.join(root, '.env')
const sampleFile = path.join(root, '.env.sample')

try {
  fs.accessSync(envFile)
  console.log('.env file already present, skipping.')
} catch (err) {
  // file does not exist: copy sample, providing values for VAPID
  const { publicKey, privateKey } = webPush.generateVAPIDKeys()
  fs.writeFileSync(
    envFile,
    fs
      .readFileSync(sampleFile, 'utf8')
      .replace('VAPID_PRIVATE_KEY=', `VAPID_PRIVATE_KEY=${privateKey}`)
      .replace('VAPID_PUBLIC_KEY=', `VAPID_PUBLIC_KEY=${publicKey}`)
  )
  console.log(
    '.env file ready to be customized. VAPID keys were provided for conveniency.'
  )
}
