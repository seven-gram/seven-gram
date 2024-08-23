import { config } from 'dotenv'
import { customCleanEnv, str } from 'envalid'
import { memoize, omit } from 'lodash-es'

export const useEnv = memoize(() => {
  return customCleanEnv(
    config().parsed,
    {
      NODE_ENV: str({ choices: ['local', 'production'] }),
    },
    (env) => {
      return omit(env, ['isDev', 'isDevelopment', 'isProd', 'isProduction', 'isTest'])
    },
  )
})
