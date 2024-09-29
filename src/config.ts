import type { PackageJson } from 'type-fest'
import { readFileSync } from 'node:fs'
import { memoize } from 'lodash-es'
import { useConfigDatabase } from './config-database.js'
import { useEnv } from './env.js'

export const useConfig = memoize(() => {
  const { NODE_ENV } = useEnv()
  const { database } = useConfigDatabase()

  const packageJson: PackageJson = JSON.parse(readFileSync('package.json', { encoding: 'utf-8' }))

  const isLocal = NODE_ENV === 'local'
  const isProduction = NODE_ENV === 'production'

  return {
    isLocal,
    isProduction,
    getComputedCommandPrefix: () => isLocal ? `${database.data.settings.commandPrefix}dev` : database.data.settings.commandPrefix,
    packageJson,
  }
})
