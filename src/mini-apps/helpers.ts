import type { Logger } from 'src/logger.js'
import { createLogger } from 'src/logger.js'
import { useUserBot } from 'src/user-bot.js'
import type { TelegramClient } from 'telegram'
import type { Entries } from 'type-fest'

interface MiniAppCallbackContext {
  logger: Logger
  userBot: TelegramClient
}
type MiniAppCallback = (context: MiniAppCallbackContext) => void

export interface MiniApp<Name> {
  name: Name
  callback: MiniAppCallback
}

export type MiniAppName = 'hamster'

export type MiniAppsMap = {
  [Name in MiniAppName]: MiniApp<Name>
}

export const defineMiniApp = <Name extends MiniAppName>(miniApp: MiniApp<Name>) => miniApp
export const defineMiniApps = (miniApps: MiniAppsMap) => miniApps

export async function initMiniApps(miniAppsMap: MiniAppsMap) {
  const { userBot } = await useUserBot()

  for (const [miniAppName, miniApp] of Object.entries(miniAppsMap) as Entries<typeof miniAppsMap>) {
    const logger = createLogger(miniAppName.toUpperCase() as Uppercase<typeof miniAppName>)

    miniApp.callback({
      logger,
      userBot,
    })
  }
}
