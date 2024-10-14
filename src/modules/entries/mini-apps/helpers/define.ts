import type { MiniAppName } from '../enums.js'
import type { DefineMiniAppOptions, MiniApp, MiniAppApi } from '../types.js'

export function defineMiniApp<Name extends MiniAppName, Api extends MiniAppApi>(
  options: DefineMiniAppOptions<Name, Api>,
): MiniApp<Name, Api> {
  return options
}
export const defineMiniApps = (miniAppsMap: MiniApp<MiniAppName, any>[]): MiniApp[] => miniAppsMap

export const defineMiniAppApi = <Api extends MiniAppApi>(api: Api): Api => api
