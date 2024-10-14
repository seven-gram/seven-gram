import type { Proxy } from 'src/modules/entries/mini-apps/config.js'
import type { Api } from 'telegram'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/StringSession.js'
import { promptApiData } from './prompts.js'

export function createClient(options: {
  apiId: number
  apiHash: string
  sessionString?: string
  proxy?: Proxy
}) {
  const { apiHash, apiId, proxy, sessionString = '' } = options
  return new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    {
      connectionRetries: 2,
      proxy: proxy
        ? {
            socksType: 5,
            ...proxy,
          }
        : undefined,
    },
  )
}

export async function promptNewClient(
  proxy?: Proxy,
  message?: Api.Message,
) {
  const { apiId, apiHash } = await promptApiData(message)
  const client = createClient({
    apiId,
    apiHash,
  })

  return client
}
