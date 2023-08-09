import { parentPort } from 'worker_threads'

// TODO implement chaining of promises to ensure serializability of response.
async function callMethodFromFile({ functionName, args, filePathOrModule }) {
  const fileExports = await import(filePathOrModule)
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
  errorData?: object
}

parentPort.addListener(
  'message',
  async ({ signal, port, functionName, args, filePathOrModule }) => {
    const response: Response = { result: null }

    try {
      response.result = await callMethodFromFile({
        functionName,
        args,
        filePathOrModule,
      })
    } catch (error) {
      response.error = error
      response.errorData = { ...error }
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
