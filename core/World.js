/**
 * The objects of one scene, in drawing order, and the controllers that drive its bodies. Each frame the controllers
 * take input and decide first; then it gives input to the live direct objects and updates every object with its
 * children; at the end it ends the controllers and the direct objects, whose own parts are ended by their owner.
 */
export default class World {
  constructor() {
    this.objects = []
    this.controllers = []
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

  /** Input is the controllers'; an object that reads keys itself does so in its own update. */
  handleInput(dt) {
    this.controllers.forEach(controller => controller.handleInput?.(dt))
  }

  update(dt, t) {
    const updateTree = object => {
      object.update?.(dt, t)
      object.children?.forEach(updateTree)
    }
    this.controllers.forEach(controller => controller.update?.(dt))
    this.objects.forEach(updateTree)
  }

  /** Ends each direct object once, and an extra one kept outside the list, such as a player. */
  end(...extra) {
    this.controllers.forEach(controller => controller.end?.())
    new Set([...this.objects, ...extra]).forEach(object => object?.end?.())
    this.objects = []
  }
}
