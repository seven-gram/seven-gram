import { useConfig } from 'src/config.js'
import { defineModule } from '../helpers/define.js'
import { modules } from './index.js'

const config = useConfig()

export const helpModule = defineModule({
  name: 'Help',
  description: `Display all commands`,
  event: {
    type: 'command',
    command: {
      pattern: 'help',
      description: `Display all commands`,
      async handler({ event }) {
        let messageText = ''
        for (const module of modules) {
          if (module.event?.type !== 'command')
            return

          if (messageText.length)
            messageText += '\n'
          const commandStringWithPrefix = `${config.getComputedCommandPrefix()}${module.event.command.pattern}`
          messageText += `| \`${commandStringWithPrefix}\` |:    ${module.event.command.description}`
        }
        await event.message.reply({ message: messageText })
      },
    },
  },
})
