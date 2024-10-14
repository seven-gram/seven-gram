import type { MiniAppName } from '../enums.js'
import type { CallbackEntityConfigHashOptions, MiniAppConfig, MiniAppConfigDatabase } from '../types.js'
import { existsSync, mkdirSync } from 'node:fs'
import { memoize } from 'lodash-es'
import { JSONFileSyncPreset } from 'lowdb/node'

export function createMiniAppConfigDatabase(name: MiniAppName) {
  return memoize((): MiniAppConfigDatabase => {
    const dir = 'databases/mini-apps'

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const database = JSONFileSyncPreset<MiniAppConfig>(`${dir}/${name}-config.json`, { sessions: {} })

    const updateSessionAxiosDefaults: MiniAppConfigDatabase['updateSessionAxiosDefaults'] = (
      sessionId,
      axiosDefaults,
    ) => {
      database.data.sessions[sessionId] ??= {}
      database.data.sessions[sessionId].axiosDefaults = axiosDefaults
      database.write()
    }

    const createHashFromOptions = (options: CallbackEntityConfigHashOptions) =>
      `${options.miniAppName}_${options.callbackEntityName}_${options.callbackEntityIndex}`

    const updateCallbackEntity: MiniAppConfigDatabase['updateCallbackEntity'] = (
      sessionId,
      options,
      updateInput,
    ) => {
      const hashId = createHashFromOptions(options)
      database.data.sessions[sessionId] ??= {}
      database.data.sessions[sessionId].callbackEntities ??= {}
      database.data.sessions[sessionId].callbackEntities[hashId] = updateInput
      database.write()
    }

    const getCallbackEntity: MiniAppConfigDatabase['getCallbackEntity'] = (
      sessionId,
      options,
    ) => {
      const hashId = createHashFromOptions(options)
      return database.data.sessions?.[sessionId]?.callbackEntities?.[hashId]
    }

    return {
      database,
      updateSessionAxiosDefaults,
      updateCallbackEntity,
      getCallbackEntity,
    }
  })()
}
