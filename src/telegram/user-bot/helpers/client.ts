import prompts from 'prompts'
import { systemLogger } from 'src/logger.js'
import type { TelegramClient } from 'telegram'

export async function startClient(client: TelegramClient): Promise<void> {
  return client.start({
    phoneNumber: async () =>
      (
        await prompts({
          message: 'Enter your phone number',
          name: 'phoneNumber',
          type: 'text',
        })
      ).phoneNumber,

    password: async () =>
      (
        await prompts({
          message: 'Enter your password',
          name: 'password',
          type: 'password',
        })
      ).password,

    phoneCode: async () =>
      (
        await prompts({
          message: 'Enter the code you recived',
          name: 'phoneCode',
          type: 'text',
        })
      ).phoneCode,

    onError: (error) => { systemLogger.error(error.message) },
  })
}
