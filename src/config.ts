import { existsSync, mkdirSync } from 'node:fs'
import { JSONFileSyncPreset } from 'lowdb/node'
import { createGlobalState } from './shared.js'

interface Config {
  userBot?: {
    apiId: number
    apiHash: string
    sessionString: string
    channels: Record<string, string | null>
  }
  bot?: {
    token: string
    username: string
  } | null
}

export const useConfigDatabase = createGlobalState(() => {
  const dir = 'databases'

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const database = JSONFileSyncPreset<Config>(`${dir}/config.json`, {})

  const setUserBot = (userBot: Config['userBot']) => {
    database.data.userBot = userBot
    database.write()
  }

  const setBot = (bot: Config['bot'] | null) => {
    database.data.bot = bot
    database.write()
  }

  return {
    database,
    setUserBot,
    setBot,
  }
})
