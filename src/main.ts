import { initMiniApps } from './mini-apps/index.js'
import { initModules } from './modules/helpers/init.js'
import { useBot } from './telegram/index.js'

await useBot()

await initMiniApps()
await initModules()
