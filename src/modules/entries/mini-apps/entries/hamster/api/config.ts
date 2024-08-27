import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface DailyKeysMiniGame {
  startDate: Date
  levelConfig: string
  youtubeUrl: string
  bonusKeys: number
  isClaimed: boolean
  totalSecondsToNextAttempt: number
  remainSecondsToGuess: number
  remainSeconds: number
  remainSecondsToNextAttempt: number
}

interface GetConfigResponse {
  dailyCipher: HamsterTypes.DailyCipher
  feature: string[]
  dailyKeysMiniGame: DailyKeysMiniGame
}

export async function getConfig(axiosClient: AxiosInstance): Promise<GetConfigResponse> {
  const response = await axiosClient.post<GetConfigResponse>(
    'https://api.hamsterkombatgame.io/clicker/config',
    {},
  )

  return response.data
}
