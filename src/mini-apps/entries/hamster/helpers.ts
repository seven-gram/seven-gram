import { Buffer } from 'node:buffer'
import { faker } from '@faker-js/faker'
import axios from 'axios'
import { sleep } from 'src/shared.js'
import retry from 'async-retry'
import type { HamsterTypes } from './index.js'

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

export function generateClientId(): string {
  const currentTime = Date.now()
  const randomPart = faker.helpers.rangeToNumber({ min: 100, max: 999 })
  const randomFirst = Number(`${currentTime.toString().substring(0, 10)}${randomPart}`)

  return `${randomFirst}-3472514666961597005`
}

export function generateEventId(): string {
  return faker.string.uuid()
}

interface GetPromoCodeOptions {
  appToken: string
  promo: HamsterTypes.Promo
  maxAttemptsCount?: number
  eventTimeout?: number
}
export async function getPromoCode(options: GetPromoCodeOptions): Promise<string> {
  const {
    appToken,
    promo,
    eventTimeout = 20000,
    maxAttemptsCount = 15,
  } = options

  const httpClient = axios.create({
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Host': 'api.gamepromo.io',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.3',
    },
  })

  const loginClientResponse = await retry(() => httpClient.post<{
    clientToken: string
  }>(
    'https://api.gamepromo.io/promo/login-client',
    {
      appToken,
      clientId: generateClientId(),
      clientOrigin: 'deviceid',
    },
  ), {
    retries: 5,
    minTimeout: 4000,
    maxTimeout: 6000,
  })
  httpClient.defaults.headers.common.Authorization = `Bearer ${loginClientResponse.data.clientToken}`

  await sleep(1000)

  return await retry(
    async () => {
      const registerEventResponse = await httpClient.post<{
        hasCode: boolean
      }>(
        'https://api.gamepromo.io/promo/register-event',
        {
          promoId: promo.promoId,
          eventId: generateEventId(),
          eventOrigin: 'undefined',
        },
      )

      if (!registerEventResponse.data.hasCode) {
        throw new Error(`No code in registered event `)
      }

      const createCodeResponse = await httpClient.post<{
        promoCode: string
      }>(
        'https://api.gamepromo.io/promo/create-code',
        { promoId: promo.promoId },
      )

      return createCodeResponse.data.promoCode
    },
    {
      retries: maxAttemptsCount,
      minTimeout: eventTimeout,
      maxTimeout: eventTimeout,
    },
  )
}
