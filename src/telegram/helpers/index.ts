import { createHash } from 'node:crypto'
import { DEFAULT_FINGERPRINT } from '../static.js'

export * from './web-app-data.js'

export function generateRandomVisitorId(): string {
  const randomString = Array.from({ length: 32 }, () => Math.random().toString(36).charAt(2)).join('')

  const md5 = createHash('md5')
  const visitorId = md5.update(randomString).digest('hex')

  return visitorId
}

export function getFingerprint() {
  const fingerprint = DEFAULT_FINGERPRINT
  fingerprint.visitorId = generateRandomVisitorId()

  return fingerprint
}
