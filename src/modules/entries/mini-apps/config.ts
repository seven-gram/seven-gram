import { defineModuleConfig } from 'src/modules/helpers/define.js'

export interface Proxy {
  ip: string
  port: number
  username?: string
  password?: string
}

export interface Session {
  proxy?: Proxy
  apiId: number
  apiHash: string
  sessionString: string
}

interface ConfigDatabase {
  needToUseMainSession: boolean
  sessions: Record<string, Session>
}

const defaultValue: ConfigDatabase = {
  needToUseMainSession: false,
  sessions: {},
}

export const miniAppsConfig = defineModuleConfig({
  name: 'mini-apps',
  defaultValue,
  extendCallback(database) {
    const addSession = (name: string, value: Session) => {
      database.data.sessions[name] = value
      database.write()
    }

    return {
      addSession,
    }
  },
})
