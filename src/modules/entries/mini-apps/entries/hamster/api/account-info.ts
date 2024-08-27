import type { AxiosInstance } from 'axios'

interface AccountInfoClass {
  id: string
  at: Date
  name: string
  avatar: Avatar
  telegramUserIds: number[]
  telegramUsers: TelegramUser[]
  cryptoWalletUserIds: any[]
  deviceIds: any[]
  appleUserIds: any[]
  googleUserIds: any[]
}

interface Avatar {
  defaultUrl: string
  compressedUrl: string
}

interface TelegramUser {
  addedToAttachmentMenu: null
  authUserId: string
  canJoinGroups: null
  canReadAllGroupMessages: null
  firstName: string
  id: number
  isBot: boolean
  isPremium: null
  languageCode: string
  lastName: string
  photos: any[]
  supportsInlineQueries: null
  username: string
}

interface GetAccountInfoResponse {
  accountInfo: AccountInfoClass
}

export async function getAccountInfo(axiosClient: AxiosInstance): Promise<GetAccountInfoResponse> {
  const response = await axiosClient.post<GetAccountInfoResponse>(
    'https://api.hamsterkombatgame.io/auth/account-info',
    null,
  )

  return response.data
}
