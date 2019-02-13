async function setupDb(client) {
  client
    .db()
    .collection('requests')
    .createIndex(
      {
        createdAt: 1
      },
      {
        expireAfterSeconds: 60
      }
    )
}

module.exports = setupDb
