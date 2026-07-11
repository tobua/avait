import { afterEach, expect, test } from 'bun:test'
import { it, reset } from '../index'
// biome-ignore lint/style/noNamespaceImport: Not published.
import * as promise from './promises'

afterEach(reset)

test('Proper types are inferred.', async () => {
  const { value } = await it(promise.successfulStringPromise())
  expect(value).toBeTypeOf('string')
  expect(value).not.toBeTypeOf('number')
})
