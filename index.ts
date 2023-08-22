export { createSynchronizedFunction as toSync } from './to-sync'

const handlers = []

export function registerErrorHandler(handler: (error: Error) => void) {
  handlers.push(handler)
}

export function reset() {
  handlers.splice(0)
}

function createAccessProxy<T extends any>(error: string | false, value: T) {
  let errorPropertyAccessed = false
  const initialTarget = (
    typeof value === 'object' ? { error, value, ...value } : { error, value }
  ) as {
    error: false | string
    value: T
  } & ValueType<T>

  return new Proxy<{ error: false | string; value: T } & ValueType<T>>(initialTarget, {
    get(_, prop) {
      if (prop === 'then') {
        return null
      }
      if (
        prop === 'error' &&
        !error &&
        typeof value === 'object' &&
        Object.hasOwn(value, 'error')
      ) {
        errorPropertyAccessed = true
        return (value as any).error
      }
      if (prop === 'error') {
        errorPropertyAccessed = true
        return error
      }
      if (!errorPropertyAccessed && error) {
        handlers.forEach((handler) => {
          handler(error)
        })
      }
      if (prop === 'value') {
        return value
      }
      if (typeof value === 'object') {
        return value[prop]
      }
      return value
    },
    set() {
      throw new Error('Cannot extend avait result object.')
    },
    has(_, prop) {
      if (typeof value !== 'object') {
        return false
      }
      return Object.hasOwn(value, prop)
    },
    getOwnPropertyDescriptor() {
      return {
        configurable: true, // Required for ...spread of values.
        enumerable: true,
      }
    },
    ownKeys() {
      if (typeof value !== 'object') {
        return []
      }
      return Object.keys(value)
    },
    isExtensible() {
      return false
    },
  })
}

type ValueType<T> = T extends Promise<infer U> ? U : T

type ReturnType<T, U> = Promise<{ error: false | string; value: T } & ValueType<T>> &
  Chainable<T, U>

interface Chainable<T, U> {
  add: <V>(method: (value: T) => Promise<V>) => ReturnType<V, U>
}

export function it<T extends any>(promise: Promise<T>): ReturnType<T, T> {
  const next = [] // Additionally chained promises to be evaluated in series.

  const runPromise = (currentPromise: Promise<T>) => async (done: Function) => {
    let result: T
    let errorMessage: string

    try {
      result = await currentPromise
    } catch (error) {
      if (error instanceof Error && error.message) {
        errorMessage = error.message
      } else {
        errorMessage = error
      }
    }

    // Exist on first error as further promises would require the result.
    if (next.length && !errorMessage) {
      const nextPromise = next.shift()(result)
      result = await new Promise(runPromise(nextPromise))
      done(result)
    } else {
      const proxy = createAccessProxy(errorMessage, result)
      done(proxy)
    }
  }

  const returnPromise = new Promise(runPromise(promise)) as any

  returnPromise.add = (method: Function) => {
    next.push(method)
    return returnPromise
  }

  return returnPromise
}
