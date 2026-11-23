import art from './wreckArt.js'
import { assets } from '/config.js'
import { canonicalImageSource, runtimeImageSource } from './imageSources.js'

const images = new Map()

/** Preload one shared wreck, addressed by the live resource; never resize the live actor. */
export function wreckFor(src) {
  const key = canonicalImageSource(src?.replace(/^.*\/assets\/images\//, ''))
  const descriptor = art[key]
  if (!descriptor) return null
  if (!images.has(descriptor.src)) {
    const image = new Image()
    image.src = assets.images + runtimeImageSource(descriptor.src)
    images.set(descriptor.src, image)
  }
  return images.get(descriptor.src)
}

/** Until the replacement finishes loading keep the previous body, rather than drawing an empty object. */
export function bodyImage(body) {
  const wreck = body.dead && wreckFor(body.image?.src)
  if (wreck?.complete && wreck.naturalWidth > 0) return wreck
  const target = body.body ?? body.damageBody
  const heavy = target?.alive && target.health.current < target.health.maximum / 4 && body.heavyArt?.image
  if (heavy?.complete && heavy.naturalWidth > 0) return heavy
  const damaged = target?.alive && target.health.current < target.health.maximum / 2 && body.damageArt?.image
  return damaged?.complete && damaged.naturalWidth > 0 ? damaged : body.image
}
