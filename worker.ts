import { parentPort } from 'worker_threads'

async function callMethodFromFile({ functionName, args, filePath }) {
  const fileExports = await import(filePath)
  return fileExports[functionName](...args)
}

type Response = {
  result: any
  error?: any
  errorData?: object
}

parentPort.addListener('message', async ({ signal, port, functionName, args, filePath }) => {
  const response: Response = { result: null }

  try {
    response.result = await callMethodFromFile({
      functionName,
      args,
      filePath,
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
})
