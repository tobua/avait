export const regularMethod = () => 'done regular'

export const asyncWrappedMethod = async () => Promise.resolve('done async wrapped')

export const asyncMethod = () => new Promise(done => { setTimeout(() => done('done async'), 10) })
