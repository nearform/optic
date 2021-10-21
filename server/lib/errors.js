const createError = (msg, opts) => {
  const err = new Error(msg || opts.code, {
    ...opts,
    isAppError: true
  })

  return err
}

const unauthorized = reason => {
  return createError(reason, { code: 'UNAUTHORIZED' })
}

const notFound = reason => {
  return createError(reason, { code: 'NOT_FOUND' })
}

const badRequest = reason => {
  return createError(reason, { code: 'BAD_REQUEST' })
}

const unknownError = reason => {
  return createError(reason, { code: 'UNKNOWN_ERROR' })
}

module.exports = { unauthorized, notFound, badRequest, unknownError }
