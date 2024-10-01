import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface ClaimDailyCipherResponse {
  interludeUser: HamsterTypes.InterludeUser
  dailyCipher: HamsterTypes.DailyCipher
}

export async function claimDailyCipher(axiosClient: AxiosInstance, cipher: string): Promise<ClaimDailyCipherResponse> {
  const response = await axiosClient.post<ClaimDailyCipherResponse>(
    'https://api.hamsterkombatgame.io/interlude/claim-daily-cipher',
    {
      cipher,
    },
  )

  return response.data
}
