import { readFile } from 'fs/promises'
import { test, expect, vi, afterEach } from 'vitest'
import { it, registerAsyncErrorHandler, reset } from '../index'

afterEach(reset)

const successfulPromise = () =>
  new Promise<any>((done) => {
    setTimeout(() => done('Hey'))
  })

const objectReturnValue = { first: 123, second: 456, nested: { value: 789 } }
const objectPromise = () =>
  new Promise<typeof objectReturnValue>((done) => {
    setTimeout(() => done(objectReturnValue))
  })

const objectPromiseWithError = () =>
  new Promise<typeof objectReturnValue & { error: string }>((done) => {
    setTimeout(() => done({ ...objectReturnValue, error: 'Regular Value' }))
  })

const failingObjectPromise = () =>
  new Promise<typeof objectReturnValue>((_, reject) => {
    // eslint-disable-next-line prefer-promise-reject-errors
    setTimeout(() => reject('Error'))
  })

const failingPromise = () =>
  new Promise<any>((_, reject) => {
    setTimeout(() => {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject('Error')
    })
  })

const failingWithErrorPromise = () =>
  new Promise<any>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Custom Error'))
    })
  })

const thrownErrorPromise = () =>
  new Promise<any>(() => {
    throw new Error('Error Message')
  })

test('Can access the value.', async () => {
  const { value } = await it(successfulPromise())
  expect(value).toBe('Hey')
})

test('Can access the error and the value.', async () => {
  const { error, value } = await it(successfulPromise())
  expect(value).toBe('Hey')
  expect(error).toBe(undefined)
})

test('Can access the rejected promise error message.', async () => {
  const { error, value } = await it(failingPromise())
  expect(error).toBe('Error')
  expect(value).toBe(undefined)
})

test('Can access the rejected promise error.', async () => {
  const { error, value } = await it(failingWithErrorPromise())
  expect(error).toBe('Custom Error')
  expect(value).toBe(undefined)
})

test('Can access the thrown error message.', async () => {
  const { error, value } = await it(thrownErrorPromise())
  expect(error).toBe('Error Message')
  expect(value).toBe(undefined)
})

test('Can access the error and the spread object properties.', async () => {
  const {
    error,
    first,
    second,
    nested: { value },
  } = await it(objectPromise())
  expect(error).toBe(undefined)
  expect(first).toBe(123)
  expect(second).toBe(456)
  expect(value).toBe(789)
})

test('Any values can be accessed using the spread syntax.', async () => {
  const { error, ...values } = await it(objectPromise())
  expect(error).toBe(undefined)
  expect(values.first).toBe(123)
  expect(values.second).toBe(456)
  expect(values.nested.value).toBe(789)
  // @ts-expect-error
  expect(values.missing).toBe(undefined)
})

test('When present error values are merged.', async () => {
  const {
    error,
    nested: { value },
  } = await it(objectPromiseWithError())
  expect(error).toBe('Regular Value')
  expect(value).toBe(789)
})

test('Accessing missing properties will lead to a type error.', async () => {
  const {
    error,
    // @ts-expect-error
    missing,
    nested: { value },
  } = await it(objectPromise())
  expect(error).toBe(undefined)
  expect(missing).toBe(undefined)
  expect(value).toBe(789)
})

test("Error handler is called when error property isn't accessed.", async () => {
  const handlerMock = vi.fn()
  registerAsyncErrorHandler(handlerMock)
  const { value: firstValue } = await it(successfulPromise())
  expect(firstValue).toBe('Hey')
  expect(handlerMock).not.toHaveBeenCalled()

  const { value: secondValue } = await it(failingPromise())
  expect(secondValue).toBe(undefined)
  expect(handlerMock).toHaveBeenCalled()
  expect(handlerMock.mock.calls[0][0]).toBe('Error')
})

test('Multiple error handlers can be added.', async () => {
  const firstHandlerMock = vi.fn(() => {})
  const secondHandlerMock = vi.fn(() => {})
  registerAsyncErrorHandler(firstHandlerMock)
  registerAsyncErrorHandler(secondHandlerMock)
  const { value: firstValue } = await it(successfulPromise())
  expect(firstValue).toBe('Hey')
  expect(firstHandlerMock).not.toHaveBeenCalled()
  expect(secondHandlerMock).not.toHaveBeenCalled()

  const { value: secondValue } = await it(failingPromise())
  expect(secondValue).toBe(undefined)
  expect(firstHandlerMock).toHaveBeenCalled()
  expect(secondHandlerMock).toHaveBeenCalled()
})

test('Handler is called with spread properties.', async () => {
  const handlerMock = vi.fn()
  registerAsyncErrorHandler(handlerMock)
  const { first } = await it(failingObjectPromise())
  expect(first).toBe(undefined)
  expect(handlerMock).toHaveBeenCalled()
  expect(handlerMock.mock.calls[0][0]).toBe('Error')
})

test('The result object cannot be modified later.', async () => {
  const result = await it(successfulPromise())
  expect(() => {
    result.another = 5
  }).toThrow()
})

test('Example in the documentation is working.', async () => {
  const { error, value } = await it(readFile('./test/fixture/some-text.txt', 'utf-8'))

  expect(error).toBe(undefined)
  expect(value).toBe('Hello World!')
})

test('Example in the documentation is failing with missing file.', async () => {
  const { error } = await it(readFile('./test/fixture/missing.txt', 'utf-8'))

  expect(error).toContain('ENOENT')
})

test('Can be used with fetch.', async () => {
  const response = await it(fetch('https://dummyjson.com/products/1'))

  expect(response.error).toBe(undefined)
  expect(response.value).toBeInstanceOf(Response)

  const data = await it(response.value.json())

  expect(data.error).toBe(undefined)
  expect(data.title).toBe('iPhone 9')
})
