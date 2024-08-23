import { useUserBot } from 'src/telegram/index.js'
import { NewMessage } from 'telegram/events/NewMessage.js'
import { systemLogger } from 'src/logger.js'
import { useConfig } from 'src/config.js'
import { escapeRegExp } from 'lodash-es'
import { pingModule } from '../entries/ping.js'
import { ModuleType } from '../types.js'
import { reloadModule } from '../entries/reload/index.js'
import { updateModule } from '../entries/update.js'
import { defineModules } from './define.js'

export async function initModules() {
  const config = useConfig()
  const userBot = await useUserBot()
  const modules = defineModules([
    pingModule,
    updateModule,
    reloadModule,
  ])

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

  for (const moduleType of Object.values(ModuleType)) {
    if (moduleType === ModuleType.COMMAND) {
      userBot.client.addEventHandler(
        async (event) => {
          const regexExecArray = new RegExp(`^${escapeRegExp(config.getComputedCommandPrefix())}(\\w*)\\s?(.*)`).exec(event.message.text)
          if (!regexExecArray?.length) {
            return
          }

          const [_, commandPattern, plainMessage] = regexExecArray

          if (!commandPattern) {
            return
          }

          const commandModule = modules.find(
            module => module.type === 'command' && module.command.pattern === commandPattern,
          )

          if (!commandModule) {
            return
          }

          try {
            await commandModule.command.handler({
              event,
              plainMessage: plainMessage || undefined,
            })
          }
          catch (error) {
            console.error(error)
            if (error instanceof Error) {
              systemLogger.error(`An unhandled error occurs while execution *${commandModule.command.pattern}* command.\n\`\`\`Message: ${error.message}\`\`\``)
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
