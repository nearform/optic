const assert = require('node:assert/strict')
const { test, after, describe, beforeEach, mock } = require('node:test')

const otpRoutes = require('../lib/routes/otp')

const { buildServer, decorate } = require('./test-util.js')

describe('/otp route', async () => {
  const sendStub = mock.fn()
  const getStub = mock.fn()
  const docStub = mock.fn()

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

  const buildMockedServer = function (options) {
    return buildServer([
      { plugin: mockedFirebasePlugin },
      { plugin: mockedPushPlugin },
      { plugin: otpRoutes, options }
    ])
  }

  const server = await buildMockedServer({ otpApprovalTimeout: 0 })

  beforeEach(async () => {
    getStub.mock.resetCalls()
    sendStub.mock.resetCalls()
    docStub.mock.resetCalls()
  })

  after(() => server.close())

  test('should generate push notification on GET request', async () => {
    // All tokens collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => ({
            secretId: 'secretId',
            subscriptionId: 'subscriptionId'
          })
        })
      }),
      0
    )
    // Subscriptions collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => mock.fn()
        })
      }),
      1
    )
    // Requests collection
    docStub.mock.mockImplementationOnce(
      () => ({
        set: () => {},
        onSnapshot: () => mock.fn(),
        delete: () => mock.fn()
      }),
      2
    )

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'GET'
    })

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(docStub.mock.callCount(), 3)
    assert.deepStrictEqual(sendStub.mock.callCount(), 1)
  })

  test('should generate push notification on POST request with valid body', async () => {
    // All tokens collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => ({
            secretId: 'secretId',
            subscriptionId: 'subscriptionId'
          })
        })
      }),
      0
    )
    // Subscriptions collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => mock.fn()
        })
      }),
      1
    )
    // Requests collection
    docStub.mock.mockImplementationOnce(
      () => ({
        set: () => {},
        onSnapshot: () => mock.fn(),
        delete: () => mock.fn()
      }),
      2
    )

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'POST',
      body: {
        packageInfo: {
          version: 'v2',
          name: '@optic/optic-expo'
        }
      }
    })

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(docStub.mock.callCount(), 3)
    assert.deepStrictEqual(sendStub.mock.callCount(), 1)
  })

  test('should generate push notification on POST request without body', async () => {
    // All tokens collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => ({
            secretId: 'secretId',
            subscriptionId: 'subscriptionId'
          })
        })
      }),
      0
    )
    // Subscriptions collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => mock.fn()
        })
      }),
      1
    )
    // Requests collection
    docStub.mock.mockImplementationOnce(
      () => ({
        set: () => {},
        onSnapshot: () => mock.fn(),
        delete: () => mock.fn()
      }),
      2
    )

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'POST'
    })

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(docStub.mock.callCount(), 3)
    assert.deepStrictEqual(sendStub.mock.callCount(), 1)
  })

  test('should return invalid on POST request if packageInfo is invalid', async () => {
    // All tokens collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => ({
            secretId: 'secretId',
            subscriptionId: 'subscriptionId'
          })
        })
      }),
      0
    )
    // Subscriptions collection
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: true,
          data: () => mock.fn()
        })
      }),
      1
    )
    // Requests collection
    docStub.mock.mockImplementationOnce(
      () => ({
        set: () => {},
        onSnapshot: () => mock.fn(),
        delete: () => mock.fn()
      }),
      2
    )

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'POST',
      body: {
        packageInfo: {
          packageVersion: 'v2',
          packageName: '@optic/optic-expo'
        }
      }
    })

    assert.deepStrictEqual(response.statusCode, 400)
    assert.deepStrictEqual(docStub.mock.callCount(), 0)
    assert.deepStrictEqual(sendStub.mock.callCount(), 0)
  })

  test('should return 404 if token not found', async () => {
    getStub.mock.mockImplementationOnce(() => ({
      exists: false
    }))

    docStub.mock.mockImplementationOnce(() => ({
      get: getStub
    }))

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'GET'
    })

    const data = await response.json()

    assert.deepStrictEqual(response.statusCode, 404)
    assert.deepStrictEqual(docStub.mock.callCount(), 1)
    assert.deepStrictEqual(getStub.mock.callCount(), 1)
    assert.deepStrictEqual(sendStub.mock.callCount(), 0)
    assert.deepStrictEqual(data.message, 'Token not found')
  })

  test('should return 404 if subscription not found', async () => {
    getStub.mock.mockImplementationOnce(
      () => ({
        exists: true,
        data: () => ({
          secretId: 'secretid',
          subscriptionId: 'subscriptionId'
        })
      }),
      0
    )
    docStub.mock.mockImplementationOnce(
      () => ({
        get: getStub
      }),
      0
    )

    getStub.mock.mockImplementationOnce(
      () => ({
        empty: false,
        docs: [
          {
            id: 99,
            data: () => ({ subscriptionId: 'ExponentPush', userId: '11111' })
          }
        ]
      }),
      1
    )
    docStub.mock.mockImplementationOnce(
      () => ({
        get: () => ({
          exists: false,
          data: () => mock.fn()
        })
      }),
      1
    )

    const response = await server.inject({
      url: '/api/generate/55555',
      method: 'GET'
    })

    const data = await response.json()

    assert.deepStrictEqual(response.statusCode, 404)
    assert.deepStrictEqual(getStub.mock.callCount(), 1)
    assert.deepStrictEqual(sendStub.mock.callCount(), 0)
    assert.deepStrictEqual(data.message, 'Subscription not found')
  })

  test('should respond and update otp', async () => {
    const updateStub = mock.fn()
    // updateStub.resolves()
    docStub.mock.mockImplementationOnce(() => ({
      get: () => ({ exists: true }),
      update: updateStub
    }))

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
    assert.deepStrictEqual(docStub.mock.callCount(), 1)
    assert.deepStrictEqual(updateStub.mock.callCount(), 1)
  })

  test('should return 404 if request does not exist', async () => {
    // Requests collection
    docStub.mock.mockImplementationOnce(() => ({
      get: () => null
    }))

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
    assert.deepStrictEqual(docStub.mock.callCount(), 1)
  })
})
