import { checkIsBotInited } from './telegram/bot/use-bot.js'
import { TelegramHelpers, useBot, useUserBot } from './telegram/index.js'

type LoggerName = string

export type Logger = ReturnType<typeof createLogger>

export function createLogger(name: LoggerName = 'SYSTEM', contextName?: string) {
  interface MessagesObject { plainMessage: string, markdownMessage: string }
  type PlainMessageOrMessagesObject = string | MessagesObject

  const logMethodFactory = (callback: (rootMessage: MessagesObject) => MessagesObject) =>
    async (message: PlainMessageOrMessagesObject) => {
      const { markdownMessage, plainMessage } = callback(typeof message === 'object'
        ? message
        : {
            markdownMessage: message,
            plainMessage: message,
          })

      console.debug(plainMessage)

      if (checkIsBotInited()) {
        try {
          const userBot = await useUserBot()
          const bot = await useBot()
          await bot.client.telegram.sendMessage(
            TelegramHelpers.mapToPeerId(userBot.loggerChannel.id, 'channel'),
            markdownMessage,
            {
              parse_mode: 'Markdown',
            },
          )
        }
        catch {}
      }
    }

  const startStringOfPlainMessage = `${name}   ${contextName ? `|${contextName}| ` : ''}`
  const startStringOfMarkdownMessage = `${name}   ${contextName ? `|${contextName}| ` : ''}`

  const info = logMethodFactory(message => ({
    plainMessage: `📜 ${startStringOfPlainMessage}${message.plainMessage}`,
    markdownMessage: `📜 ${startStringOfMarkdownMessage}${message.markdownMessage}`,
  }))

  const success = logMethodFactory(message => ({
    plainMessage: `✅️ ${startStringOfPlainMessage}${message.plainMessage}`,
    markdownMessage: `✅️ ${startStringOfMarkdownMessage}${message.markdownMessage}`,
  }))

  const error = logMethodFactory(message => ({
    plainMessage: `🚨 ${startStringOfPlainMessage}${message.plainMessage}`,
    markdownMessage: `🚨 ${startStringOfMarkdownMessage}${message.markdownMessage}`,
  }))

  return {
    info,
    success,
    error,
  }
}

export const systemLogger = createLogger('SYSTEM')
