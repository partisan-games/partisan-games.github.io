import * as THREE from 'three'
import { loadedModel } from '/core3d/assets/models.js'

/**
 * The rolling stock of a freight train, each its model in metres along z, standing on the rails at its middle:
 * `length` from buffer to buffer.
 */
export const railwayCars = {
  locomotive: { name: 'Lokomotiva', model: { file: 'vehicle/train/locomotive/locomotive.glb', size: 4.6 }, length: 7.9 },
  boxcar: { name: 'Zatvoreni teretni vagon', model: { file: 'vehicle/train/boxcar/model.glb', scale: 1 }, length: 12.74 },
  'high-boxcar': { name: 'Visoki zatvoreni vagon', model: { file: 'vehicle/train/high-boxcar/model.glb', scale: 1 }, length: 11.98 },
  'ore-car': { name: 'Otvoreni vagon za rudu', model: { file: 'vehicle/train/ore-car/model.glb', scale: 1 }, length: 12.45 },
}

/** What to load; a game awaits requestModels(models) before it makes a train. */
export const models = Object.values(railwayCars).map(({ model }) => model)

/** The cars a freight train is made of, behind its locomotive. */
export const wagons = Object.keys(railwayCars).filter(kind => kind !== 'locomotive')

/** Metres between the buffers of two cars. */
const coupling = .6

/**
 * A train of `cars`, kinds of `railwayCars` from the front, the locomotive first: the cars one behind the other along
 * +z, the whole train centred on its middle.
 */
export default class Train {
  constructor(cars = ['locomotive', 'boxcar', 'ore-car', 'boxcar']) {
    this.mesh = new THREE.Group()
    this.mesh.name = 'Train'
    const lengths = cars.map(kind => railwayCars[kind].length)
    this.length = lengths.reduce((sum, length) => sum + length, 0) + coupling * (cars.length - 1)
    let front = -this.length / 2
    cars.forEach((kind, i) => {
      const car = loadedModel(railwayCars[kind].model).clone(true)
      car.position.z = front + lengths[i] / 2
      this.mesh.add(car)
      front += lengths[i] + coupling
    })
  }
}
