'use strict'

const { join: pathJoin } = require('path')

const envSchema = require('env-schema')
const S = require('fluent-json-schema')
const pkgDir = require('pkg-dir')

const pkgRoot = pkgDir.sync()
const pluginsPath = pathJoin(pkgRoot, 'server/lib', 'plugins')
const routesPath = pathJoin(pkgRoot, 'server/lib', 'routes')

const env = envSchema({
  dotenv: true,
  schema: S.object()
    .prop('NODE_ENV', S.string())
    .prop('HOST', S.string().default('0.0.0.0'))
    .prop('PORT', S.string().default('3001'))
    .prop('FIREBASE_PROJECT_ID', S.string())
    .prop('FIREBASE_PRIVATE_KEY', S.string())
    .prop('FIREBASE_PRIVATE_KEY_BASE64', S.string())
    .prop('FIREBASE_CLIENT_EMAIL', S.string())
    .prop('VAPID_PUBLIC_KEY', S.string())
    .prop('VAPID_PRIVATE_KEY', S.string())
    .prop('VAPID_SUBJECT', S.string())
    .prop('REACT_APP_API_KEY', S.string())
    .prop('REACT_APP_AUTH_DOMAIN', S.string())
    .prop('REACT_APP_DATABASE_URL', S.string())
    .prop('REACT_APP_PROJECT_ID', S.string())
    .prop('REACT_APP_STORAGE_BUCKET', S.string())
    .prop('REACT_APP_MESSAGING_SENDER_ID', S.string())
    .prop(
      'LOG_LEVEL',
      S.string()
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info')
    )
    .required([
      'HOST',
      'PORT',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY_BASE64',
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'VAPID_SUBJECT',
      'REACT_APP_API_KEY',
      'REACT_APP_AUTH_DOMAIN',
      'REACT_APP_DATABASE_URL',
      'REACT_APP_PROJECT_ID',
      'REACT_APP_STORAGE_BUCKET',
      'REACT_APP_MESSAGING_SENDER_ID'
    ])
})

const isProduction = env.NODE_ENV === 'production'

const config = {
  isProduction,
  pluginsPath,
  routesPath,
  fastify: {
    host: env.HOST,
    port: +env.PORT
  },
  fastifyInit: {
    trustProxy: 2,
    disableRequestLogging: true,
    logger: {
      level: env.LOG_LEVEL,
      serializers: {
        req: request => ({
          method: request.raw.method,
          url: request.raw.url,
          hostname: request.hostname,
          params: request.params,
          query: request.query
        }),
        res: response => ({
          body: response.body,
          statusCode: response.statusCode
        })
      }
    }
  },
  firebase: {
    firebaseProjectId: env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: env.FIREBASE_PRIVATE_KEY,
    firebasePrivateKeyBase64: env.FIREBASE_PRIVATE_KEY_BASE64
  },
  vapid: {
    vapidPublicKey: env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: env.VAPID_PRIVATE_KEY,
    vapidSubject: env.VAPID_SUBJECT
  },
  react: {
    reactAppApiKey: env.REACT_APP_API_KEY,
    reactAppAuthDomain: env.REACT_APP_AUTH_DOMAIN,
    reactAppDatabaseUrl: env.REACT_APP_DATABASE_URL,
    reactAppProjectId: env.REACT_APP_PROJECT_ID,
    reactAppStorageBucket: env.REACT_APP_STORAGE_BUCKET,
    reactAppMessagingSenderId: env.REACT_APP_MESSAGING_SENDER_ID
  }
}

module.exports = config
