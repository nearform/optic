import React, { Fragment, useState } from 'react'
import { Snackbar, withStyles } from '@material-ui/core'
import { FileCopy as CopyIcon } from '@material-ui/icons'

function Secret({ value, classes }) {
  const [snackOpen, setSnackOpen] = useState(false)

  const toClipboard = () => {
    navigator.clipboard.writeText(value)
    setSnackOpen(true)
  }

  const closeSnack = () => setSnackOpen(false)

  return (
    <Fragment>
      <CopyIcon
        className={classes.icon}
        aria-label="copy OTP"
        onClick={toClipboard}
      />
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        open={snackOpen}
        autoHideDuration={3e3}
        message={`${value} copied to your clipboard!`}
        onClick={closeSnack}
        onClose={closeSnack}
      />
    </Fragment>
  )
}

const styles = theme => ({
  root: {
    marginLeft: theme.spacing.unit,
    padding: theme.spacing.unit
  },

  icon: {
    fontSize: theme.typography.fontSize,
    color: theme.palette.grey[400],
    marginLeft: theme.spacing.unit,
    cursor: 'pointer'
  }
})

export default withStyles(styles)(Secret)
