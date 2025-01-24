'use strict'

const { join: pathJoin } = require('path')

const envSchema = require('env-schema')
const S = require('fluent-json-schema')
const { packageDirectorySync } = require('pkg-dir')

const pkgRoot = packageDirectorySync()
const pluginsPath = pathJoin(pkgRoot, 'server/lib', 'plugins')
const routesPath = pathJoin(pkgRoot, 'server/lib', 'routes')

const env = envSchema({
  dotenv: true,
  schema: S.object()
    .prop('NODE_ENV', S.string())
    .prop('HOST', S.string().default('0.0.0.0'))
    .prop('PORT', S.string().default('3001'))
    .prop('FIREBASE_PROJECT_ID', S.string())
    .prop('FIREBASE_PRIVATE_KEY_BASE64', S.string())
    .prop('FIREBASE_CLIENT_EMAIL', S.string())
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
      'FIREBASE_PRIVATE_KEY_BASE64'
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
        req: (request) => ({
          method: request.raw.method,
          url: request.raw.url,
          hostname: request.hostname,
          params: request.params,
          query: request.query
        }),
        res: (response) => ({
          body: response.body,
          statusCode: response.statusCode
        })
      }
    }
  },
  firebase: {
    firebaseProjectId: env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKeyBase64: env.FIREBASE_PRIVATE_KEY_BASE64
  }
}

module.exports = config
