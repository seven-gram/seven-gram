import type { useUserBot } from './use-user-bot.js'

export type UserBot = Awaited<ReturnType<typeof useUserBot>>
