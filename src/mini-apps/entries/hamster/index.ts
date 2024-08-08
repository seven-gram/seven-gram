import { faker } from '@faker-js/faker'
import { createMiniAppConfigDatabase } from 'src/mini-apps/helpers/config-database.js'
import { MiniAppName } from 'src/mini-apps/enums.js'
import { defineMiniApp } from 'src/mini-apps/helpers/define.js'
import { convertToMilliseconds, sleep } from 'src/shared.js'
import { HamsterStatic } from './static.js'
import { HamsterApi } from './api/index.js'
import * as HamsterHelpers from './helpers.js'

export { HamsterStatic } from './static.js'
export * as HamsterTypes from './types/index.js'
export { HamsterHelpers }

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
        await logger.info(`Tapped: ${tapsCount} times\nCurrent energy is ${availableTaps}`)
      },
      shedulerType: 'timeout',
      timeout: () => faker.helpers.rangeToNumber({
        min: convertToMilliseconds({ minutes: 50 }),
        max: convertToMilliseconds({ minutes: 60 }),
      }),
    },
    {
      name: 'Keys Minigame',
      async callback({ logger, api }) {
        const {
          dailyKeysMiniGame: {
            isClaimed,
            remainSecondsToNextAttempt,
          },
        } = await api.getConfig()

        if (isClaimed || remainSecondsToNextAttempt >= 0) {
          await logger.info(`Minigame is already claimed. Remain time to next game is ${remainSecondsToNextAttempt} seconds`)
          return
        }

        const { clickerUser } = await api.getClickerUser()
        const gameSleepTimeInSeconds = faker.helpers.rangeToNumber({ min: 15, max: 40 })
        const cipher = HamsterHelpers.getMiniGameCipher(clickerUser.id, gameSleepTimeInSeconds)
        await logger.info(`cipher: ${cipher}`)
        await logger.info(`Sleep for ${gameSleepTimeInSeconds} seconds`)
        await api.startDailyKeysMinigame()
        await sleep(convertToMilliseconds({ seconds: gameSleepTimeInSeconds }))
        const { clickerUser: newClickerUser, dailyKeysMiniGame } = await api.claimDailyKeysMinigame(cipher)
        if (dailyKeysMiniGame.isClaimed) {
          const keysRecieved = newClickerUser.totalKeys - clickerUser.totalKeys
          await logger.info(`Key is succesfully claimed\nKeys recieved: ${keysRecieved}\nTotal keys: ${newClickerUser.totalKeys}`)
        }
      },
      shedulerType: 'cron',
      cronExpression: `0 ${faker.helpers.rangeToNumber({ min: 12, max: 16 })} * * *`,
    },
  ],
})
