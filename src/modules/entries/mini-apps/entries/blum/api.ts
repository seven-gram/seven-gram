import type { AxiosInstance } from 'axios'
import type { TelegramClient } from 'telegram'
import { doFloodProtect, getWebAppData } from 'src/telegram/helpers/index.js'
import { defineMiniAppApi } from '../../helpers/define.js'
import { BlumStatic } from './static.js'

export interface GetTokenResult {
  token: {
    access: string
    refresh: string
    user: {
      id: {
        id: string
      }
      username: string
    }
  }
  justCreated: boolean
}

async function getToken(axiosClient: AxiosInstance, telegramClient: TelegramClient) {
  const webAppData = await getWebAppData(telegramClient, BlumStatic.BOT_ENTITY, BlumStatic.URL)

  let data
  try {
    data = (await axiosClient.post<GetTokenResult>(
      'https://gateway.blum.codes/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP',
      { query: webAppData },
    )).data
  }
  catch {
    void 0
  }

  if (!data) {
    await doFloodProtect()
    data = (await axiosClient.post<GetTokenResult>(
      'https://user-domain.blum.codes/api/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP',
      { query: webAppData },
    )).data
  }

  const { access: authToken } = data.token
  if (!authToken) {
    throw new Error('Can not login. auth-by-telegram-webapp return result without authToken')
  }

  return {
    ...data,
    authToken,
  }
}

export interface GetBalanceResponce {
  availableBalance: string
  playPasses: number
  isFastFarmingEnabled: boolean
  timestamp: number
  farming?: {
    startTime: number
    endTime: number
    earningsRate: string
    balance: string
  }
}

async function getBalance(axiosClient: AxiosInstance) {
  const response = await axiosClient<GetBalanceResponce>({
    url: 'https://game-domain.blum.codes/api/v1/user/balance',
    method: 'GET',
  })
  return response.data
}

async function claimDailyReward(axiosClient: AxiosInstance) {
  await axiosClient({
    url: 'https://game-domain.blum.codes/api/v1/daily-reward?offset=-420',
    method: 'POST',
    data: null,
  })
}

async function startFarming(axiosClient: AxiosInstance) {
  const { data } = await axiosClient({
    url: 'https://game-domain.blum.codes/api/v1/farming/start',
    method: 'POST',
    data: null,
  })
  return data
}

async function claimFarming(axiosClient: AxiosInstance) {
  const { data } = await axiosClient({
    url: 'https://game-domain.blum.codes/api/v1/farming/claim',
    method: 'POST',
    data: null,
  })
  return data
}

async function getTasks(axiosClient: AxiosInstance) {
  const { data } = await axiosClient({
    url: 'https://game-domain.blum.codes/api/v1/tasks',
    method: 'GET',
  })
  return data
}

async function startTask(axiosClient: AxiosInstance, taskId: string) {
  const { data } = await axiosClient({
    url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/start`,
    method: 'POST',
    data: null,
  })
  return data
}

async function claimTaskReward(axiosClient: AxiosInstance, taskId: string) {
  const { data } = await axiosClient({
    url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/claim`,
    method: 'POST',
    data: null,
  })
  return data
}

export interface StartGameResult {
  gameId: string
}

async function startGame(axiosClient: AxiosInstance) {
  const { data } = await axiosClient<StartGameResult>({
    url: 'https://game-domain.blum.codes/api/v1/game/play',
    method: 'POST',
    data: null,
  })
  return data
}

async function claimGame(axiosClient: AxiosInstance, gameId: string, points: number) {
  await axiosClient({
    url: `https://game-domain.blum.codes/api/v1/game/claim`,
    method: 'POST',
    data: {
      gameId,
      points,
    },
  })
}

export const BlumApi = defineMiniAppApi({
  getToken,
  getBalance,
  claimFarming,
  claimDailyReward,
  startFarming,
  getTasks,
  claimTaskReward,
  startGame,
  claimGame,
  startTask,
})
