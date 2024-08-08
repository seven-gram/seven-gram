import type { AxiosInstance } from 'axios'

interface DailyCipher {
  cipher: string
  bonusCoins: number
  isClaimed: boolean
  remainSeconds: number
}

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
  dailyCipher: DailyCipher
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
