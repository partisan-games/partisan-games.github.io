/** Supply the Node variables expected by the vendored Ammo UMD build, without changing its physics code. */
export async function load(url, context, nextLoad) {
  const loaded = await nextLoad(url, context)
  if (url !== new URL('../../../libs/ammo.js', import.meta.url).href) return loaded
  return { ...loaded, source: `
    import { createRequire } from 'node:module'
    import { fileURLToPath } from 'node:url'
    import { dirname } from 'node:path'
    const require = createRequire(import.meta.url)
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    ${loaded.source}
  ` }
}
