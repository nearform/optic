const { test } = require('tap')
const sinon = require('sinon')

const subscriptionRoutes = require('../lib/routes/subscription')

const { buildServer, decorate } = require('./test-util.js')

test('subscription route', async (t) => {
  const authStub = sinon.stub()
  const sendStub = sinon.stub()
  const getStub = sinon.stub()
  const docStub = sinon.stub()
  const updateStub = sinon.stub()
  const addStub = sinon.stub()

  const mockedAuthPlugin = async function(server) {
    decorate(server, 'auth', authStub)
  }

  const mockedFirebasePlugin = async function(server) {
    const admin = {
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            update: updateStub
          }),
          add: addStub,
          where: () => ({
            where: () => ({
              get: getStub
            })
          })
        })
      })
    }
    decorate(server, 'firebaseAdmin', admin)
  }

  const mockedPushPlugin = async function(server) {
    const push = {
      send: sendStub
    }
    decorate(server, 'push', push)
  }

  const server = await buildServer([
    { plugin: mockedAuthPlugin },
    { plugin: mockedFirebasePlugin },
    { plugin: mockedPushPlugin },
    { plugin: subscriptionRoutes }
  ])

  t.beforeEach(async () => {
    getStub.reset()
    docStub.reset()
    updateStub.reset()
    addStub.reset()
  })

  t.teardown(server.close.bind(server))

  t.test('should return 400 if no endpoint specified', async (t) => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'expo'
      }
    })

    t.equal(response.statusCode, 400)
  })

  t.test('should return 400 if type=expo and no token specified', async (t) => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'expo'
      }
    })

    t.equal(response.statusCode, 400)
  })

  t.test('should return 400 if type is not specified', async (t) => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        endpoint: 'mock'
      }
    })

    t.equal(response.statusCode, 400)
  })

  t.test('should return 400 if type is neither "web" nor "expo"', async (t) => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'mock'
      }
    })

    t.equal(response.statusCode, 400)
  })
})
