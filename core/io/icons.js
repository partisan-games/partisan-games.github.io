import atlas from '/assets/images/sources/ui-icons/source.json' with { type: 'json' }
import { assets } from '/config.js'

const columns = atlas.atlas.width / atlas.cell.width
const rows = atlas.atlas.height / atlas.cell.height
/** The atlas picture, named by its contents so a redrawn atlas is never taken from the cache. */
const atlasUrl = `${assets.images}ui/pixel-icons.webp?v=${atlas.sha256.slice(0, 8)}`
const share = (offset, cell, count) => count > 1 ? offset / cell / (count - 1) * 100 : 0

/** One icon of the atlas as markup: a box the stylesheet sizes (`.icon-art`), the cell filling it whatever its size. */
const art = name => {
  const { x, y } = atlas.icons[name]
  return `<span class="icon-art" role="img" aria-label="${name}" style="background-image: url('${atlasUrl}'); ` +
    `background-size: ${columns * 100}% ${rows * 100}%; ` +
    `background-position: ${share(x, atlas.cell.width, columns)}% ${share(y, atlas.cell.height, rows)}%"></span>`
}

/** Every icon the games show, by its meaning, as markup to put into buttons, windows and the HUD. */
export const icons = Object.freeze(Object.fromEntries(Object.keys(atlas.icons).map(name => [name, art(name)])))

/** Paths are relative to the image root, independent of UI and game classes. */
export const iconImages = Object.freeze({
  ammunition: 'game-ready/projektili/granata.webp',
  coin: 'ui/coin.gif',
  coinStill: 'ui/coin-still.png',
  /** The one gun sight: in the middle of a first-person view, and the pointer where the player aims with the mouse. */
  sight: 'ui/crosshair.png',
})
