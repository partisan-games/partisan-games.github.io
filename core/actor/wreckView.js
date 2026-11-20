import art from './wreckArt.js'
import { assets } from '/config.js'

const images = new Map()

/** Preload one shared wreck, addressed by the live resource; never resize the live actor. */
export function wreckFor(src) {
  const key = src?.replace(/^.*\/assets\/images\//, '')
  const descriptor = art[key]
  if (!descriptor) return null
  if (!images.has(descriptor.src)) {
    const image = new Image()
    image.src = assets.images + descriptor.src
    images.set(descriptor.src, image)
  }
  return images.get(descriptor.src)
}

/** Until the replacement finishes loading keep the previous body, rather than drawing an empty object. */
export function bodyImage(body) {
  const wreck = body.dead && wreckFor(body.image?.src)
  return wreck?.complete && wreck.naturalWidth > 0 ? wreck : body.image
}
