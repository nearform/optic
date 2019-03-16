import React from 'react'
import { Button, Drawer, withStyles } from '@material-ui/core'

// intermediate component to leverage laziness evaluation
// https://material-ui.com/utils/modal/#performance
function ConfirmOptions({ classes, onClose, onConfirm, options }) {
  return (
    <div>
      <h3>{(options && options.title) || 'Confirm'}</h3>
      <p>{(options && options.message) || 'Confirm'}</p>
      <Button variant="contained" color="primary" onClick={onConfirm}>
        Confirm
      </Button>
      <Button variant="contained" color="secondary" onClick={onClose}>
        Cancel
      </Button>
    </div>
  )
}

function ConfirmDialog({ classes, open, onClose, ...props }) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      classes={{ paper: classes.drawer }}
    >
      <ConfirmOptions classes={classes} onClose={onClose} {...props} />
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

  addButton: {
    flexGrow: 0
  }
})

export default withStyles(styles)(ConfirmDialog)
