function isJson(response: Response) {
  const headers: any = response.headers
  let contentType = ''

  for (const [key, value] of headers.entries()) {
    if (key.toLowerCase() === 'content-type') {
      contentType = value
      break
    }
  }

  return contentType.includes('application/json')
}

function getMethod(data?: object | number) {
  const type = typeof data
  if (type === 'undefined') {
    return 'GET'
  }

  if (type === 'number' || type === 'string') {
    return 'DELETE'
  }

  if (type === 'object') {
    // Uuse put if ID is found on data (usually used to find an existing resource).
    return Object.hasOwn(data as object, 'id') ? 'PUT' : 'POST'
  }

  return 'GET'
}

// : Promise<{ error: boolean | string, status: number, data: T | null, text: string }>
export async function load<T>(url: string, data?: object | number) {
  let response: Response
  const hasData = typeof data !== 'undefined'

  try {
    response = await fetch(url, {
      method: getMethod(data),
      body: hasData ? JSON.stringify(data) : undefined,
      headers: hasData
        ? {
            'Content-Type': 'application/json',
          }
        : undefined,
    })
  } catch (_error) {
    return { error: true, status: 500 } as {
      error: string | boolean
      status: number
      data: T
      text: string
    } & T
  }

  const status = response.status
  let text: string | undefined
  let responseData: T | undefined

  if (isJson(response)) {
    try {
      responseData = (await response.json()) as T
    } catch {
      responseData = undefined // Handle non-JSON response
    }
  } else {
    text = await response.text()
  }

  const error = response.ok ? false : response.statusText

  return { error, status, data: responseData, text, ...responseData }
}
