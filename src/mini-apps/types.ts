import type { AxiosInstance, HeadersDefaults } from 'axios'
import type { Logger } from 'src/logger.js'
import type { LowSync } from 'lowdb'
import type axios from 'axios'
import type { MiniAppName } from './enums.js'

export interface MiniAppConfig {
  sessions: {
    [Id in number]?: {
      headersWrapper: {
        expirationDate: string
        headers: HeadersDefaults
      }
    }
  }
}
export interface MiniAppConfigDatabase {
  database: LowSync<MiniAppConfig>
  updateSessionLoginHeaders: (id: number, headers: HeadersDefaults, lifetime: number) => void
}

type MiniAppCallback = <Name>(context: MiniApp<Name>['public'] & {
  axiosClient: AxiosInstance
}) => void | Promise<void>

type MiniAppCallbackEntity = {
  name: string
  callback: MiniAppCallback
} & ({
  shedulerType: 'cron'
  cronExpression: string
} | {
  shedulerType: 'timeout'
  timeout: () => number
})

export interface DefineMiniAppOptions<Name> {
  name: Name
  configDatabase: MiniAppConfigDatabase
  login: {
    callback: (createAxios: typeof axios.create) => Promise<AxiosInstance>
    lifetime: number
  }
  callbackEntities: MiniAppCallbackEntity[]
}

export interface MiniApp<Name> extends DefineMiniAppOptions<Name> {
  public: {
    logger: Logger
  }
}

export type MiniAppsMap = {
  [Name in MiniAppName]: MiniApp<Name>
}
