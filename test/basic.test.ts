import { readFile } from 'fs/promises'
import { test, expect, mock, afterEach } from 'bun:test'
import { it, registerErrorHandler, reset } from '../index'
import * as promise from './promises'

afterEach(reset)

test('Can access the value.', async () => {
  const { value } = await it(promise.successfulPromise())
  expect(value).toBe('Hey')
})

test('Can access the error and the value.', async () => {
  const { error, value } = await it(promise.successfulPromise())
  expect(value).toBe('Hey')
  expect(error).not.toBeDefined()
})

test('Can access the rejected promise error message.', async () => {
  const { error, value } = await it(promise.failingPromise())
  expect(error).toBe('Error')
  expect(value).not.toBeDefined()
})

test('Can access the rejected promise error.', async () => {
  const { error, value } = await it(promise.failingWithErrorPromise())
  expect(error).toBe('Custom Error')
  expect(value).not.toBeDefined()
})

test('Can access an early thrown error.', async () => {
  const { error, value } = await it(promise.earlyErrorPromise())
  // @ts-ignore
  expect(error).toBe('Early Error')
  expect(value).not.toBeDefined()
})

test('Can access the value in a chain of promises.', async () => {
  const { error, value } = await it(promise.chainPromise())
  expect(error).not.toBeDefined()
  expect(value).toBe(15)
})

test('Can access the error in a chain of erroneous promises.', async () => {
  const { error, value } = await it(promise.erroneousChainPromise())
  expect(error).toBe('Late Error 15')
  expect(value).not.toBeDefined()
})

test('Can access the thrown error message.', async () => {
  const { error, value } = await it(promise.thrownErrorPromise())
  expect(error).toBe('Error Message')
  expect(value).not.toBeDefined()
})

test('Can access the error and the spread object properties.', async () => {
  const {
    error,
    first,
    second,
    nested: { value },
  } = await it(promise.objectPromise())
  expect(error).not.toBeDefined()
  expect(first).toBe(123)
  expect(second).toBe(456)
  expect(value).toBe(789)
})

test('Any values can be accessed using the spread syntax.', async () => {
  const { error, ...values } = await it(promise.objectPromise())
  expect(error).not.toBeDefined()
  expect(values.first).toBe(123)
  expect(values.second).toBe(456)
  expect(values.nested.value).toBe(789)
  // @ts-expect-error
  expect(values.missing).not.toBeDefined()
})

test('When present error values are merged.', async () => {
  const {
    error,
    nested: { value },
  } = await it(promise.objectPromiseWithError())
  expect(error).toBe('Regular Value')
  expect(value).toBe(789)
})

test('Accessing missing properties will lead to a type error.', async () => {
  const {
    error,
    // @ts-expect-error
    missing,
    nested: { value },
  } = await it(promise.objectPromise())
  expect(error).not.toBeDefined()
  expect(missing).not.toBeDefined()
  expect(value).toBe(789)
})

test("Error handler is called when error property isn't accessed.", async () => {
  const handlerMock = mock()
  registerErrorHandler(handlerMock)
  const { value: firstValue } = await it(promise.successfulPromise())
  expect(firstValue).toBe('Hey')
  expect(handlerMock).not.toHaveBeenCalled()

  const { value: secondValue } = await it(promise.failingPromise())
  expect(secondValue).not.toBeDefined()
  expect(handlerMock).toHaveBeenCalled()
  expect(handlerMock.mock.calls[0][0]).toBe('Error')
})

test('Multiple error handlers can be added.', async () => {
  const firstHandlerMock = mock(() => {})
  const secondHandlerMock = mock(() => {})
  registerErrorHandler(firstHandlerMock)
  registerErrorHandler(secondHandlerMock)
  const { value: firstValue } = await it(promise.successfulPromise())
  expect(firstValue).toBe('Hey')
  expect(firstHandlerMock).not.toHaveBeenCalled()
  expect(secondHandlerMock).not.toHaveBeenCalled()

  const { value: secondValue } = await it(promise.failingPromise())
  expect(secondValue).not.toBeDefined()
  expect(firstHandlerMock).toHaveBeenCalled()
  expect(secondHandlerMock).toHaveBeenCalled()
})

test('Handler is called with spread properties.', async () => {
  const handlerMock = mock()
  registerErrorHandler(handlerMock)
  const { first } = await it(promise.failingObjectPromise())
  expect(first).not.toBeDefined()
  expect(handlerMock).toHaveBeenCalled()
  expect(handlerMock.mock.calls[0][0]).toBe('Error')
})

test('The result object cannot be modified later.', async () => {
  const result = await it(promise.successfulPromise())
  expect(() => {
    result.another = 5
  }).toThrow()
})

test('Example in the documentation is working.', async () => {
  const { error, value } = await it(readFile('./test/fixture/some-text.txt', 'utf-8'))

  expect(error).not.toBeDefined()
  expect(value).toBe('Hello World!')
})

test('Example in the documentation is failing with missing file.', async () => {
  const { error } = await it(readFile('./test/fixture/missing.txt', 'utf-8'))

  expect(error).toContain('No such file or directory')
})

test('Can be used with fetch.', async () => {
  const response = await it(fetch('https://dummyjson.com/products/1'))

  expect(response.error).not.toBeDefined()
  expect(response.value).toBeInstanceOf(Response)

  const data = await it(response.value.json())

  expect(data.error).not.toBeDefined()
  expect(data.title).toContain('Mascara')
})

test('Several async calls can be added.', async () => {
  const data = await it(promise.chainedPromise())
    .add((next) => next.another())
    .add((next) => next.oneMoreLevel())

  expect(data.error).not.toBeDefined()
  // @ts-expect-error
  const value: number = data.level // Should be inferred as string.
  // @ts-expect-error
  expect(value).toBe('3')
})

test('Promises can be added with fetch.', async () => {
  const data = await it(fetch('https://dummyjson.com/products/1')).add((next) => next.json())

  expect(data.error).not.toBeDefined()
  expect(data.title).toContain('Mascara')
})

test('An error in added in promises is collected.', async () => {
  const data = await it(promise.chainedPromiseWithErrors())
    .add((next) => next.another())
    .add((next) => next.oneMoreLevel())

  expect(data.error).toBe('level 3 error')
})

test('An error in the middle of the added in promises is collected.', async () => {
  const data = await it(promise.chainedPromiseWithErrors([2]))
    .add((next) => next.another())
    .add((next) => next.oneMoreLevel())

  expect(data.error).toBe('level 2 error')
})

test('First thrown error is returned.', async () => {
  const data = await it(promise.chainedPromiseWithErrors([1, 2, 3]))
    .add((next) => next.another())
    .add((next) => next.oneMoreLevel())

  expect(data.error).toBe('level 1 error')
})

test('An error in the middle of the rejected in promises is returned.', async () => {
  const data = await it(promise.chainedPromiseWithRejects([2]))
    .add((next) => next.another())
    .add((next) => next.oneMoreLevel())

  expect(data.error).toBe('level 2 reject')
})

test('The first rejected promise is returned.', async () => {
  const data = await it(promise.chainedPromiseWithRejects([1, 2]))
    .add((next) => next.another())
    .add((next) => next.oneMoreLevel())

  expect(data.error).toBe('level 1 reject')
})
