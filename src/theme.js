import { createMuiTheme } from '@material-ui/core'

const theme = createMuiTheme({
  palette: {
    primary: { main: '#2165E3' },
    secondary: { main: '#FB7A9C' },
    nearformColors: ['#2165E3', '#194CAA', '#FB775E', '#FB7A9C', '#F6BAB8']
  },
  typography: {
    useNextVariants: true,
    fontFamily: 'Didact Gothic',
    h1: {
      fontFamily: 'Poppins'
    },
    h2: {
      fontFamily: 'Poppins'
    },
    h3: {
      fontFamily: 'Poppins'
    },
    h4: {
      fontFamily: 'Poppins'
    },
    h5: {
      fontFamily: 'Poppins'
    },
    h6: {
      fontFamily: 'Poppins'
    }
  }
})

export default theme
