import { Worker } from 'worker_threads'
import { test, expect } from 'vitest'
import { toSync, createSynchronizedFunction, createWorker } from '../synchronize'

test('Creates a worker.', () => {
  const worker = createWorker()
  expect(worker).toBeDefined()
  expect(worker).toBeInstanceOf(Worker)
})

test('Creates and resolves synchronized functions for various types.', () => {
  const regularMethod = createSynchronizedFunction('../test/fixture/methods.js', 'regularMethod')
  expect(regularMethod()).toBe('done regular')

  const asyncWrappedMethod = createSynchronizedFunction(
    '../test/fixture/methods.js',
    'asyncWrappedMethod',
  )
  expect(asyncWrappedMethod()).toBe('done async wrapped')

  const asyncMethod = createSynchronizedFunction('../test/fixture/methods.js', 'asyncMethod')
  expect(asyncMethod()).toBe('done async')

  const fsMethod = createSynchronizedFunction('fs/promises', 'readFile')
  expect(fsMethod('./test/fixture/some-text.txt', 'utf-8')).toBe('Hello World!')

  const missingMethod = createSynchronizedFunction('../test/fixture/missing.js', 'missingMethod')
  expect(missingMethod()).toContain('Failed to import')

  const chainedFetch = createSynchronizedFunction('node-fetch', ['default', 'json'])
  expect(chainedFetch([['https://dummyjson.com/products/1'], []]).title).toBe('iPhone 9')
})

test('Works with main toSync export.', () => {
  const asyncResult = toSync('../test/fixture/methods.js', 'asyncMethod')()
  expect(asyncResult).toBe('done async')

  const fileResult = toSync('fs/promises', 'readFile')('./test/fixture/some-text.txt', 'utf-8')
  expect(fileResult).toBe('Hello World!')
})

test('Can synchronize common inherently asynchronous network operations.', () => {
  const nodeFetchResult = toSync('node-fetch', ['default', 'json'])([
    ['https://dummyjson.com/products/1'],
    [],
  ])

  expect(nodeFetchResult.error).toBeUndefined()
  expect(nodeFetchResult.title).toBe('iPhone 9')

  const missingNodeFetchResult = toSync('node-fetch', ['default', 'json'])([
    ['https://dummyjson.com/produc/1'],
    [],
  ])

  expect(missingNodeFetchResult.error.message).toContain('Unexpected token')
  expect(missingNodeFetchResult.error.name).toBe('SyntaxError')
  expect(missingNodeFetchResult.error.toString()).toContain('SyntaxError')

  const axiosResult = toSync('axios', ['get', 'data'])([['https://dummyjson.com/products/1']])
  expect(axiosResult.title).toBe('iPhone 9')
})
