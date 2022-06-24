'use strict'

const path = require('path')

const autoLoad = require('@fastify/autoload')
const fp = require('fastify-plugin')
const fastifyStatic = require('@fastify/static')
const helmet = require('@fastify/helmet')
const sensible = require('@fastify/sensible')

async function plugin(server, config) {
  server.register(fastifyStatic, {
    root: path.join(__dirname, '../../build')
  })

  server.register(helmet)
  server.register(sensible)

  server
    .register(autoLoad, {
      dir: config.pluginsPath,
      options: config,
      ignorePattern: /.*(test|spec).js/
    })
    .register(autoLoad, {
      dir: config.routesPath,
      options: config,
      ignorePattern: /.*(test|spec).js/
    })
}

module.exports = fp(plugin)
