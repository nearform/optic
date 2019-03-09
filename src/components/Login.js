import React from 'react'
import { StyledFirebaseAuth } from 'react-firebaseui'
import { Divider, Grid, Typography, withStyles } from '@material-ui/core'
import { RemoveRedEyeTwoTone as EyeIcon } from '@material-ui/icons'
import firebase from '../lib/firebase'

const firebaseConfig = {
  signInFlow: 'popup',
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
  callbacks: {
    signInSuccessWithAuthResult: () => false
  }
}

function Login({ classes }) {
  return (
    <div className={classes.root}>
      <Grid
        container
        direction="column"
        justify="center"
        alignItems="center"
        className={classes.loginGrid}
      >
        <Grid item>
          <Typography variant="h3">Optic</Typography>
        </Grid>
        <Grid item>
          <EyeIcon className={classes.loginIcon} />
        </Grid>
        <Grid item className={classes.primer}>
          <Divider className={classes.primerDivider} />
          <Typography>
            Grant your favorite automated tools an OTP when they need it!
          </Typography>
          <Divider className={classes.primerDivider} />
        </Grid>
        <Grid item>
          <StyledFirebaseAuth
            uiConfig={firebaseConfig}
            firebaseAuth={firebase.auth()}
          />
        </Grid>
      </Grid>
    </div>
  )
}

const styles = theme => ({
  root: {
    flexGrow: 1
  },

  primer: {
    textAlign: 'center',
    margin: '0 1em'
  },

  primerDivider: {
    margin: '1em'
  }
})

export default withStyles(styles)(Login)
