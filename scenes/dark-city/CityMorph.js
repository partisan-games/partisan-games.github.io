import TWEEN from 'three/examples/jsm/libs/tween.module.js'

/** One city's morph animations, on its presentation clock and with its own tween collection. */
export default class CityMorph {
  constructor({ buildings, clock }) {
    this.buildings = buildings
    this.clock = clock
    this.tweens = new TWEEN.Group()
  }

  grow(mapSize) {
    this.buildings.forEach(building => {
      const y = 1 + Math.random() * 20 + (Math.random() < .1 ? 15 : 0)
      new TWEEN.Tween(building.scale, this.tweens)
        .to({ x: 1 + Math.random() * 3, y, z: 1 + Math.random() * 3 })
        .start(this.clock.now * 1000)
      new TWEEN.Tween(building.position, this.tweens)
        .to({ x: -mapSize * .5 + Math.random() * mapSize, z: -mapSize * .5 + Math.random() * mapSize, y: y / 2 })
        .start(this.clock.now * 1000)
    })
  }

  update() {
    this.tweens.update(this.clock.now * 1000)
  }

  end() {
    this.tweens.removeAll()
  }
}
