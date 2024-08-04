import { CronJob, CronTime } from 'cron'
import humanizeDuration from 'humanize-duration'
import { useUserBot } from 'src/telegram/user-bot.js'
import type { AxiosInstance } from 'axios'
import axios from 'axios'
import type { MiniAppsMap } from '../types.js'

export async function initMiniApps(miniAppsMap: MiniAppsMap) {
  const usersBots = [await useUserBot()]
  for (const userBot of usersBots) {
    const userBotId = Number(userBot.me.id)

    for (const miniApp of Object.values(miniAppsMap)) {
      const configDatabase = miniApp.configDatabase

      for (const callbackEntity of miniApp.callbackEntities) {
        let axiosClient: AxiosInstance | undefined
        const useAxiosClient = async (): Promise<AxiosInstance> => {
          const headersWrapper = configDatabase.database.data.sessions[userBotId]?.headersWrapper
          const isHeadersExpired = !headersWrapper || new Date(headersWrapper.expirationDate) <= new Date()

          if (isHeadersExpired) {
            axiosClient = await miniApp.login.callback(axios.create)
            configDatabase.updateSessionLoginHeaders(userBotId, axiosClient.defaults.headers, miniApp.login.lifetime)
          }
          else if (!axiosClient) {
            axiosClient = axios.create({
              headers: headersWrapper.headers,
            })
            configDatabase.updateSessionLoginHeaders(userBotId, axiosClient.defaults.headers, miniApp.login.lifetime)
          }

          return axiosClient
        }

        const sheduledHandler = async (duration: number) => {
          const nextJobExecutionDurationString = humanizeDuration(duration)

          try {
            await callbackEntity.callback({
              ...miniApp.public,
              axiosClient: await useAxiosClient(),
            })

            miniApp.public.logger.success({
              plainMessage: `Module |${callbackEntity.name}| was executed succesfully.\nNext execution after ${nextJobExecutionDurationString}`,
              markdownMessage: `Module _|${callbackEntity.name}|_ was executed succesfully\n\nNext execution after _${nextJobExecutionDurationString}_`,
            })
          }
          catch (error) {
            if (error instanceof Error) {
              miniApp.public.logger.error({
                plainMessage: `An unhandled error occurs.\nMessage: ${error.message}\nNext execution after ${nextJobExecutionDurationString}`,
                markdownMessage: `An unhandled error occurs.\`\`\`Message: ${error.message}\`\`\`\nNext execution after _${nextJobExecutionDurationString}_`,
              })
            }
          }
        }

        if (callbackEntity.shedulerType === 'cron') {
          const job = new CronJob(
            callbackEntity.cronExpression,
            () => sheduledHandler(new CronTime(callbackEntity.cronExpression).getTimeout()),
          )
          job.start()
        }
        else if (callbackEntity.shedulerType === 'timeout') {
          const timeoutSheduledHandler = async () => {
            const duration = callbackEntity.timeout()
            await sheduledHandler(duration)
            setTimeout(timeoutSheduledHandler, duration)
          }
          setTimeout(timeoutSheduledHandler, callbackEntity.timeout())
        }
      }
    }
  }
}
