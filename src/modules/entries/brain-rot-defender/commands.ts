import { useConfig } from 'src/config.js'
import { defineModuleCommand } from 'src/modules/helpers/define.js'
import { promptBoolean } from 'src/telegram/helpers/index.js'
import { TelegramHelpers, useUserBot } from 'src/telegram/index.js'
import { reloadApplication } from '../reload/helpers/reload.js'
import { brainRotDefenderModule } from './index.js'

export const toggleUserInBlacklistCommand = defineModuleCommand({
  pattern: 'toggleuser',
  description: 'Toggle user in blacklist',
  async handler({ messageEvent: { message } }) {
    const { config } = brainRotDefenderModule
    const userBot = await useUserBot()

    const entity = await TelegramHelpers.AsyncRetryFactory(
      async () => {
        await message.reply({ message: 'Enter entity of the account that you want to toggle in blacklist' })
        const nameMessageEvent = await userBot.waitForOutgoingMessage()
        if (!nameMessageEvent.message.text.length) {
          throw new Error(`Account entity can not be empty`)
        }
        return nameMessageEvent.message.text
      },
      message,
    )

    config.toggleUserInBlacklist(entity)

    await message.reply({
      message:
      `Entity ${entity} succesfully toggled`
      + `\nList now: [ ${config.database.data.usersBlacklist.join(', ')} ]`,
    })

    const { isDaemonMode } = useConfig()

    if (isDaemonMode) {
      const needToReload = await promptBoolean(
        `Need to reload for the changes to take effect. Would you like to reload now?`,
        message,
      )
      if (needToReload) {
        await reloadApplication(message)
      }
    }
  },
})
