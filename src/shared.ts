export type AnyFn = (...args: any[]) => any

export function sleep(duration: number) {
  return new Promise(resolve => setTimeout(() => {
    resolve(null)
  }, duration))
}

export type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never
