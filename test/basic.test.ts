import { test, expect } from 'vitest'
import { it } from '../index'

const successfulPromise = () =>
  new Promise<any>((done) => {
    setTimeout(() => done('Hey'))
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
