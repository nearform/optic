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

import ConfirmDialogReducer, {
  dispatchContext as ConfirmDialogDispatchContext,
  initialState as confirmDialogInitialState,
  stateContext as ConfirmDialogStateContext
} from './state/modules/ConfirmDialog'

function Main({ classes }) {
  const [user, setUser] = useState({})
  const [idToken, setIdToken] = useState()
  const [secrets, setSecrets] = useState([])
  const [cameraDialog, toggleCameraDialog] = useState(false)
  const [formDialog, toggleFormDialog] = useState(false)

  const [confirmState, confirmDispatch] = useReducer(
    ConfirmDialogReducer,
    confirmDialogInitialState
  )
  const { confirmDialog, onCancel, onConfirm, confirmOptions } = confirmState

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
      <ConfirmDialogDispatchContext.Provider value={confirmDispatch}>
        <ConfirmDialogStateContext.Provider value={confirmState}>
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
        </ConfirmDialogStateContext.Provider>
      </ConfirmDialogDispatchContext.Provider>
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
