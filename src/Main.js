import React, { useState, useEffect } from 'react'
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

function Main({ classes }) {
  const [user, setUser] = useState({})
  const [idToken, setIdToken] = useState()
  const [secrets, setSecrets] = useState([])
  const [cameraDialog, toggleCameraDialog] = useState(false)
  const [formDialog, toggleFormDialog] = useState(false)

  // confirm state
  const [confirmDialog, toggleConfirmDialog] = useState(false)
  const [onConfirm, setOnConfirm] = useState()
  const [onCancel, setOnCancel] = useState()
  const [confirmOptions, setConfirmOptions] = useState()

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
    if (!idToken) return

    secretsManager.fetch({ uid: user.uid }).then(setSecrets)
    requestPermission('/api', idToken)
    subscribe('/api', idToken)
  }, [idToken])

  const addSecret = async secret => {
    const uid = user.uid
    await secretsManager.upsert({ uid, ...secret })
    setSecrets(await secretsManager.fetch({ uid }))
  }

  const resetConfirm = function() {
    toggleConfirmDialog(false)
    setOnConfirm()
    setOnCancel()
    setConfirmOptions()
  }

  const confirm = function(options) {
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
      setConfirmOptions(options)

      // on confirm, resolve the promise and reset confirmation state
      setOnConfirm(() => {
        return () => {
          resolve()
          resetConfirm()
        }
      })

      // on cancel, reject the promise and reset confirmation state
      setOnCancel(() => {
        return () => {
          reject(new Error('The confirmation dialog was cancelled'))
          resetConfirm()
        }
      })

      // open custom dialog
      toggleConfirmDialog(true)
    })
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
      <AppBar user={user} signOut={() => firebase.auth().signOut()} />
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
