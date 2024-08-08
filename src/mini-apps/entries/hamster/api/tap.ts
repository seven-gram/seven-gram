import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface TapResponse {
  clickerUser: HamsterTypes.ClickerUser
}

export async function tap(
  axiosClient: AxiosInstance,
  availableTaps: number,
  count: number,
): Promise<TapResponse> {
  const response = await axiosClient.post<TapResponse>(
    'https://api.hamsterkombatgame.io/clicker/tap',
    {
      availableTaps,
      count,
      timestamp: Date.now(),
    },
  )

  return response.data
}
