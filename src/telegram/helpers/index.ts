import type BigInt from 'big-integer'
import { createHash } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { sleep } from 'src/shared.js'
import { TelegramStatic } from '../index.js'

export * from '../user-bot/helpers/web-app-data.js'

export function generateRandomVisitorId(): string {
  const randomString = Array.from({ length: 32 }, () => Math.random().toString(36).charAt(2)).join('')

  const md5 = createHash('md5')
  const visitorId = md5.update(randomString).digest('hex')

  return visitorId
}

export function getFingerprint() {
  const fingerprint = TelegramStatic.DEFAULT_FINGERPRINT
  fingerprint.visitorId = generateRandomVisitorId()

  return fingerprint
}

export async function doFloodProtect() {
  await sleep(faker.helpers.rangeToNumber({ min: 1000, max: 3000 }))
}

export function mapToPeerId(id: BigInt.BigInteger | number | string, type: 'user' | 'chat' | 'channel') {
  if (type === 'user') {
    return id.toString()
  }

  if (type === 'channel') {
    return `-100${id}`
  }

  return `-${id}`
}
