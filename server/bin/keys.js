#!/usr/bin/env node

const webPush = require('web-push')

const { publicKey, privateKey } = webPush.generateVAPIDKeys()

console.log('vapid keys generated successfully')
console.log(`Public key - ${publicKey}`)
console.log(`Private key - ${privateKey}`)
