import type { Proxy } from './config.js'
import { useConfig } from 'src/config.js'
import { defineModuleCommand } from 'src/modules/helpers/define.js'
import { promptBoolean } from 'src/telegram/helpers/index.js'
import { TelegramHelpers, UserBotHelpers, useUserBot } from 'src/telegram/index.js'
import { startClient } from 'src/telegram/user-bot/use-user-bot/helpers/client.js'
import { reloadApplication } from '../reload/helpers/reload.js'
import { miniAppsModule } from './index.js'

export const addSessionCommand = defineModuleCommand({
  pattern: 'addsession',
  description: 'Create new sub-account session',
  async handler({ messageEvent: { message } }) {
    const { config } = miniAppsModule
    const userBot = await useUserBot()

    const needToAttachProxy = await TelegramHelpers.promptBoolean(
      `Would you like to add attach proxy?`,
      message,
    )
    let proxy: Proxy | undefined
    if (needToAttachProxy) {
      proxy = await TelegramHelpers.AsyncRetryFactory(
        async (): Promise<Proxy> => {
          await message.reply({ message: 'Enter proxy in **ip:port:username:pass** format (198.37.22.52:5181:qodsquxf:thtmh0xvqasw)' })
          const proxyStringMessageEvent = await userBot.waitForOutgoingMessage()
          const proxyArray = proxyStringMessageEvent.message.text.split(':')

          const [ipString, portString, usernameString, passwordString] = proxyArray.map(value => value || undefined)

          if (!ipString || !portString) {
            throw new Error(`**ip** and **port** properties are required`)
          }

          const portNumber = Number.parseInt(portString)
          if (!portNumber || Number.isNaN(portNumber)) {
            throw new Error(`**port** property must be a number`)
          }

          return {
            ip: ipString,
            port: portNumber,
            username: usernameString,
            password: passwordString,
          }
        },
        message,
      )
    }

    const name = await TelegramHelpers.AsyncRetryFactory(
      async () => {
        await message.reply({ message: 'Enter your account name' })
        const nameMessageEvent = await userBot.waitForOutgoingMessage()
        const minLength = 0
        const maxLength = 10
        if (nameMessageEvent.message.text.length <= minLength || nameMessageEvent.message.text.length >= maxLength) {
          throw new Error(`Account name must be greater than ${minLength} and less than ${maxLength}`)
        }
        return nameMessageEvent.message.text
      },
      message,
    )

    const client = await UserBotHelpers.promptNewClient(proxy, message)
    await startClient(client, message)
    config.addSession(name, {
      apiId: client.apiId,
      apiHash: client.apiHash,
      sessionString: client.session.save() as unknown as string,
      proxy,
    })
    await message.reply({
      message: `Session ${name} added succesfully`,
    })

    const { isDaemonMode } = useConfig()

    if (isDaemonMode) {
      const needToReload = await promptBoolean(
        `Need to reload for the changes to take effect. Would you like to reload now?`,
        message,
      )
      if (needToReload) {
        await reloadApplication(message)
      }
    }
  },
})

export const toggleMainSessionCommand = defineModuleCommand({
  pattern: 'togglemainsession',
  description: 'Toggle usage of main session to farm miniapps',
  async handler({ messageEvent }) {
    const { database } = miniAppsModule.config
    database.data.needToUseMainSession = !database.data.needToUseMainSession
    database.write()

    const replyMessage = await messageEvent.message.reply({
      message: `Now main session usage status is **${database.data.needToUseMainSession ? 'ON' : 'OFF'}**`,
    })

    const { isDaemonMode } = useConfig()

    if (isDaemonMode) {
      const needToReload = await promptBoolean(
        `Need to reload for the changes to take effect. Would you like to reload now?`,
        replyMessage,
      )
      if (needToReload) {
        await reloadApplication(replyMessage)
      }
    }
    else {
      await replyMessage?.reply({ message: `Need to reload for the changes to take effect.` })
    }
  },
})
