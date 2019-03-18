import React, { Fragment, useState } from 'react'
import { Button, Drawer, withStyles } from '@material-ui/core'

// intermediate component to leverage laziness evaluation
// https://material-ui.com/utils/modal/#performance
function ConfirmOptions({ classes, onCancel, onConfirm, title, message }) {
  return (
    <div>
      <h3>{title || 'Confirm'}</h3>
      <p>{message || 'Confirm'}</p>
      <Button variant="contained" color="primary" onClick={onConfirm}>
        Confirm
      </Button>
      <Button variant="contained" color="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}

function ConfirmDialog({ classes, children, ...props }) {
  const [opts, setOpts] = useState({
    open: false,
    title: null,
    message: null,
    onConfirm: null,
    onCancel: null
  })

  function resetConfirm() {
    setOpts({
      open: false,
      title: null,
      message: null,
      onConfirm: null,
      onCancel: null
    })
  }

  function confirm(options) {
    // reject if there is already a confirmation dialog open
    if (opts.open) {
      return new Promise.reject(
        new Error(
          'There is already an open confirmation dialog. You must close it before opening a new one'
        )
      )
    }

    // return a promise that resolves or rejects after user interaction
    return new Promise((resolve, reject) => {
      // set custom options
      setOpts({
        ...options,
        open: true,
        // on confirm, resolve the promise and reset confirmation state
        onConfirm: () => {
          resolve()
          resetConfirm()
        },
        // on cancel, reject the promise and reset confirmation state
        onCancel: () => {
          reject(new Error('The confirmation dialog was cancelled'))
          resetConfirm()
        }
      })
    })
  }

  return (
    <Fragment>
      <Drawer
        anchor="bottom"
        open={opts.open}
        onClose={opts.onCancel}
        classes={{ paper: classes.drawer }}
      >
        <ConfirmOptions classes={classes} {...opts} />
      </Drawer>
      {children(confirm)}
    </Fragment>
  )
}

const styles = theme => ({
  drawer: {
    padding: theme.spacing.unit * 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  addButton: {
    flexGrow: 0
  }
})

export default withStyles(styles)(ConfirmDialog)
