import React, { useState } from 'react'
import {
  Button,
  Drawer,
  TextField,
  Typography,
  withStyles
} from '@material-ui/core'
import { Add as AddIcon } from '@material-ui/icons'

// intermediate component to leverage laziness evaluation
// https://material-ui.com/utils/modal/#performance
function Form({ classes, addSecret, onClose, displayName }) {
  const [secret, setSecret] = useState('')
  const [account, setAccount] = useState(displayName)
  const [issuer, setIssuer] = useState('')

  const save = async event => {
    // stop to avoid reloading the page on form submit
    event.preventDefault()
    await addSecret({ secret, account, issuer })
    // reset form
    setSecret('')
    setAccount(displayName)
    setIssuer('')
    onClose()
  }
  return (
    <form className={classes.form} onSubmit={save}>
      <Typography paragraph>Enter your new secret details:</Typography>
      <TextField
        autoFocus
        label="Issuer"
        value={issuer}
        placeholder="Who created your secret"
        onChange={e => setIssuer(e.target.value)}
        variant="outlined"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Secret"
        value={secret}
        placeholder="Long, cryptic string"
        onChange={e => setSecret(e.target.value)}
        variant="outlined"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Account"
        value={account}
        placeholder="Your account"
        onChange={e => setAccount(e.target.value)}
        variant="outlined"
        InputLabelProps={{ shrink: true }}
      />
      <Button
        color="primary"
        size="large"
        disabled={!secret || !account || !issuer}
        onClick={save}
        className={classes.addButton}
        type="submit"
      >
        <AddIcon className={classes.addIcon} />
        Add secret
      </Button>
    </form>
  )
}

function SecretFormDialog({ classes, open, onClose, ...props }) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      classes={{ paper: classes.drawer }}
    >
      <Form classes={classes} onClose={onClose} {...props} />
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

  form: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    '& > *': {
      minWidth: 250,
      flexGrow: 1,
      margin: theme.spacing.unit
    },
    '& > :first-child': {
      width: '100%'
    }
  },

  addButton: {
    flexGrow: 0
  },

  addIcon: {
    marginRight: theme.spacing.unit
  }
})

export default withStyles(styles)(SecretFormDialog)
