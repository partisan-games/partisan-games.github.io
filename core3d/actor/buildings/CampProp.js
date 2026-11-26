import { Group, MathUtils } from 'three'
import { loadedModel, requestModel } from '/core3d/assets/models.js'

/** Original exterior kit in metres; no automatic fitting or rescaling of its connection points. */
export const campModels = Object.fromEntries([
  'storehouse', 'fence-straight', 'fence-corner', 'fence-terminal', 'gate', 'timber-screen', 'watchtower',
].map(kind => [kind, { file: `building/crveni-krst/${kind}.glb`, scale: 1, receiveShadow: true,
  castShadow: !kind.startsWith('fence') && kind !== 'gate' }]))

export const models = Object.values(campModels)

/** A visual prop only: collision and victory still belong to the level, not this art library. */
export default class CampProp {
  constructor(mesh) {
    this.mesh = mesh.clone(true)
    this.gates = []
    this.aims = []
    this.lights = []
    this.lenses = []
    this.mesh.traverse(part => {
      if (part.name === 'GateLeft' || part.name === 'GateRight') this.gates.push(part)
      if (part.name === 'SearchlightAim') this.aims.push(part)
      if (part.isSpotLight) {
        // SpotLight.clone clones .target separately from its children; use the glTF target in this instance.
        part.target = part.children[0] ?? part.target
        if (!part.target.parent) part.add(part.target)
        part.castShadow = false
        part.distance = 24
        this.lights.push(part)
      }
      if (part.isMesh && part.material.name === 'lamp') {
        // The prepared model and other towers retain their own on/off appearance.
        part.material = part.material.clone()
        this.lenses.push(part.material)
      }
    })
    this.gateOpen = false
    this.gateFraction = 0
    this.sweeping = false
    this.elapsed = 0
    this.state = this.states[0] ?? null
  }

  /** What its parts can do: a gate is `closed` or `open`; a searchlight is `on`, `off` or `sweeping`, on. */
  get states() {
    return [...this.gates.length ? ['closed', 'open'] : [], ...this.lights.length ? ['on', 'off', 'sweeping'] : []]
  }

  /** Puts the part the state belongs to in it; the other part stays as it is. */
  setState(name) {
    if (!this.states.includes(name)) return
    this.state = name
    if (name === 'closed' || name === 'open') {
      this.gateOpen = name === 'open'
      return
    }
    this.sweeping = name === 'sweeping'
    const on = name !== 'off'
    this.lights.forEach(light => {
      light.visible = on
    })
    this.lenses.forEach(material => {
      material.emissiveIntensity = on ? 1 : 0
    })
  }

  update(dt) {
    this.elapsed += dt
    this.gateFraction = MathUtils.clamp(this.gateFraction + (this.gateOpen ? 1 : -1) * dt * 1.5, 0, 1)
    this.gates.forEach(gate => {
      gate.rotation.y = this.gateFraction * Math.PI * .48 * (gate.name === 'GateLeft' ? 1 : -1)
    })
    if (this.sweeping) this.aims.forEach(aim => {
      aim.rotation.y = Math.sin(this.elapsed * .55) * .7
    })
  }
}

export async function createCampProp(kind) {
  const descriptor = campModels[kind]
  if (!descriptor) throw new RangeError(`Unknown camp prop: ${kind}`)
  await requestModel(descriptor)
  return new CampProp(loadedModel(descriptor))
}

/** One visual study assembled from the same seven files; not a layout installed into the game. */
export async function createCampStudy() {
  await Promise.all(models.map(model => requestModel(model)))
  const group = new Group()
  const placements = [
    ['storehouse', 0, -7, 0], ['watchtower', -13, 10, 0],
    ['fence-straight', -10, 8, Math.PI / 2], ['fence-straight', -10, 3, Math.PI / 2],
    ['fence-straight', -5, 5, 0], ['fence-terminal', 0, 5, 0],
    ['timber-screen', 4, 5, 0], ['gate', -7.5, 10, 0],
  ]
  for (const [kind, x, z, angle] of placements) {
    const mesh = loadedModel(campModels[kind]).clone(true)
    mesh.position.set(x, 0, z)
    mesh.rotation.y = angle
    group.add(mesh)
  }
  return new CampProp(group)
}
