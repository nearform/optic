import React, { useReducer } from 'react'

const initialState = { open: false }

export const DispatchContext = React.createContext(null)
export const StateContext = React.createContext(initialState)

const RESET = 'RESET'
const SET_OPTIONS = 'SET_OPTIONS'
const SET_ON_CONFIRM = 'SET_ON_CONFIRM'
const SET_ON_CANCEL = 'SET_ON_CANCEL'
const TOGGLE_DIALOG = 'TOGGLE_DIALOG'

export const confirm = function(options, dispatch, { open }) {
  // reject if there is already a confirmation dialog open
  if (open) {
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

function reducer(state, action) {
  switch (action.type) {
    case RESET:
      return { open: false }
    case SET_OPTIONS:
      return { ...state, confirmOptions: action.payload }
    case SET_ON_CONFIRM:
      return { ...state, onConfirm: action.payload }
    case SET_ON_CANCEL:
      return { ...state, onCancel: action.payload }
    case TOGGLE_DIALOG:
      return { ...state, open: action.payload }
    default:
      console.log(`${action.type} is not a valid action`)
      return { ...state }
  }
}

export function ConfirmProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  )
}
