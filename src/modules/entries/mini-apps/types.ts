import type { AxiosError, AxiosInstance, HeadersDefaults } from 'axios'
import type axios from 'axios'
import type { CronJobParams, CronTime } from 'cron'
import type { LowSync } from 'lowdb'
import type { randomInt as _randomInt } from 'node:crypto'
import type { Logger } from 'src/logger.js'
import type { createCronTimeoutWithDeviation as _createCronTimeoutWithDeviation, MaybePromiseLike, OmitFirstArg } from 'src/shared.js'
import type { UserBot } from 'src/telegram/user-bot/types.js'
import type { MiniAppName } from './enums.js'

export type MiniAppApi = {
  [key in string]: (axiosClient: AxiosInstance, ...args: any[]) => Promise<any | void | never>
}

interface CallbackEntityConfig {
  nextExecutionDate: string
}

export interface MiniAppConfig {
  sessions: {
    [Id in number]?: {
      headersWrapper?: {
        headers: HeadersDefaults
      }
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
  updateSessionLoginHeaders: (sessionId: number, headers: HeadersDefaults) => void
  updateCallbackEntity: (
    sessionId: number,
    entityOptions: CallbackEntityConfigHashOptions,
    updateInput: CallbackEntityConfig
  ) => void
  getCallbackEntity: (
    sessionId: number,
    entityOptions: CallbackEntityConfigHashOptions
  ) => CallbackEntityConfig | undefined
}

type MiniAppCallback<Name, Api> = (context: MiniApp<Name, Api>['public'] & {
  axiosClient: AxiosInstance
  userBot: UserBot
  api: {
    [Key in keyof Api]: OmitFirstArg<Api[Key]>
  }
}) => MaybePromiseLike<void | {
  extraRestartTimeout?: number
}>

interface MiniAppCallbackEntity<Name, Api> {
  name: string
  timeout: (options: {
    createCronTime: (cronJobParams: CronJobParams['cronTime']) => CronTime
    randomInt: typeof _randomInt
    createCronTimeoutWithDeviation: typeof _createCronTimeoutWithDeviation
  }) => number
  callback: MiniAppCallback<Name, Api>
}

export interface DefineMiniAppOptions<Name, Api> {
  name: Name
  api: Api
  configDatabase: MiniAppConfigDatabase
  login: {
    callback: (createAxios: typeof axios.create) => Promise<AxiosInstance>
  }
  onResponseRejected?: (
    error: AxiosError,
    axiosClient: AxiosInstance,
    createAxios: typeof axios.create
  ) => MaybePromiseLike<AxiosError | null | undefined>
  callbackEntities: MiniAppCallbackEntity<Name, Api>[]
}

export interface MiniApp<Name = MiniAppName, Api = MiniAppApi> extends DefineMiniAppOptions<Name, Api> {
  public: {
    logger: Logger
  }
}
