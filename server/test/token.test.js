const assert = require('node:assert/strict')
const { test, after, describe, beforeEach, mock } = require('node:test')

const tokenRoutes = require('../lib/routes/token')

const { buildServer, decorate } = require('./test-util.js')

describe('token route', async () => {
  const authStub = mock.fn()
  const sendStub = mock.fn()
  const setStub = mock.fn()
  const deleteStub = mock.fn()
  const getStub = mock.fn()
  const documentIdStub = mock.fn()

  const mockedAuthPlugin = async function (server) {
    decorate(server, 'auth', authStub)
  }

  const mockedFirebasePlugin = async function (server) {
    const admin = {
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            get: getStub,
            set: setStub,
            delete: deleteStub
          }),
          where: () => ({
            where: () => ({
              get: getStub
            })
          })
        })
      })
    }
    admin.firestore.FieldPath = { documentId: documentIdStub }
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
    { plugin: tokenRoutes }
  ])

  beforeEach(async () => {
    setStub.mock.resetCalls()
    deleteStub.mock.resetCalls()
    documentIdStub.mock.resetCalls()
    getStub.mock.resetCalls()
  })

  after(() => server.close())

  test('should set token for user', async () => {
    setStub.mock.mockImplementationOnce(() => {})
    getStub.mock.mockImplementationOnce(() => ({ empty: false }))
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id', subscriptionId: 'mock-id' }
    })

    const data = response.json()

    assert.deepStrictEqual(response.statusCode, 200)
    assert.deepStrictEqual(setStub.mock.callCount(), 1)
    assert.deepStrictEqual(
      Object.prototype.hasOwnProperty.call(data, 'token'),
      true
    )
  })

  test('should return 400 if secretId is not specified', async () => {
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { subscriptionId: 'mock-id' }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })

  test('should return 400 if subscriptionId is not specified', async () => {
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id' }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })

  test('should return 403 if subscriptionId doesnt belong to user', async () => {
    getStub.mock.mockImplementationOnce(() => ({ empty: true }))
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id', subscriptionId: 'mock-subscription' }
    })

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(getStub.mock.callCount(), 1)
  })

  test('should delete token', async () => {
    deleteStub.mock.mockImplementationOnce(() => {})
    getStub.mock.mockImplementationOnce(
      () => ({
        exists: true,
        get: () => '111'
      }),
      0
    )
    getStub.mock.mockImplementationOnce(() => ({ empty: false }), 1)
    documentIdStub.mock.mockImplementationOnce(() => '111')

    const response = await server.inject({
      url: '/api/token/55555',
      method: 'DELETE'
    })

    assert.deepStrictEqual(response.statusCode, 204)
    assert.deepStrictEqual(deleteStub.mock.callCount(), 1)
  })
})
