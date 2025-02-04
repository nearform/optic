const assert = require('node:assert/strict')
const { test, after, describe, beforeEach, afterEach } = require('node:test')

const sinon = require('sinon')

const otpRoutes = require('../lib/routes/otp')

const { buildServer, decorate } = require('./test-util.js')

describe('/otp route', async () => {
  const sendStub = sinon.stub()
  const getStub = sinon.stub()
  const docStub = sinon.stub()

  const mockedFirebasePlugin = async function (server) {
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

  const mockedPushPlugin = async function (server) {
    const push = {
      send: sendStub
    }
    decorate(server, 'push', push)
  }

  const server = await buildServer([
    { plugin: mockedFirebasePlugin },
    { plugin: mockedPushPlugin },
    { plugin: otpRoutes }
  ])

  let clock
  beforeEach(async () => {
    getStub.reset()
    sendStub.reset()
    docStub.reset()
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  after(() => server.close())

  test('should generate push notification on GET request', async () => {
    // All tokens collection
    docStub.onFirstCall().returns({
      get: () => ({
        exists: true,
        data: () => ({
          secretId: 'secretId',
          subscriptionId: 'subscriptionId'
        })
      })
    })
    // Subscriptions collection
    docStub.onSecondCall().returns({
      get: () => ({
        exists: true,
        data: () => sinon.stub()
      })
    })
    // Requests collection
    docStub.onThirdCall().returns({
      set: () => {},
      onSnapshot: () => sinon.stub(),
      delete: () => sinon.stub()
    })

    let response

    server
      .inject({
        url: '/api/generate/55555',
        method: 'GET'
      })
      .then((resp) => (response = resp))

    await clock.tickAsync(61e3)

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(docStub.calledThrice, true)
    assert.deepStrictEqual(sendStub.called, true)
  })

  test('should generate push notification on POST request with valid body', async () => {
    // All tokens collection
    docStub.onFirstCall().returns({
      get: () => ({
        exists: true,
        data: () => ({
          secretId: 'secretId',
          subscriptionId: 'subscriptionId'
        })
      })
    })
    // Subscriptions collection
    docStub.onSecondCall().returns({
      get: () => ({
        exists: true,
        data: () => sinon.stub()
      })
    })
    // Requests collection
    docStub.onThirdCall().returns({
      set: () => {},
      onSnapshot: () => sinon.stub(),
      delete: () => sinon.stub()
    })

    let response

    server
      .inject({
        url: '/api/generate/55555',
        method: 'POST',
        body: {
          packageInfo: {
            version: 'v2',
            name: '@optic/optic-expo'
          }
        }
      })
      .then((resp) => (response = resp))

    await clock.tickAsync(61e3)

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(docStub.calledThrice, true)
    assert.deepStrictEqual(sendStub.called, true)
  })

  test('should generate push notification on POST request without body', async () => {
    // All tokens collection
    docStub.onFirstCall().returns({
      get: () => ({
        exists: true,
        data: () => ({
          secretId: 'secretId',
          subscriptionId: 'subscriptionId'
        })
      })
    })
    // Subscriptions collection
    docStub.onSecondCall().returns({
      get: () => ({
        exists: true,
        data: () => sinon.stub()
      })
    })
    // Requests collection
    docStub.onThirdCall().returns({
      set: () => {},
      onSnapshot: () => sinon.stub(),
      delete: () => sinon.stub()
    })

    let response

    server
      .inject({
        url: '/api/generate/55555',
        method: 'POST'
      })
      .then((resp) => (response = resp))

    await clock.tickAsync(61e3)

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(docStub.calledThrice, true)
    assert.deepStrictEqual(sendStub.called, true)
  })

  test('should return invalid on POST request if packageInfo is invalid', async () => {
    // All tokens collection
    docStub.onFirstCall().returns({
      get: () => ({
        exists: true,
        data: () => ({
          secretId: 'secretId',
          subscriptionId: 'subscriptionId'
        })
      })
    })
    // Subscriptions collection
    docStub.onSecondCall().returns({
      get: () => ({
        exists: true,
        data: () => sinon.stub()
      })
    })
    // Requests collection
    docStub.onThirdCall().returns({
      set: () => {},
      onSnapshot: () => sinon.stub(),
      delete: () => sinon.stub()
    })

    let response

    server
      .inject({
        url: '/api/generate/55555',
        method: 'POST',
        body: {
          packageInfo: {
            packageVersion: 'v2',
            packageName: '@optic/optic-expo'
          }
        }
      })
      .then((resp) => (response = resp))

    await clock.tickAsync(61e3)

    assert.deepStrictEqual(response.statusCode, 400)
    assert.deepStrictEqual(docStub.called, false)
    assert.deepStrictEqual(sendStub.called, false)
  })

  test('should return 404 if token not found', async () => {
    getStub.returns({
      exists: false
    })

    docStub.returns({
      get: getStub
    })

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'GET'
    })

    const data = await response.json()

    assert.deepStrictEqual(response.statusCode, 404)
    assert.deepStrictEqual(docStub.calledOnce, true)
    assert.deepStrictEqual(getStub.calledOnce, true)
    assert.deepStrictEqual(sendStub.called, false)
    assert.deepStrictEqual(data.message, 'Token not found')
  })

  test('should return 404 if subscription not found', async () => {
    getStub.onFirstCall().returns({
      exists: true,
      data: () => ({
        secretId: 'secretid',
        subscriptionId: 'subscriptionId'
      })
    })
    docStub.onFirstCall().returns({
      get: getStub
    })

    getStub.onSecondCall().returns({
      empty: false,
      docs: [
        {
          id: 99,
          data: () => ({ subscriptionId: 'ExponentPush', userId: '11111' })
        }
      ]
    })
    docStub.onSecondCall().returns({
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

    assert.deepStrictEqual(response.statusCode, 404)
    assert.deepStrictEqual(getStub.calledOnce, true)
    assert.deepStrictEqual(sendStub.called, false)
    assert.deepStrictEqual(data.message, 'Subscription not found')
  })

  test('should respond and update otp', async () => {
    clock.restore()
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

    assert.deepStrictEqual(response.statusCode, 201)
    assert.deepStrictEqual(docStub.called, true)
    assert.deepStrictEqual(updateStub.called, true)
  })

  test('should return 404 if request does not exist', async () => {
    clock.restore()
    // Requests collection
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

    assert.deepStrictEqual(response.statusCode, 404)
    assert.deepStrictEqual(docStub.called, true)
  })
})
