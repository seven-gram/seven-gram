import { defineModules } from '../helpers/define.js'
import { helpModule } from './help.js'
import { miniAppsModule } from './mini-apps/index.js'
import { pingModule } from './ping.js'
import { reloadModule } from './reload/index.js'
import { updateModule } from './update.js'

export { updateModule } from './update.js'
export { reloadModule as restartModule } from './reload/index.js'

export const modules = defineModules([
  pingModule,
  updateModule,
  reloadModule,
  helpModule,
  miniAppsModule,
])
