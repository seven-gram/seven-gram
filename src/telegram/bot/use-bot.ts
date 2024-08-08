import { Telegraf } from 'telegraf'
import type { SendMessageParams } from 'telegram/client/messages.js'
import type { UserFromGetMe } from 'telegraf/types'
import { faker } from '@faker-js/faker'
import { AppMeta } from 'src/meta.js'
import { memoize } from 'lodash-es'
import { sleep } from '../../shared.js'
import { useConfigDatabase } from '../../config.js'
import { systemLogger } from '../../logger.js'
import { TelegramMeta, useUserBot } from '../index.js'

async function createBot() {
  const userBot = await useUserBot()
  const sendMessageToBotFather = async (params: SendMessageParams) => await userBot.client.sendMessage(TelegramMeta.botFatherId, params)
  await sendMessageToBotFather({ message: '/newbot' })

  await userBot.waitForIncommingMessage({ fromUsers: [TelegramMeta.botFatherId] })
  const name = `${AppMeta.name} | BOT`
  await sleep(2000)
  await sendMessageToBotFather({ message: name })

  await userBot.waitForIncommingMessage({ fromUsers: [TelegramMeta.botFatherId] })
  const username = `seven_gram_${faker.string.nanoid(5)}_bot`
  await sleep(2000)
  await sendMessageToBotFather({ message: username })
  const messageEvent = await userBot.waitForIncommingMessage({ fromUsers: [TelegramMeta.botFatherId] })
  const codeEntity = messageEvent.message.entities?.find(entity => entity.className === 'MessageEntityCode')
  if (!codeEntity) {
    throw new Error('No MessageEntityCode in BotFather answer')
  }
  if (!codeEntity.offset || !codeEntity.length) {
    throw new Error('No offset or length in  MessageEntityCode')
  }
  const tokenStartPosition = codeEntity.offset + 1
  const tokenEndPosition = codeEntity.offset + codeEntity.length + 1
  const token = messageEvent.message.text.slice(tokenStartPosition, tokenEndPosition)

  const client = new Telegraf(token)

  return {
    client,
    name,
    username,
  }
}

async function initBot() {
  const userBot = await useUserBot()

  let client: Telegraf

  const configDatabase = useConfigDatabase()
  if (!configDatabase.database.data.bot) {
    systemLogger.info(`Starting creation of ${name} bot`)
    const createBotResult = await createBot()
    configDatabase.setBot({
      token: createBotResult.client.telegram.token,
      username: createBotResult.username,
    })
    systemLogger.success(`${createBotResult.name} bot created`)

    try {
      systemLogger.info(`Adding bot ${createBotResult.name} to special folder`)
      await userBot.client.sendMessage(createBotResult.username, { message: TelegramMeta.startBotCommand })
      await userBot.addEntitiesToSpecialFolder([createBotResult.username])
    }
    catch (error) {
      if (error instanceof Error)
        systemLogger.error(`Error occurs while addind bot ${name} to special folder. \`\`\`${error.message}\`\`\``)
    }

    client = createBotResult.client
  }
  else {
    client = new Telegraf(configDatabase.database.data.bot.token)
  }

  client.start(ctx => ctx.reply('Welcome'))
  client.help(ctx => ctx.reply('Send me a sticker'))
  client.launch()

  let me = await fetchMe(false)

  async function fetchMe(needToCache = true): Promise<UserFromGetMe> {
    try {
      const userFromGetMe = await client.telegram.getMe()
      if (needToCache) {
        me = userFromGetMe
      }
      return userFromGetMe
    }
    catch (error) {
      if (error instanceof Error && error.message === '401: Unauthorized') {
        configDatabase.setBot(null)
        const bot = await initBot()
        client = bot.client
        if (needToCache) {
          me = bot.me
        }
        return bot.me
      }
      throw error
    }
  }

  return {
    client,
    me,
    fetchMe,
  }
}

export const useBot = memoize(async () => {
  const userBot = await useUserBot()
  const { client, me, fetchMe } = await initBot()

  const sendMessageToMe = client.telegram.sendMessage.bind(client.telegram, userBot.me.id.toString())

  return {
    client,
    me,
    fetchMe,
    sendMessageToMe,
  }
})
