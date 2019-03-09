import React, { useState } from 'react'
import classnames from 'classnames'
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  withStyles
} from '@material-ui/core'
import {
  Add as AddIcon,
  DeleteForever as DeleteForeverIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Remove as RemoveIcon
} from '@material-ui/icons'

function Secret({
  classes,
  secret,
  color,
  remove,
  generateToken,
  revokeToken,
  ...props
}) {
  const { issuer, account, token } = secret
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={classes.root} {...props}>
      <CardHeader
        avatar={
          <Avatar aria-label="Secret" style={{ backgroundColor: color }}>
            {issuer[0].toUpperCase()}
          </Avatar>
        }
        action={
          <Tooltip title="Permanently remove secret and revokes its token">
            <IconButton
              aria-label="Remove secret"
              onClick={() => remove(secret)}
            >
              <DeleteForeverIcon />
            </IconButton>
          </Tooltip>
        }
        title={issuer}
        subheader={`for ${account}`}
      />
      <CardContent>
        <Typography color="textSecondary">Token:</Typography>
        {token ? token : 'no token yet'}
      </CardContent>
      <CardActions disableActionSpacing>
        <Tooltip title={`${token ? 'Refresh' : 'Generate'} token`}>
          <IconButton
            aria-label={`${token ? 'Refresh' : 'Generate'} token`}
            onClick={() => generateToken(secret)}
          >
            {token ? <RefreshIcon /> : <AddIcon />}
          </IconButton>
        </Tooltip>
        {token && (
          <Tooltip title="Revoke token">
            <IconButton
              aria-label="Revoke token"
              onClick={() => revokeToken(secret)}
            >
              <RemoveIcon />
            </IconButton>
          </Tooltip>
        )}
        <IconButton
          className={classnames(classes.expand, {
            [classes.expandOpen]: expanded
          })}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label="Show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography color="textSecondary">Secret:</Typography>
          {secret.secret}
        </CardContent>
      </Collapse>
    </Card>
  )
}

const styles = theme => ({
  root: {
    minWidth: 300,
    maxWidth: 400,
    margin: theme.spacing.unit
  },

  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    })
  },

  expandOpen: {
    transform: 'rotate(180deg)'
  }
})

export default withStyles(styles)(Secret)
