import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface Task {
  id: string
  type: 'StreakDay' | 'Default' | 'WithLink' | 'TelegramSubscribe' | 'WithLocaleLink'
  condition: string
  rewardCoins: number
  periodicity: string
  toggle?: Toggle
  link?: string
  name: ModalButton
  modalDescription?: ModalButton
  modalLinkButton?: ModalButton
  image: Image
  rewardDelaySeconds?: number
  isCompleted: boolean
  linksWithLocales?: LinksWithLocales
  availableOnLocale?: string[]
  channelId?: number
  modalButton?: ModalButton
  rewardsByDays?: RewardsByDay[]
  modalTitle?: ModalButton
  days?: number
  completedAt?: Date
  remainSeconds?: number
}

interface Image {
  defaultUrl: string
  compressedUrl: string
}

interface LinksWithLocales {
  en: string
  ar?: string
  hi?: string
  it?: string
  ru?: string
  th?: string
  pt?: string
  es?: string
  tr?: string
  fr: string
  id?: string
  ja?: string
  ko?: string
  pl?: string
  vi?: string
  de: string
  zh?: string
}

interface ModalButton {
  de: string
  en: string
  es?: string
  fr: string
  hi: string
  id: string
  pt: string
  ru: string
  th?: string
  tl?: string
  tr?: string
  uz: string
  vi: string
}

interface RewardsByDay {
  days: number
  rewardCoins: number
}

interface Toggle {
  enableAt: Date
}

interface GetTasksListResponse {
  tasks: Task[]
}

export async function getTasksList(axiosClient: AxiosInstance): Promise<GetTasksListResponse> {
  const response = await axiosClient.post<GetTasksListResponse>(
    'https://api.hamsterkombatgame.io/clicker/list-tasks',
    null,
  )

  return response.data
}

interface CheckTasksResponse {
  clickerUser: HamsterTypes.ClickerUser
  task: Task[]
}

export async function checkTask(axiosClient: AxiosInstance, taskId: string): Promise<CheckTasksResponse> {
  const response = await axiosClient.post<CheckTasksResponse>(
    'https://api.hamsterkombatgame.io/clicker/check-task',
    { taskId },
  )

  return response.data
}
