import type { AxiosError, AxiosInstance } from 'axios'
import type axios from 'axios'
import type { CronJobParams, CronTime } from 'cron'
import type { LowSync } from 'lowdb'
import type { randomInt as _randomInt } from 'node:crypto'
import type { Logger } from 'src/logger.js'
import type { createCronTimeoutWithDeviation as _createCronTimeoutWithDeviation, MaybePromiseLike, OmitFirstArg } from 'src/shared.js'
import type { TelegramClient } from 'telegram'
import type { MiniAppName } from './enums.js'

export type MiniAppApi = {
  [key in string]: (axiosClient: AxiosInstance, ...args: any[]) => Promise<any | void | never>
}

interface CallbackEntityConfig {
  nextExecutionDate: string
}

export interface MiniAppConfig {
  sessions: {
    [name in string]?: {
      axiosDefaults?: typeof axios.defaults
      callbackEntities?: {
        [Hash in string]?: CallbackEntityConfig
      }
    }
  }
}

export interface CallbackEntityConfigHashOptions {
  miniAppName: string
  callbackEntityName: string
  callbackEntityIndex: number
}

export interface MiniAppConfigDatabase {
  database: LowSync<MiniAppConfig>
  updateSessionAxiosDefaults: (sessionName: string, axiosDefaults: typeof axios.defaults) => void
  updateCallbackEntity: (
    sessionName: string,
    entityOptions: CallbackEntityConfigHashOptions,
    updateInput: CallbackEntityConfig
  ) => void
  getCallbackEntity: (
    sessionName: string,
    entityOptions: CallbackEntityConfigHashOptions
  ) => CallbackEntityConfig | undefined
}

type MiniAppCallback<Api> = (context: {
  axiosClient: AxiosInstance
  logger: Logger
  telegramClient: TelegramClient
  api: {
    [Key in keyof Api]: OmitFirstArg<Api[Key]>
  }
}) => MaybePromiseLike<void | {
  extraRestartTimeout?: number
}>

interface MiniAppCallbackEntity<Api> {
  name: string
  timeout: (options: {
    createCronTime: (cronJobParams: CronJobParams['cronTime']) => CronTime
    randomInt: typeof _randomInt
    createCronTimeoutWithDeviation: typeof _createCronTimeoutWithDeviation
  }) => number
  callback: MiniAppCallback<Api>
}

export interface DefineMiniAppOptions<Name, Api> {
  name: Name
  api: Api
  configDatabase: MiniAppConfigDatabase
  login: {
    callback: (options: {
      initialAxiosClient: AxiosInstance
      telegramClient: TelegramClient
    }) => Promise<void>
  }
  onResponseRejected?: (options: {
    error: AxiosError
    axiosClient: AxiosInstance
    telegramClient: TelegramClient
  }) => MaybePromiseLike<AxiosError | null | undefined>
  callbackEntities: MiniAppCallbackEntity<Api>[]
}

export interface MiniApp<Name = MiniAppName, Api = MiniAppApi> extends DefineMiniAppOptions<Name, Api> {
}
