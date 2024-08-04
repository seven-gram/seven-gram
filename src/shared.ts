export type AnyFn = (...args: any[]) => any

export function createGlobalState<Fn extends AnyFn>(
  stateFactory: Fn,
  lifetime?: number,
): Fn {
  let initialized = false
  let state: any

  return ((...args: any[]) => {
    if (!initialized) {
      state = stateFactory(...args)!
      if (lifetime)
        setInterval(() => state = stateFactory(...args)!, lifetime)
      initialized = true
    }

    return state
  }) as Fn
}

export function sleep(duration: number) {
  return new Promise(resolve => setTimeout(() => {
    resolve(null)
  }, duration))
}
