import QrScanner from 'qr-scanner'
import otpauth from 'url-otpauth'

QrScanner.WORKER_PATH = `${process.env.PUBLIC_URL}/qr-scanner-worker.min.js`

export async function scan(file) {
  return parse(await QrScanner.scanImage(file))
}

export async function parse(content) {
  return otpauth.parse(content)
}
