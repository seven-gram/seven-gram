import { randomInt } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { convertToMilliseconds, formatCoins } from 'src/shared.js'
import { TelegramHelpers } from 'src/telegram/index.js'
import { sleep } from 'zx'
import { doFloodProtect } from 'src/telegram/helpers/index.js'
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
    lifetime: convertToMilliseconds({ hours: 24 }),
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
      timeout: () => faker.helpers.rangeToNumber({
        min: convertToMilliseconds({ minutes: 50 }),
        max: convertToMilliseconds({ minutes: 60 }),
      }),
    },
    {
      name: 'Candles',
      async callback({ api, logger }) {
        const {
          dailyKeysMiniGames: { Candles: game },
        } = await api.getConfig()

        if (!game) {
          logger.info('Can not find Candles game in config')
          return
        }

        if (game.isClaimed) {
          await logger.info(`Minigame ${game.id} is already claimed.`)
          return
        }

        if (game.remainSecondsToNextAttempt >= 0) {
          await logger.info(`Can not complete minigame because of timeout. Next retry after ${game.remainSecondsToNextAttempt} secconds`)
          return {
            extraRestartTimeout: convertToMilliseconds({
              seconds: game.remainSecondsToNextAttempt,
            }),
          }
        }

        const { clickerUser } = await api.getClickerUser()
        await api.startDailyKeysMinigame(game.id)
        const gameSleepTime = randomInt(15_000, 25_000)
        logger.info(
          `${game.id} minigame started`
          + `\nSleep ${gameSleepTime / 1000} seconds`,
        )
        await sleep(gameSleepTime)
        const cipher = HamsterHelpers.createGetMiniGameCipherFactory().getMiniGameCipher(game, clickerUser.id)
        const { dailyKeysMiniGames, clickerUser: { totalKeys: newTotalKeys }, bonus } = await api.claimDailyKeysMinigame(cipher, game.id)

        if (dailyKeysMiniGames.isClaimed) {
          await logger.success(
          `Mini game ${game.id} is succesfully claimed`
          + `\nTotal keys: ${newTotalKeys} (+${bonus})`,
          )
        }
        else {
          logger.info(`Can not claim mini game ${game.id} with _${cipher}_ cipher`)
        }
      },
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('* 12 * * *', convertToMilliseconds({ minutes: 30 })),
    },
    {
      name: 'Tiles',
      async callback({ logger, api }) {
        const {
          dailyKeysMiniGames: { Tiles: game },
        } = await api.getConfig()

        if (!game) {
          logger.info('Can not find Tiles game in config')
          return
        }

        if (game.isClaimed) {
          await logger.info(`Mini game ${game.id} is already claimed`)
          return
        }

        const TILES_POINTS_PER_GAME = [350, 550] as const
        const TILES_ITERATIONS_PER_EXECUTION = [4, 10] as const

        let currentGame = game
        const gameIterations = randomInt(TILES_ITERATIONS_PER_EXECUTION[0], TILES_ITERATIONS_PER_EXECUTION[1])
        for (const _ of Array.from(Array(gameIterations).keys())) {
          if (currentGame.isClaimed) {
            break
          }

          const pointsToFarm = currentGame.remainPoints <= TILES_POINTS_PER_GAME[1]
            ? currentGame.remainPoints
            : randomInt(TILES_POINTS_PER_GAME[0], TILES_POINTS_PER_GAME[1])

          const { clickerUser } = await api.getClickerUser()
          await api.startDailyKeysMinigame(game.id)
          const { timeToFarmPoints, getMiniGameCipher } = HamsterHelpers.createGetMiniGameCipherFactory(pointsToFarm)
          logger.info(
            `${game.id} minigame started`
            + `\nPoints recieved: ${(currentGame.maxPoints ?? 0) - currentGame.remainPoints}/${currentGame.maxPoints}`
            + `\nPoints to farm: ${pointsToFarm}`
            + `\nSleep: ${timeToFarmPoints / 1000} seconds`,
          )
          await sleep(timeToFarmPoints)
          const cipher = getMiniGameCipher(game, clickerUser.id)
          const { dailyKeysMiniGames, clickerUser: newClickerUser, bonus } = await api.claimDailyKeysMinigame(cipher, game.id)
          currentGame = dailyKeysMiniGames

          await logger.success(
          `Part of the ${game.id} mini game prize was succesfully recieved`
          + `\nTotal coins: ${formatCoins(newClickerUser.totalCoins)} (+${formatCoins(bonus)})`,
          )
          await doFloodProtect()
        }

        if (currentGame.isClaimed) {
          await logger.success(`Minigame ${game.id} was succesfully claimed`)
        }
        else {
          return {
            extraRestartTimeout: randomInt(convertToMilliseconds({ minutes: 10 }), convertToMilliseconds({ minutes: 15 })),
          }
        }
      },
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('* 12 * * *', convertToMilliseconds({ minutes: 30 })),
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
        await logger.success(
          `Successfully claim daily cipher: ${decodedCipher}`
          + `\nBonus: ${bonusCoins}`,
        )
      },
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('* 13 * * *', convertToMilliseconds({ minutes: 30 })),
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
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('* 14 * * *', convertToMilliseconds({ minutes: 30 })),
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
      timeout: ({ randomInt }) => randomInt(convertToMilliseconds({ hours: 5 }), convertToMilliseconds({ hours: 6 })),
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
      timeout: ({ randomInt }) => randomInt(convertToMilliseconds({ minutes: 30 }), convertToMilliseconds({ minutes: 40 })),
    },
  ],
})
