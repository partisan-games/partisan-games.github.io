/** Source cell inside a uniform atlas, excluding its transparent gutter. */
export default function atlasFrame(width, height, column, row, gutter = 0) {
  return [column * (width + 2 * gutter) + gutter, row * (height + 2 * gutter) + gutter, width, height]
}
