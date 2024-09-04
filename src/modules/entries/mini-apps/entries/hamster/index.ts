import { randomInt } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { convertToMilliseconds } from 'src/shared.js'
import { TelegramHelpers } from 'src/telegram/index.js'
import { sleep } from 'zx'
import { defineMiniApp } from '../../helpers/define.js'
import { MiniAppName } from '../../enums.js'
import { createMiniAppConfigDatabase } from '../../helpers/config-database.js'
import { HamsterStatic } from './static.js'
import { HamsterApi } from './api/index.js'
import * as HamsterHelpers from './helpers.js'
import * as HamsterTypes from './types/index.js'

export { HamsterStatic } from './static.js'
export { HamsterHelpers, HamsterTypes }

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
      name: 'Minigames',
      async callback({ logger, api }) {
        const {
          dailyKeysMiniGames,
        } = await api.getConfig()

        const currentlySupportedMinigames = ['Candles']

        for (const [_, game] of Object.entries(dailyKeysMiniGames)) {
          if (currentlySupportedMinigames.includes(game.id) === false) {
            await logger.info(`Minigame ${game.id} is not supported yet.`)
            return
          }

          if (game.isClaimed) {
            await logger.info(`Minigame ${game.id} is already claimed.`)
            return
          }

          if (game.remainSecondsToNextAttempt >= 0) {
            await logger.info(`Can not complete minigame because of timeout.`)
            // TODO: retry to run game
            return
          }

          let currentIsClaimed = false
          while (currentIsClaimed === false) {
            const { clickerUser } = await api.getClickerUser()
            await api.startDailyKeysMinigame(game.id)
            const gameSleepTime = randomInt(15_000, 25_000)
            await logger.info(`Daily keys minigame started. Sleep for ${gameSleepTime / 1000} seconds`)
            await sleep(gameSleepTime)
            const cipher = HamsterHelpers.getMiniGameCipher(game, clickerUser.id)
            const { dailyKeysMiniGames } = await api.claimDailyKeysMinigame(cipher, game.id)
            currentIsClaimed = dailyKeysMiniGames.isClaimed
          }

          await logger.info(`Mini Game ${game.id} is succesfully claimed`)
        }
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
        const promosSettings = await api.getPromosSettings()

        for await (const promoSettings of promosSettings) {
          const promo = promos.find(promo => promo.promoId === promoSettings.promoId)

          if (!promo) {
            await logger.info(`Can no find game with id _${promoSettings.promoId}_. Skipping it.`)
            continue
          }

          const promoState = states.find(state => state.promoId === promo.promoId)

          if ((promoState?.receiveKeysToday ?? 0) >= promo.keysPerDay) {
            await logger.info(`All promo codes activated for _${promo.title.en}_ game yet.`)
            continue
          }

          let currentActivatedPromosCount = promoState?.receiveKeysToday ?? 0

          await logger.info(`Starting promo codes mining for _${promo.title.en}_ game`)
          try {
            while (currentActivatedPromosCount < promo.keysPerDay) {
              const promoCode = await HamsterHelpers.getPromoCode({
                appToken: promoSettings.appToken,
                promo,
                eventTimeout: promoSettings.minWaitAfterLogin * 1000,
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
            const { task: newTask } = await api.checkTask(task.id)
            if (newTask.isCompleted) {
              await logger.info(`Task _${newTask.id}_ succesfully completed.\nBonus coins: ${newTask.rewardCoins}`)
            }
            await TelegramHelpers.doFloodProtect()
          }

          if (task.id.includes('youtube') && (task.type === 'WithLink' || task.type === 'WithLocaleLink')) {
            await onTaskCompletion()
          }

          else if (task.type === 'StreakDay' && task.id === 'streak_days') {
            await onTaskCompletion()
          }
        }
      },
      shedulerType: 'timeout',
      timeout: () => faker.helpers.rangeToNumber({
        min: convertToMilliseconds({ hours: 5 }),
        max: convertToMilliseconds({ hours: 6 }),
      }),
    },
    {
      name: 'Mining',
      async callback({ logger, api }) {
        const { sections, upgradesForBuy } = await api.getUpgradesForBuy()
        let { clickerUser } = await api.getClickerUser()
        const unavaliableSections = sections.filter(section => !section.isAvailable).map(section => section.section)

        const sortedUpgradesForBuy = upgradesForBuy
          .toSorted((a, b) => b.profitPerHourDelta - a.profitPerHourDelta)
          .toSorted(a => a.expiresAt ? -1 : 1)

        for (const upgradeForBuy of sortedUpgradesForBuy) {
          if (
            !upgradeForBuy.isAvailable
            || upgradeForBuy.cooldownSeconds
            || (upgradeForBuy.maxLevel && upgradeForBuy.level >= upgradeForBuy.maxLevel)
            || upgradeForBuy.isExpired
            || upgradeForBuy.price <= 0
            || clickerUser.balanceCoins < upgradeForBuy.price
            || unavaliableSections.includes(upgradeForBuy.section)
            || (upgradeForBuy.price / upgradeForBuy.profitPerHourDelta) > 4000
          ) {
            continue
          }

          async function buyUpgrade() {
            const { upgradesForBuy, clickerUser: newClickerUser } = await api.buyUpgrade(upgradeForBuy.id)
            clickerUser = newClickerUser
            const updatedUpgradeForBuy = upgradesForBuy.find(upgrade => upgrade.id === upgradeForBuy.id)!
            await logger.info(`_${updatedUpgradeForBuy.id}_ card was bought succesfully.\nLevel: ${updatedUpgradeForBuy.level}\n`)
            await TelegramHelpers.doFloodProtect()
          }

          await buyUpgrade()
        }
      },
      shedulerType: 'timeout',
      timeout: () => faker.helpers.rangeToNumber({
        min: convertToMilliseconds({ minutes: 30 }),
        max: convertToMilliseconds({ minutes: 40 }),
      }),
    },
  ],
})