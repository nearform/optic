'use strict'

const path = require('path')

const autoLoad = require('fastify-autoload')
const fp = require('fastify-plugin')

async function plugin(server, config) {
  server.register(require('fastify-static'), {
    root: path.join(__dirname, '../../public'),
    prefix: '/public/'
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
