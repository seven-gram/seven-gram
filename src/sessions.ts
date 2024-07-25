import { JSONFilePreset } from 'lowdb/node'
import { uniqBy } from 'lodash-es'
import hash from 'object-hash'
import type { Api } from 'telegram'
import { createGlobalState } from './shared.js'

export interface Session {
  name: string
  id: Api.User['id']
  apiId: number
  apiHash: string
  sessionString: string
}

interface Sessions {
  sessions: Session[]
}

export const useSessions = createGlobalState(async () => {
  const sessionsDatabase = await JSONFilePreset<Sessions>('sessions.json', {
    sessions: [],
  })
  sessionsDatabase.update(
    sessionsDatabase =>
      (sessionsDatabase.sessions = uniqBy(
        sessionsDatabase.sessions,
        session => hash(session),
      )),
  )

  return {
    sessionsDatabase,
  }
})
