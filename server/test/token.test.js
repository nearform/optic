const { test } = require('tap')
const sinon = require('sinon')

const tokenRoutes = require('../lib/routes/token')

const { buildServer, decorate } = require('./test-util.js')

test('token route', async (t) => {
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

  t.beforeEach(async () => {
    setStub.reset()
    deleteStub.reset()
    documentIdStub.reset()
    getStub.reset()
  })

  t.teardown(server.close.bind(server))

  t.test('should set token for user', async (t) => {
    setStub.resolves()
    getStub.resolves({ empty: false })
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id', subscriptionId: 'mock-id' }
    })

    const data = response.json()

    t.equal(response.statusCode, 200)
    t.equal(setStub.calledOnce, true)
    t.equal(Object.prototype.hasOwnProperty.call(data, 'token'), true)
  })

  t.test('should return 400 if secretId is not specified', async (t) => {
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { subscriptionId: 'mock-id' }
    })

    t.equal(response.statusCode, 400)
  })

  t.test('should return 400 if subscriptionId is not specified', async (t) => {
    const response = await server.inject({
      url: '/api/token',
      method: 'PUT',
      body: { secretId: 'mock-id' }
    })

    t.equal(response.statusCode, 400)
  })

  t.test(
    'should return 403 if subscriptionId doesnt belong to user',
    async (t) => {
      getStub.resolves({ empty: true })
      const response = await server.inject({
        url: '/api/token',
        method: 'PUT',
        body: { secretId: 'mock-id', subscriptionId: 'mock-subscription' }
      })

      t.equal(response.statusCode, 403)
      t.equal(getStub.calledOnce, true)
    }
  )

  t.test('should delete token', async (t) => {
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

    t.equal(response.statusCode, 204)
    t.equal(deleteStub.calledOnce, true)
  })
})
