import { load } from './load'

export { load }

type ErrorHandler = (error: Error | string | string[]) => void

const handlers: ErrorHandler[] = []

export function registerErrorHandler(handler: ErrorHandler) {
  handlers.push(handler)
}

export function reset() {
  handlers.splice(0)
}

function createAccessProxy<T extends { [key: string | symbol]: any }>(error: string | string[] | false | undefined, value: T) {
  let errorPropertyAccessed = false
  const initialTarget = (typeof value === 'object' ? { error, value, ...value } : { error, value }) as {
    error: false | string
    value: T
  } & ValueType<T>

  return new Proxy<{ error: false | string; value: T } & ValueType<T>>(initialTarget, {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Splitting up won't do much.
    get(_, prop) {
      if (prop === 'then') {
        return null
      }
      if (prop === 'error' && !error && typeof value === 'object' && Object.hasOwn(value as object, 'error')) {
        errorPropertyAccessed = true
        return (value as any).error
      }
      if (prop === 'error') {
        errorPropertyAccessed = true
        return error
      }
      if (!errorPropertyAccessed && error) {
        for (const handler of handlers) {
          handler(error)
        }
      }
      if (prop === 'value') {
        return value
      }
      if (value && typeof value === 'object') {
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
      if (!value || typeof value !== 'object') {
        return []
      }
      return Object.keys(value)
    },
    isExtensible() {
      return false
    },
  })
}

function readableError(error: Error | string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return error as string
}

interface Options {
  parallel?: boolean
}

async function resolvePromises<T>(promises: Promise<T>[], options: Options) {
  const results: T[] = []
  const errors: string[] = []

  if (options.parallel) {
    try {
      return [(await Promise.all(promises)) as T[]] as const
    } catch (error) {
      return [[], Array.isArray(error) ? error.map(readableError) : [readableError(error as Error | string)]] as const
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const promise of promises) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await promise
      results.push(result)
    } catch (error) {
      errors.push(readableError(error as Error | string))
    }
  }

  return [results, errors.length ? errors : undefined] as const
}

type ValueType<T> = T extends Promise<infer U> ? U : T

type ReturnType<T, U> = Promise<{ error: false | string; value: T } & ValueType<T>> & Chainable<T, U>

interface Chainable<T, U> {
  add: <V>(method: (value: T) => Promise<V>) => ReturnType<V, U>
}

export function it<T>(promise: Promise<T> | Promise<T>[], options: Options = {}): ReturnType<T, T> {
  const next: Function[] = [] // Additionally chained promises to be evaluated in series.

  const runPromise = (currentPromise: Promise<T> | Promise<T>[]) => async (done: Function) => {
    let result: any
    let errorMessage: string | string[] | undefined

    try {
      ;[result, errorMessage] = Array.isArray(promise) ? await resolvePromises(promise, options) : [await currentPromise]
    } catch (error) {
      errorMessage = readableError(error as Error | string)
    }

    // Exist on first error as further promises would require the result.
    if (next.length && !errorMessage) {
      const nextPromise = (next.shift() as Function)(result)
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
