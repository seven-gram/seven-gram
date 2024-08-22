import { AppMeta } from 'src/meta.js'
import { useBot, useUserBot } from 'src/telegram/index.js'
import { $ } from 'zx'
import { defineModule } from '../helpers/define.js'

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

export const reloadModule = defineModule({
  type: 'command',
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
  command: {
    pattern: 'reload',
    description: `Reloads current ${AppMeta.name} process`,
    async handler({ event }) {
      const bot = await useBot()
      const { config } = reloadModule

      const reloadingMessageText = 'Reloading...'

      const message = await event.message.edit({ text: reloadingMessageText })

      const chatId = message?.chatId?.toJSON()
      const messageId = message?.id

      if (messageId && chatId) {
        config.setUserMessageToEdit({
          messageId,
          chatId,
        })
      }
      else {
        const message = await bot.sendMessageToMe(reloadingMessageText)
        config.setBotMessageToEdit({
          chatId: message.chat.id.toString(),
          messageId: message.message_id,
        })
      }
      reloadModule.config.toggleNeedToReload(true)
      await $`pm2 reload main`
    },
  },
  async onInit() {
    if (reloadModule.config.database.data.needToReload) {
      reloadModule.config.toggleNeedToReload(false)

      const userBot = await useUserBot()
      const bot = await useBot()
      const { config } = reloadModule

      const reloadedMessageText = 'Reloaded!'
      const { userMessageToEdit, botMessageToEdit } = config.database.data
      if (userMessageToEdit) {
        let chatInputEntity
        try {
          await userBot.client.getInputEntity(userMessageToEdit.chatId)
        }
        catch {
          await userBot.client.getDialogs()
          chatInputEntity = await userBot.client.getInputEntity(userMessageToEdit.chatId)
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
