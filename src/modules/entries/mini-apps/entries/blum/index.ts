import { randomInt } from 'node:crypto'
import { convertToMilliseconds, sleep } from 'src/shared.js'
import { doFloodProtect } from 'src/telegram/helpers/index.js'
import { AxiosError } from 'axios'
import { defineMiniApp } from '../../helpers/define.js'
import { MiniAppName } from '../../enums.js'
import { createMiniAppConfigDatabase } from '../../helpers/config-database.js'
import { BlumApi } from './api.js'
import { BlumStatic } from './static.js'

export const blumMiniApp = defineMiniApp({
  name: MiniAppName.BLUM,
  api: BlumApi,
  configDatabase: createMiniAppConfigDatabase(MiniAppName.BLUM),
  login: {
    async callback(createAxios) {
      const axiosClient = createAxios({ headers: BlumStatic.DEFAULT_HEADERS })
      const { authToken } = await BlumApi.getToken(axiosClient)
      axiosClient.defaults.headers.common.Authorization = `Bearer ${authToken}`

      return axiosClient
    },
    lifetime: convertToMilliseconds({ hours: 24 }),
  },
  callbackEntities: [
    {
      name: 'Daily Reward',
      async callback({ logger, api }) {
        try {
          await api.claimDailyReward()
          await logger.success(`Daily reward was succesfully claimed`)
        }
        catch (error) {
          if (error instanceof AxiosError) {
            await logger.info(`Can not claim daily reward. Maybe reward was claimed yet`)
            throw error
          }
        }
      },
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('* 9 * * *', convertToMilliseconds({ minutes: 30 })),
    },
    {
      name: 'Farming',
      async callback({ logger, api }) {
        let balance = await api.getBalance()

        if (!balance.farming) {
          await logger.info(`Starting farming...`)
          await api.startFarming()
          await doFloodProtect()
          await logger.success(`Farming started`)
          balance = await api.getBalance()
          console.log('balance', balance)
          const timeToFarmingEnd = balance.farming?.endTime ?? 0 - Date.now()
          if (timeToFarmingEnd > 0) {
            return {
              extraRestartTimeout: randomInt(
                timeToFarmingEnd + convertToMilliseconds({ minutes: 1 }),
                timeToFarmingEnd + convertToMilliseconds({ minutes: 3 }),
              ),
            }
          }
          return
        }

        let timeToFarmingEnd = balance.farming.endTime - Date.now()

        if (timeToFarmingEnd <= 0) {
          await api.claimFarming()
          await doFloodProtect()
          await logger.info(`Starting farming...`)
          await api.startFarming()
          await doFloodProtect()
          await logger.success(`Farming started`)
          balance = await api.getBalance()
          if (balance.farming)
            timeToFarmingEnd = balance.farming.endTime - Date.now()
          if (timeToFarmingEnd > 0) {
            return {
              extraRestartTimeout: randomInt(
                timeToFarmingEnd + convertToMilliseconds({ minutes: 1 }),
                timeToFarmingEnd + convertToMilliseconds({ minutes: 3 }),
              ),
            }
          }
        }
        else {
          await logger.info(`Farming is already started`)
          return {
            extraRestartTimeout: randomInt(
              timeToFarmingEnd + convertToMilliseconds({ minutes: 1 }),
              timeToFarmingEnd + convertToMilliseconds({ minutes: 3 }),
            ),
          }
        }
      },
      timeout: () => randomInt(
        convertToMilliseconds({ hours: 8 }),
        convertToMilliseconds({ hours: 8, minutes: 5 }),
      ),
    },
    {
      name: 'Play Passes',
      async callback({ logger, api }) {
        const POINTS_PER_GAME = [200, 230] as const
        let balance = await api.getBalance()

        if (!balance.playPasses) {
          await logger.info(`There are no play passes. Sleep...`)
          return
        }

        const randomGamesCount = balance.playPasses <= 5 ? balance.playPasses : randomInt(5, balance.playPasses)
        await logger.info(`Starting ${randomGamesCount} game sessions`)

        for (let i = 0; i < randomGamesCount; i++) {
          const { gameId } = await api.startGame()
          const timeToSleep = randomInt(
            convertToMilliseconds({ seconds: 30 }),
            convertToMilliseconds({ seconds: 32 }),
          )
          const randomPointsCount = randomInt(POINTS_PER_GAME[0], POINTS_PER_GAME[1])
          await logger.info(
            `Starting ${gameId} game session...`
            + `\nSleep time: ${timeToSleep / 1000} seconds`
            + `\nPoints to farm : ${randomPointsCount}`,
          )
          await sleep(timeToSleep)
          await api.claimGame(gameId, randomPointsCount)
          balance = await api.getBalance()
          await logger.info(
          `Game session ${gameId} done.`
          + `\nTotal points: ${balance.availableBalance} (+${randomPointsCount})`
          + `\nPasses left: ${balance.playPasses}`,
          )
          await sleep(randomInt(
            convertToMilliseconds({ seconds: 5 }),
            convertToMilliseconds({ seconds: 10 }),
          ))
        }

        if (balance.playPasses) {
          return {
            extraRestartTimeout: randomInt(
              convertToMilliseconds({ minutes: 20 }),
              convertToMilliseconds({ minutes: 30 }),
            ),
          }
        }
      },
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('* 10 * * *', convertToMilliseconds({ minutes: 30 })),
    },
  ],
})
