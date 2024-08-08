import { hamsterMiniApp } from './entries/hamster/index.js'
import { defineMiniApps } from './helpers/define.js'

export { initMiniApps } from './helpers/init.js'

export const miniApps = defineMiniApps([
  hamsterMiniApp,
])
