import { useConfig } from 'src/config.js'
import { AppMeta } from 'src/meta.js'
import { $ } from 'zx'
import { defineModule } from '../helpers/define.js'
import { reloadApplication } from './reload/helpers/reload.js'

export const updateModule = defineModule({
  name: 'Updater',
  description: `Updates ${AppMeta.name} to latest avaliable version`,
  event: {
    type: 'command',
    command: {
      pattern: 'update',
      description: `Updates ${AppMeta.name} to latest avaliable version`,
      async handler({ event }) {
        const pullingMessage = await event.message.reply({ message: 'Pulling...' })
        const pullResult = await $({ nothrow: true })`git pull`

        if (pullResult.stderr.includes('error')) {
          await pullingMessage?.edit({
            text: `Error occurs while pulling changes.\n**Message: ${pullResult.stderr}**`,
            parseMode: 'markdown',
          })
          throw new Error(pullResult.stderr)
        }

        if (pullResult.stdout.includes('Already up to date')) {
          await pullingMessage?.edit({ text: 'Already up to date' })
          return
        }

        if (/package(?:-lock)?\.json/.test(pullResult.stdout)) {
          await pullingMessage?.edit({ text: 'Installing dependencies...' })
          await $`npm ci --include=dev`
        }

        await pullingMessage?.edit({ text: 'Building...' })
        await $`npm run build`
        await pullingMessage?.edit({ text: 'Update finished! Now need to reload app.' })

        const config = useConfig()
        if (config.isDaemonMode) {
          const reloadingMessage = await event.message.reply({ message: 'Reload executed...' })
          await reloadApplication(reloadingMessage)
        }
      },
    },
  },
})
