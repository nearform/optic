import React from 'react'
import { MuiThemeProvider, CssBaseline, withStyles } from '@material-ui/core'

import theme from './theme'
import Main from './Main'

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Main />
    </MuiThemeProvider>
  )
}

const styles = {
  '@global': {
    body: {
      fontFamily: "'Didact Gothic', sans-serif"
    }
  }
}

export default withStyles(styles)(App)
