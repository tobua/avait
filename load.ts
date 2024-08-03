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

// : Promise<{ error: boolean | string, status: number, data: T | null, text: string }>
export async function load<T>(url: string) {
  let response: Response
  try {
    response = await fetch(url)
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
  let data: T | undefined

  if (isJson(response)) {
    try {
      data = (await response.json()) as T
    } catch {
      data = undefined // Handle non-JSON response
    }
  } else {
    text = await response.text()
  }

  const error = response.ok ? false : response.statusText

  return { error, status, data, text, ...data }
}
