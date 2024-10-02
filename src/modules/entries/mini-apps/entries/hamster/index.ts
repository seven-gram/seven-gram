import { randomInt } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { convertToMilliseconds, formatCoins } from 'src/shared.js'
import { doFloodProtect } from 'src/telegram/helpers/index.js'
import { TelegramHelpers } from 'src/telegram/index.js'
import { sleep } from 'zx'
import { MiniAppName } from '../../enums.js'
import { createMiniAppConfigDatabase } from '../../helpers/config-database.js'
import { defineMiniApp } from '../../helpers/define.js'
import { HamsterApi } from './api/index.js'
import * as HamsterHelpers from './helpers.js'
import { HamsterStatic } from './static.js'
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
  },
  async onResponseRejected(error, axiosClient, createAxios) {
    if (error.response?.status === 401) {
      const cleanAxiosClient = createAxios({ headers: HamsterStatic.DEFAULT_HEADERS })
      const { authToken } = await HamsterApi.authByTelegramWebapp(cleanAxiosClient)
      axiosClient.defaults.headers.common.Authorization = `Bearer ${authToken}`
    }
    else {
      return error
    }
  },
  callbackEntities: [
    {
      name: 'Anti AFK',
      async callback({ api }) {
        await api.getAccountInfo()
        await api.getInterludeUser()
        await api.getPromos()
        await api.getUpgradesForBuy()
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

        const { interludeUser } = await api.getInterludeUser()
        await api.startDailyKeysMinigame(game.id)
        const gameSleepTime = randomInt(15_000, 25_000)
        logger.info(
          `${game.id} minigame started`
          + `\nSleep ${gameSleepTime / 1000} seconds`,
        )
        await sleep(gameSleepTime)
        const cipher = HamsterHelpers.createGetMiniGameCipherFactory().getMiniGameCipher(game, interludeUser.id)
        const { dailyKeysMiniGames, interludeUser: { totalKeys: newTotalKeys }, bonus } = await api.claimDailyKeysMinigame(cipher, game.id)

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
        createCronTimeoutWithDeviation('0 12 * * *', convertToMilliseconds({ minutes: 30 })),
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
        for (const _ of Array.from(Array.from({ length: gameIterations }).keys())) {
          if (currentGame.isClaimed) {
            break
          }

          const pointsToFarm = currentGame.remainPoints <= TILES_POINTS_PER_GAME[1]
            ? currentGame.remainPoints
            : randomInt(TILES_POINTS_PER_GAME[0], TILES_POINTS_PER_GAME[1])

          const { interludeUser } = await api.getInterludeUser()
          await api.startDailyKeysMinigame(game.id)
          const { timeToFarmPoints, getMiniGameCipher } = HamsterHelpers.createGetMiniGameCipherFactory(pointsToFarm)
          logger.info(
            `${game.id} minigame started`
            + `\nPoints recieved: ${(currentGame.maxPoints ?? 0) - currentGame.remainPoints}/${currentGame.maxPoints}`
            + `\nPoints to farm: ${pointsToFarm}`
            + `\nSleep: ${timeToFarmPoints / 1000} seconds`,
          )
          await sleep(timeToFarmPoints)
          const cipher = getMiniGameCipher(game, interludeUser.id)
          const { dailyKeysMiniGames, interludeUser: newInterludeUser, bonus } = await api.claimDailyKeysMinigame(cipher, game.id)
          currentGame = dailyKeysMiniGames

          await logger.success(
            `Part of the ${game.id} mini game prize was succesfully recieved`
            + `\nTotal coins: ${formatCoins(newInterludeUser.totalDiamonds)} (+${formatCoins(bonus)})`,
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
        createCronTimeoutWithDeviation('0 12 * * *', convertToMilliseconds({ minutes: 30 })),
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
        createCronTimeoutWithDeviation('0 14 * * *', convertToMilliseconds({ minutes: 30 })),
    },
    {
      name: 'Tasks',
      async callback({ logger, api }) {
        const { tasks } = await api.getTasksList()

        for (const task of tasks) {
          if (task.isCompleted) {
            continue
          }

          async function onTaskCompletion() {
            const { task: newTask } = await api.checkTask(task.id)
            if (newTask.isCompleted) {
              await logger.info(`Task _${newTask.id}_ succesfully completed.`)
            }
            await TelegramHelpers.doFloodProtect()
          }

          if (task.id.includes('youtube')) {
            await onTaskCompletion()
          }
        }
      },
      timeout: ({ randomInt }) => randomInt(convertToMilliseconds({ hours: 5 }), convertToMilliseconds({ hours: 6 })),
    },
    {
      name: 'Upgrades',
      async callback({ logger, api }) {
        const { upgradesForBuy } = await api.getUpgradesForBuy()
        let { interludeUser } = await api.getInterludeUser()

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
            || interludeUser.balanceDiamonds < upgradeForBuy.price
            || (upgradeForBuy.price / upgradeForBuy.profitPerHourDelta) > 100
          ) {
            continue
          }

          async function buyUpgrade() {
            const { upgradesForBuy, interludeUser: newInterludeUser } = await api.buyUpgrade(upgradeForBuy.id)
            interludeUser = newInterludeUser
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
