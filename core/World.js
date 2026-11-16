/**
 * The objects of one scene, in drawing order. Each frame it gives input to the live direct objects and updates
 * every object with its children; at the end it ends the direct objects, whose own parts are ended by their owner.
 */
export default class World {
  constructor() {
    this.objects = []
  }

  add(...objects) {
    this.objects.push(...objects)
  }

  /** Behind everything already added, so drawn first. */
  addBehind(...objects) {
    this.objects.unshift(...objects)
  }

  remove(...objects) {
    this.objects = this.objects.filter(object => !objects.includes(object))
  }

  /** Only 2D objects take input here; 3D objects read it in their own update. */
  handleInput(dt) {
    this.objects.forEach(object => {
      if (object.alive && object.handleInput) object.handleInput(dt)
    })
  }

  update(dt, t) {
    const updateTree = object => {
      object.update?.(dt, t)
      object.children?.forEach(updateTree)
    }
    this.objects.forEach(updateTree)
  }

  /** Ends each direct object once, and an extra one kept outside the list, such as a player. */
  end(...extra) {
    new Set([...this.objects, ...extra]).forEach(object => object?.end?.())
    this.objects = []
  }
}
