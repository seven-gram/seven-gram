import { useConfig } from 'src/config.js'
import { AppMeta } from 'src/meta.js'
import { defineModule } from '../helpers/define.js'

const config = useConfig()

export const pingModule = defineModule({
  name: 'Ping',
  description: `Ping`,
  event: {
    type: 'command',
    command: {
      pattern: 'ping',
      description: `Replies ping message`,
      async handler({ event }) {
        const version = config.packageJson.version ? `v${config.packageJson.version}` : null
        await event.message.reply({ message: `Hello from ${AppMeta.name} ${version}!` })
      },
    },
  },
})
