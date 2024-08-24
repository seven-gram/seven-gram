import { useBot } from 'src/telegram/index.js'
import type { Api } from 'telegram'
import { $ } from 'zx'
import { reloadModule } from '../index.js'

export async function reloadApplication(message?: Api.Message) {
  const bot = await useBot()
  const { config } = reloadModule

  const reloadingMessageText = 'Reloading...'

  const reloadingMessage = await message?.reply({ message: reloadingMessageText })
  const chatId = reloadingMessage?.chatId?.toJSON()
  const messageId = reloadingMessage?.id

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
  config.toggleNeedToReload(true)
  await $`npm run pm2:reload`
}
