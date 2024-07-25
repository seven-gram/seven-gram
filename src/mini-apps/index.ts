import { hamsterMiniApp } from './entries/hamster.js'
// import { okxRacerMiniApp } from './entries/okx-racer.js'
import { defineMiniApps } from './helpers.js'

export const miniAppsMap = defineMiniApps({
  hamster: hamsterMiniApp,
  // "okx-racer": okxRacerMiniApp
})
