import { AppMeta } from 'src/meta.js'
import { useBot, useUserBot } from 'src/telegram/index.js'
import type { Api } from 'telegram'
import { defineModule } from '../../helpers/define.js'
import { reloadApplication } from './helpers/reload.js'

const NAME = 'Reloader'

interface MessageToEdit {
  chatId: string
  messageId: number
}
interface ConfigDatabase {
  needToReload: boolean
  userMessageToEdit?: MessageToEdit
  botMessageToEdit?: MessageToEdit
}

const defaultValue: ConfigDatabase = {
  needToReload: false,
}

const userBot = await useUserBot()
const bot = await useBot()

export const reloadModule = defineModule({
  name: NAME,
  description: `Reloads current ${AppMeta.name} process`,
  configOptions: {
    name: NAME.toLowerCase(),
    defaultValue,
    extendCallback(database) {
      const toggleNeedToReload = (value = !database.data.needToReload) => {
        database.data.needToReload = value
        database.write()
      }

      const setUserMessageToEdit = (messageToEdit: MessageToEdit | undefined) => {
        database.data.userMessageToEdit = messageToEdit
        database.write()
      }

      const setBotMessageToEdit = (messageToEdit: MessageToEdit | undefined) => {
        database.data.botMessageToEdit = messageToEdit
        database.write()
      }

      return {
        toggleNeedToReload,
        setUserMessageToEdit,
        setBotMessageToEdit,
      }
    },
  },
  event: {
    type: 'command',
    command: {
      pattern: 'reload',
      description: `Reloads current ${AppMeta.name} process`,
      async handler({ event }) {
        await reloadApplication(event.message)
      },
    },
  },
  async onInit() {
    if (reloadModule.config.database.data.needToReload) {
      reloadModule.config.toggleNeedToReload(false)

      const { config } = reloadModule

      const reloadedMessageText = 'Reloaded!'
      const { userMessageToEdit, botMessageToEdit } = config.database.data
      if (userMessageToEdit) {
        let chatInputEntity: Api.TypeInputPeer | undefined
        try {
          chatInputEntity = await userBot.client.getInputEntity(userMessageToEdit.chatId)
        }
        catch {
          await userBot.client.getDialogs()
          await userBot.client.getInputEntity(userMessageToEdit.chatId)
            .then(inputEntity => (chatInputEntity = inputEntity))
            .catch()
        }

        if (chatInputEntity) {
          await userBot.client.editMessage(chatInputEntity, {
            message: userMessageToEdit.messageId,
            text: reloadedMessageText,
          })
        }
        config.setUserMessageToEdit(undefined)
      }
      else if (botMessageToEdit) {
        await bot.client.telegram.editMessageText(
          botMessageToEdit.chatId,
          botMessageToEdit.messageId,
          undefined,
          reloadedMessageText,
        )
        config.setBotMessageToEdit(undefined)
      }
    }
  },
})
