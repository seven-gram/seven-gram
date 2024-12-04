import type { Module } from '../types.js'
import { useConfig } from 'src/config.js'
import { defineModules } from '../helpers/define.js'
import { brainRotDefenderModule } from './brain-rot-defender/index.js'
import { helpModule } from './help.js'
import { miniAppsModule } from './mini-apps/index.js'
import { pingModule } from './ping.js'
import { reloadModule } from './reload/index.js'
import { updateModule } from './update.js'

export { reloadModule as restartModule } from './reload/index.js'
export { updateModule } from './update.js'

const config = useConfig()

const modulesArray: Module[] = [
  pingModule,
  updateModule,
  helpModule,
  miniAppsModule,
  brainRotDefenderModule,
]

if (config.isDaemonMode) {
  modulesArray.push(reloadModule)
}

export const modules = defineModules(modulesArray)
