<p align="center">
  <img src="https://github.com/tobua/avait/raw/main/logo.png" alt="avait" width="50%">
</p>

# avait

Async error handling without try-catch.

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
  next.json()
)
// title => 'iPhone 9'
```

## Asynchronous Error Handler

When an error is thrown but the `error` property isn't accessed errors can be sent to registered handlers.

```js
import { it, registerAsyncErrorHandler } from 'avait'
import { readFile } from 'fs/promises'

registerAsyncErrorHandler((error) => alert(error))

const { value } = await it(readFile('./my-file.txt', 'utf-8'))

console.log(`File contents: ${value}`)
```

## Converting an Async Method to a Synchronous One

Using the `toSync` method it's possible to leverage node `worker_threads` to turn an async method into a synchronous one. This is usually not necessary nor recommended as asynchronous methods are supported in any environment nowadays. As the first argument the method accepts a module path or a file (basically anything that can be passed to `import`) with a specific export as the second argument which will default to the `default` export. The second argument can be an array in case multiple calls should be chained. Proper chaining is important as the final result needs to be serializable in order to be passed back from the worker. The function returned by `toSync` can then be synchronously be called adding any arguments as an array or in the case of chaining multiple arrays.

```js
import { toSync } from 'avait'

// Synchronize an async module.
const fileContents = toSync('fs/promises', 'readFile')('./my-file.txt', 'utf-8')
const { title } = toSync('node-fetch', ['default', 'json'])([
  ['https://dummyjson.com/products/1'],
  [],
])
const { id, description } = toSync('axios', ['get', 'data'])([['https://dummyjson.com/products/1']])

// Synchronize an async method from a local file.
const prased = toSync('../parse-data.js', 'parse')([[data]])
```

## Credits

Error handling inspired by [await-to-js](https://github.com/scopsy/await-to-js).

Async to sync approach taken from [@prettier/sync](https://github.com/prettier/prettier-synchronized).
