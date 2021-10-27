const { test } = require('tap')
const sinon = require('sinon')

const subscriptionRoutes = require('../lib/routes/subscription')

const { buildServer, decorate } = require('./test-util.js')

test('subscription route', async (t) => {
  const authStub = sinon.stub()
  const sendStub = sinon.stub()
  const getStub = sinon.stub()
  const docStub = sinon.stub()
  const updateStub = sinon.stub()
  const addStub = sinon.stub()

  const mockedAuthPlugin = async function(server) {
    decorate(server, 'auth', authStub)
  }

  const mockedFirebasePlugin = async function(server) {
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
    { plugin: subscriptionRoutes }
  ])

  t.beforeEach(async () => {
    getStub.reset()
    docStub.reset()
    updateStub.reset()
    addStub.reset()
  })

  t.teardown(server.close.bind(server))

  t.test('should update subscription if existing subscription', async (t) => {
    getStub.returns([{ id: 99 }, { id: 199 }])

    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'web',
        endpoint: 'mock-endpoint'
      }
    })

    t.equal(response.statusCode, 201)
    t.equal(getStub.calledOnce, true)
    t.equal(updateStub.calledTwice, true)
    t.equal(addStub.called, false)
  })

  t.test('should add subscription if not existing subscription', async (t) => {
    addStub.resolves({ id: 99 })
    getStub.returns({
      empty: true
    })

    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'web',
        endpoint: 'mock-endpoint'
      }
    })

    t.equal(response.statusCode, 201)
    t.equal(getStub.calledOnce, true)
    t.equal(addStub.calledOnce, true)
    t.equal(updateStub.called, false)
  })

  t.test('should return 400 if no endpoint specified', async (t) => {
    const response = await server.inject({
      url: '/api/register',
      method: 'POST',
      body: {
        type: 'web'
      }
    })

    const data = response.json()

    t.equal(response.statusCode, 400)
    t.equal(data.error.id, 'no-endpoint')
  })
})
