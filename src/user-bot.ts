import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { systemLogger } from './logger.js'
import { useConfig } from './config.js'
import { createGlobalState } from './shared.js'

async function createConnection(client: TelegramClient) {
  const { setMainSession } = await useConfig()
  await client.start({
    phoneNumber: async () =>
      (
        await systemLogger.prompt('Enter your phone number', {
          name: 'phoneNumber',
          type: 'text',
        })
      ).phoneNumber,
    password: async () =>
      (
        await systemLogger.prompt('Enter your password', {
          name: 'password',
          type: 'password',
        })
      ).password,
    phoneCode: async () =>
      (
        await systemLogger.prompt('Enter the code you recived', {
          name: 'phoneCode',
          type: 'text',
        })
      ).phoneCode,
    onError: error => systemLogger.error(error.message),
  })
  const me = await client.getMe()
  await setMainSession({
    id: me.id,
    apiId: client.apiId,
    apiHash: client.apiHash,
    name: me.firstName || me.lastName || me.username || me.id.toString(),
    sessionString: client.session.save() as unknown as string,
  })
}

export const useUserBot = createGlobalState(async () => {
  const { configDatabase } = await useConfig()

  const promptApiData = async () => {
    const { api_id } = await systemLogger.prompt('Enter api_id', {
      name: 'api_id',
      type: 'number',
    })
    const { api_hash } = await systemLogger.prompt('Enter api_hash', {
      name: 'api_hash',
      type: 'text',
      min: 10,
    })

    return {
      apiHash: String(api_hash),
      apiId: Number(api_id),
    }
  }

  const promptNewClient = async () => {
    const { apiId, apiHash } = await promptApiData()
    const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
      connectionRetries: 2,
    })

    return client
  }

  const userBot = await (async (): Promise<TelegramClient> => {
    if (!configDatabase.data.mainSession) {
      return promptNewClient()
    }
    else {
      return new TelegramClient(
        new StringSession(configDatabase.data.mainSession.sessionString),
        configDatabase.data.mainSession.apiId,
        configDatabase.data.mainSession.apiHash,
        {
          connectionRetries: 2,
        },
      )
    }
  })()

  if (!userBot.connected) {
    await createConnection(userBot)
  }

  return {
    userBot,
    promptNewClient,
  }
})
