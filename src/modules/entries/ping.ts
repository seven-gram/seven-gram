import { useConfig } from 'src/config.js'
import { AppMeta } from 'src/meta.js'
import { defineModule, defineModuleCommand } from '../helpers/define.js'

const config = useConfig()

export const pingModule = defineModule({
  name: 'Ping',
  description: `Ping`,
  event: {
    type: 'command',
    commandSettings: {
      type: 'base',
      command: defineModuleCommand({
        pattern: 'ping',
        description: `Replies ping message`,
        async handler({ messageEvent }) {
          const version = config.packageJson.version ? `v${config.packageJson.version}` : null
          await messageEvent.message.reply({ message: `Hello from ${AppMeta.name} ${version}` })
        },
      }),
    },
  },
})
