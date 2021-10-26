import React, { useState, useEffect } from 'react'
import { withStyles } from '@material-ui/core'

import firebase from 'firebase/app'
import 'firebase/auth'

import subscribe from './lib/subscription'
import requestPermission from './lib/notification'
import * as secretsManager from './lib/secrets'
import { scan } from './lib/qr-parser'

import AppBar from './components/AppBar'
import AddSecretButton from './components/AddSecretButton'
import Confirm from './components/Confirm'
import Login from './components/Login'
import QRReaderDialog from './components/QRReaderDialog'
import SecretFormDialog from './components/SecretFormDialog'
import SecretsTable from './components/SecretsTable'

import { ConfirmProvider } from './context/confirm'

function Main({ classes }) {
  const [user, setUser] = useState({})
  const [idToken, setIdToken] = useState()
  const [secrets, setSecrets] = useState([])
  const [cameraDialog, toggleCameraDialog] = useState(false)
  const [formDialog, toggleFormDialog] = useState(false)
  const [firebaseApp, setFirebaseApp] = useState()

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/config') // @todo: cache for offline
      const config = await response.json()
      const app = firebase.initializeApp(config)
      setFirebaseApp(app)
    }
    load()
  }, [])

  useEffect(() => {
    if (!firebaseApp) return
    firebaseApp.auth().onAuthStateChanged(async user => {
      setUser(user || {})

      if (user) {
        setIdToken(await user.getIdToken())
      } else {
        setIdToken(null)
      }
    })
  }, [firebaseApp])

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

  const signOut = async () => {
    firebaseApp.auth().signOut()
    localStorage.clear()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
  }

  if (!firebaseApp) {
    return null
  }

  if (!user.uid) {
    return <Login firebase={firebase} />
  }

  return (
    <div className={classes.root}>
      <ConfirmProvider>
        <AppBar user={user} secrets={secrets} signOut={signOut} />
        <Confirm />
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
      </ConfirmProvider>
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
