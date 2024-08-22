import { AppMeta } from 'src/meta.js'
import { $ } from 'zx'
import { defineModule } from '../helpers/define.js'
import { reloadModule } from './reload.js'

export const updateModule = defineModule({
  type: 'command',
  name: 'Updater',
  description: `Updates ${AppMeta.name} to latest avaliable version`,
  command: {
    pattern: 'update',
    description: `Updates ${AppMeta.name} to latest avaliable version`,
    async handler({ event }) {
      const pullingMessage = await event.message.edit({ text: 'Pulling...' })
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

      if (!pullResult.stdout.includes('Updating...')) {
        await pullingMessage?.edit({ text: `Can not pull changed. Message: ${pullResult.stdout}` })
        return
      }

      if (/package(?:-lock)?\.json/.test(pullResult.stdout)) {
        await $`npm i`
      }

      await $`npm run build`
      await pullingMessage?.edit({ text: 'Updated' })
      await event.message.reply({ message: `.${reloadModule.command.pattern}` })
    },
  },
})
