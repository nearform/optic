import React, { useReducer } from 'react'

const initialState = {
  open: false,
  message: 'An unknown error occured'
}

export const ToastDispatchContext = React.createContext(null)
export const ToastStateContext = React.createContext(initialState)

const CLOSE_TOAST = 'CLOSE_TOAST'
const OPEN_TOAST = 'OPEN_TOAST'
const SET_TOAST_MESSAGE = 'SET_TOAST_MESSAGE'

export const closeToast = function() {
  return { type: CLOSE_TOAST }
}

export const showToast = function(message, dispatch) {
  message = message || initialState.message
  dispatch(setToastMessage(message))
  return { type: OPEN_TOAST }
}

const setToastMessage = function(message) {
  return { type: SET_TOAST_MESSAGE, payload: message }
}

function reducer(state, action) {
  switch (action.type) {
    case CLOSE_TOAST:
      return { ...state, open: false }
    case OPEN_TOAST:
      return { ...state, open: true }
    case SET_TOAST_MESSAGE:
      return { ...state, message: action.payload }
    default:
      console.log(`${action.type} is not a valid action`)
      return { ...state }
  }
}

export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <ToastDispatchContext.Provider value={dispatch}>
      <ToastStateContext.Provider value={state}>
        {children}
      </ToastStateContext.Provider>
    </ToastDispatchContext.Provider>
  )
}
