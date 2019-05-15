import React, { useContext } from 'react'
import {
  IconButton,
  Snackbar,
  SnackbarContent,
  withStyles
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import ErrorIcon from '@material-ui/icons/Error'

import {
  closeToast,
  ToastDispatchContext,
  ToastStateContext
} from '../context/toast'

function Toast({ classes }) {
  const toastDispatch = useContext(ToastDispatchContext)
  const { message, open } = useContext(ToastStateContext)

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    toastDispatch(closeToast())
  }

  return (
    <div>
      <Snackbar
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <SnackbarContent
          className={classes.error}
          message={
            <span className={classes.message}>
              <ErrorIcon className={classes.iconVariant} />
              {message}
            </span>
          }
          action={[
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              className={classes.close}
              onClick={handleClose}
            >
              <CloseIcon className={classes.icon} />
            </IconButton>
          ]}
        />
      </Snackbar>
    </div>
  )
}

const styles = theme => ({
  close: {
    padding: theme.spacing.unit / 2
  },
  error: {
    backgroundColor: theme.palette.error.dark
  },
  icon: {
    fontSize: 20
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing.unit
  },
  message: {
    display: 'flex',
    alignItems: 'center'
  }
})

export default withStyles(styles)(Toast)
