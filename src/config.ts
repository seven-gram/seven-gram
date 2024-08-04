import { JSONFilePreset } from 'lowdb/node'
import type { BotName } from 'src/telegram/index.js'
import type { Session } from './sessions.js'
import { createGlobalState } from './shared.js'

type BotNameToBotOptionMap = {
  [Name in BotName]?: {
    token: string
  }
}

interface Config {
  mainSession?: Session
  botsOptions: BotNameToBotOptionMap
}

export const useConfigStore = createGlobalState(async () => {
  const configDatabase = await JSONFilePreset<Config>('databases/config.json', {
    botsOptions: {},
  })

  const setMainSession = async (session: Session) => {
    configDatabase.data.mainSession = session
    await configDatabase.write()
  }

  return {
    configDatabase,
    setMainSession,
  }
})
