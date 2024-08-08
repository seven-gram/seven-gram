import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import prompts from 'prompts'
import { memoize } from 'lodash-es'
import { useConfigDatabase } from '../../config.js'
import type { OmitFirstArg } from '../../shared.js'
import { TelegramHelpers, TelegramStatic, UserBotHelpers } from '../index.js'

async function initUserBot() {
  const promptApiData = async () => {
    const { api_id } = await prompts({
      message: 'Enter api_id',
      name: 'api_id',
      type: 'number',
    })
    const { api_hash } = await prompts({
      message: 'Enter api_hash',
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

  const configDatabase = useConfigDatabase()

  let client: TelegramClient

  if (!configDatabase.database.data.userBot) {
    client = await promptNewClient()
    await UserBotHelpers.startClient(client)
    configDatabase.setUserBot({
      apiId: client.apiId,
      apiHash: client.apiHash,
      sessionString: client.session.save() as unknown as string,
      channels: {},
    })
  }
  else {
    client = new TelegramClient(
      new StringSession(configDatabase.database.data.userBot.sessionString),
      configDatabase.database.data.userBot.apiId,
      configDatabase.database.data.userBot.apiHash,
      {
        connectionRetries: 2,
      },
    )
    await client.connect()
  }

  let me = await client.getMe()
  async function fetchMe() {
    return me = await client.getMe()
  }
  await TelegramHelpers.doFloodProtect()
  const loggerChannel = await UserBotHelpers.getOrCreateChannel(client, {
    ...TelegramStatic.CHANNELS.logger,
    megagroup: true,
  })
  await TelegramHelpers.doFloodProtect()
  UserBotHelpers.inviteBotToChannel(client, loggerChannel)
  await TelegramHelpers.doFloodProtect()
  UserBotHelpers.addEntitiesToSpecialFolder(client, [loggerChannel])

  return {
    client,
    me,
    fetchMe,
    loggerChannel,
  }
}

export const useUserBot = memoize(async () => {
  const { client, me, fetchMe, loggerChannel } = await initUserBot()

  const helpers: {
    [Key in keyof typeof UserBotHelpers]: OmitFirstArg<typeof UserBotHelpers[Key]>
  } = {
    waitForIncommingMessage: UserBotHelpers.waitForIncommingMessage.bind(globalThis, client),
    startClient: UserBotHelpers.startClient.bind(globalThis, client),
    getWebAppData: UserBotHelpers.getWebAppData.bind(globalThis, client),
    addDialogsToDialogFilter: UserBotHelpers.addDialogsToDialogFilter.bind(globalThis, client),
    createDialogFilter: UserBotHelpers.createDialogFilter.bind(globalThis, client),
    getDialogFilters: UserBotHelpers.getDialogFilters.bind(globalThis, client),
    getDialogs: UserBotHelpers.getDialogs.bind(globalThis, client),
    getFirstDialogFilter: UserBotHelpers.getFirstDialogFilter.bind(globalThis, client),
    getOrCreateChannel: UserBotHelpers.getOrCreateChannel.bind(globalThis, client),
    inviteBotToChannel: UserBotHelpers.inviteBotToChannel.bind(globalThis, client),
    addEntitiesToSpecialFolder: UserBotHelpers.addEntitiesToSpecialFolder.bind(globalThis, client),
  }

  return {
    client,
    me,
    fetchMe,
    loggerChannel,
    ...helpers,
  }
})
