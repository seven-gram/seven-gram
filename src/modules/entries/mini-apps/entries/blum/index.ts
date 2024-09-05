import { randomInt } from 'node:crypto'
import { convertToMilliseconds, sleep } from 'src/shared.js'
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
      name: 'Play Passes',
      async callback({ logger, api }) {
        const POINTS_PER_GAME = [200, 230] as const
        let balance = await api.getBalance()

        if (!balance.playPasses) {
          await logger.error(`There are no play passes. Sleep...`)
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
