import { parentPort } from 'worker_threads'

async function callMethodFromFile({
  functionName,
  args,
  filePathOrModule,
}: {
  functionName: string | Function
  args: any[]
  filePathOrModule: string
}) {
  // Directly return promise from previous result.
  if (typeof functionName !== 'string') {
    if (typeof functionName === 'function') {
      const result = functionName(...(args ?? []))
      return result
    }
    return functionName
  }

  let fileExports = null

  // Import module or file.
  try {
    fileExports = await import(filePathOrModule)
  } catch (error) {
    return `Failed to import "${filePathOrModule}" from ${process.cwd()}.`
  }

  // Determine correct export and call with arguments.
  if (
    !fileExports[functionName] &&
    typeof fileExports.default !== 'undefined' &&
    fileExports.default[functionName]
  ) {
    return fileExports.default[functionName](...args)
  }
  if (typeof fileExports[functionName] !== 'function') {
    return null
  }
  return fileExports[functionName](...args)
}

type Response = {
  result: any
  error?: any
}

parentPort.addListener(
  'message',
  async ({
    signal,
    port,
    functionName,
    args,
    filePathOrModule,
  }: {
    signal: Int32Array
    port: MessagePort
    functionName: string[]
    args: any[][]
    filePathOrModule: string
  }) => {
    const response: Response = { result: null }
    let result = null

    const functionPromises = functionName.map((name, index) => async (previousResult) => {
      try {
        response.result = await callMethodFromFile({
          // Cannot pass previousResult[name] to callMethodFromFile as it would lose context.
          functionName: previousResult
            ? (...innerArgs: any[]) => {
                if (typeof previousResult[name] === 'function') {
                  return previousResult[name](innerArgs)
                }

                return previousResult[name]
              }
            : name,
          args: args[index],
          filePathOrModule,
        })
      } catch (error) {
        response.error = error
      }

      return response.result
    })

    // eslint-disable-next-line no-restricted-syntax
    for (const promiseFn of functionPromises) {
      // eslint-disable-next-line no-await-in-loop
      result = await promiseFn(result)
    }

    try {
      port.postMessage(response)
    } catch {
      port.postMessage({
        error: new Error('Cannot serialize worker response'),
      })
    } finally {
      port.close()
      Atomics.store(signal, 0, 1)
      Atomics.notify(signal, 0)
    }
  }
)
