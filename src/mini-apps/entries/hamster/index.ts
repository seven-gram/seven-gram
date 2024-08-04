import { faker } from '@faker-js/faker'
import { createMiniAppConfigDatabase } from 'src/mini-apps/helpers/config-database.js'
import { MiniAppName } from 'src/mini-apps/enums.js'
import { defineMiniApp } from 'src/mini-apps/helpers/define.js'
import { HamsterStatic } from './static.js'
import { HamsterApi } from './api/index.js'

export const hamsterMiniApp = defineMiniApp<MiniAppName.HAMSTER>({
  name: MiniAppName.HAMSTER,
  configDatabase: createMiniAppConfigDatabase(MiniAppName.HAMSTER),
  login: {
    async callback(createAxios) {
      const { authToken } = await HamsterApi.authByTelegramWebapp()
      const axiosClient = createAxios({ headers: HamsterStatic.DEFAULT_HEADERS })
      axiosClient.defaults.headers.common.Authorization = `Bearer ${authToken}`

      return axiosClient
    },
    lifetime: 1000 * 60 * 60 * 12,
  },
  callbackEntities: [
    {
      name: 'Log AccountInfo',
      async callback({ logger, axiosClient }) {
        const { accountInfo } = await HamsterApi.getAccountInfo(axiosClient)
        logger.info(`\`\`\`json ${JSON.stringify(accountInfo, null, 2)}\`\`\``)
      },
      shedulerType: 'timeout',
      timeout: () => faker.helpers.rangeToNumber({ min: 5000, max: 6000 }),
    },
  ],
})
