import React, { useState, useEffect } from 'react'
import { StyledFirebaseAuth } from 'react-firebaseui'
import { Typography, Button, withStyles } from '@material-ui/core'
import QrScanner from 'qr-scanner'

import firebase from './lib/firebase'
import subscribe from './lib/subscription'
import requestPermission from './lib/notification'
import * as secretsManager from './lib/secrets'

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
  const [user, setUser] = useState({})
  const [idToken, setIdToken] = useState()
  const [secrets, setSecrets] = useState([])
  const [uploadDialog, toggleUploadDialog] = useState(false)
  const [cameraDialog, toggleCameraDialog] = useState(false)
  const [formDialog, toggleFormDialog] = useState(false)

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

  const removeSecret = async id => {
    await secretsManager.remove(id)
    setSecrets(await secretsManager.fetch({ uid: user.uid }))
  }

  const updateSecret = async (id, secret) => {
    await secretsManager.upsert({ _id: id, ...secret })
    setSecrets(await secretsManager.fetch({ uid: user.uid }))
  }

  if (!user.uid) {
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
        Welcome {user.displayName}! You are now signed-in!
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
        displayName={user.displayName}
      />
      <SecretsTable
        secrets={secrets}
        updateSecret={updateSecret}
        removeSecret={removeSecret}
        idToken={idToken}
      />
      <br />
      <footer>
        Icons made by{' '}
        <a
          href="https://www.flaticon.com/authors/smalllikeart"
          title="smalllikeart"
          target="_blank"
          rel="noopener noreferrer"
        >
          smalllikeart
        </a>{' '}
        licensed by{' '}
        <a
          href="http://creativecommons.org/licenses/by/3.0/"
          title="Creative Commons BY 3.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC 3.0 BY
        </a>
      </footer>
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
