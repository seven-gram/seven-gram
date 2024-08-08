import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface GetClickerUserResponse {
  clickerUser: HamsterTypes.ClickerUser
}

export async function getClickerUser(axiosClient: AxiosInstance): Promise<GetClickerUserResponse> {
  const response = await axiosClient.post<GetClickerUserResponse>(
    'https://api.hamsterkombatgame.io/clicker/sync',
    {},
  )

  return response.data
}
