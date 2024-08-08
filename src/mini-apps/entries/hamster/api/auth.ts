import { TelegramHelpers, useUserBot } from 'src/telegram/index.js'
import type { AxiosInstance } from 'axios'
import { HamsterStatic } from '../static.js'

interface AuthByTelegramWebapp {
  authToken?: string
}

export async function authByTelegramWebapp(axiosClient: AxiosInstance): Promise<Required<AuthByTelegramWebapp>> {
  const userBot = await useUserBot()
  const fingerprint = TelegramHelpers.getFingerprint()
  const webAppData = await userBot.getWebAppData(HamsterStatic.HAMSTER_BOT_ENTITY, HamsterStatic.HAMSTER_URL)

  const response = await axiosClient
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
