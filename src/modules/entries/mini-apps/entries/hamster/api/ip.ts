import type { AxiosInstance } from 'axios'

export interface GetIpResponse {
  ip: string
  country_code: string
  city_name: string
  latitude: string
  longitude: string
  asn: string
  asn_org: string
}

export async function getIp(axiosClient: AxiosInstance): Promise<GetIpResponse> {
  const response = await axiosClient.get<GetIpResponse>(
    'https://api.hamsterkombatgame.io/ip',
  )

  return response.data
}
