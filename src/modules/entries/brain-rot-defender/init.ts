import { useUserBot } from 'src/telegram/index.js'
import { NewMessage } from 'telegram/events/NewMessage.js'
import { brainRotDefenderConfig } from './config.js'
import { blockMessage, checkIfMessageContainsBrainRotPattern } from './helpers.js'

export async function initBrainRotDefender() {
  const { database } = brainRotDefenderConfig

  const { client } = await useUserBot()

  client.addEventHandler(async ({ message }) => {
    if (await checkIfMessageContainsBrainRotPattern(message)) {
      blockMessage(message)
    }
  }, new NewMessage({
    incoming: true,
    chats: database.data.usersBlacklist,
  }))
}
