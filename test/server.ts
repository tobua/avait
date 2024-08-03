import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

function getJson(_request: Request) {
  return Response.json({ posts: [] })
}

function getText(_request: Request) {
  return new Response('Hello World')
}

new Elysia()
  .onBeforeHandle(({ request }) => {
    // biome-ignore lint/suspicious/noConsoleLog: Info for tests.
    console.log(`${request.method} request to ${request.url}`)
  })
  .use(cors())
  .get('/api/json', getJson)
  .get('/api/text', getText)
  .listen(3000)
