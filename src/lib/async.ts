export function withTimeout<T>(thenable: PromiseLike<T>, ms = 3000): Promise<Awaited<T>> {
  return Promise.race([
    Promise.resolve(thenable),
    new Promise<Awaited<T>>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}
