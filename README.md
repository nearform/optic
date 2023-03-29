# Optic

[![ci](https://github.com/nearform/optic/actions/workflows/ci.yml/badge.svg)](https://github.com/nearform/optic/actions/workflows/ci.yml)
[![cd](https://github.com/nearform/optic/actions/workflows/cd.yml/badge.svg)](https://github.com/nearform/optic/actions/workflows/cd.yml)


Optic is an app that helps you securely generate OTP tokens for 2FA protected npm accounts. It allows auto-publish npm packages using CI.

This repository contains the backend API for the application. Unless you're here on purpose, you're probably looking for the [GitHub action](https://github.com/nearform/optic-release-automation-action) or the [mobile application](https://github.com/nearform/optic-expo).

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
1. GitHub Actions Secrets
   1. Make sure that all the secrets described in the actions (such as `.github/workflows/deploy-job.yml`) have been created and have updated values.
1. GCP
   1. Make sure that the Service Account that will run the Cloud Run service has the "Secret Manager Access" role attached to it so the service can query the secrets

## Setup
1. `git clone https://github.com/nearform/optic.git && cd optic`
1. `npm i`
1. `npm run dev:env`
1. in the generated `.env` file, insert values:
   - `FIREBASE_CLIENT_EMAIL` is your Firebase client email generated along with the private key
   - `FIREBASE_PRIVATE_KEY_BASE64` is your Firebase private key, base64 encoded to avoid new lines
   - `FIREBASE_PROJECT_ID` is your Firebase project id
   - Do not use quotes, if you intend to use the same file for dockerized deployment
1. `npm run dev`

## Docker

1. Build: `docker build -t nearform/optic:latest .`
1. Generate the `.env` file using the steps from setup
1. Run: `docker run --env-file .env --expose 3001 nearform/optic:latest`

## Usage
1. Log in the application
1. Add your secret, by scanning NPM's QR code, or providing the secret key manually
1. Generage a token and save it in CI as environement variable named `OTP_TOKEN`
1. Update NPM registry with your NPM token `echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc`
1. Use CURL to get OTP token and publish package `npm publish --otp $(curl -s http://localhost:3000/api/generate/$OTP_TOKEN)`

## Issues
1. The initial assumption was that we don't need database, but we need a place to store subscriptions

[firebase]: https://console.firebase.google.com
[firebase-admin-settings]: https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app
[firebase-signin]: https://console.firebase.google.com/u/0/project/_/authentication/providers
[firebase-app-settings]: https://console.firebase.google.com/u/0/project/_/settings/general/
[database]: https://console.firebase.google.com/u/0/project/_/database
[npm-profile]: https://www.npmjs.com/settings/~/profile
[npm-token]: https://www.npmjs.com/settings/~/tokens
