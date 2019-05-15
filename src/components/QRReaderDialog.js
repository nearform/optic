import React, { useContext } from 'react'
import { Drawer, Typography, withStyles } from '@material-ui/core'
import QrReader from 'react-qr-reader'
import { parse } from '../lib/qr-parser'
import { showToast, ToastDispatchContext } from '../context/toast'

// intermediate component to leverage laziness evaluation
// https://material-ui.com/utils/modal/#performance
function Form({ classes, addSecret, onClose }) {
  const toastDispatch = useContext(ToastDispatchContext)

  const scan = async result => {
    if (result) {
      try {
        await addSecret(await parse(result))
      } catch (err) {
        toastDispatch(showToast(err.message, toastDispatch))
      }
      onClose()
    }
  }

  return (
    <div className={classes.form}>
      <Typography paragraph>
        Please scan your QR code to add new secret
      </Typography>
      <QrReader
        delay={300}
        onError={err => console.error(err)}
        onScan={scan}
        className={classes.reader}
      />
    </div>
  )
}

function QRReaderDialog({ classes, open, onClose, addSecret }) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      classes={{ paper: classes.drawer }}
    >
      <Form classes={classes} onClose={onClose} addSecret={addSecret} />
    </Drawer>
  )
}

const styles = theme => ({
  drawer: {
    padding: theme.spacing.unit * 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },

  reader: {
    height: 600,
    width: 600,
    [theme.breakpoints.down('sm')]: {
      height: 300,
      width: 300
    }
  }
})

export default withStyles(styles)(QRReaderDialog)
