import React, { useState, useEffect, useReducer } from 'react'
import { withStyles } from '@material-ui/core'

import firebase from './lib/firebase'
import subscribe from './lib/subscription'
import requestPermission from './lib/notification'
import * as secretsManager from './lib/secrets'
import { scan } from './lib/qr-parser'

import AppBar from './components/AppBar'
import AddSecretButton from './components/AddSecretButton'
import Login from './components/Login'
import QRReaderDialog from './components/QRReaderDialog'
import SecretFormDialog from './components/SecretFormDialog'
import SecretsTable from './components/SecretsTable'
import Toast from './components/Toast'

// todo: move to contexts file
export const ToastDispatch = React.createContext(null)

// todo: move to constants file
const OPEN_TOAST = 'OPEN_TOAST'
const CLOSE_TOAST = 'CLOSE_TOAST'

function Main({ classes }) {
  const [user, setUser] = useState({})
  const [idToken, setIdToken] = useState()
  const [secrets, setSecrets] = useState([])
  const [cameraDialog, toggleCameraDialog] = useState(false)
  const [formDialog, toggleFormDialog] = useState(false)

  const [toastState, toastDispatch] = useReducer(toastReducer, {
    open: false
  })
  const { open } = toastState

  // todo: move to reducers file
  function toastReducer(state, action) {
    switch (action.type) {
      case CLOSE_TOAST:
        return { open: false }
      case OPEN_TOAST:
        return { open: true }
      default:
        throw new Error(`${action.type} is not a valid toast action`)
    }
  }

  // todo: move to actions file
  function open() {
    toastDispatch({ TYPE: OPEN_TOAST })
  }
  function close() {
    toastDispatch({ TYPE: CLOSE_TOAST })
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
      <AppBar
        user={user}
        secrets={secrets}
        signOut={() => firebase.auth().signOut()}
      />
      <Toast open={open} />
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
