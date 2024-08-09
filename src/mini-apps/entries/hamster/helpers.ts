import { Buffer } from 'node:buffer'
import { faker } from '@faker-js/faker'

export function getMiniGameCipher(userId: string, gameSleepTime: number): string {
  const randomNumber = faker.helpers.rangeToNumber({
    min: 10000000000,
    max: 99999999999,
  })
  const cipher = `0${gameSleepTime}${randomNumber}`.substring(0, 10)
  const body = `${cipher}|${userId}`

  const encodedBody = Buffer.from(body).toString('base64')

  return encodedBody
}

export function decodeDailyCipher(cipher: string): string {
  const encoded = `${cipher.substring(0, 3)}${cipher.substring(4, cipher.length)}`
  return Buffer.from(encoded, 'base64').toString('utf-8')
}
