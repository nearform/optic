import uniqid from 'uniqid'
import localforage from 'localforage'

const secretStorageKey = 'secrets'

localforage.config({
  driver: localforage.INDEXEDDB
})

/**
 * Find all secrets, applying a selector if provided.
 * When provided, all where clause must be fulfilled (logical AND).
 * By default, returns all secrets
 * @async
 * @param {Object} where - hash of where clauses returned secrets must fulfill with
 * @returns {Array<Object>} list (may be empty) of matching secrets
 */
export async function fetch(where = {}) {
  let secrets = []
  try {
    const props = Object.keys(where)
    secrets = ((await localforage.getItem(secretStorageKey)) || []).filter(
      secret => props.every(prop => secret[prop] === where[prop])
    )
  } catch (err) {
    console.error('Failed to read secrets from IndexedDB', err)
  }
  return secrets
}

/**
 * Add or update a secret to the list.
 * If not provided, an _id key will be generated
 * @async
 * @param {Object} secret - secret to upsert
 * @returns {Object} the added/updated secret
 */
export async function upsert(secret) {
  const secretId = secret._id || uniqid()
  const secrets = await fetch()
  let upserted = secrets.find(({ _id }) => _id === secretId)
  if (upserted) {
    Object.assign(upserted, secret)
  } else {
    upserted = { _id: secretId, ...secret }
    secrets.push(upserted)
  }
  try {
    await localforage.setItem(secretStorageKey, secrets)
  } catch (err) {
    console.error('Failed to add new secret to IndexedDB', err)
  }
  return upserted
}

/**
 * Remove a secret from the list. Does not fail if it can not be found.
 * @async
 * @param {String} secretId - removed secret id
 * @returns {Object} the removed secret (may be null)
 */
export async function remove(secretId) {
  const secrets = await fetch()
  const idx = secrets.findIndex(({ _id }) => _id === secretId)
  let removed = null
  if (idx !== -1) {
    removed = secrets.splice(idx, 1)[0]
  }
  try {
    await localforage.setItem(secretStorageKey, secrets)
  } catch (err) {
    console.error('Failed to remove secret from IndexedDB', err)
  }
  return removed
}
