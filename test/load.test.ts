import { expect, test } from 'bun:test'
import { load } from '../index'
import './server' // Simple mock server using Elysia.

test('Can access data from a JSON response.', async () => {
  const { error, status, data, text, ...props } = await load('http://localhost:3000/api/json')

  expect(error).toBe(false)
  expect(status).toBe(200)
  expect(data).toEqual({ posts: [] })
  expect(text).not.toBeDefined()
  expect(props).toEqual({ posts: [] })
})

test('Can access data from a regular text response.', async () => {
  const { error, status, data, text, ...props } = await load('http://localhost:3000/api/text')

  expect(error).toBe(false)
  expect(status).toBe(200)
  expect(data).not.toBeDefined()
  expect(text).toBe('Hello World')
  expect(props).toEqual({})
})

test('The returned data can be typed.', async () => {
  const { error, status, data, text, posts } = await load<{ posts: unknown[] }>('http://localhost:3000/api/json')

  expect(error).toBe(false)
  expect(status).toBe(200)
  expect(data.posts.length).toBe(0)
  expect(text).not.toBeDefined() // text.length accessible.
  expect(posts.length).toBe(0)
})

test('Can make a POST request.', async () => {
  const { error, status, data, text, ...props } = await load('http://localhost:3000/api/json', { name: "I'm posting!" })

  expect(error).toBe(false)
  expect(status).toBe(200)
  expect(data).toEqual({ method: 'POST', result: [] })
  expect(text).not.toBeDefined()
  expect(props).toEqual({ method: 'POST', result: [] })
})

test('Can make a PUT request.', async () => {
  const { error, status, data, text, ...props } = await load('http://localhost:3000/api/json', { id: 7, name: "I'm putting!" })

  expect(error).toBe(false)
  expect(status).toBe(200)
  expect(data).toEqual({ method: 'PUT', result: 5 })
  expect(text).not.toBeDefined()
  expect(props).toEqual({ method: 'PUT', result: 5 })
})

test('Can make a DELETE request.', async () => {
  const { error, status, data, text, ...props } = await load('http://localhost:3000/api/json', 3)

  expect(error).toBe(false)
  expect(status).toBe(200)
  expect(data).toEqual({ method: 'DELETE', result: true })
  expect(text).not.toBeDefined()
  expect(props).toEqual({ method: 'DELETE', result: true })
})
