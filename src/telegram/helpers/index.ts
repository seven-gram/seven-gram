import type BigInt from 'big-integer'
import type { Api } from 'telegram'
import { createHash } from 'node:crypto'
import { faker } from '@faker-js/faker'

import AsyncRetry from 'async-retry'
import prompts from 'prompts'
import { sleep } from 'src/shared.js'
import { TelegramHelpers, TelegramStatic, useUserBot } from '../index.js'

export * from '../user-bot/use-user-bot/helpers/web-app-data.js'

export function generateRandomVisitorId(): string {
  const randomString = Array.from({ length: 32 }, () => Math.random().toString(36).charAt(2)).join('')

  const md5 = createHash('md5')
  const visitorId = md5.update(randomString).digest('hex')

  return visitorId
}

export function getFingerprint() {
  const fingerprint = TelegramStatic.DEFAULT_FINGERPRINT
  fingerprint.visitorId = generateRandomVisitorId()

  return fingerprint
}

export async function doFloodProtect() {
  await sleep(faker.helpers.rangeToNumber({ min: 1000, max: 3000 }))
}

export function mapToPeerId(id: BigInt.BigInteger | number | string, type: 'user' | 'chat' | 'channel') {
  if (type === 'user') {
    return id.toString()
  }

  if (type === 'channel') {
    return `-100${id}`
  }

  return `-${id}`
}

export function AsyncRetryFactory<GReturn>(
  callback: AsyncRetry.RetryFunction<GReturn>,
  message: Api.Message,
  attemptsCount = 3,
): Promise<GReturn> {
  return AsyncRetry(
    callback,
    {
      retries: attemptsCount,
      factor: 0,
      randomize: false,
      async onRetry(error, attempt) {
        if (error instanceof Error) {
          await message.reply({
            message: `Attempt ${attempt} of ${attemptsCount} failed`
              + `\nError: ${error.message}`,
          })
        }
      },
    },
  )
}

export async function promptBoolean(
  promptMessage: string,
  message?: Api.Message,
): Promise<boolean> {
  promptMessage += ' (y/n)'

  if (message) {
    const userBot = await useUserBot()

    const isAgree = await TelegramHelpers.AsyncRetryFactory(
      async () => {
        await message.reply({ message: promptMessage })
        const outgoingMessageEvent = await userBot.waitForOutgoingMessage()
        const text = outgoingMessageEvent.message.text.toLowerCase()

        if (!['y', 'n'].includes(text)) {
          throw new Error('Message must be *y* or *n*')
        }

        return text === 'y'
      },
      message,
    )

    return isAgree
  }

  const { isAgree } = await prompts({
    message: promptMessage,
    name: 'isAgree',
    type: 'confirm',
  })

  return isAgree
}
