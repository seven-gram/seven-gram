import type { Api } from 'telegram'
import prompts from 'prompts'
import { TelegramHelpers } from 'src/telegram/index.js'
import { useUserBot } from '../use-user-bot/index.js'

interface ApiData {
  apiId: number
  apiHash: string
}
export async function promptApiData(message?: Api.Message): Promise<ApiData> {
  if (message) {
    const userBot = await useUserBot()

    const apiId = await TelegramHelpers.AsyncRetryFactory(
      async () => {
        await message.reply({ message: `Enter api_id` })
        const outgoingMessageEvent = await userBot.waitForOutgoingMessage()

        const apiId = Number.parseInt(outgoingMessageEvent.message.text)

        if (!apiId || Number.isNaN(apiId)) {
          throw new Error('Error while parsing api_id')
        }

        return apiId
      },
      message,
    )

    const apiHash = await TelegramHelpers.AsyncRetryFactory(
      async () => {
        await message.reply({ message: `Enter api_hash` })
        const outgoingMessageEvent = await userBot.waitForOutgoingMessage()

        return outgoingMessageEvent.message.text
      },
      message,
    )

    return {
      apiId,
      apiHash,
    }
  }

  const { apiId } = await prompts({
    message: 'Enter api_id',
    name: 'apiId',
    type: 'number',
  })
  const { apiHash } = await prompts({
    message: 'Enter api_hash',
    name: 'apiHash',
    type: 'text',
    min: 10,
  })

  return {
    apiId: Number(apiId),
    apiHash: String(apiHash),
  }
}
