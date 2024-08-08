import { initMiniApps } from './mini-apps/index.js'
import { useBot } from './telegram/index.js'

await useBot()
await initMiniApps()
