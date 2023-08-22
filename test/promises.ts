export const successfulPromise = () =>
  new Promise<any>((done) => {
    setTimeout(() => done('Hey'))
  })

const objectReturnValue = { first: 123, second: 456, nested: { value: 789 } }
export const objectPromise = () =>
  new Promise<typeof objectReturnValue>((done) => {
    setTimeout(() => done(objectReturnValue), 2)
  })

export const objectPromiseWithError = () =>
  new Promise<typeof objectReturnValue & { error: string }>((done) => {
    setTimeout(() => done({ ...objectReturnValue, error: 'Regular Value' }), 2)
  })

export const failingObjectPromise = () =>
  new Promise<typeof objectReturnValue>((_, reject) => {
    // eslint-disable-next-line prefer-promise-reject-errors
    setTimeout(() => reject('Error'), 2)
  })

export const failingPromise = () =>
  new Promise<any>((_, reject) => {
    setTimeout(() => {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject('Error')
    }, 2)
  })

export const failingWithErrorPromise = () =>
  new Promise<any>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Custom Error'))
    }, 2)
  })

export const thrownErrorPromise = () =>
  new Promise<any>(() => {
    throw new Error('Error Message')
  })

export const chainedPromise = () =>
  new Promise<{
    level: number
    another: () => Promise<{
      level: number
      oneMoreLevel: () => Promise<{ level: string }>
    }>
  }>((done) => {
    setTimeout(
      () =>
        done({
          level: 1,
          another: () =>
            new Promise<{ level: number; oneMoreLevel: () => Promise<{ level: string }> }>(
              (done1) => {
                setTimeout(
                  () =>
                    done1({
                      level: 2,
                      oneMoreLevel: () =>
                        new Promise<{ level: string }>((done2) => {
                          setTimeout(() => done2({ level: '3' }), 2)
                        }),
                    }),
                  2
                )
              }
            ),
        }),
      2
    )
  })

export const chainedPromiseWithErrors = (level = [3]) =>
  new Promise<{
    level: number
    another: () => Promise<{
      level: number
      oneMoreLevel: () => Promise<{ level: string }>
    }>
  }>((done) => {
    if (level.includes(1)) {
      throw new Error('level 1 error')
    }
    setTimeout(() =>
      done({
        level: 1,
        another: () =>
          new Promise<{ level: number; oneMoreLevel: () => Promise<{ level: string }> }>(
            (done1) => {
              if (level.includes(2)) {
                throw new Error('level 2 error')
              }
              setTimeout(() =>
                done1({
                  level: 2,
                  oneMoreLevel: () =>
                    new Promise<{ level: string }>((done2) => {
                      if (level.includes(3)) {
                        throw new Error('level 3 error')
                      }
                      setTimeout(() => done2({ level: '3' }))
                    }),
                })
              )
            }
          ),
      })
    )
  })

export const chainedPromiseWithRejects = (level = [3]) =>
  new Promise<{
    level: number
    another: () => Promise<{
      level: number
      oneMoreLevel: () => Promise<{ level: string }>
    }>
  }>((done, reject) => {
    if (level.includes(1)) {
      reject(new Error('level 1 reject'))
    }
    setTimeout(() =>
      done({
        level: 1,
        another: () =>
          new Promise<{ level: number; oneMoreLevel: () => Promise<{ level: string }> }>(
            (done1, reject1) => {
              if (level.includes(2)) {
                reject1(new Error('level 2 reject'))
              }
              setTimeout(() =>
                done1({
                  level: 2,
                  oneMoreLevel: () =>
                    new Promise<{ level: string }>((done2, reject2) => {
                      if (level.includes(3)) {
                        reject2(new Error('level 3 reject'))
                      }
                      setTimeout(() => done2({ level: '3' }))
                    }),
                })
              )
            }
          ),
      })
    )
  })

export const earlyErrorPromise = async () => {
  throw new Error('Early Error')
}

export const chainPromise = async () => {
  const value = await new Promise<number>((done) => {
    setTimeout(() => done(5), 10)
  })
  return new Promise<number>((done) => {
    setTimeout(() => done(value * 3), 10)
  })
}

export const erroneousChainPromise = async () => {
  const value = await new Promise<number>((done) => {
    setTimeout(() => done(5), 10)
  })
  return new Promise<number>((_, reject) => {
    setTimeout(() => reject(new Error(`Late Error ${value * 3}`)), 10)
  })
}
