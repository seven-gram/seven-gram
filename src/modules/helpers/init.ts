import type { CommandEvent } from '../types.js'
import { escapeRegExp } from 'lodash-es'
import { useConfig } from 'src/config.js'
import { systemLogger } from 'src/logger.js'
import { useUserBot } from 'src/telegram/index.js'
import { NewMessage } from 'telegram/events/NewMessage.js'
import { modules } from '../entries/index.js'
import { EventType } from '../types.js'

export async function initModules() {
  const config = useConfig()
  const userBot = await useUserBot()

  for (const module of modules) {
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
        async (event) => {
          const commandEvents = modules
            .map(module => module.event)
            .filter((event): event is CommandEvent => event?.type === 'command')

          const regexExecArray = new RegExp(`^${escapeRegExp(config.getComputedCommandPrefix())}(\\w*)\\s?(.*)`).exec(event.message.text)
          if (!regexExecArray?.length) {
            return
          }

          const [_, commandPattern, plainMessage] = regexExecArray

          if (!commandPattern) {
            return
          }

          const commandEvent = commandEvents.find(event => event.command.pattern === commandPattern)

          if (!commandEvent) {
            return
          }

          try {
            await commandEvent.command.handler({
              event,
              plainMessage: plainMessage || undefined,
            })
          }
          catch (error) {
            console.error(error)
            if (error instanceof Error) {
              systemLogger.error(`An unhandled error occurs while execution *${commandEvent.command.pattern}* command.\n\`\`\`Message: ${error.message}\`\`\``)
            }
          }
        },
        new NewMessage({
          outgoing: true,
        }),
      )

      continue
    }
  }

  systemLogger.info('Modules initialization finished')
}
