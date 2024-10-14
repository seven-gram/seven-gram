import type { OmitFirstArg } from 'src/shared.js'
import { memoize } from 'lodash-es'
import { useConfigDatabase } from 'src/config-database.js'
import { TelegramHelpers, TelegramStatic } from 'src/telegram/index.js'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { UserBotHelpers } from '../index.js'
import * as Helpers from './helpers/index.js'

async function initUserBot() {
  const configDatabase = useConfigDatabase()

  let client: TelegramClient

  if (!configDatabase.database.data.userBot) {
    client = await UserBotHelpers.promptNewClient()
    await Helpers.startClient(client)
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
  const loggerChannel = await Helpers.getOrCreateChannel(client, {
    ...TelegramStatic.CHANNELS.logger,
    megagroup: true,
  })
  await TelegramHelpers.doFloodProtect()
  Helpers.inviteBotToChannel(client, loggerChannel)
  await TelegramHelpers.doFloodProtect()
  Helpers.addEntitiesToSpecialFolder(client, [loggerChannel])

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
    [Key in keyof typeof Helpers]: OmitFirstArg<typeof Helpers[Key]>
  } = {
    waitForIncommingMessage: Helpers.waitForIncommingMessage.bind(globalThis, client),
    waitForOutgoingMessage: Helpers.waitForOutgoingMessage.bind(globalThis, client),
    startClient: Helpers.startClient.bind(globalThis, client),
    getWebAppData: Helpers.getWebAppData.bind(globalThis, client),
    addDialogsToDialogFilter: Helpers.addDialogsToDialogFilter.bind(globalThis, client),
    createDialogFilter: Helpers.createDialogFilter.bind(globalThis, client),
    getDialogFilters: Helpers.getDialogFilters.bind(globalThis, client),
    getDialogs: Helpers.getDialogs.bind(globalThis, client),
    getFirstDialogFilter: Helpers.getFirstDialogFilter.bind(globalThis, client),
    getOrCreateChannel: Helpers.getOrCreateChannel.bind(globalThis, client),
    inviteBotToChannel: Helpers.inviteBotToChannel.bind(globalThis, client),
    addEntitiesToSpecialFolder: Helpers.addEntitiesToSpecialFolder.bind(globalThis, client),
  }

  return {
    client,
    me,
    fetchMe,
    loggerChannel,
    ...helpers,
  }
})
