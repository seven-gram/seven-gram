import type { UserFromGetMe } from 'telegraf/types'
import type { SendMessageParams } from 'telegram/client/messages.js'
import { faker } from '@faker-js/faker'
import { memoize } from 'lodash-es'
import { useConfigDatabase } from 'src/config-database.js'
import { systemLogger } from 'src/logger.js'
import { AppMeta } from 'src/meta.js'
import { sleep } from 'src/shared.js'
import { Telegraf } from 'telegraf'
import { TelegramMeta } from '../meta.js'
import { useUserBot } from '../user-bot/use-user-bot.js'

async function createBot() {
  const userBot = await useUserBot()
  const sendMessageToBotFather = async (params: SendMessageParams) => await userBot.client.sendMessage(TelegramMeta.botFatherId, params)
  await sendMessageToBotFather({ message: '/newbot' })

  await userBot.waitForIncommingMessage({ fromUsers: [TelegramMeta.botFatherId] })
  const name = `${AppMeta.name} | BOT`
  await sleep(2000)
  await sendMessageToBotFather({ message: name })

  await userBot.waitForIncommingMessage({ fromUsers: [TelegramMeta.botFatherId] })
  const username = `seven_gram_${faker.string.alphanumeric(5)}_bot`
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
    await systemLogger.info(`Starting bot creation`)
    const createBotResult = await createBot()
    configDatabase.setBot({
      token: createBotResult.client.telegram.token,
      username: createBotResult.username,
    })
    await systemLogger.success(`${createBotResult.name} bot created`)

    try {
      await systemLogger.info(`Adding bot ${createBotResult.name} to special folder`)
      await userBot.client.sendMessage(createBotResult.username, { message: TelegramMeta.startBotCommand })
      await userBot.addEntitiesToSpecialFolder([createBotResult.username])
    }
    catch (error) {
      if (error instanceof Error)
        await systemLogger.error(`Error occurs while addind bot ${name} to special folder. \`\`\`${error.message}\`\`\``)
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

let isBotInited = false
export const checkIsBotInited = () => isBotInited

export const useBot = memoize(async () => {
  const userBot = await useUserBot()
  const { client, me, fetchMe } = await initBot()
  isBotInited = true

  const sendMessageToMe = client.telegram.sendMessage.bind(client.telegram, userBot.me.id.toString())

  return {
    client,
    me,
    fetchMe,
    sendMessageToMe,
  }
})
