import { existsSync, mkdirSync } from 'node:fs'
import { memoize, merge } from 'lodash-es'
import { JSONFileSyncPreset } from 'lowdb/node'

interface Database {
  settings: {
    commandPrefix: string
  }
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

export const useConfigDatabase = memoize(() => {
  const dir = 'databases'

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const defaultData: Database = {
    settings: {
      commandPrefix: '.',
    },
  }
  const database = JSONFileSyncPreset<Database>(`${dir}/config.json`, defaultData)
  database.data = merge(defaultData, database.data)
  database.write()

  const setUserBot = (userBot: Database['userBot']) => {
    database.data.userBot = userBot
    database.write()
  }

  const setBot = (bot: Database['bot'] | null) => {
    database.data.bot = bot
    database.write()
  }

  return {
    database,
    setUserBot,
    setBot,
  }
})
