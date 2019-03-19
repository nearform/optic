# Optic
Optic is an app that helps you securely generate OTP tokens for 2FA protected npm accounts. It allows auto-publish npm packages using CI.

## Prerequisites
1. [firebase]
   1. Create an account
   1. Follow [instructions][firebase-admin-settings] to create a project and generate a private key
   1. In the firebase [console][firebase-app-settings] add a web application to get the required configuration 
   1. Enable at least one sign in method in your [firebase project][firebase-signin] (Google is probably the most straigh forward)
   1. Create a Firestore [database], allowing reads
1. NPM
   1. Create account and edit your profile
   1. Enable `Two Factor Authentication` in your [profile][npm-profile]
   1. Create a new [token][npm-token] and save it in you CI as `NPM_TOKEN` env variable

## Setup
1. `git clone https://github.com/nearform/optic.git && cd npm-otp`
1. `npm i`
1. `npm run dev:env`
1. in the generated `.env` file, insert values:
   - `FIREBASE_CLIENT_EMAIL` is your Firebase client email generated along with the private key
   - `FIREBASE_PRIVATE_KEY` is your Firebase private key (wrapped with double quotes): `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...HoRYGGAU=\n-----END PRIVATE KEY-----\n"`
   - `FIREBASE_PROJECT_ID` is your Firebase project id
   - `VAPID_SUBJECT` is a `mailto:` address
   - Get all th `REACT_APP_*` values from the Firebase web application configuration snippet
1. `npm run dev`

## Usage
1. Log in the application
1. Add your secret, by scanning NPM's QR code, or providing the secret key manually
1. Generage a token and save it in CI as environement variable named `OTP_TOKEN`
1. Update NPM registry with your NPM token `echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc`
1. Use CURL to get OTP token and publish package `npm publish --otp $(curl -s http://localhost:3000/api/generate/$OTP_TOKEN)`

## Deficiency
1. The initial assumption was that we don't need database, but we need a place to store subscriptions
1. Safari browser doesn't support push notifications
1. Only Android browsers support push notifications
1. Desktop browsers need a running process to receive notification
1. Building a mobile app might solve all problems

- [firebase]: https://console.firebase.google.com
- [firebase-admin-settings]: https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app
- [firebase-signin]: https://console.firebase.google.com/u/0/project/_/authentication/providers
- [firebase-app-settings]: https://console.firebase.google.com/u/0/project/_/settings/general/
- [database]: https://console.firebase.google.com/u/0/project/_/database
- [VAPID]: https://tools.ietf.org/html/draft-ietf-webpush-vapid-01
- [npm-profile]: https://www.npmjs.com/settings/~/profile
- [npm-token]: https://www.npmjs.com/settings/~/tokens