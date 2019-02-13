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

function SecretsTable({ classes, fetchSecrets, secrets, idToken }) {
  const generateToken = async secretId => {
    try {
      await fetch(`/api/token/${secretId}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${idToken}`
        }
      })

      await fetchSecrets()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteSecret = async secretId => {
    try {
      await fetch(`/api/secrets/${secretId}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${idToken}`
        }
      })

      await fetchSecrets()
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
                <Button onClick={() => deleteSecret(secret._id)}>Delete</Button>
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
