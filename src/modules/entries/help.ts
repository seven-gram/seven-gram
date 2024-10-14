import { useConfig } from 'src/config.js'
import { defineModule, defineModuleCommand } from '../helpers/define.js'
import { modules } from './index.js'

const config = useConfig()

export const helpModule = defineModule({
  name: 'Help',
  description: `Display all commands`,
  event: {
    type: 'command',
    commandSettings: {
      type: 'base',
      command: defineModuleCommand({
        pattern: 'help',
        description: `Display all commands`,
        plainText: {
          helpText: 'commandName',
          required: false,
        },
        async handler({ messageEvent, plainText }) {
          let messageText = ''
          if (plainText) {
            const module = modules.entries.find(module =>
              module.event?.commandSettings.type === 'parrent'
                ? module.event?.commandSettings.pattern === plainText
                : module.event?.commandSettings.command.pattern === plainText,
            )

            if (!module?.event) {
              return
            }

            const { commandSettings } = module.event

            if (commandSettings.type === 'base') {
              messageText
              = `Command: ${commandSettings.command.pattern}`
              + `\nDescription: ${commandSettings.command.description}`
            }
            else if (commandSettings.type === 'parrent') {
              if (!commandSettings.commands)
                return

              messageText
            = `Command: ${commandSettings.pattern} [command]`
            + `\n\nSubcommands:`

              commandSettings.commands.forEach((command) => {
                messageText
              += `\n| `
              + `\`${command.pattern}\` `
              + `|:    `
              + `${command.description}`
              })
            }
          }
          else {
            for (const module of modules.entries) {
              if (module.event?.type !== 'command')
                continue

              const { commandSettings } = module.event

              if (messageText.length)
                messageText += '\n'

              const rootCommandPattern = commandSettings.type === 'base' ? commandSettings.command.pattern : commandSettings.pattern
              const rootCommandDescription = commandSettings.type === 'base' ? commandSettings.command.description : commandSettings.description

              const commandStringWithPrefix = `${config.getComputedCommandPrefix()}${rootCommandPattern}`
              messageText
              += `| `
              + `\`${commandStringWithPrefix}\` `
              + `${commandSettings.type === 'parrent' ? '[subcommand] ' : ''}`
              + `${(commandSettings.type === 'base' && commandSettings.command.plainText?.helpText) ? `(...${commandSettings.command.plainText.helpText})` : ''}`
              + `|:    `
              + `${rootCommandDescription}`
            }
            messageText += `\n\n Hint: type subcommand name after help command to see detail info`
          }
          await messageEvent.message.reply({ message: messageText })
        },
      }),
    },
  },
})
