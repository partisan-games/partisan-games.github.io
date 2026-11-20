/** Gives a block's image the size of its atlas and runs `onload`: happy-dom does not load images. */
export function loadAtlas(object, width, height) {
  Object.defineProperties(object.image, {
    naturalWidth: { value: width, configurable: true },
    naturalHeight: { value: height, configurable: true },
  })
  object.image.onload()
}
