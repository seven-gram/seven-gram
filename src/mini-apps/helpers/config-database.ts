import { existsSync, mkdirSync } from 'node:fs'
import { createGlobalState } from 'src/shared.js'
import { JSONFileSyncPreset } from 'lowdb/node'
import type { MiniAppName } from '../enums.js'
import type { MiniAppConfig, MiniAppConfigDatabase } from '../types.js'

export function createMiniAppConfigDatabase(name: MiniAppName) {
  return createGlobalState((): MiniAppConfigDatabase => {
    const dir = 'databases/mini-apps'

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const database = JSONFileSyncPreset<MiniAppConfig>
    (`${dir}/${name}-config.json`, { sessions: {} })

    const updateSessionLoginHeaders:
    MiniAppConfigDatabase['updateSessionLoginHeaders'] = (id, headers, lifetime) => {
      database.data.sessions[id] = {
        ...database.data.sessions[id],
        headersWrapper: {
          expirationDate: new Date(Date.now() + lifetime).toJSON(),
          headers,
        },
      }
      database.write()
    }

    return {
      database,
      updateSessionLoginHeaders,
    }
  })()
}
