import React, { useState } from 'react'
import {
  AppBar,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  withStyles
} from '@material-ui/core'
import { AccountCircle } from '@material-ui/icons'
import { common } from '@material-ui/core/colors'
import RemainingTime from './RemainingTime'

function Bar({ classes, secrets, user, signOut }) {
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
        {secrets && secrets.length && (
          <Chip
            avatar={
              <Avatar className={classes.remainingTime}>
                <RemainingTime />
              </Avatar>
            }
            className={classes.refresh}
            label="before refresh"
            variant="outlined"
          />
        )}
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
  },

  refresh: {
    color: common.white,
    borderColor: common.white
  },

  remainingTime: {
    backgroundColor: common.white,
    paddingBottom: 2
  }
})

export default withStyles(styles)(Bar)
