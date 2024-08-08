import { existsSync, mkdirSync } from 'node:fs'
import { JSONFileSyncPreset } from 'lowdb/node'
import { memoize } from 'lodash-es'
import objectHash from 'object-hash'
import type { MiniAppName } from '../enums.js'
import type { MiniAppConfig, MiniAppConfigDatabase } from '../types.js'

export function createMiniAppConfigDatabase(name: MiniAppName) {
  return memoize((): MiniAppConfigDatabase => {
    const dir = 'databases/mini-apps'

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const database = JSONFileSyncPreset<MiniAppConfig>
    (`${dir}/${name}-config.json`, { sessions: {} })

    const updateSessionLoginHeaders: MiniAppConfigDatabase['updateSessionLoginHeaders'] = (
      sessionId,
      headers,
      lifetime,
    ) => {
      database.data.sessions[sessionId] ??= {}
      database.data.sessions[sessionId].headersWrapper = {
        expirationDate: new Date(Date.now() + lifetime).toJSON(),
        headers,
      }
      database.write()
    }

    const updateCallbackEntity: MiniAppConfigDatabase['updateCallbackEntity'] = (
      sessionId,
      options,
      updateInput,
    ) => {
      const hashId = objectHash(options)
      database.data.sessions[sessionId] ??= {}
      database.data.sessions[sessionId].callbackEntities ??= {}
      database.data.sessions[sessionId].callbackEntities[hashId] = updateInput
      database.write()
    }

    const getCallbackEntity: MiniAppConfigDatabase['getCallbackEntity'] = (
      sessionId,
      options,
    ) => {
      const hashId = objectHash(options)
      return database.data.sessions?.[sessionId]?.callbackEntities?.[hashId]
    }

    return {
      database,
      updateSessionLoginHeaders,
      updateCallbackEntity,
      getCallbackEntity,
    }
  })()
}
