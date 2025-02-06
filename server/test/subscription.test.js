const assert = require('node:assert/strict')
const { test, after, describe, beforeEach, mock } = require('node:test')

const subscriptionRoutes = require('../lib/routes/subscription')

const { buildServer, decorate } = require('./test-util.js')

describe('subscription route', async () => {
  const authStub = mock.fn()
  const sendStub = mock.fn()
  const getStub = mock.fn()
  const docStub = mock.fn()
  const updateStub = mock.fn()
  const addStub = mock.fn()

  const mockedAuthPlugin = async function (server) {
    decorate(server, 'auth', authStub)
  }

  const mockedFirebasePlugin = async function (server) {
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

  const mockedPushPlugin = async function (server) {
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

  beforeEach(async () => {
    getStub.mock.resetCalls()
    docStub.mock.resetCalls()
    updateStub.mock.resetCalls()
    addStub.mock.resetCalls()
  })

  after(() => server.close())

  test('should return 400 if no endpoint specified', async () => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'expo'
      }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })

  test('should return 400 if type=expo and no token specified', async () => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'expo'
      }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })

  test('should return 400 if type is not specified', async () => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        endpoint: 'mock'
      }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })

  test('should return 400 if type is neither "web" nor "expo"', async () => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'mock'
      }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })
})
