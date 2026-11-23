import { canonicalImageSource } from '/core/actor/imageSources.js'

/**
 * Makes every picture load at once with a size, as in a browser, so views measure and cull themselves as they would
 * there: 256 × 128 px, or the size given for a file whose path ends with a key of `sizes`.
 */
export function loadImages(t, sizes = {}) {
  class LoadedImage extends EventTarget {
    naturalWidth = 256
    naturalHeight = 128
    set src(value) {
      this.url = value
      const size = Object.entries(sizes).find(([ending]) => canonicalImageSource(value).endsWith(ending))?.[1]
      if (size) [this.naturalWidth, this.naturalHeight] = size
      queueMicrotask(() => {
        this.complete = true
        this.onload?.()
        this.dispatchEvent(new Event('load'))
      })
    }
    get src() {
      return this.url
    }
    decode() {
      return Promise.resolve()
    }
  }
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  Object.defineProperty(globalThis, 'Image', { value: LoadedImage, configurable: true, writable: true })
  t.after(() => Object.defineProperty(globalThis, 'Image', descriptor))
}
