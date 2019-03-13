import React from 'react'
import { Fab, SvgIcon, Tooltip, withStyles } from '@material-ui/core'
import { Input as InputIcon, Publish as PublishIcon } from '@material-ui/icons'
import Upload from './Upload'

// https://www.flaticon.com/authors/dave-gandy
// https://www.flaticon.com/free-icon/qr-code_25213#term=qr%20code&page=1&position=1
function QRCodeIcon(props) {
  return (
    <SvgIcon
      {...props}
      viewBox="0 0 401.994 401.994"
      style={{ padding: '0.05em' }}
    >
      <g>
        <path d="M0,401.991h182.724V219.265H0V401.991z M36.542,255.813h109.636v109.352H36.542V255.813z" />
        <rect x="73.089" y="292.355" width="36.544" height="36.549" />
        <rect x="292.352" y="365.449" width="36.553" height="36.545" />
        <rect x="365.442" y="365.449" width="36.552" height="36.545" />
        <polygon
          points="365.446,255.813 328.904,255.813 328.904,219.265 219.265,219.265 219.265,401.991 255.813,401.991 
          255.813,292.355 292.352,292.355 292.352,328.904 401.991,328.904 401.991,219.265 401.991,219.265 365.446,219.265 		"
        />
        <path d="M0,182.728h182.724V0H0V182.728z M36.542,36.542h109.636v109.636H36.542V36.542z" />
        <rect x="73.089" y="73.089" width="36.544" height="36.547" />
        <path d="M219.265,0v182.728h182.729V0H219.265z M365.446,146.178H255.813V36.542h109.633V146.178z" />
        <rect x="292.352" y="73.089" width="36.553" height="36.547" />
      </g>
    </SvgIcon>
  )
}

function AddSecretButton({ classes, scanQR, uploadImage, manuallyAdd }) {
  return (
    <div className={classes.root}>
      <Tooltip title="Add new secret by scanning a QR Code">
        <Fab
          className={classes.fab}
          color="primary"
          aria-label="Scan QR"
          onClick={scanQR}
        >
          <QRCodeIcon />
        </Fab>
      </Tooltip>
      <Upload onChange={event => uploadImage(event.target.files[0])}>
        <Tooltip title="Add new secret by uploading a QR Code">
          <Fab
            className={classes.fab}
            component="span"
            color="primary"
            aria-label="Upload QR"
          >
            <PublishIcon />
          </Fab>
        </Tooltip>
      </Upload>
      <Tooltip title="Add new secret by filling the details">
        <Fab
          className={classes.fab}
          color="primary"
          aria-label="Manually insert"
          onClick={manuallyAdd}
        >
          <InputIcon />
        </Fab>
      </Tooltip>
    </div>
  )
}

const styles = theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center'
  },

  fab: {
    margin: theme.spacing.unit
  }
})

export default withStyles(styles)(AddSecretButton)
