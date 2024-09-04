import { Buffer } from 'node:buffer'
import * as crypto from 'node:crypto'
import { faker } from '@faker-js/faker'
import axios from 'axios'
import { sleep } from 'src/shared.js'
import retry from 'async-retry'
import type { DailyKeysMiniGame } from './api/minigame.js'
import type { HamsterTypes } from './index.js'

type CreateGetMiniGameCipherFactoryResult<Optional> = Optional extends false ? {
  getMiniGameCipher: (miniGame: DailyKeysMiniGame, userId: string) => string
} : {
  timeToFarmPoints: number
  getMiniGameCipher: (miniGame: DailyKeysMiniGame, userId: string) => string
}
export function createGetMiniGameCipherFactory(points?: undefined): CreateGetMiniGameCipherFactoryResult<false>
export function createGetMiniGameCipherFactory(points: number): CreateGetMiniGameCipherFactoryResult<true>
export function createGetMiniGameCipherFactory(points?: number | undefined): CreateGetMiniGameCipherFactoryResult<boolean> {
  function getGameCipher(startNumber: string): string {
    const magicIndex = Number.parseInt(startNumber) % (startNumber.length - 2)
    let res = ''

    for (let i = 0; i < startNumber.length; i++) {
      res += i === magicIndex ? '0' : Math.floor(Math.random() * 10).toString()
    }

    return res
  }

  function getMiniGameCipher(miniGame: DailyKeysMiniGame, userId: string, points = 0): string {
    const startDt = new Date(miniGame.startDate)
    const startNumber = Math.floor(startDt.getTime() / 1000)

    const cipherScore = (startNumber + points) * 2

    const hash = crypto.createHash('sha256')
    hash.update(`R1cHard_AnA1${cipherScore}G1ve_Me_y0u7_Pa55w0rD`)
    const signature = hash.digest('base64')

    const gameCipher = getGameCipher(startNumber.toString())

    const dataString = [
      gameCipher,
      userId,
      miniGame.id,
      cipherScore,
      signature,
    ].join('|')

    return Buffer.from(dataString).toString('base64')
  }

  if (points) {
    return {
      timeToFarmPoints: points / 2 * 1000,
      getMiniGameCipher: (miniGame, userId) => getMiniGameCipher(miniGame, userId, points),
    }
  }

  return {
    getMiniGameCipher: (miniGame, userId) => getMiniGameCipher(miniGame, userId, points),
  }
}

export function decodeDailyCipher(cipher: string): string {
  const encoded = `${cipher.substring(0, 3)}${cipher.substring(4, cipher.length)}`
  return Buffer.from(encoded, 'base64').toString('utf-8')
}

export function generateClientId(): string {
  const currentTime = Date.now()
  // eslint-disable-next-line ts/no-loss-of-precision
  const randomNumber = `34${faker.helpers.rangeToNumber({ min: 10000000000000000, max: 99999999999999999 })}`

  return `${currentTime}-${randomNumber}`
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
    maxAttemptsCount = 40,
  } = options

  const httpClient = axios.create({
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Host': 'api.gamepromo.io',
      'User-Agent': 'UnityPlayer/2021.3.15f1 (UnityWebRequest/1.0, libcurl/7.84.0-DEV)',
      'Accept': '/',
      'Accept-Encoding': 'gzip, deflate, br',
      'X-Unity-Version': '2021.3.15f1',
      'Connection': 'keep-alive',
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
