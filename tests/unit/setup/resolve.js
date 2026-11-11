// Mirrors how the browser resolves this project's imports: root-relative paths and the import map in index.html.
const root = new URL('../../../', import.meta.url)

const importMap = {
  three: 'libs/three/build/three.module.min.js',
}

export function resolve(specifier, context, nextResolve) {
  if (importMap[specifier])
    return nextResolve(new URL(importMap[specifier], root).href, context)

  if (specifier.startsWith('three/'))
    return nextResolve(new URL(`libs/${specifier}`, root).href, context)

  if (specifier.startsWith('/') && !specifier.startsWith('//'))
    return nextResolve(new URL(`.${specifier}`, root).href, context)

  return nextResolve(specifier, context)
}
