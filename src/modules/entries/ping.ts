import { AppMeta } from 'src/meta.js'
import { useConfig } from 'src/config.js'
import { defineModule } from '../helpers/define.js'

const config = useConfig()

export const pingModule = defineModule({
  type: 'command',
  name: 'Ping',
  description: `Ping`,
  command: {
    pattern: 'ping',
    description: `Replies ping message`,
    async handler({ event }) {
      const version = config.packageJson.version ? `v${config.packageJson.version}` : null
      await event.message.reply({ message: `Hello from ${AppMeta.name} ${version}` })
    },
  },
})
