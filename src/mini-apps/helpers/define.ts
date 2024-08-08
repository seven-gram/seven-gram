import { createLogger } from 'src/logger.js'
import type { DefineMiniAppOptions, MiniApp, MiniAppApi } from '../types.js'
import type { MiniAppName } from '../enums.js'

export function defineMiniApp<Name extends MiniAppName, Api extends MiniAppApi>(
  options: DefineMiniAppOptions<Name, Api>,
): MiniApp<Name, Api> {
  const logger = createLogger(options.name.toUpperCase() as Uppercase<typeof options.name>)

  return {
    ...options,
    public: {
      logger,
    },
  }
}
export const defineMiniApps = <TMiniApps extends MiniApp<MiniAppName, any>[]>(miniAppsMap: TMiniApps) => miniAppsMap

export const defineMiniAppApi = <Api extends MiniAppApi>(api: Api): Api => api
