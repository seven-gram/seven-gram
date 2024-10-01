import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface GetInterludeUserResponse {
  interludeUser: HamsterTypes.InterludeUser
}

export async function getInterludeUser(axiosClient: AxiosInstance): Promise<GetInterludeUserResponse> {
  const response = await axiosClient.post<GetInterludeUserResponse>(
    'https://api.hamsterkombatgame.io/interlude/sync',
    {},
  )

  return response.data
}
