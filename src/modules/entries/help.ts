import { useConfig } from 'src/config.js'
import { defineModule } from '../helpers/define.js'
import { modules } from './index.js'

const config = useConfig()

export const helpModule = defineModule({
  type: 'command',
  name: 'Help',
  description: `Display all commands`,
  command: {
    pattern: 'help',
    description: `Display all commands`,
    async handler({ event }) {
      const commandModules = modules.filter(module => module.type === 'command')

      let messageText = ''
      for (const commandModule of commandModules) {
        if (messageText.length)
          messageText += '\n'
        const commandStringWithPrefix = `${config.getComputedCommandPrefix()}${commandModule.command.pattern}`
        messageText += `| \`${commandStringWithPrefix}\` |:    ${commandModule.command.description}`
      }
      await event.message.edit({ text: messageText })
    },
  },
})
