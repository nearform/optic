import React, { useContext } from 'react'
import { Button, Drawer, withStyles } from '@material-ui/core'

import { ConfirmStateContext } from '../context/confirm'

// intermediate component to leverage laziness evaluation
// https://material-ui.com/utils/modal/#performance
function ConfirmOptions({ classes, message, onCancel, onConfirm, title }) {
  return (
    <div className={classes.container}>
      <h3>{title || 'Confirm'}</h3>
      <p>{message || 'Are you sure?'}</p>
      <Button
        variant="contained"
        color="primary"
        onClick={onConfirm}
        className={classes.button}
      >
        Confirm
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={onCancel}
        className={classes.button}
      >
        Cancel
      </Button>
    </div>
  )
}

function Confirm({ classes }) {
  const { message, open, onCancel, onConfirm, title } = useContext(
    ConfirmStateContext
  )

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onCancel}
      classes={{ paper: classes.drawer }}
    >
      <ConfirmOptions
        classes={classes}
        message={message}
        onCancel={onCancel}
        onConfirm={onConfirm}
        title={title}
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

  button: {
    margin: theme.spacing.unit,
    flexGrow: 0
  },

  container: {
    textAlign: 'center'
  }
})

export default withStyles(styles)(Confirm)
