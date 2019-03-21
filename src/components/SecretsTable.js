import React, { useContext } from 'react'
import { colors, Typography, withStyles } from '@material-ui/core'
import Secret from './Secret'
import {
  confirm,
  DispatchContext as ConfirmDispatchContext,
  StateContext as ConfirmStateContext
} from '../state/Confirm'

const colorNames = Object.keys(colors).sort()

function SecretsTable({
  classes,
  removeSecret,
  updateSecret,
  secrets,
  idToken
}) {
  const confirmDispatch = useContext(ConfirmDispatchContext)
  const confirmState = useContext(ConfirmStateContext)

  const generateToken = async secret => {
    try {
      await confirm(
        {
          title: 'Generate Token',
          message:
            'This will generate a new token and render any existing token invalid. Are you sure you want to continue?'
        },
        confirmDispatch,
        confirmState
      )

      const response = await fetch(`/api/token/${secret._id}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${idToken}`
        }
      })

      const { token } = await response.json()
      await updateSecret(secret._id, { token })
    } catch (e) {
      console.error(e)
    }
  }

  const revokeToken = async secret => {
    try {
      await confirm(
        {
          title: 'Revoke Token',
          message:
            'This will revoke the existing token and render it invalid. Are you sure you want to continue?'
        },
        confirmDispatch,
        confirmState
      )

      await fetch(`/api/token/${secret._id}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${idToken}`
        }
      })

      await updateSecret(secret._id, { token: undefined })
    } catch (e) {
      console.error(e)
    }
  }

  const remove = async secret => {
    try {
      await confirm(
        {
          title: 'Remove secret',
          message:
            'This will permanently remove the secret and render the existing token invalid. Are you sure you want to continue?'
        },
        confirmDispatch,
        confirmState
      )
      if (secret.token) {
        await revokeToken(secret._id)
      }
      await removeSecret(secret._id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className={classes.root}>
      {!secrets || secrets.length === 0 ? (
        <div className={classes.instructions}>
          <Typography paragraph>You don't have any secret yet!</Typography>
          <Typography>
            Add one by scanning or uploading a QR code, or even enter the
            details manually.
          </Typography>
        </div>
      ) : (
        secrets.map((secret, i) => (
          <Secret
            key={i}
            secret={secret}
            color={colors[colorNames[i % colorNames.length]][500]}
            remove={remove}
            generateToken={generateToken}
            revokeToken={revokeToken}
          />
        ))
      )}
    </div>
  )
}

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: theme.spacing.unit
  },

  instructions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: theme.spacing.unit
  }
})

export default withStyles(styles)(SecretsTable)
