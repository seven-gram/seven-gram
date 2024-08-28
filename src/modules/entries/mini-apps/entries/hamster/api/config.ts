import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'
import type { DailyKeysMiniGame } from './minigame.js'

interface GetConfigResponse {
  dailyCipher: HamsterTypes.DailyCipher
  feature: string[]
  dailyKeysMiniGames: Record<string, DailyKeysMiniGame>
}

export async function getConfig(axiosClient: AxiosInstance): Promise<GetConfigResponse> {
  const response = await axiosClient.post<GetConfigResponse>(
    'https://api.hamsterkombatgame.io/clicker/config',
    null,
  )

  return response.data
}
