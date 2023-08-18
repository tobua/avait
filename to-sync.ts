import { Worker, receiveMessageOnPort, MessageChannel } from 'worker_threads'

let worker: Worker

export function createWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      require.resolve(process.env.NODE_ENV === 'production' ? './worker.js' : './dist/worker.js')
    )
    worker.unref()
  }

  return worker
}

interface JsonObject {
  [key: string]: SerializableValue
}
interface JsonArray extends Array<SerializableValue> {}
type SerializableValue = string | number | boolean | null | JsonObject | JsonArray

type FunctionArguments<T extends string | string[]> = T extends string[]
  ? SerializableValue[][]
  : SerializableValue[]

export function createSynchronizedFunction<T extends string | string[]>(
  filePathOrModule: string,
  functionName?: T
) {
  return (...args: FunctionArguments<T>) => {
    const signal = new Int32Array(new SharedArrayBuffer(4))
    const { port1: localPort, port2: workerPort } = new MessageChannel()
    createWorker()
    worker.postMessage(
      {
        signal,
        port: workerPort,
        functionName: Array.isArray(functionName) ? functionName : [functionName ?? 'default'],
        args: Array.isArray(functionName) ? args : [args],
        filePathOrModule,
      },
      [workerPort]
    )

    Atomics.wait(signal, 0, 0)

    const {
      message: { result = {}, error },
    } = receiveMessageOnPort(localPort) ?? {}

    if (error) {
      result.error = error
    }

    return result
  }
}
