import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface DailyKeysMinigameResult {
  clickerUser: HamsterTypes.ClickerUser
  dailyKeysMiniGame: HamsterTypes.DailyKeysMinigame
}

export async function startDailyKeysMinigame(axiosClient: AxiosInstance): Promise<DailyKeysMinigameResult> {
  const response = await axiosClient.post<DailyKeysMinigameResult>(
    'https://api.hamsterkombatgame.io/clicker/start-keys-minigame',
    null,
  )

  return response.data
}

export async function claimDailyKeysMinigame(axiosClient: AxiosInstance, cipher: string): Promise<DailyKeysMinigameResult> {
  const response = await axiosClient.post<DailyKeysMinigameResult>(
    'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame',
    {
      cipher,
    },
  )

  return response.data
}
