const handlers = []

export function registerAsyncErrorHandler(handler: (error: Error) => void) {
  handlers.push(handler)
}

function createAccessProxy<T extends any>(error: string | false, value: T) {
  let errorPropertyAccessed = false

  return new Proxy<{ error: false | string; value: T }>(
    { error, value },
    {
      get(target, prop) {
        console.log('get', target, prop)
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
    }
  )
}

export async function it<T extends any>(
  promise: Promise<T>
): Promise<{ error: false | string; value: T }> {
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
