/** Wait for pixels and the owner's load callback before the first scene drawing. */
export default async function imageReady(image, initialized) {
  const loaded = new Promise((resolve, reject) => {
    let onLoad, onError
    const cleanup = () => {
      image.removeEventListener?.('load', onLoad)
      image.removeEventListener?.('error', onError)
    }
    onLoad = () => {
      cleanup()
      resolve()
    }
    onError = () => {
      cleanup()
      reject(new Error(`Image could not be loaded: ${image.src || 'unknown image'}`))
    }
    if (image.complete) {
      if (image.naturalWidth === 0) onError()
      else onLoad()
      return
    }
    image.addEventListener('load', onLoad, { once: true })
    image.addEventListener('error', onError, { once: true })
  })
  await Promise.all([loaded, initialized])
  if (image.decode) await image.decode()
  return image
}
