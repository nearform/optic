import React from 'react'
import {
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  withStyles
} from '@material-ui/core'

function SecretsTable({
  classes,
  removeSecret,
  updateSecret,
  secrets,
  idToken
}) {
  const generateToken = async secretId => {
    try {
      const response = await fetch(`/api/token/${secretId}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${idToken}`
        }
      })

      const { token } = await response.json()
      await updateSecret(secretId, { token })
    } catch (e) {
      console.error(e)
    }
  }

  const revokeToken = async secretId => {
    try {
      await fetch(`/api/token/${secretId}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${idToken}`
        }
      })

      await updateSecret(secretId, { token: undefined })
    } catch (e) {
      console.error(e)
    }
  }

  const remove = async secret => {
    try {
      if (secret.token) {
        await revokeToken(secret._id)
      }
      await removeSecret(secret._id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Paper>
      <Typography className={classes.tokensTitle} variant="h4">
        Your Secrets
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Secret</TableCell>
            <TableCell>Account</TableCell>
            <TableCell>Issuer</TableCell>
            <TableCell>Token</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>

        <TableBody>
          {secrets.map((secret, index) => (
            <TableRow key={index}>
              <TableCell>{secret.secret}</TableCell>
              <TableCell>{secret.account}</TableCell>
              <TableCell>{secret.issuer}</TableCell>
              <TableCell>{secret.token}</TableCell>
              <TableCell>
                <Button onClick={() => generateToken(secret._id)}>
                  {secret.token ? 're' : ''}generate token
                </Button>
                {secret.token && (
                  <Button onClick={() => revokeToken(secret._id)}>
                    revoke
                  </Button>
                )}
                <Button onClick={() => remove(secret)}>delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

const styles = theme => ({
  tokensTitle: {
    padding: theme.spacing.unit * 2
  }
})

export default withStyles(styles)(SecretsTable)
