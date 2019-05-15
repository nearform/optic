import QrScanner from 'qr-scanner'
import otpauth from 'url-otpauth'

QrScanner.WORKER_PATH = `${process.env.PUBLIC_URL}/qr-scanner-worker.min.js`

export async function scan(file) {
  try {
    return parse(await QrScanner.scanImage(file))
  } catch (err) {
    console.log(`Unscannable QR image: ${err.message}`, err)
    // TODO throw error
    return null
  }
}

export async function parse(content) {
  console.log('Got from image/QR code:', content)
  const { issuer, key: secret, account } = otpauth.parse(content)
  console.log(issuer, account, secret)
  return { issuer, account, secret }
}
