import { createLogger } from 'src/logger.js'
import type { DefineMiniAppOptions, MiniApp, MiniAppsMap } from '../types.js'
import type { MiniAppName } from '../enums.js'

export function defineMiniApp<Name extends MiniAppName>(options: DefineMiniAppOptions<Name>): MiniApp<Name> {
  const logger = createLogger(options.name.toUpperCase() as Uppercase<typeof options.name>)

  return {
    ...options,
    public: {
      logger,
    },
  }
}
export const defineMiniApps = (miniApps: MiniAppsMap) => miniApps
