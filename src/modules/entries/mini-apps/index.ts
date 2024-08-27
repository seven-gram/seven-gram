import { defineModule } from 'src/modules/helpers/define.js'
import { defineMiniApps } from './helpers/define.js'
import { hamsterMiniApp } from './entries/hamster/index.js'
import { MiniAppName } from './enums.js'
import { initMiniApps } from './helpers/init.js'

export { initMiniApps } from './helpers/init.js'

export const miniApps = defineMiniApps([
  hamsterMiniApp,
])

export const miniAppsModule = defineModule({
  name: 'Mini Apps',
  description: `Automates routine work in popular apps (${Object.values(MiniAppName).join(', ')})`,
  onInit() {
    initMiniApps()
  },
})
