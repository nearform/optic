'use strict'

const path = require('path')

const autoLoad = require('fastify-autoload')
const fp = require('fastify-plugin')
const fastifyStatic = require('fastify-static')

async function plugin(server, config) {
  server.register(fastifyStatic, {
    root: path.join(__dirname, '../../public')
  })

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
