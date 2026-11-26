import Background from '/core/objects/Background.js'
import Partisan from '/core/gameplay/bodies/soldiers/Partisan.js'
import PartisanSprite from '/core/actor/soldiers/PartisanSprite.js'
import { sideProjection } from '/core/actor/projection.js'

/** The picture's own size and scale: its stone piers say a metre is about 25 of its pixels. */
const picture = { src: 'background/neretva-late-winter-1943-pixel.png', width: 1536, height: 1024, pxPerMeter: 25 }
/**
 * Where the men's feet go in the picture: along the left pier, down the top of the fallen truss to its end in the
 * water, over the rocks to the right bank and on past the edge.
 */
const path = [[-200, 405], [350, 405], [370, 410], [550, 535], [700, 615], [810, 650], [950, 670], [1100, 705],
  [1200, 685], [1250, 680], [1800, 680]]
/** How many men cross, metres apart, how fast, and for how many seconds the crossing is shown. */
const column = { count: 7, apart: 1.8, speed: 3.5, duration: 10 }

/** Partisans file over the wreck of the Jablanica bridge, between the German and the Chetnik stages. */
export default class BridgeCrossing {
  constructor({ width, height }) {
    this.background = new Background(picture.src)
    const across = width / picture.width, down = height / picture.height
    const pxPerMeter = picture.pxPerMeter * down
    const projection = sideProjection({ pxPerMeter, groundY: height })
    const points = path.map(([x, y]) => ({ x: x * across / pxPerMeter, y: (height - y * down) / pxPerMeter }))
    const groundAt = x => {
      const next = points.findIndex(point => point.x >= x)
      if (next <= 0) return points[next < 0 ? points.length - 1 : 0].y
      const a = points[next - 1], b = points[next]
      return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x)
    }
    const start = points[2].x
    this.men = Array.from({ length: column.count }, (_, i) => {
      const body = new Partisan({ role: 'runner', x: start - i * column.apart, groundAt, yaw: 0 })
      body.moveSpeed = column.speed
      body.setState('move')
      return { body, view: new PartisanSprite(body, { projection }) }
    })
    this.drawables = this.men.flatMap(({ body, view }) => [body, view])
    this.elapsed = 0
    this.shown = false
  }

  show() {
    this.shown = true
  }

  get done() {
    return this.elapsed >= column.duration
  }

  update(dt) {
    this.elapsed += dt
  }
}
