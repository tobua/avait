<p align="center">
  <img src="https://github.com/tobua/avait/raw/main/logo.png" alt="avait" width="50%">
</p>

# avait

Async error handling and fetch without try-catch.

## Usage

```js
import { it } from 'avait'
import { readFile } from 'fs/promises'

const { error, value } = await it(readFile('./my-file.txt', 'utf-8'))

if (error) return alert('Error')
console.log(`File contents: ${value}`)
```

It's possible to resolve multiple promises in a row.

```js
const { error, title } = await it(fetch('https://dummyjson.com/products/1')).add((next) =>
  next.json(),
)
// title => 'iPhone 9' or similar.
```

## Error Handler

When an error is thrown but the `error` property isn't accessed errors will be sent to any registered error handlers.

```ts
import { it, registerErrorHandler } from 'avait'
import { readFile } from 'fs/promises'

registerErrorHandler((error) => alert(error))

const { value } = await it(readFile('./my-file.txt', 'utf-8'))

console.log(`File contents: ${value}`)
```

## Multiple Promises

It's possible to pass an array of promises. In this case the result `value` as well as the `error` will also be returned as an array. Using the second argument parallelism can be enabled which leads to the promises being run in parallel.

```ts
import { it } from 'avait'

const { value } = await it([firstPromise, secondPromise])
console.log(value[0])
// With parallelism enabled
const { value } = await it([firstPromise, secondPromise], { parallel: true })
console.log(value[1])
```

## Simple `fetch`

This is a super small wrapper around `fetch` that's supposed to make error handling and accessing the data simple.

```ts
import { load } from 'avait'

const { error, status, data, text } = await load('http://localhost:3000/api') // GET method

// error: boolean | string, indicating if the request errored.
// status: The HTTP status code.
// data: parsed JSON data if response is JSON.
// text: string, text content if response contains text.
// ...props: For a JSON response top-level object properties will be spread on the return object.


await load('http://localhost:3000/api', { name: 'John Doe' }) // POST method
await load('http://localhost:3000/api', { id: 1, name: 'John Doe' }) // PUT method
await load('http://localhost:3000/api', 1) // DELETE method
```

## Converting an Async Method to a Synchronous One

> [!IMPORTANT]
> This feature has been removed with Version 2 of this plugin. I haven't found it useful and it currently doensn't work with Bun. Check out [make-synchronized](https://github.com/fisker/make-synchronized) if you're looking to provide a synchronized interface to an asynchronous method.

## Credits

Error handling inspired by [await-to-js](https://github.com/scopsy/await-to-js).
