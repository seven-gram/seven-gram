import type { AxiosInstance } from 'axios'
import axios from 'axios'
import type { HamsterTypes } from '../index.js'

export interface GetPromoCodesResponse {
  promos: HamsterTypes.Promo[]
  states: HamsterTypes.PromoState[]
}

export async function getPromos(axiosClient: AxiosInstance): Promise<GetPromoCodesResponse> {
  const response = await axiosClient.post<GetPromoCodesResponse>(
    'https://api.hamsterkombatgame.io/clicker/get-promos',
    null,
  )

  return response.data
}

export interface ApplyPromoCodeResponse {
  clickerUser: HamsterTypes.ClickerUser
  promoState: HamsterTypes.PromoState
}

export async function applyPromoCode(axiosClient: AxiosInstance, promoCode: string): Promise<ApplyPromoCodeResponse> {
  const response = await axiosClient.post<ApplyPromoCodeResponse>(
    'https://api.hamsterkombatgame.io/clicker/apply-promo',
    { promoCode },
  )

  return response.data
}

export interface PromoSettings {
  appToken: string
  promoId: string
  minWaitAfterLogin: number
}

export async function getPromosSettings(_: AxiosInstance): Promise<PromoSettings[]> {
  const axiosClient = axios.create()
  const response = await axiosClient.post<PromoSettings[]>(
    'https://api21.datavibe.top/api/Games',
    null,
  )

  return response.data
}
