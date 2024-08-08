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
