import { systemLogger } from 'src/logger.js'
import { useUserBot } from 'src/telegram/index.js'
import { NewMessage } from 'telegram/events/NewMessage.js'
import { modules } from '../entries/index.js'
import { EventType } from '../types.js'

export async function initModules() {
  const userBot = await useUserBot()

  for (const module of modules.entries) {
    try {
      await module.onInit?.()
    }
    catch (error) {
      console.error(error)
      if (error instanceof Error) {
        systemLogger.error(`An unhandled error occurs while calling "onInit" hook of *${module.name}* module.\n\`\`\`Message: ${error.message}\`\`\``)
      }
    }
  }

  for (const eventType of Object.values(EventType)) {
    if (eventType === EventType.COMMAND) {
      userBot.client.addEventHandler(
        event => modules.parseCommand(event),
        new NewMessage({
          outgoing: true,
        }),
      )

      continue
    }
  }

  await systemLogger.info('Modules initialization finished')
}
