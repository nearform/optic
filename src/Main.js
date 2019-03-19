import React, { useState, useEffect, useReducer } from 'react'
import { withStyles } from '@material-ui/core'

import firebase from './lib/firebase'
import subscribe from './lib/subscription'
import requestPermission from './lib/notification'
import * as secretsManager from './lib/secrets'
import { scan } from './lib/qr-parser'

import AppBar from './components/AppBar'
import AddSecretButton from './components/AddSecretButton'
import ConfirmDialog from './components/ConfirmDialog'
import Login from './components/Login'
import QRReaderDialog from './components/QRReaderDialog'
import SecretFormDialog from './components/SecretFormDialog'
import SecretsTable from './components/SecretsTable'

// todo: move to contexts file
export const ConfirmDialogDispatch = React.createContext(null)

// todo: move to constants file
const RESET = 'RESET'
const SET_OPTIONS = 'SET_OPTIONS'
const SET_ON_CONFIRM = 'SET_ON_CONFIRM'
const SET_ON_CANCEL = 'SET_ON_CANCEL'
const TOGGLE_DIALOG = 'TOGGLE_DIALOG'

function Main({ classes }) {
  const [user, setUser] = useState({})
  const [idToken, setIdToken] = useState()
  const [secrets, setSecrets] = useState([])
  const [cameraDialog, toggleCameraDialog] = useState(false)
  const [formDialog, toggleFormDialog] = useState(false)

  const [confirmState, dispatch] = useReducer(confirmDialogReducer, {
    confirmDialog: false
  })
  const { confirmDialog, onCancel, onConfirm, confirmOptions } = confirmState

  // todo: move to reducers file
  function confirmDialogReducer(state, action) {
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

  // todo: move to actions file
  const confirm = function(options, dispatch) {
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
    dispatch({ type: SET_OPTIONS, payload: options })
    return new Promise((resolve, reject) => {
      // set custom options

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

  useEffect(() => {
    firebase.auth().onAuthStateChanged(async user => {
      setUser(user || {})

      if (user) {
        setIdToken(await user.getIdToken())
      } else {
        setIdToken(null)
      }
    })
  }, [])

  useEffect(() => {
    if (!user.uid) return
    secretsManager.fetch({ uid: user.uid }).then(setSecrets)
  }, [user])

  useEffect(() => {
    if (!idToken) return
    requestPermission('/api', idToken)
    subscribe('/api', idToken)
  }, [idToken])

  const addSecret = async secret => {
    const uid = user.uid
    await secretsManager.upsert({ uid, ...secret })
    setSecrets(await secretsManager.fetch({ uid }))
  }

  const removeSecret = async id => {
    await secretsManager.remove(id)
    setSecrets(await secretsManager.fetch({ uid: user.uid }))
  }

  const updateSecret = async (id, secret) => {
    await secretsManager.upsert({ _id: id, ...secret })
    setSecrets(await secretsManager.fetch({ uid: user.uid }))
  }

  if (!user.uid) {
    return <Login />
  }

  return (
    <div className={classes.root}>
      <ConfirmDialogDispatch.Provider value={dispatch}>
        <AppBar
          user={user}
          secrets={secrets}
          signOut={() => firebase.auth().signOut()}
        />
        <ConfirmDialog
          onClose={onCancel}
          onConfirm={onConfirm}
          open={confirmDialog}
          options={confirmOptions}
        />
        <QRReaderDialog
          open={cameraDialog}
          onClose={() => toggleCameraDialog(false)}
          addSecret={addSecret}
        />
        <SecretFormDialog
          open={formDialog}
          onClose={() => toggleFormDialog(false)}
          addSecret={addSecret}
          displayName={user.displayName}
        />
        <SecretsTable
          confirm={confirm}
          secrets={secrets}
          updateSecret={updateSecret}
          removeSecret={removeSecret}
          idToken={idToken}
        />
        <AddSecretButton
          scanQR={() => toggleCameraDialog(true)}
          // TODO recover from scan/upload errors
          uploadImage={file => scan(file).then(addSecret)}
          manuallyAdd={() => toggleFormDialog(true)}
        />
      </ConfirmDialogDispatch.Provider>
    </div>
  )
}

const styles = () => ({
  root: {
    flexGrow: 1,
    paddingTop: '65px'
  }
})

export default withStyles(styles)(Main)
