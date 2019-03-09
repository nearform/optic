import React from 'react'
import { Drawer, withStyles } from '@material-ui/core'
import QrReader from 'react-qr-reader'
import { parse } from '../lib/qr-parser'
function QRReaderDialog({ classes, open, onClose, addSecret }) {
  const scan = async result => {
    if (result) {
      await addSecret(parse(result))
      onClose()
    }
  }
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      classes={{ paper: classes.drawer }}
    >
      <QrReader
        delay={300}
        onError={err => console.error(err)}
        onScan={scan}
        className={classes.reader}
      />
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
