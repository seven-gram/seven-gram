import type { CronJobParams } from 'cron'
import { randomInt } from 'node:crypto'
import { CronTime } from 'cron'

export type AnyFn = (...args: any[]) => any

export function sleep(duration: number) {
  return new Promise(resolve => setTimeout(() => {
    resolve(null)
  }, duration))
}

export type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never

export function convertToMilliseconds(options: {
  seconds?: number
  minutes?: number
  hours?: number
}): number {
  const { seconds = 0, minutes = 0, hours = 0 } = options
  let milliseconds = 0

  milliseconds += seconds * 1000
  milliseconds += minutes * 1000 * 60
  milliseconds += hours * 1000 * 60 * 60

  return milliseconds
}

export type NeverIfNullable<T> = T extends null ? never : T extends undefined ? never : T
export type AnyRecord = Record<string, any>
export type MaybePromiseLike<T> = T | PromiseLike<T>

const intlNumberFormat = new Intl.NumberFormat()
export function formatCoins(coins: number) {
  return intlNumberFormat.format(coins)
}

export function createCronTimeoutWithDeviation(cronJobParams: CronJobParams['cronTime'], deviation: number) {
  const cronTimeout = new CronTime(cronJobParams).getTimeout()
  return randomInt(cronTimeout - deviation, cronTimeout + deviation)
}
