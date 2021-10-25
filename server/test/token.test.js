const { test } = require('tap')
const sinon = require('sinon')

const tokenRoutes = require('../lib/routes/token')

const { buildServer, decorate } = require('./test-util.js')

test('token route', async (t) => {
  const authStub = sinon.stub()
  const sendStub = sinon.stub()
  const setStub = sinon.stub()
  const deleteStub = sinon.stub()

  const mockedAuthPlugin = async function(server) {
    decorate(server, 'auth', authStub)
  }

  const mockedFirebasePlugin = async function(server) {
    const admin = {
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            set: setStub,
            delete: deleteStub
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
    { plugin: tokenRoutes }
  ])

  t.beforeEach(async () => {
    setStub.reset()
    deleteStub.reset()
  })

  t.teardown(server.close.bind(server))

  t.test('should set token for user', async (t) => {
    setStub.resolves()
    const response = await server.inject({
      url: '/api/token/55555',
      method: 'PUT'
    })

    const data = response.json()

    t.equal(response.statusCode, 200)
    t.equal(setStub.calledOnce, true)
    t.equal(data.hasOwnProperty('token'), true)
  })

  t.test('should delete token', async (t) => {
    deleteStub.resolves()
    const response = await server.inject({
      url: '/api/token/55555',
      method: 'DELETE'
    })

    t.equal(response.statusCode, 204)
    t.equal(deleteStub.calledOnce, true)
  })
})
