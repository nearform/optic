import React, { useState } from 'react'
import {
  AppBar,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  withStyles
} from '@material-ui/core'
import { AccountCircle } from '@material-ui/icons'

function Bar({ classes, user, signOut }) {
  const [anchorEl, setAnchor] = useState(null)
  const open = Boolean(anchorEl)

  const openMenu = ({ currentTarget }) => setAnchor(currentTarget)

  const closeMenu = () => setAnchor(null)

  const onSignOut = () => {
    closeMenu()
    signOut()
  }

  return (
    <AppBar className={classes.root} position="fixed">
      <Toolbar>
        <Typography variant="h6" color="inherit" className={classes.title}>
          Optic
        </Typography>
        <IconButton
          aria-owns={open ? 'menu-appbar' : undefined}
          aria-haspopup="true"
          onClick={openMenu}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          open={open}
          onClose={closeMenu}
        >
          <MenuItem onClick={closeMenu}>{user.displayName}</MenuItem>
          <MenuItem onClick={onSignOut}>Sign-out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

const styles = theme => ({
  root: {},

  title: {
    flexGrow: 1
  }
})

export default withStyles(styles)(Bar)
