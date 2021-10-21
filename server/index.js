'use strict'

const Fastify = require('fastify')
const closeWithGrace = require('close-with-grace')

const getConfig = require('./lib/config/index')
const startServer = require('./lib/server')

let log

async function main() {
  const config = await getConfig()

  const server = Fastify(config.fastifyInit)
  log = server.log

  server.register(startServer, config)
  server.options('*', (request, reply) => {
    reply.send()
  })

  await server.listen(config.fastify.port, config.fastify.host)

  closeWithGrace({ delay: 500 }, async function({ signal, err }) {
    if (err) {
      log.error(err, 'An unhandled error was caught, closing server')
    }
    await server.close()
    log.info({ signal }, 'application closed')

    if (err) {
      process.exit(1)
    }
  })
}

main()
  .catch(err => {
    // must be an init error, so bail
    if (log) {
      log.error(err, 'Error during initialization')
    } else {
      console.error('Error during initialization:', err)
    }
    process.exit(1)
  })
  .catch(err =>
    // failed beyond belief
    console.error(err)
  )
