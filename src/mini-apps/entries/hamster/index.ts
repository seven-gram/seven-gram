import { faker } from '@faker-js/faker'
import { createMiniAppConfigDatabase } from 'src/mini-apps/helpers/config-database.js'
import { MiniAppName } from 'src/mini-apps/enums.js'
import { defineMiniApp } from 'src/mini-apps/helpers/define.js'
import { convertToMilliseconds } from 'src/shared.js'
import { HamsterStatic } from './static.js'
import { HamsterApi } from './api/index.js'

export { HamsterStatic } from './static.js'
export * as HamsterTypes from './types/index.js'

export const hamsterMiniApp = defineMiniApp({
  name: MiniAppName.HAMSTER,
  api: HamsterApi,
  configDatabase: createMiniAppConfigDatabase(MiniAppName.HAMSTER),
  login: {
    async callback(createAxios) {
      const axiosClient = createAxios({ headers: HamsterStatic.DEFAULT_HEADERS })
      const { authToken } = await HamsterApi.authByTelegramWebapp(axiosClient)
      axiosClient.defaults.headers.common.Authorization = `Bearer ${authToken}`

      return axiosClient
    },
    lifetime: 1000 * 60 * 60 * 12,
  },
  callbackEntities: [
    {
      name: 'Tap',
      async callback({ logger, api }) {
        let { clickerUser: { availableTaps, earnPerTap } } = await api.getClickerUser()
        const maxTapsCount = Math.floor(availableTaps / earnPerTap)
        const tapsCount = faker.helpers.rangeToNumber({
          min: maxTapsCount - 10,
          max: maxTapsCount - 1,
        })
        await api.tap(availableTaps, tapsCount)
        availableTaps = availableTaps - tapsCount * earnPerTap
        logger.info(`Tapped: ${tapsCount} times\nCurrent energy is ${availableTaps}`)
      },
      shedulerType: 'timeout',
      timeout: () => faker.helpers.rangeToNumber({
        min: convertToMilliseconds({ minutes: 50 }),
        max: convertToMilliseconds({ minutes: 60 }),
      }),
    },
  ],
})
