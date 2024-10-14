import type { useUserBot } from '../index.js'

export type UserBot = Awaited<ReturnType<typeof useUserBot>>
