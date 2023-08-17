import { Worker, receiveMessageOnPort, MessageChannel } from 'worker_threads'
// import { pathToFileURL, fileURLToPath } from 'url'
// import { isAbsolute } from 'path'

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

// function getProperty(property, prettierEntry) {
//   return /** @type {Prettier} */ require(prettierEntry)[property]
// }

// function createDescriptor(getter) {
//   let value
//   return {
//     get: () => {
//       value ??= getter()
//       return value
//     },
//     enumerable: true,
//   }
// }

// function toImportId(entry) {
//   if (entry instanceof URL) {
//     return entry.href
//   }

//   if (typeof entry === 'string' && isAbsolute(entry)) {
//     return pathToFileURL(entry).href
//   }

//   return entry
// }

// function toRequireId(entry) {
//   if (entry instanceof URL || entry.startsWith('file:')) {
//     return fileURLToPath(entry)
//   }

//   return entry
// }
