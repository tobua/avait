export { createSynchronizedFunction as toSync } from './to-sync'

type ValueType<T> = T extends object ? T : { value: T }

const handlers = []

export function registerAsyncErrorHandler(handler: (error: Error) => void) {
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

export async function it<T extends any>(
  promise: Promise<T>
): Promise<{ error: false | string; value: T } & ValueType<T>> {
  let result: T
  let errorMessage: string

  try {
    result = await promise
  } catch (error) {
    if (error instanceof Error && error.message) {
      errorMessage = error.message
    } else {
      errorMessage = error
    }
  }

  return createAccessProxy(errorMessage, result)
}
