import React, { useState, useEffect } from 'react'
import { StyledFirebaseAuth } from 'react-firebaseui'
import { Typography, Button, withStyles } from '@material-ui/core'
import QrScanner from 'qr-scanner'

import firebase from './lib/firebase'
import { subscribe } from './web-push-service-worker-registration'

import QRReaderDialog from './components/QRReaderDialog'
import QRImageUploadDialog from './components/QRImageUploadDialog'
import SecretFormDialog from './components/SecretFormDialog'
import SecretsTable from './components/SecretsTable'

const QrScannerWorkerPath = `${process.env.PUBLIC_URL}/qr-scanner-worker.min.js`
QrScanner.WORKER_PATH = QrScannerWorkerPath

const firebaseConfig = {
  signInFlow: 'popup',
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
  callbacks: {
    signInSuccessWithAuthResult: () => false
  }
}

function Main({ classes }) {
  const [signedIn, setSignedIn] = useState(false)
  const [idToken, setIdToken] = useState()
  const [secrets, setSecrets] = useState([])
  const [uploadDialog, toggleUploadDialog] = useState(false)
  const [cameraDialog, toggleCameraDialog] = useState(false)
  const [formDialog, toggleFormDialog] = useState(false)

  useEffect(() => {
    return firebase.auth().onAuthStateChanged(async user => {
      setSignedIn(!!user)

      if (user) {
        setIdToken(await firebase.auth().currentUser.getIdToken())
      }
    })
  }, [])

  const fetchSecrets = async () => {
    const response = await fetch('/api/secrets', {
      headers: {
        authorization: `Bearer ${idToken}`
      }
    })

    setSecrets(await response.json())
  }

  useEffect(() => {
    if (!idToken) return

    fetchSecrets()
    subscribe('/api', idToken)
  }, [idToken])

  const addSecret = async (secret, account, issuer) => {
    try {
      await fetch('/api/secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ secret, account, issuer })
      })

      await fetchSecrets()
    } catch (e) {
      console.error(e)
    }
  }

  if (!signedIn) {
    return (
      <div className={classes.root}>
        <Typography variant="h3" gutterBottom>
          NPM OTP
        </Typography>
        <Typography paragraph variant="subtitle1">
          Please sign-in:
        </Typography>
        <StyledFirebaseAuth
          uiConfig={firebaseConfig}
          firebaseAuth={firebase.auth()}
        />
      </div>
    )
  }

  return (
    <div className={classes.root}>
      <Typography variant="h3" gutterBottom>
        NPM OTP
      </Typography>
      <Typography paragraph variant="subtitle1">
        Welcome {firebase.auth().currentUser.displayName}! You are now
        signed-in!
        <Button onClick={() => firebase.auth().signOut()}>Sign-out</Button>
      </Typography>
      <Button onClick={() => toggleCameraDialog(true)}>Scan QR</Button>
      <QRReaderDialog
        open={cameraDialog}
        onClose={() => toggleCameraDialog(false)}
        addSecret={addSecret}
      />
      <Button onClick={() => toggleUploadDialog(true)}>Upload image</Button>
      <QRImageUploadDialog
        open={uploadDialog}
        onClose={() => toggleUploadDialog(false)}
        addSecret={addSecret}
      />
      <Button onClick={() => toggleFormDialog(true)}>Manually insert</Button>
      <SecretFormDialog
        open={formDialog}
        onClose={() => toggleFormDialog(false)}
        addSecret={addSecret}
      />
      <SecretsTable
        secrets={secrets}
        fetchSecrets={fetchSecrets}
        idToken={idToken}
      />
    </div>
  )
}

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
    'max-width': '1200px',
    margin: '0 auto'
  }
})

export default withStyles(styles)(Main)
