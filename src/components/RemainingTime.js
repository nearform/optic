import { useState, useEffect } from 'react'
import { authenticator } from 'otplib'

function RemainingTime() {
  const [remaining, setRemaining] = useState(authenticator.timeRemaining())
  useEffect(() => {
    let timeout
    const refresh = () => {
      setRemaining(authenticator.timeRemaining())
      timeout = setTimeout(refresh, 1e3)
    }
    refresh()
    return () => clearTimeout(timeout)
  })

  return remaining
}

export default RemainingTime
