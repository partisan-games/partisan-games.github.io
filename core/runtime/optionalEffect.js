/** Development keeps native failures; production isolates each failed optional operation. */
export function createEffectHandler(development) {
  const failures = new WeakMap()

  function fail(owner, name, error) {
    if (development) throw error
    let failed = failures.get(owner)
    if (!failed) failures.set(owner, failed = new Set())
    if (!failed.has(name)) {
      failed.add(name)
      console.warn(`[Optional effect] ${name}${owner.file ? ` (${owner.file})` : ''}`, error)
    }
    return null
  }

  function run(owner, name, effect) {
    if (development) return effect()
    if (failures.get(owner)?.has(name)) return null
    try {
      const result = effect()
      return result?.then ? Promise.resolve(result).catch(error => fail(owner, name, error)) : result
    } catch (error) {
      return fail(owner, name, error)
    }
  }

  return { run, fail }
}

