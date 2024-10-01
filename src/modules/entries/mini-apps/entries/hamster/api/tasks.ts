import type { AxiosInstance } from 'axios'
import type { HamsterTypes } from '../index.js'

interface GetTasksListResponse {
  tasks: HamsterTypes.Task[]
}

export async function getTasksList(axiosClient: AxiosInstance): Promise<GetTasksListResponse> {
  const response = await axiosClient.post<GetTasksListResponse>(
    'https://api.hamsterkombatgame.io/interlude/list-tasks',
    null,
  )

  return response.data
}

interface CheckTasksResponse {
  interludeUser: HamsterTypes.InterludeUser
  task: HamsterTypes.Task
}

export async function checkTask(axiosClient: AxiosInstance, taskId: string): Promise<CheckTasksResponse> {
  const response = await axiosClient.post<CheckTasksResponse>(
    'https://api.hamsterkombatgame.io/interlude/check-task',
    { taskId },
  )

  return response.data
}
