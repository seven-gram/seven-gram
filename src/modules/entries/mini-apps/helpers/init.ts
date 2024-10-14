import type { AxiosInstance } from 'axios'
import type { AnyFn, MaybePromiseLike } from 'src/shared.js'
import type { TelegramClient } from 'telegram'
import type { Proxy } from '../config.js'
import type { MiniAppName } from '../enums.js'
import type { MiniApp } from '../types.js'
import { randomInt } from 'node:crypto'
import axios, { AxiosError } from 'axios'
import { CronTime } from 'cron'
import { createLogger } from 'src/logger.js'
import { miniApps, miniAppsModule } from 'src/modules/entries/mini-apps/index.js'
import { createCronTimeoutWithDeviation, sleep } from 'src/shared.js'
import { doFloodProtect } from 'src/telegram/helpers/index.js'
import { UserBotHelpers, useUserBot } from 'src/telegram/index.js'
import { MiniAppsStatic } from '../static.js'

export async function initMiniApps() {
  foreachTelegramClients(async (sessionName, client, proxy) => {
    for (const miniApp of miniApps) {
      (() => {
        const callbacksQueue = createCallbacksQueue({
          sessionName,
          telegramClient: client,
        })
        const useAxiosClient = useAxiosClientFactory(sessionName, client, miniApp, proxy)
        const configDatabase = miniApp.configDatabase

        for (const [callbackEntity, callbackEntityIndex] of miniApp.callbackEntities.map((value, index) => [value, index] as const)) {
          const logger = createLogger(
            miniApp.name.toUpperCase() as Uppercase<typeof miniApp.name>,
            callbackEntity.name,
          )

          const callbackEntityConfig = configDatabase.getCallbackEntity(
            sessionName,
            {
              miniAppName: miniApp.name,
              callbackEntityName: callbackEntity.name,
              callbackEntityIndex,
            },
          )
          const nextExecutionDateExpired = !callbackEntityConfig || new Date(callbackEntityConfig.nextExecutionDate) <= new Date()

          const getCallbackEntityTimeout = () => callbackEntity.timeout({
            createCronTime: (options: any) => new CronTime(options),
            randomInt,
            createCronTimeoutWithDeviation,
          })

          const timeoutSheduledHandler = async () => {
            async function tryExecuteCallback() {
              let callbackResult

              if (callbacksQueue.has(callbackEntity.callback) === false) {
                const axiosClient = await useAxiosClient()
                callbackResult = await callbacksQueue.addCallback(
                  callbackEntity.callback,
                  () => callbackEntity.callback({
                    axiosClient,
                    logger,
                    telegramClient: client,
                    api: Object.fromEntries(
                      Object.entries(miniApp.api).map(([key, value]) => [key, (value as AnyFn).bind(globalThis, axiosClient)]),
                    ) as any,
                  }),
                )
                  .subscribe()
              }

              return callbackResult
            }

            let callbackResult
            try {
              callbackResult = await tryExecuteCallback()
            }
            catch (error: any) {
              if (error instanceof AxiosError) {
                await logger.error({
                  plainMessage: `Module was executed with error.\nMessage: ${JSON.stringify(error.response?.data ?? error.message)}`,
                  markdownMessage: `Module was executed with error.\`\`\`Message: ${JSON.stringify(error.response?.data ?? error.message)}\`\`\``,
                })
              }
              else if (error instanceof Error) {
                await logger.error({
                  plainMessage: `An unhandled error occurs.\nMessage: ${error.message}`,
                  markdownMessage: `An unhandled error occurs.\`\`\`Message: ${error.message}\`\`\``,
                })
              }
            }

            const timeoutDuration = callbackResult?.extraRestartTimeout ?? getCallbackEntityTimeout()

            configDatabase.updateCallbackEntity(
              sessionName,
              {
                miniAppName: miniApp.name,
                callbackEntityName: callbackEntity.name,
                callbackEntityIndex,
              },
              {
                nextExecutionDate: new Date(Date.now() + timeoutDuration).toJSON(),
              },
            )
            setTimeout(timeoutSheduledHandler, timeoutDuration)
          }

          if (nextExecutionDateExpired) {
            timeoutSheduledHandler()
          }
          else {
            setTimeout(timeoutSheduledHandler, getCallbackEntityTimeout())
          }
        }
      })()

      await doFloodProtect()
    }
  })
}

function useAxiosClientFactory(
  sessionName: string,
  telegramClient: TelegramClient,
  miniApp: MiniApp<MiniAppName>,
  proxy?: Proxy,
) {
  let axiosClient: AxiosInstance | undefined

  async function useAxiosClient(): Promise<AxiosInstance> {
    const configDatabase = miniApp.configDatabase
    const session = configDatabase.database.data.sessions[sessionName]

    const axiosDefaults = session?.axiosDefaults

    if (!axiosDefaults) {
      if (!telegramClient.connected) {
        await telegramClient.connect()
      }

      axiosClient = axios.create(
        proxy
          ? {
              proxy: {
                protocol: 'http',
                host: proxy.ip,
                port: proxy.port,
                auth: proxy.password && proxy.username
                  ? {
                      username: proxy.username,
                      password: proxy.password,
                    }
                  : undefined,
              },
            }
          : undefined,
      )
      await miniApp.login.callback({
        initialAxiosClient: axiosClient,
        telegramClient,
      })
      configDatabase.updateSessionAxiosDefaults(sessionName, axiosClient.defaults)
    }
    else if (!axiosClient) {
      axiosClient = axios.create({
        headers: axiosDefaults.headers,
        proxy: axiosDefaults.proxy,
      })
      configDatabase.updateSessionAxiosDefaults(sessionName, axiosClient.defaults)
    }

    axiosClient.interceptors.request.use(
      (request) => {
        const accessToken = axiosClient?.defaults.headers.common.Authorization
        if (accessToken) {
          request.headers.Authorization = accessToken
        }
        return request
      },
      error => Promise.reject(error),
    )

    const onResponseRejected = miniApp.onResponseRejected
    if (onResponseRejected) {
      axiosClient.interceptors.response.use(
        response => response,
        async (error) => {
          if (!(error instanceof AxiosError))
            return Promise.reject(error)

          const originalRequest = error.config as typeof error.config & { _retry: boolean | undefined }

          if (!axiosClient || !originalRequest || originalRequest._retry)
            return Promise.reject(error)

          try {
            if (!telegramClient.connected) {
              await telegramClient.connect()
            }
            const onResponseRejectedResult = await onResponseRejected({
              error,
              axiosClient,
              telegramClient,
            })

            configDatabase.updateSessionAxiosDefaults(sessionName, axiosClient.defaults)

            if (onResponseRejectedResult instanceof Error) {
              return Promise.reject(error)
            }

            originalRequest._retry = true
            return axiosClient.request(originalRequest)
          }
          catch (error) {
            return Promise.reject(error)
          }
        },
      )
    }

    return axiosClient
  }

  return useAxiosClient
}

function foreachTelegramClients(
  callback: (
    sessionName: string,
    client: TelegramClient,
    proxy?: Proxy,
  ) => MaybePromiseLike<void>,
) {
  const { database } = miniAppsModule.config

  if (database.data.needToUseMainSession) {
    useUserBot().then((userBot) => {
      callback(MiniAppsStatic.reservedMainSessionName, userBot.client)
    })
  }

  Object
    .entries(database.data.sessions)
    .forEach(([sessionName, session]) => {
      const telegramClient = UserBotHelpers.createClient(session)
      callback(sessionName, telegramClient, session.proxy)
    })
}

function createCallbacksQueue(options: {
  sessionName: string
  telegramClient: TelegramClient
}) {
  const { sessionName, telegramClient } = options

  const isMainSession = sessionName === MiniAppsStatic.reservedMainSessionName
  const callbacksQueueEntries: [AnyFn, () => Promise<void>][] = [];

  (async () => {
    while (true) {
      if (callbacksQueueEntries.length) {
        if (!telegramClient.connected && !isMainSession) {
          await telegramClient.connect()
        }

        try {
          await callbacksQueueEntries.pop()?.[1]?.()
        }
        catch {
          void 0
        }

        if (!callbacksQueueEntries.length && !isMainSession) {
          await telegramClient.disconnect()
        }
      }
      await sleep(1000)
    }
  })()

  function has(keyCallback: AnyFn) {
    return callbacksQueueEntries.some(entry => entry[0] === keyCallback)
  }

  function addCallback<GCallbackReturnType>(keyCallback: AnyFn, callback: (...args: any[]) => GCallbackReturnType) {
    const { promise, resolve, reject } = Promise.withResolvers<Awaited<GCallbackReturnType>>()

    callbacksQueueEntries.unshift([
      keyCallback,
      async () => {
        try {
          const callbackResult = await callback()
          resolve(callbackResult)
        }
        catch (error) {
          reject(error)
        }
      },
    ])

    return {
      subscribe: () => promise,
    }
  }

  return {
    addCallback,
    has,
  }
}
