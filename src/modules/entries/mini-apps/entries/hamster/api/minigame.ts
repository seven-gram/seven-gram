import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

export interface DailyKeysMiniGame {
  id: string
  startDate: Date
  levelConfig: string
  youtubeUrl: string
  bonusKeys: number
  isClaimed: boolean
  totalSecondsToNextAttempt: number
  remainSecondsToGuess: number
  remainSeconds: number
  remainSecondsToNextAttempt: number
  remainPoints: number
  maxPoints?: number
}

interface StartDailyKeysMinigameResult {
  clickerUser: HamsterTypes.ClickerUser
  dailyKeysMiniGames: DailyKeysMiniGame
}

export async function startDailyKeysMinigame(axiosClient: AxiosInstance, miniGameId: string): Promise<StartDailyKeysMinigameResult> {
  const response = await axiosClient.post<StartDailyKeysMinigameResult>(
    'https://api.hamsterkombatgame.io/clicker/start-keys-minigame',
    { miniGameId },
  )

  return response.data
}

interface ClaimDailyKeysMinigameResult {
  clickerUser: HamsterTypes.ClickerUser
  dailyKeysMiniGames: DailyKeysMiniGame
}

export async function claimDailyKeysMinigame(axiosClient: AxiosInstance, cipher: string, miniGameId: string): Promise<ClaimDailyKeysMinigameResult> {
  const response = await axiosClient.post<ClaimDailyKeysMinigameResult>(
    'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame',
    { cipher, miniGameId },
  )

  return response.data
}
