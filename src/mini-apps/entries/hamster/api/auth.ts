import { TelegramHelpers, useUserBot } from 'src/telegram/index.js'
import axios from 'axios'
import { HamsterStatic } from '../static.js'

interface AuthByTelegramWebapp {
  authToken?: string
}

export async function authByTelegramWebapp(): Promise<Required<AuthByTelegramWebapp>> {
  const userBot = await useUserBot()
  const fingerprint = TelegramHelpers.getFingerprint()
  const webAppData = await userBot.getWebAppDatar(HamsterStatic.HAMSTER_BOT_ENTITY, HamsterStatic.HAMSTER_URL)

  const response = await axios
    .create({ headers: HamsterStatic.DEFAULT_HEADERS })
    .post<AuthByTelegramWebapp>(
      'https://api.hamsterkombatgame.io/auth/auth-by-telegram-webapp',
      {
        initDataRaw: webAppData,
        fingerprint,
      },
    )
  const { authToken } = response.data
  if (!authToken) {
    throw new Error('Can not login. auth-by-telegram-webapp return result without authToken')
  }

  return {
    ...response.data,
    authToken,
  }
}
