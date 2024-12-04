import { createLogger } from 'src/logger.js'
import { defineModule } from 'src/modules/helpers/define.js'
import { toggleUserInBlacklistCommand } from './commands.js'
import { brainRotDefenderConfig } from './config.js'
import { initBrainRotDefender } from './init.js'

export const brainRotDefenderModule = defineModule({
  name: 'Brain Rot Defender',
  description: `Automatically remove all incoming links in private chats with YoutubeShorts`,
  config: brainRotDefenderConfig,
  event: {
    type: 'command',
    commandSettings: {
      type: 'parrent',
      pattern: 'brainrotdefender',
      description: 'Allow to controll Brain Rot Defender settings',
      commands: [
        toggleUserInBlacklistCommand,
      ],
    },
  },
  onInit() {
    initBrainRotDefender()
  },
})

export const brainRotLogger = createLogger(brainRotDefenderModule.name.toUpperCase())
