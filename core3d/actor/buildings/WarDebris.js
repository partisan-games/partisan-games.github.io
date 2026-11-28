import { Box3, DoubleSide, Mesh, MeshLambertMaterial, MeshPhongMaterial, PlaneGeometry, Quaternion, Vector3 } from 'three'
import { loadedModel } from '/core3d/assets/models.js'
import wreckFire from '/core3d/actor/characters/wreckFire.js'
import { paintVehicleCondition } from '/core3d/actor/derived/tankCondition.js'

const armyWindows = 'ArmyTruck_Window_ArmyTruck_Glass_0'
const glass = new MeshPhongMaterial({ color: 0x465d60, transparent: true, opacity: .38,
  depthWrite: false, side: DoubleSide, shininess: 52, specular: 0x879b9f })

const truckLooks = {
  truck: {
    forward: -1, wheels: /^Cube00[1237]$/,
    engine: [0, 1.46, -2.08], wreckFile: 'vehicle/truck/opel-blitz/wreck.webp',
  },
  'army-truck': {
    forward: 1, wheels: /^Wheel_/,
    engine: [0, 1.72, 2.60], wreckFile: 'vehicle/truck/army-truck/wreck.webp',
  },
}

export const hasTruckWreck = kind => Object.hasOwn(truckLooks, kind)

function truckWheels(mesh, names) {
  mesh.updateWorldMatrix(true, true)
  const wheels = []
  const box = new Box3()
  mesh.traverse(part => {
    if (!part.isMesh || !names.test(part.name)) return
    box.setFromObject(part, true)
    // The Army Truck wheels share the chassis origin, so find each axle from its own vertices.
    const center = part.parent.worldToLocal(box.getCenter(new Vector3()))
    const axis = new Vector3(1, 0, 0).transformDirection(part.parent.matrixWorld.clone().invert())
    const radius = (box.max.y - box.min.y) / 2
    wheels.push({ part, center, axis, radius, offset: part.position.clone().sub(center), rest: part.quaternion.clone() })
  })
  return wheels
}

/**
 * What the war leaves on the ground of a town, each its model at its real `size`, its height in metres: things dropped
 * or abandoned. One not yet in a game names the catalogue's shared library as its `game`.
 */
export const warDebris = {
  truck: { name: 'Kamion Opel Blitz', model: { file: 'vehicle/truck/opel-blitz/model.fbx', size: 2.6, fitVisible: true } },
  'army-truck': { name: 'Nemački vojni kamion', model: { file: 'vehicle/truck/army-truck/model.fbx', size: 3, fitVisible: true } },
  barrel: { name: 'Bure', model: { file: 'item/barrel/model.fbx', size: .9, fitVisible: true } },
  'ammunition-box': { name: 'Sanduk municije', model: { file: 'item/ammunition-box/scene.gltf', size: .4, fitVisible: true } },
  // the Italian armoured car of the Great War, still with Italian units in Yugoslavia in 1941-1943
  'lancia-1zm': { name: 'Oklopni automobil Lancia 1ZM', game: 'Zajednička biblioteka',
    model: { file: 'vehicle/armored-car/lancia-1ZM/lancia.fbx', size: 2.8, fitVisible: true } },
}

/** What to load; a game awaits requestModels(models) before it makes a piece of debris. */
export const models = Object.values(warDebris).map(({ model }) => model)

/** A piece of debris of `kind`, one of `warDebris`, standing on the ground at its middle. */
export default class WarDebris {
  constructor(kind) {
    this.kind = kind
    this.mesh = loadedModel(warDebris[kind].model).clone(true)
    if (kind === 'army-truck') {
      const windows = this.mesh.getObjectByName(armyWindows)
      if (windows) windows.material = glass
    }
  }
}

/** The truck preview can drive and become a burning wreck. */
export class TruckDebris extends WarDebris {
  constructor(kind) {
    super(kind)
    const look = truckLooks[kind]
    this.states = ['idle', 'move', 'dead', 'wreck']
    this.state = 'idle'
    this.wheels = truckWheels(this.mesh, look.wheels)
    this.travel = 0
    this.wheelTurn = new Quaternion()
    this.paint = paintVehicleCondition(this.mesh, () => this.destroyed ? 2 : 0,
      { wreckFile: look.wreckFile })
  }

  get destroyed() {
    return this.state === 'dead' || this.state === 'wreck'
  }

  setState(state) {
    if (!this.states.includes(state) || (this.destroyed && (state === 'idle' || state === 'move'))) return
    this.state = state
    if (!this.destroyed) return
    this.paint?.update()
    const windows = this.mesh.getObjectByName(armyWindows)
    if (windows) windows.visible = false
    if (state === 'wreck' && this.wreckFlames) {
      this.wreckFlames.dispose()
      this.wreckFlames = undefined
    }
  }

  update(dt, t) {
    const look = truckLooks[this.kind]
    if (this.state === 'move') {
      const distance = look.forward * 4 * dt
      this.travel += distance
      this.mesh.position.z += distance
      for (const { part, axis, radius, center, offset, rest } of this.wheels) {
        this.wheelTurn.setFromAxisAngle(axis, this.travel / radius)
        part.position.copy(offset).applyQuaternion(this.wheelTurn).add(center)
        part.quaternion.copy(this.wheelTurn).multiply(rest)
      }
    } else if (this.state === 'dead' && this.mesh.parent) {
      this.wreckFlames ??= wreckFire(this.mesh, look.engine)
      this.wreckFlames.update(dt, t)
    }
  }

  end() {
    this.wreckFlames?.dispose()
    this.paint?.dispose()
  }
}

/** The picture of a burnt patch of ground, as a bomb or a shell leaves, under the images folder. */
export const scorchPicture = 'textures/decal-diffuse.png'

/** A burnt patch `size` metres across where a bomb fell, flat on the ground, drawn from the texture `map` of `scorchPicture`. */
export function createScorch(size, map) {
  const mesh = new Mesh(new PlaneGeometry(size, size),
    new MeshLambertMaterial({ map, color: 0x000000, transparent: true, opacity: .85, depthWrite: false }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = .04
  return mesh
}
