import { JSONFilePreset } from 'lowdb/node'
import type { Session } from './sessions.js'
import { createGlobalState } from './shared.js'

interface Config {
  mainSession?: Session
  botToken?: string
}

export const useConfig = createGlobalState(async () => {
  const configDatabase = await JSONFilePreset<Config>('config.json', {})

  const setMainSession = async (session: Session) => {
    configDatabase.data.mainSession = session
    await configDatabase.write()
  }

  const setBotToken = async (token: string) => {
    configDatabase.data.botToken = token
    await configDatabase.write()
  }

  return {
    configDatabase,
    setMainSession,
    setBotToken,
  }
})
