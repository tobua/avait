import { cors } from '@elysiajs/cors'
import { Elysia, t } from 'elysia'

function getJson(_request: Request) {
  return Response.json({ posts: [] })
}

function postJson(_request: Request) {
  return Response.json({ method: 'POST', result: [] })
}

function putJson(_request: Request) {
  return Response.json({ method: 'PUT', result: 5 })
}

function deleteJson(_request: Request) {
  return Response.json({ method: 'DELETE', result: true })
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
  .post('/api/json', postJson, {
    body: t.Object({
      name: t.String(),
    }),
  })
  .put('/api/json', putJson, {
    body: t.Object({
      id: t.Number(),
      name: t.String(),
    }),
  })
  .delete('/api/json', deleteJson, {
    body: t.Number(),
  })
  .get('/api/text', getText)
  .listen(3000)
