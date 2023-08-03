<p align="center">
  <img src="https://github.com/tobua/avait/raw/main/logo.png" alt="avait" width="50%">
</p>

# avait

Async error handling without try-catch.

## Usage

```js
import { it } from 'avait'

const { error, value } = await it(readFile('./my-file.txt'))

if (error) return alert('Error')
console.log(`File contents: ${value}`)
```

## Asynchronous Error Handler

When an error is thrown but the `error` property isn't accessed errors can be sent to registered handlers.

```js
import { it, registerAsyncErrorHandler } from 'avait'

registerAsyncErrorHandler((error) => alert(error))

const { value } = await it(readFile('./my-file.txt'))

console.log(`File contents: ${value}`)
```
