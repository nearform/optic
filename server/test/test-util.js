const Fastify = require('fastify')
const fp = require('fastify-plugin')
const sensible = require('fastify-sensible')

const wrapFp = plugin =>
  plugin[Symbol.for('skip-override')] ? plugin : fp(plugin)

async function buildServer(plugins = []) {
  const server = Fastify({
    logger: false
  })

  server.register(sensible)

  plugins.reduce(
    (server, { plugin, options }) => server.register(wrapFp(plugin), options),
    server
  )

  await server.ready()

  return server
}

function decorate(server, name, value) {
  server.decorate(name, value)
}

module.exports = {
  buildServer,
  decorate
}
