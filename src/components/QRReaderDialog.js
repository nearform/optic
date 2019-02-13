import React from 'react'
import { DialogTitle, Dialog } from '@material-ui/core'
import QrReader from 'react-qr-reader'
import UrlOtpAuth from 'url-otpauth'

function QRReaderDialog({ onClose, qrError, addSecret, ...other }) {
  const qrScan = async result => {
    if (result) {
      const { key, account, issuer } = UrlOtpAuth.parse(result)

      await addSecret(key, account, issuer)
      onClose()
    }
  }

  return (
    <Dialog onClose={onClose} {...other}>
      <DialogTitle>Scan QR code</DialogTitle>
      <div>
        <QrReader
          delay={300}
          onError={err => console.error(err)}
          onScan={qrScan}
          style={{ width: 400, height: 400 }}
        />
      </div>
    </Dialog>
  )
}

export default QRReaderDialog
