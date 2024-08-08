import { CronJob, CronTime } from 'cron'
import humanizeDuration from 'humanize-duration'
import type { AxiosInstance } from 'axios'
import axios from 'axios'
import { useUserBot } from 'src/telegram/index.js'
import type { AnyFn } from 'src/shared.js'
import { miniApps } from '../index.js'

export async function initMiniApps() {
  const usersBots = [await useUserBot()]
  for (const userBot of usersBots) {
    const userBotId = Number(userBot.me.id)

    for (const miniApp of miniApps) {
      const configDatabase = miniApp.configDatabase
      const session = configDatabase.database.data.sessions[userBotId]

      for (const [callbackEntity, callbackEntityIndex] of miniApp.callbackEntities.map((value, index) => [value, index] as const)) {
        let axiosClient: AxiosInstance | undefined
        const useAxiosClient = async (): Promise<AxiosInstance> => {
          const headersWrapper = session?.headersWrapper
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
            const axiosClient = await useAxiosClient()
            await callbackEntity.callback({
              ...miniApp.public,
              axiosClient,
              userBot,
              api: Object.fromEntries(
                Object.entries(miniApp.api).map(([key, value]) => [key, (value as AnyFn).bind(globalThis, axiosClient)]),
              ) as Record<keyof typeof miniApp.api, AnyFn>,
            })

            await miniApp.public.logger.success({
              plainMessage: `Module |${callbackEntity.name}| was executed succesfully.\nNext execution after ${nextJobExecutionDurationString}`,
              markdownMessage: `Module _|${callbackEntity.name}|_ was executed succesfully\n\nNext execution after _${nextJobExecutionDurationString}_`,
            })
          }
          catch (error) {
            if (error instanceof Error) {
              await miniApp.public.logger.error({
                plainMessage: `An unhandled error occurs.\nMessage: ${error.message}\nNext execution after ${nextJobExecutionDurationString}`,
                markdownMessage: `An unhandled error occurs.\`\`\`Message: ${error.message}\`\`\`\nNext execution after _${nextJobExecutionDurationString}_`,
              })
            }
          }
          configDatabase.updateCallbackEntity(
            userBotId,
            {
              miniAppName: miniApp.name,
              callbackEntityName: callbackEntity.name,
              callbackEntityIndex,
            },
            {
              nextExecutionDate: new Date(Date.now() + duration).toJSON(),
            },
          )
        }

        const callbackEntityConfig = configDatabase.getCallbackEntity(userBotId, {
          miniAppName: miniApp.name,
          callbackEntityName: callbackEntity.name,
          callbackEntityIndex,
        })
        const nextExecutionDateExpired = !callbackEntityConfig || new Date(callbackEntityConfig.nextExecutionDate) <= new Date()

        if (callbackEntity.shedulerType === 'cron') {
          const job = new CronJob(
            callbackEntity.cronExpression,
            () => sheduledHandler(new CronTime(callbackEntity.cronExpression).getTimeout()),
          )
          job.start()
          if (nextExecutionDateExpired) {
            sheduledHandler(new CronTime(callbackEntity.cronExpression).getTimeout())
          }
        }
        else if (callbackEntity.shedulerType === 'timeout') {
          const timeoutSheduledHandler = async () => {
            const duration = callbackEntity.timeout()
            await sheduledHandler(duration)
            setTimeout(timeoutSheduledHandler, duration)
          }
          if (nextExecutionDateExpired) {
            timeoutSheduledHandler()
          }
          else {
            setTimeout(timeoutSheduledHandler, callbackEntity.timeout())
          }
        }
      }
    }
  }
}
