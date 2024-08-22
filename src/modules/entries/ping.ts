import { AppMeta } from 'src/meta.js'
import { defineModule } from '../helpers/define.js'

export const pingModule = defineModule({
  type: 'command',
  name: 'Ping',
  description: `Ping`,
  command: {
    pattern: 'ping',
    description: `Replies ping message`,
    async handler({ event }) {
      await event.message.reply({ message: `Hello from ${AppMeta.name}!` })
    },
  },
})
