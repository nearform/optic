const { test } = require('tap')
const sinon = require('sinon')

const otpRoutes = require('../lib/routes/otp')

const { buildServer, decorate } = require('./test-util.js')

test('/otp route', async (t) => {
  const authStub = sinon.stub()
  const sendStub = sinon.stub()
  const getStub = sinon.stub()
  const docStub = sinon.stub()

  const mockedAuthPlugin = async function(server) {
    decorate(server, 'auth', authStub)
  }

  const mockedFirebasePlugin = async function(server) {
    const admin = {
      firestore: () => ({
        collection: () => ({
          doc: docStub,
          where: () => ({
            get: getStub
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
    { plugin: otpRoutes }
  ])

  t.beforeEach(async () => {
    getStub.reset()
    sendStub.reset()
    docStub.reset()
  })

  t.teardown(server.close.bind(server))

  t.test('should generate push notification', async (t) => {
    getStub.returns({
      empty: false,
      docs: [
        {
          id: 99,
          data: () => ({ subscriptionId: 'ExponentPush', userId: '11111' })
        }
      ]
    })
    docStub.returns({
      get: () => ({
        exists: true,
        data: () => sinon.stub()
      }),
      set: () => {},
      onSnapshot: () => sinon.stub(),
      delete: () => sinon.stub()
    })

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'GET'
    })

    t.equal(response.statusCode, 403)
    t.equal(docStub.calledTwice, true)
    t.equal(getStub.calledOnce, true)
    t.equal(sendStub.called, true)
  })

  t.test('should return 404 if token not found', async (t) => {
    getStub.returns({
      empty: true,
      docs: [
        {
          id: 99,
          data: () => ({ userId: '11111' })
        }
      ]
    })

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'GET'
    })

    const data = await response.json()

    t.equal(response.statusCode, 404)
    t.equal(docStub.called, false)
    t.equal(getStub.calledOnce, true)
    t.equal(sendStub.called, false)
    t.equal(data.message, 'Token not found')
  })
  t.test('should return 404 if subscription not found', async (t) => {
    getStub.onCall(0).returns({
      empty: false,
      docs: [
        {
          id: 99,
          data: () => ({ subscriptionId: 'ExponentPush', userId: '11111' })
        }
      ]
    })
    docStub.returns({
      get: () => ({
        exists: false,
        data: () => sinon.stub()
      })
    })

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'GET'
    })

    const data = await response.json()

    t.equal(response.statusCode, 404)
    t.equal(getStub.calledOnce, true)
    t.equal(sendStub.called, false)
    t.equal(data.message, 'Subscription not found')
  })

  t.test('should respond and update otp', async (t) => {
    const updateStub = sinon.stub()
    updateStub.resolves()
    docStub.returns({
      get: () => ({ exists: true }),
      update: updateStub
    })

    const response = await server.inject({
      url: '/api/respond',
      method: 'POST',
      body: {
        uniqueId: 111,
        otp: 54321,
        approved: true
      }
    })

    t.equal(response.statusCode, 201)
    t.equal(docStub.called, true)
    t.equal(updateStub.called, true)
  })

  t.test('should return 404 if request does not exist', async (t) => {
    docStub.returns({
      get: () => null
    })

    const response = await server.inject({
      url: '/api/respond',
      method: 'POST',
      body: {
        uniqueId: 111,
        otp: 54321,
        approved: true
      }
    })

    t.equal(response.statusCode, 404)
    t.equal(docStub.called, true)
  })
})
