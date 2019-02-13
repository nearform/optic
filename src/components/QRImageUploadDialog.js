import React from 'react'
import { DialogTitle, Dialog, InputBase } from '@material-ui/core'
import QrScanner from 'qr-scanner'
import UrlOtpAuth from 'url-otpauth'

function QRReaderDialog({ onClose, addSecret, ...other }) {
  const readImage = async e => {
    try {
      const result = await QrScanner.scanImage(e.target.files[0])
      const { key, account, issuer } = UrlOtpAuth.parse(result)

      await addSecret(key, account, issuer)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog onClose={onClose} {...other}>
      <DialogTitle>Upload image with QR</DialogTitle>
      <div>
        <InputBase type="file" accept="image/*" capture onChange={readImage} />
      </div>
    </Dialog>
  )
}

export default QRReaderDialog
