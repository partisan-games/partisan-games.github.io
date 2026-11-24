import { NearestFilter, SRGBColorSpace, Sprite, SpriteMaterial, TextureLoader } from 'three'
import { assets } from '/config.js'

const loader = new TextureLoader()

/** A pixel-art picture under the images folder, sharp up close; each view that shows it makes its own billboard. */
export async function loadPixelArt(src) {
  const texture = await loader.loadAsync(assets.images + src)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  return texture
}

/**
 * A flat picture that always faces the camera, standing on its foot point, `pxPerMeter` of the art to a metre; an
 * atlas of `columns` by `rows` frames shows one frame at a time. It has a copy of the texture of its own, which
 * shares the picture, so the scene frees both when it ends.
 */
export function billboard(texture, { pxPerMeter, columns = 1, rows = 1 }) {
  const map = texture.clone()
  map.repeat.set(1 / columns, 1 / rows)
  const sprite = new Sprite(new SpriteMaterial({ map, alphaTest: .5 }))
  sprite.center.set(.5, 0)
  sprite.scale.set(texture.image.width / columns / pxPerMeter, texture.image.height / rows / pxPerMeter, 1)
  showFrame(sprite, 0)
  return sprite
}

/** Shows the frame in `column` and `row` of the billboard's atlas, the top row 0. */
export function showFrame(sprite, column, row = 0) {
  const { map } = sprite.material
  map.offset.set(column * map.repeat.x, 1 - (row + 1) * map.repeat.y)
}
