import { hamsterMiniApp } from './entries/hamster/index.js'
import { defineMiniApps } from './helpers/define.js'

export { initMiniApps } from './helpers/init.js'

export const miniAppsMap = defineMiniApps({
  hamster: hamsterMiniApp,
})
