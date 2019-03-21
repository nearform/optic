import React from 'react'
import {
  CloseIcon,
  ErrorIcon,
  IconButton,
  Snackbar,
  withStyles
} from '@material-ui/core'

const defaultOptions = {
  autoHideDuration: 6000,
  message: 'An unknown error occured',
  position: { horizontal: 'left', vertical: 'botton' }
}

function Toast({ classes, open, options }) {
  const { autoHideDuration, message, position } = Object.assign(
    {},
    defaultOptions,
    options
  )

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    this.setState({ open: false })
  }

  return (
    <div>
      <Snackbar
        anchorOrigin={position}
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        message={
          <span>
            <ErrorIcon />
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
            <CloseIcon />
          </IconButton>
        ]}
      />
    </div>
  )
}

const styles = theme => ({
  close: {
    padding: theme.spacing.unit / 2
  }
})

export default withStyles(styles)(Toast)
