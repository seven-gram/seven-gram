import { randomInt } from 'node:crypto'
import { AxiosError } from 'axios'
import { convertToMilliseconds, sleep } from 'src/shared.js'
import { doFloodProtect } from 'src/telegram/helpers/index.js'
import { MiniAppName } from '../../enums.js'
import { createMiniAppConfigDatabase } from '../../helpers/config-database.js'
import { defineMiniApp } from '../../helpers/define.js'
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
  },
  async onResponseRejected(error, axiosClient, createAxios) {
    if (error.response?.status === 401) {
      const cleanAxiosClient = createAxios({ headers: BlumStatic.DEFAULT_HEADERS })
      const { authToken } = await BlumApi.getToken(cleanAxiosClient)
      axiosClient.defaults.headers.common.Authorization = `Bearer ${authToken}`
    }
    else {
      return error
    }
  },
  callbackEntities: [
    {
      name: 'Daily Reward',
      async callback({ logger, api }) {
        await api.claimDailyReward()
        await logger.success(`Daily reward was succesfully claimed`)
      },
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('0 9 * * *', convertToMilliseconds({ minutes: 30 })),
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

        const randomGamesCount = balance.playPasses <= 5
          ? balance.playPasses
          : randomInt(
            5,
            balance.playPasses < 10 ? balance.playPasses : 10,
          )
        await logger.info(`Starting ${randomGamesCount} game sessions`)

        let claimedGamesCount = 0
        for (let i = 0; i < randomGamesCount; i++) {
          try {
            const { gameId } = await api.startGame()
            const timeToSleep = randomInt(
              convertToMilliseconds({ seconds: 29 }),
              convertToMilliseconds({ seconds: 37 }),
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
            await logger.success(
              `Game session ${gameId} done.`
              + `\nTotal points: ${balance.availableBalance} (+${randomPointsCount})`
              + `\nPasses left: ${balance.playPasses}`,
            )
            await sleep(randomInt(
              convertToMilliseconds({ seconds: 10 }),
              convertToMilliseconds({ seconds: 20 }),
            ))
            claimedGamesCount++
          }
          catch (error) {
            if (i === randomGamesCount - 1 && claimedGamesCount === 0) {
              throw (error)
            }

            if (error instanceof AxiosError) {
              await logger.error(
                `An error occurs while executing game iteration with index ${i + 1}`
                + `\n\`\`\`Message: ${error.message}\`\`\``
                + `\nSkipping game...`,
              )
              await sleep(convertToMilliseconds({ seconds: 15 }))
            }
          }
        }

        if (balance.playPasses) {
          return {
            extraRestartTimeout: randomInt(
              convertToMilliseconds({ minutes: 25 }),
              convertToMilliseconds({ minutes: 35 }),
            ),
          }
        }
      },
      timeout: ({ createCronTimeoutWithDeviation }) =>
        createCronTimeoutWithDeviation('0 11 * * *', convertToMilliseconds({ minutes: 30 })),
    },
  ],
})
