import type { MiniAppName } from './mini-apps/enums.js'
import { useBots } from './telegram/index.js'

type LoggerName = Uppercase<MiniAppName> | 'SYSTEM'

export type Logger = ReturnType<typeof createLogger>

export function createLogger(name: LoggerName = 'SYSTEM') {
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

      try {
        const { logger: loggerBot } = await useBots()
        await loggerBot.sendMessage(markdownMessage, {
          parse_mode: 'Markdown',
        })
      }
      catch {}
    }

  const info = logMethodFactory(message => ({
    plainMessage: `📜 ${name}   ${message.plainMessage}`,
    markdownMessage: `📜 *${name}*   ${message.markdownMessage}`,
  }))

  const success = logMethodFactory(message => ({
    plainMessage: `✅️ ${name}   ${message.plainMessage}`,
    markdownMessage: `✅️ *${name}*   ${message.markdownMessage}`,
  }))

  const error = logMethodFactory(message => ({
    plainMessage: `🚨 ${name}   ${message.plainMessage}`,
    markdownMessage: `🚨 *${name}*   ${message.markdownMessage}`,
  }))

  return {
    info,
    success,
    error,
  }
}

export const systemLogger = createLogger('SYSTEM')
