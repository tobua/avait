import { Worker } from 'worker_threads'
import { test, expect } from 'vitest'
import { toSync } from '../index'
import { createSynchronizedFunction, createWorker } from '../to-sync'

test('Creates a worker.', () => {
  const worker = createWorker()
  expect(worker).toBeDefined()
  expect(worker).toBeInstanceOf(Worker)
})

test('Creates and resolves synchronized functions for various types.', () => {
  const regularMethod = createSynchronizedFunction('regularMethod', '../test/fixture/methods.js')
  expect(regularMethod()).toBe('done regular')

  const asyncWrappedMethod = createSynchronizedFunction(
    'asyncWrappedMethod',
    '../test/fixture/methods.js'
  )
  expect(asyncWrappedMethod()).toBe('done async wrapped')

  const asyncMethod = createSynchronizedFunction('asyncMethod', '../test/fixture/methods.js')
  expect(asyncMethod()).toBe('done async')

  const fsMethod = createSynchronizedFunction('readFile', 'fs/promises')
  expect(fsMethod('./test/fixture/some-text.txt', 'utf-8')).toBe('Hello World!')
})

test('Works with main toSync export.', () => {
  const asyncResult = toSync('asyncMethod', '../test/fixture/methods.js')()
  expect(asyncResult).toBe('done async')

  const fileResult = toSync('readFile', 'fs/promises')('./test/fixture/some-text.txt', 'utf-8')
  expect(fileResult).toBe('Hello World!')
})
