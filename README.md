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

## Asynchronous Error Handler

When an error is thrown but the `error` property isn't accessed errors can be sent to registered handlers.

```js
import { it, registerAsyncErrorHandler } from 'avait'
import { readFile } from 'fs/promises'

registerAsyncErrorHandler((error) => alert(error))

const { value } = await it(readFile('./my-file.txt', 'utf-8'))

console.log(`File contents: ${value}`)
```

## Credits

Error handling inspired by [await-to-js](https://github.com/scopsy/await-to-js).
Async to sync approach taken from [@prettier/sync](https://github.com/prettier/prettier-synchronized).
