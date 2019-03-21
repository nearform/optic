import React from 'react'

export const initialState = { confirmDialog: false }

export const dispatchContext = React.createContext(null)
export const stateContext = React.createContext(initialState)

export const RESET = 'RESET'
export const SET_OPTIONS = 'SET_OPTIONS'
export const SET_ON_CONFIRM = 'SET_ON_CONFIRM'
export const SET_ON_CANCEL = 'SET_ON_CANCEL'
export const TOGGLE_DIALOG = 'TOGGLE_DIALOG'

export const confirm = function(options, dispatch, { confirmDialog }) {
  // reject if there is already a confirmation dialog open
  if (confirmDialog) {
    return new Promise((r, reject) =>
      reject(
        new Error(
          'There is already an open confirmation dialog. You must close it before opening a new one'
        )
      )
    )
  }

  // return a promise that resolves or rejects after user interaction
  return new Promise((resolve, reject) => {
    // set custom options
    dispatch({ type: SET_OPTIONS, payload: options })

    // on confirm, resolve the promise and reset confirmation state
    dispatch({
      type: SET_ON_CONFIRM,
      payload: () => {
        resolve()
        dispatch({ type: RESET })
      }
    })

    // on cancel, reject the promise and reset confirmation state
    dispatch({
      type: SET_ON_CANCEL,
      payload: () => {
        reject(new Error('The confirmation dialog was cancelled'))
        dispatch({ type: RESET })
      }
    })

    // open custom dialog
    dispatch({ type: TOGGLE_DIALOG, payload: true })
  })
}

export default function reducer(state, action) {
  switch (action.type) {
    case RESET:
      return { confirmDialog: false }
    case SET_OPTIONS:
      return Object.assign({}, state, { confirmOptions: action.payload })
    case SET_ON_CONFIRM:
      return Object.assign({}, state, { onConfirm: action.payload })
    case SET_ON_CANCEL:
      return Object.assign({}, state, { onCancel: action.payload })
    case TOGGLE_DIALOG:
      return Object.assign({}, state, { confirmDialog: action.payload })
    default:
      throw new Error(`${action.type} is not a valid action`)
  }
}
