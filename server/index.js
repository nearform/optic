'use strict'

require('dotenv').config()

const Fastify = require('fastify')
const closeWithGrace = require('close-with-grace')

const startServer = require('./lib/server')
const config = require('./config')

const server = Fastify(config.fastifyInit)

server.register(startServer, config)

const closeListeners = closeWithGrace({ delay: 500 }, async function({
  signal,
  err
}) {
  if (err) {
    server.log.error(err, 'An unhandled error was caught, closing server')
  }
  await server.close()
  server.log.info({ signal }, 'application closed')

  if (err) {
    process.exit(1)
  }
})

server.addHook('onClose', async (instance, done) => {
  closeListeners.uninstall()
  done()
})

server.listen(config.fastify.port, config.fastify.host)
