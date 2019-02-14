# NPM OTP
NPM OTP is an app that helps you securely generate OTP tokens for 2FA protected npm accounts. It allows auto-publish npm packages using CI.

## Setup
1. `git clone https://github.com/nearform/npm-otp.git && cd npm-otp`
1. `npm i`
1. `cp .env.example .env` and insert values
1. `npm run dev`

## Usage
1. Save generated token in CI as ENV variable
1. Use CURL to get OTP token for the saved token `OTP=$(curl http://localhost:3000/api/generate/$TOKEN)`
1. Update NPM registry with your NPM token `echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc`
1. Publish package `npm publish --otp $OTP`

## Deficiency
1. The initial assumption was that we don't need database, but we need a place to store secrets
1. Safari browser doesn't support push notifications
1. Only Android browsers support push notifications
1. Desktop browsers need a running process to receive notification
1. Building a mobile app might solve all problems