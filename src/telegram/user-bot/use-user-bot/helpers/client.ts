import type { Api, TelegramClient } from 'telegram'
import prompts from 'prompts'
import { systemLogger } from 'src/logger.js'
import { TelegramHelpers, useUserBot } from 'src/telegram/index.js'

export async function startClient(
  client: TelegramClient,
  message?: Api.Message,
): Promise<void> {
  const errorsMessages: string[] = []
  const retriesCount = 3

  return client.start({
    async phoneNumber() {
      if (message) {
        const userBot = await useUserBot()
        return await TelegramHelpers.AsyncRetryFactory(
          async () => {
            await message.reply({ message: `Enter your phone number` })
            const outgoingMessageEvent = await userBot.waitForOutgoingMessage()

            return outgoingMessageEvent.message.text
          },
          message,
        )
      }

      return (
        await prompts({
          message: 'Enter your phone number',
          name: 'phoneNumber',
          type: 'text',
        })
      ).phoneNumber
    },

    async password() {
      if (message) {
        const userBot = await useUserBot()
        return await TelegramHelpers.AsyncRetryFactory(
          async () => {
            await message.reply({ message: `Enter your password` })
            const outgoingMessageEvent = await userBot.waitForOutgoingMessage()

            return outgoingMessageEvent.message.text
          },
          message,
        )
      }

      return (
        await prompts({
          message: 'Enter your password',
          name: 'password',
          type: 'password',
        })
      ).password
    },

    async phoneCode() {
      if (message) {
        const userBot = await useUserBot()
        return await TelegramHelpers.AsyncRetryFactory(
          async () => {
            await message.reply({ message: `Enter the code you recived` })
            const outgoingMessageEvent = await userBot.waitForOutgoingMessage()

            return outgoingMessageEvent.message.text
          },
          message,
        )
      }

      return (
        await prompts({
          message: 'Enter the code you recived',
          name: 'phoneCode',
          type: 'text',
        })
      ).phoneCode
    },

    onError(error) {
      errorsMessages.push(error.message)
      const currentRetriesCount = errorsMessages.filter(message => error.message === message).length

      systemLogger.error(error.message)
      message?.reply({
        message:
        `Starting session error. Attempt ${currentRetriesCount} of ${retriesCount}`
        + `\nError: ${error.message}`,
      })

      if (currentRetriesCount === retriesCount) {
        throw error
      }
    },
  })
}
