import { faker } from '@faker-js/faker'
import { createMiniAppConfigDatabase } from 'src/mini-apps/helpers/config-database.js'
import { MiniAppName } from 'src/mini-apps/enums.js'
import { defineMiniApp } from 'src/mini-apps/helpers/define.js'
import { convertToMilliseconds, sleep } from 'src/shared.js'
import { TelegramHelpers } from 'src/telegram/index.js'
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

        if (isClaimed) {
          await logger.info(`Minigame is already claimed.`)
          return
        }

        async function completeMinigame() {
          const { clickerUser } = await api.getClickerUser()
          const gameSleepTimeInSeconds = faker.helpers.rangeToNumber({ min: 15, max: 40 })
          const cipher = HamsterHelpers.getMiniGameCipher(clickerUser.id, gameSleepTimeInSeconds)
          await api.startDailyKeysMinigame()
          await logger.info(`Daily keys minigame started. Sleep for ${gameSleepTimeInSeconds} seconds`)
          await sleep(convertToMilliseconds({ seconds: gameSleepTimeInSeconds }))
          const { clickerUser: newClickerUser, dailyKeysMiniGame } = await api.claimDailyKeysMinigame(cipher)

          if (dailyKeysMiniGame.isClaimed) {
            const keysRecieved = newClickerUser.totalKeys - clickerUser.totalKeys
            await logger.info(`Key is succesfully claimed\nKeys recieved: ${keysRecieved}\nTotal keys: ${newClickerUser.totalKeys}`)
          }
        }

        if (remainSecondsToNextAttempt >= 0) {
          setTimeout(
            () => completeMinigame(),
            convertToMilliseconds({ seconds: remainSecondsToNextAttempt }),
          )
          await logger.info(`Can not complete minigame because of timeout. Next attempt planned after ${remainSecondsToNextAttempt} seconds`)
          return
        }

        await completeMinigame()
      },
      shedulerType: 'cron',
      cronExpression: `${faker.helpers.rangeToNumber({ min: 1, max: 59 })} 12 * * *`,
    },
    {
      name: 'Daily Cipher',
      async callback({ logger, api }) {
        const { dailyCipher: { cipher, isClaimed } } = await api.getConfig()

        if (isClaimed) {
          await logger.info(`Daily cipher is already claimed`)
          return
        }

        const decodedCipher = HamsterHelpers.decodeDailyCipher(cipher)
        const { dailyCipher: { bonusCoins } } = await api.claimDailyCipher(decodedCipher)
        await logger.success(`Successfully claim daily cipher: ${decodedCipher}\nBonus: ${bonusCoins}`)
      },
      shedulerType: 'cron',
      cronExpression: `${faker.helpers.rangeToNumber({ min: 1, max: 59 })} 13 * * *`,
    },
    {
      name: 'Playground',
      async callback({ logger, api }) {
        const { promos, states } = await api.getPromos()

        for await (const promo of promos) {
          const appToken = HamsterStatic.PROMO_ID_TO_APP_TOKEN_MAP[promo.promoId]
          const promoState = states.find(state => state.promoId === promo.promoId)

          if (!appToken) {
            await logger.info(`Skipping game _${promo.title.en}_. Can not find its app token.`)
            continue
          }

          if (!promoState) {
            await logger.info(`Skipping game _${promo.title.en}_. Can not find its state.`)
            continue
          }

          if (promoState.receiveKeysToday >= promo.keysPerDay) {
            await logger.info(`All promo codes activated for _${promo.title.en}_ game yet.`)
            continue
          }

          let currentActivatedPromosCount = promoState.receiveKeysToday

          await logger.info(`Starting promo codes mining for _${promo.title.en}_ game`)
          try {
            while (currentActivatedPromosCount < promo.keysPerDay) {
              const promoCode = await HamsterHelpers.getPromoCode({
                appToken,
                promo,
              })

              const { promoState } = await api.applyPromoCode(promoCode)
              await logger.info(`Promo ${promoCode} was succesfully activated for ${promo.title.en} game.\n${currentActivatedPromosCount + 1} codes of ${promo.keysPerDay} applied.`)

              currentActivatedPromosCount = promoState.receiveKeysToday

              await TelegramHelpers.doFloodProtect()
            }
            await logger.info(`Promo codes mining for _${promo.title.en}_ game succesfully finished.`)
          }
          catch (error) {
            console.error(error)
            if (error instanceof Error) {
              await logger.error(`An error occurs while mining promo for _${promo.title.en}_ game:\n\`\`\`Message: ${error.message}\`\`\``)
            }
          }

          await TelegramHelpers.doFloodProtect()
        }
      },
      shedulerType: 'cron',
      cronExpression: `${faker.helpers.rangeToNumber({ min: 1, max: 59 })} 14 * * *`,
    },
    {
      name: 'Tasks',
      async callback({ logger, api }) {
        const { tasks } = await api.getTasksList()

        let completedTasksCount = 0

        for (const task of tasks) {
          if (task.isCompleted) {
            continue
          }
          else if (
            task.rewardDelaySeconds
            && task.toggle?.enableAt
            && ((new Date().valueOf() - new Date(task.toggle.enableAt).valueOf()) / 1000) < task.rewardDelaySeconds
          ) {
            // TODO: plan module execution to nearest time after reward delay seconds end
            continue
          }

          async function onTaskCompletion() {
            await logger.info(`Task _${task.id}_ succesfully completed.\nBonus coins: ${task.rewardCoins}`)
            completedTasksCount++
          }

          if (task.id.includes('youtube') && (task.type === 'WithLink' || task.type === 'WithLocaleLink')) {
            await api.checkTask(task.id)
            await onTaskCompletion()
          }

          else if (task.type === 'StreakDay' && task.id === 'streak_days') {
            await api.checkTask(task.id)
            await onTaskCompletion()
          }
        }

        if (completedTasksCount === 0) {
          await logger.info(`Can not complete any task :(`)
        }
      },
      shedulerType: 'timeout',
      timeout: () => faker.helpers.rangeToNumber({
        min: convertToMilliseconds({ hours: 5 }),
        max: convertToMilliseconds({ hours: 6 }),
      }),
    },
  ],
})
