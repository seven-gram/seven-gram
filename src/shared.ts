export type AnyFn = (...args: any[]) => any

export function createGlobalState<Fn extends AnyFn>(
  stateFactory: Fn,
): Fn {
  let initialized = false
  let state: any

  return ((...args: any[]) => {
    if (!initialized) {
      state = stateFactory(...args)!
      initialized = true
    }
    return state
  }) as Fn
}
