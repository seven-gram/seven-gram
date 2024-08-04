import { Telegraf } from 'telegraf'
import type { SendMessageParams } from 'telegram/client/messages.js'
import type { UserFromGetMe } from 'telegraf/types'
import type { EntitiesLike } from 'telegram/define.js'
import { capitalize } from 'lodash-es'
import { createGlobalState } from '../shared.js'
import { useConfigStore } from '../config.js'
import { meta } from '../meta.js'
import { systemLogger } from '../logger.js'
import { useUserBot } from './index.js'

export enum BotName {
  GENERAL = 'general',
  LOGGER = 'logger',
}

interface CreateBotOptions {
  name: BotName
}

async function createBot(name: BotName) {
  const userBot = await useUserBot()

  let me: UserFromGetMe | null = null

  const createBot = async (options: CreateBotOptions): Promise<Telegraf> => {
    const sendMessageToBotFather = async (params: SendMessageParams) => await userBot.client.sendMessage(meta.telegram.botFatherId, params)
    await sendMessageToBotFather({ message: '/newbot' })

    await userBot.waitForIncommingMessage({ fromUsers: [meta.telegram.botFatherId] })
    const botName = `${meta.app.name} | ${options.name.toUpperCase()}`
    await sendMessageToBotFather({ message: botName })

    await userBot.waitForIncommingMessage({ fromUsers: [meta.telegram.botFatherId] })
    const botUsername = `seven_gram_${userBot.me?.id}_${options.name}_bot`
    await sendMessageToBotFather({ message: botUsername })
    const messageEvent = await userBot.waitForIncommingMessage({ fromUsers: [meta.telegram.botFatherId] })
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

    return client
  }

  const addBotsToFolder = async (botEntities: EntitiesLike) => {
    const getDialogFilter = async () =>
      await userBot.getFirstDialogFilter({ title: meta.telegram.dialogFilter.title })

    let dialogFilter = await getDialogFilter()

    if (!dialogFilter) {
      await userBot.createDialogFilter(meta.telegram.dialogFilter, botEntities)
      dialogFilter = await getDialogFilter()
      if (!dialogFilter) {
        throw new Error(`Can not find dialog filter with title ${meta.telegram.dialogFilter}`)
      }
    }
    await userBot.addDialogsToDialogFilter(dialogFilter.id, botEntities)
  }

  const installBot = async (): Promise<Telegraf> => {
    const configStore = await useConfigStore()
    let bot: Telegraf | undefined
    if (!configStore.configDatabase.data.botsOptions[name]) {
      systemLogger.info(`Starting creation of ${name} bot`)
      const createdBot = await createBot({ name })
      await configStore.configDatabase.update(({ botsOptions }) => {
        botsOptions[name] = {
          token: createdBot.telegram.token,
        }
      })
      systemLogger.success(`${capitalize(name)} bot created`)

      try {
        systemLogger.info(`Adding bot ${name} to special folder`)
        await addBotsToFolder([(await createdBot.telegram.getMe()).username])
      }
      catch (error) {
        if (error instanceof Error)
          systemLogger.error(`Error occurs while addind bot ${name} to special folder. \`\`\`${error.message}\`\`\``)
      }

      bot = createdBot
    }
    else {
      bot = new Telegraf(configStore.configDatabase.data.botsOptions[name].token)
    }

    if (!bot) {
      throw new Error(`Something went wrong during ${name} bot initialization`)
    }

    bot.start(ctx => ctx.reply('Welcome'))
    bot.help(ctx => ctx.reply('Send me a sticker'))
    bot.launch()
    return bot
  }

  let client = await installBot()
  const reinstallBot = async () => client = await installBot()

  const fetchMe = async () => {
    try {
      me = await client.telegram.getMe()
    }
    catch (error) {
      if (error instanceof Error && error.message === '401: Unauthorized') {
        const configStore = await useConfigStore()
        await configStore.configDatabase.update(database => database.botsOptions = {})
        await reinstallBot()
        await fetchMe()
      }
    }
  }

  if (!me)
    await fetchMe()
  if (!me)
    throw new Error('User was not inited')

  const sendMessage = client.telegram.sendMessage.bind(client.telegram, userBot.me.id.toString())

  return {
    bot: client,
    me,
    sendMessage,
  }
}

type BotsNameToBotMap = Record<BotName, Awaited<ReturnType<typeof createBot>>>

export const useBots = createGlobalState(async (): Promise<BotsNameToBotMap> => {
  const partialBots: BotsNameToBotMap = {} as any

  for await (const botName of Object.values(BotName)) {
    const bot = await (async () => {
      try {
        return createBot(botName)
      }
      catch (error) {
        systemLogger.error(`Error while creation ${botName} bot.`)
        throw error
      }
    })()

    partialBots[botName] = bot
  }

  return partialBots
})
