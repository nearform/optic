const { test, after, describe, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')

const secretRoutes = require('../lib/routes/secret')

const { buildServer, decorate } = require('./test-util.js')

describe('secret route', async () => {
  const deleteStub = mock.fn()
  const getStub = mock.fn()

  const mockedAuthPlugin = async function (server) {
    decorate(server, 'auth', mock.fn())
  }

  const mockedFirebasePlugin = async function (server) {
    const admin = {
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            get: getStub,
            delete: deleteStub
          }),
          where: () => ({
            get: getStub,
            where: () => ({
              get: getStub
            })
          })
        })
      })
    }
    admin.firestore.FieldPath = { documentId: mock.fn() }
    decorate(server, 'firebaseAdmin', admin)
  }

  const mockedPushPlugin = async function (server) {
    const push = {
      send: mock.fn()
    }
    decorate(server, 'push', push)
  }

  const server = await buildServer([
    { plugin: mockedAuthPlugin },
    { plugin: mockedFirebasePlugin },
    { plugin: mockedPushPlugin },
    { plugin: secretRoutes }
  ])

  beforeEach(async () => {
    deleteStub.mock.resetCalls()
    getStub.mock.resetCalls()
  })

  after(() => server.close())

  test('should delete all tokens relating to a secretId', async () => {
    deleteStub.mock.mockImplementationOnce(() => {})
    getStub.mock.mockImplementationOnce(
      () => ({
        exists: true,
        docs: [
          {
            id: 'an-id',
            data: () => ({
              subscriptionId: 'a-subscription-id'
            })
          },
          {
            id: 'another-id',
            data: () => ({
              subscriptionId: 'another-subscription-id'
            })
          }
        ]
      }),
      0
    )

    getStub.mock.mockImplementationOnce(
      () => ({
        empty: false
      }),
      1
    )

    getStub.mock.mockImplementationOnce(
      () => ({
        empty: false
      }),
      2
    )

    const response = await server.inject({
      url: '/api/secret/55555',
      method: 'DELETE'
    })

    assert.deepStrictEqual(response.statusCode, 204)
    assert.deepStrictEqual(deleteStub.mock.callCount(), 2)
  })

  test('should not delete tokens without access', async (t) => {
    deleteStub.mock.mockImplementationOnce(() => {})
    getStub.mock.mockImplementationOnce(
      () => ({
        exists: true,
        docs: [
          {
            id: 'an-id',
            data: () => ({
              subscriptionId: 'a-subscription-id'
            })
          }
        ]
      }),
      0
    )

    getStub.mock.mockImplementationOnce(
      () => ({
        empty: true
      }),
      1
    )

    const response = await server.inject({
      url: '/api/secret/55555',
      method: 'DELETE'
    })

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(deleteStub.mock.callCount(), 0)
  })
})
