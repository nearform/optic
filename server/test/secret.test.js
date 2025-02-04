const { test, after, describe, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const sinon = require('sinon')

const secretRoutes = require('../lib/routes/secret')

const { buildServer, decorate } = require('./test-util.js')

describe('secret route', async (t) => {
  const deleteStub = sinon.stub()
  const getStub = sinon.stub()

  const mockedAuthPlugin = async function (server) {
    decorate(server, 'auth', sinon.stub())
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
    admin.firestore.FieldPath = { documentId: sinon.stub() }
    decorate(server, 'firebaseAdmin', admin)
  }

  const mockedPushPlugin = async function (server) {
    const push = {
      send: sinon.stub()
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
    deleteStub.reset()
    getStub.reset()
  })

  after(() => server.close())

  test('should delete all tokens relating to a secretId', async () => {
    deleteStub.resolves()
    getStub.onFirstCall().resolves({
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
    })

    getStub.onSecondCall().resolves({
      empty: false
    })

    getStub.onThirdCall().resolves({
      empty: false
    })

    const response = await server.inject({
      url: '/api/secret/55555',
      method: 'DELETE'
    })

    assert.deepStrictEqual(response.statusCode, 204)
    assert.deepStrictEqual(deleteStub.calledTwice, true)
  })

  test('should not delete tokens without access', async (t) => {
    deleteStub.resolves()
    getStub.onFirstCall().resolves({
      exists: true,
      docs: [
        {
          id: 'an-id',
          data: () => ({
            subscriptionId: 'a-subscription-id'
          })
        }
      ]
    })

    getStub.onSecondCall().resolves({
      empty: true
    })

    const response = await server.inject({
      url: '/api/secret/55555',
      method: 'DELETE'
    })

    assert.deepStrictEqual(response.statusCode, 403)
    assert.deepStrictEqual(deleteStub.notCalled, true)
  })
})
