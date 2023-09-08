import { test, expect, vi, afterEach } from 'vitest'
import { it, registerErrorHandler, reset } from '../index'
import * as promise from './promises'

afterEach(reset)

test('Can run multiple promises.', async () => {
  const { value, error } = await it([promise.successfulPromise(), promise.successfulPromise()])

  expect(error).toBe(undefined)
  expect(Array.isArray(value)).toBe(true)
  expect(value).toEqual(['Hey', 'Hey'])
})

test('All errors will be returned when running multiple promises.', async () => {
  const { value, error } = await it([
    promise.successfulPromise(),
    promise.failingPromise(),
    promise.failingPromise(),
  ])

  expect(error).toEqual(['Error', 'Error'])
  expect(value).toEqual(['Hey'])
})

test('Will evaluate promises in parallel.', async () => {
  const { value, error } = await it([promise.successfulPromise(), promise.successfulPromise()], {
    parallel: true,
  })

  expect(error).toBe(undefined)
  expect(Array.isArray(value)).toBe(true)
  expect(value).toEqual(['Hey', 'Hey'])
})

test('When registered the error handler will be called.', async () => {
  const handlerMock = vi.fn()
  registerErrorHandler(handlerMock)

  const { value } = await it([
    promise.failingPromise(),
    promise.successfulPromise(),
    promise.objectPromise(),
  ])

  expect(Array.isArray(value)).toBe(true)
  expect(value[0]).toBe('Hey')
  expect(value[1].second).toBe(456)

  expect(handlerMock).toHaveBeenCalled()
  expect(handlerMock.mock.calls[0][0]).toEqual(['Error'])
})
