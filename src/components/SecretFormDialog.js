import React, { useState } from 'react'
import {
  DialogTitle,
  Dialog,
  TextField,
  Button,
  withStyles
} from '@material-ui/core'

function SecretFormDialog({ onClose, addSecret, classes, ...other }) {
  const [secret, setSecret] = useState('')
  const [account, setAccount] = useState('')
  const [issuer, setIssuer] = useState('')

  const save = async () => {
    await addSecret(secret, account, issuer)
    onClose()
  }

  return (
    <Dialog onClose={onClose} {...other}>
      <DialogTitle>Manually enter secret</DialogTitle>
      <form className={classes.newSecret}>
        <TextField
          label="Secret"
          value={secret}
          onChange={e => setSecret(e.target.value)}
        />
        <TextField
          label="Account"
          value={account}
          onChange={e => setAccount(e.target.value)}
        />
        <TextField
          label="Issuer"
          value={issuer}
          onChange={e => setIssuer(e.target.value)}
        />
        <Button
          color="primary"
          size="large"
          disabled={!secret || !account || !issuer}
          onClick={save}
        >
          Add secret
        </Button>
      </form>
    </Dialog>
  )
}

const styles = theme => ({
  newSecret: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    '& > * + *': {
      marginLeft: theme.spacing.unit
    },
    padding: '20px'
  }
})

export default withStyles(styles)(SecretFormDialog)
