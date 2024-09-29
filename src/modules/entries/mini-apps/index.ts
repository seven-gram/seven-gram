import { defineModule } from 'src/modules/helpers/define.js'
import { blumMiniApp } from './entries/blum/index.js'
import { MiniAppName } from './enums.js'
import { defineMiniApps } from './helpers/define.js'
import { initMiniApps } from './helpers/init.js'
// import { hamsterMiniApp } from './entries/hamster/index.js'

export { initMiniApps } from './helpers/init.js'

export const miniApps = defineMiniApps([
  // hamsterMiniApp,
  blumMiniApp,
])

export const miniAppsModule = defineModule({
  name: 'Mini Apps',
  description: `Automates routine work in popular apps (${Object.values(MiniAppName).join(', ')})`,
  onInit() {
    initMiniApps()
  },
})
