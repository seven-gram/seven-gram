import { defineModule } from 'src/modules/helpers/define.js'
import { addSessionCommand, toggleMainSessionCommand } from './commands.js'
import { miniAppsConfig } from './config.js'
import { blumMiniApp } from './entries/blum/index.js'
import { hamsterMiniApp } from './entries/hamster/index.js'
import { MiniAppName } from './enums.js'
import { defineMiniApps } from './helpers/define.js'
import { initMiniApps } from './helpers/init.js'

export { initMiniApps } from './helpers/init.js'

export const miniApps = defineMiniApps([
  hamsterMiniApp,
  blumMiniApp,
])

export const miniAppsModule = defineModule({
  name: 'Mini Apps',
  description: `Automates routine work in popular apps (${Object.values(MiniAppName).join(', ')})`,
  config: miniAppsConfig,
  event: {
    type: 'command',
    commandSettings: {
      type: 'parrent',
      pattern: 'miniapps',
      description: 'Allow to controll miniapps settings',
      commands: [
        addSessionCommand,
        toggleMainSessionCommand,
      ],
    },
  },
  onInit() {
    initMiniApps()
  },
})
