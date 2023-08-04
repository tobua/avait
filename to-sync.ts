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

export function createSynchronizedFunction(functionName: string, filePath: string) {
  return (...args: any[]) => {
    const signal = new Int32Array(new SharedArrayBuffer(4))
    const { port1: localPort, port2: workerPort } = new MessageChannel()
    createWorker()
    worker.postMessage({ signal, port: workerPort, functionName, args, filePath }, [workerPort])

    Atomics.wait(signal, 0, 0)

    const {
      message: { result, error, errorData },
    } = receiveMessageOnPort(localPort) ?? {}

    if (error) {
      throw Object.assign(error, errorData)
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
