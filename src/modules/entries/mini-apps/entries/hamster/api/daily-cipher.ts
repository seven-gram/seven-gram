import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface ClaimDailyCipherResponse {
  clickerUser: HamsterTypes.ClickerUser
  dailyCipher: HamsterTypes.DailyCipher
}

export async function claimDailyCipher(axiosClient: AxiosInstance, cipher: string): Promise<ClaimDailyCipherResponse> {
  const response = await axiosClient.post<ClaimDailyCipherResponse>(
    'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher',
    {
      cipher,
    },
  )

  return response.data
}
