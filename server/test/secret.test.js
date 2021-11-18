const { test } = require('tap')
const sinon = require('sinon')

const tokenRoutes = require('../lib/routes/token')

const { buildServer, decorate } = require('./test-util.js')

test('secret route', async (t) => {
  const authStub = sinon.stub()
  const sendStub = sinon.stub()
  const setStub = sinon.stub()
  const deleteStub = sinon.stub()
  const getStub = sinon.stub()
  const documentIdStub = sinon.stub()

  const mockedAuthPlugin = async function(server) {
    decorate(server, 'auth', authStub)
  }

  const mockedFirebasePlugin = async function(server) {
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
    documentIdStub.reset()
    getStub.reset()
  })

  t.teardown(server.close.bind(server))

  t.test('should delete all tokens relating to a secretId', async (t) => {
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
