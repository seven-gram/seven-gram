import { memoize } from 'lodash-es'
import { useEnv } from './env.js'
import { useConfigDatabase } from './config-database.js'

export const useConfig = memoize(() => {
  const { NODE_ENV } = useEnv()
  const { database } = useConfigDatabase()

  const isLocal = NODE_ENV === 'local'
  const isProduction = NODE_ENV === 'production'

  return {
    isLocal,
    isProduction,
    getComputedCommandPrefix: () => isLocal ? `${database.data.settings.commandPrefix}dev` : database.data.settings.commandPrefix,
  }
})
