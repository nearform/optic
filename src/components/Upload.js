import React, { useRef } from 'react'
import { withStyles } from '@material-ui/core'

const ENTER = 13
const SPACE = 32

function Upload({ classes, onChange, children, ...props }) {
  const inputEl = useRef(null)
  return (
    <div {...props}>
      <label
        onKeyDown={({ keyCode }) => {
          if (keyCode === ENTER || keyCode === SPACE) {
            inputEl.current.click()
          }
        }}
      >
        <input
          ref={inputEl}
          accept="image/*"
          className={classes.input}
          onChange={onChange}
          type="file"
        />
        {children}
      </label>
    </div>
  )
}

const styles = () => ({
  input: {
    display: 'none'
  }
})

export default withStyles(styles)(Upload)
