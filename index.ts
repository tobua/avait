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
  const initialTarget = (typeof value === 'object' ? { error, ...value } : { error, value }) as {
    error: false | string
  } & ValueType<T>

  return new Proxy<{ error: false | string } & ValueType<T>>(initialTarget, {
    get(_, prop) {
      if (prop === 'then') {
        return null
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
      if (typeof value === 'object') {
        if (Object.hasOwn(value, prop)) {
          return value[prop]
        }
        return undefined
      }
      return value
    },
    // set: function (target, prop, val) {
    //   value = val;
    //   return true;
    // },
    // has: function (target, prop) {
    //   return true;
    // },
    // getOwnPropertyDescriptor: function (target, prop) {
    //   return {
    //     configurable: true,
    //     enumerable: true,
    //   };
    // },
    // ownKeys: function (target) {
    //   return [];
    // },
    // isExtensible: function (target) {
    //   return false;
    // },
  })
}

export async function it<T extends any>(
  promise: Promise<T>
): Promise<{ error: false | string } & ValueType<T>> {
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
