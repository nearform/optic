const assert = require('node:assert/strict')
const { test, after, describe, beforeEach } = require('node:test')

const sinon = require('sinon')

const tokenRoutes = require('../lib/routes/token')

const { buildServer, decorate } = require('./test-util.js')

describe('token route', async () => {
  const authStub = sinon.stub()
  const sendStub = sinon.stub()
  const setStub = sinon.stub()
  const deleteStub = sinon.stub()
  const getStub = sinon.stub()
  const documentIdStub = sinon.stub()

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
    setStub.reset()
    deleteStub.reset()
    documentIdStub.reset()
    getStub.reset()
  })

  after(() => server.close())

  test('should set token for user', async () => {
    setStub.resolves()
    getStub.resolves({ empty: false })
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id', subscriptionId: 'mock-id' }
    })

    const data = response.json()

    assert.deepStrictEqual(response.statusCode, 200)
    assert.deepStrictEqual(setStub.calledOnce, true)
    assert.deepStrictEqual(
      Object.prototype.hasOwnProperty.call(data, 'token'),
      true
    )
  })

  test('should return 400 if secretId is not specified', async (t) => {
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { subscriptionId: 'mock-id' }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })

  test('should return 400 if subscriptionId is not specified', async (t) => {
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id' }
    })

    assert.deepStrictEqual(response.statusCode, 400)
  })

  test('should return 403 if subscriptionId doesnt belong to user', async () => {
    getStub.resolves({ empty: true })
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id', subscriptionId: 'mock-subscription' }
    })

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(getStub.calledOnce, true)
  })

  test('should delete token', async (t) => {
    deleteStub.resolves()
    getStub.onCall(0).resolves({
      exists: true,
      get: () => '111'
    })
    getStub.onCall(1).resolves({ empty: false })
    documentIdStub.resolves('111')

    const response = await server.inject({
      url: '/api/token/55555',
      method: 'DELETE'
    })

    assert.deepStrictEqual(response.statusCode, 204)
    assert.deepStrictEqual(deleteStub.calledOnce, true)
  })
})
