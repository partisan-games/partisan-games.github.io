import optimized from './optimizedImages.js'

const originals = Object.fromEntries(Object.entries(optimized).map(([source, runtime]) => [runtime, source]))

function mapped(source, table) {
  if (!source) return source
  const match = source.match(/^(.*\/assets\/images\/)?([^?#]+)([?#].*)?$/)
  if (!match) return source
  const [, prefix = '', path, suffix = ''] = match
  return table[path] ? prefix + table[path] + suffix : source
}

/** Canonical PNG identity and atlas metadata remain stable; only the verified download changes. */
export const runtimeImageSource = source => mapped(source, optimized)
export const canonicalImageSource = source => mapped(source, originals)
