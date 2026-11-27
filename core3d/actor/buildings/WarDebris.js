import { Mesh, MeshLambertMaterial, PlaneGeometry } from 'three'
import { loadedModel } from '/core3d/assets/models.js'

/**
 * What the war leaves on the ground of a town, each its model at its real `size`, its height in metres: things dropped
 * or abandoned.
 */
export const warDebris = {
  truck: { name: 'Kamion Opel Blitz', model: { file: 'vehicle/truck/opel-blitz/model.fbx', size: 2.6, fitVisible: true } },
  'army-truck': { name: 'Nemački vojni kamion', model: { file: 'vehicle/truck/army-truck/model.fbx', size: 3, fitVisible: true } },
  barrel: { name: 'Bure', model: { file: 'item/barrel/model.fbx', size: .9, fitVisible: true } },
  'ammunition-box': { name: 'Sanduk municije', model: { file: 'item/ammunition-box/scene.gltf', size: .4, fitVisible: true } },
}

/** What to load; a game awaits requestModels(models) before it makes a piece of debris. */
export const models = Object.values(warDebris).map(({ model }) => model)

/** A piece of debris of `kind`, one of `warDebris`, standing on the ground at its middle. */
export default class WarDebris {
  constructor(kind) {
    this.kind = kind
    this.mesh = loadedModel(warDebris[kind].model).clone(true)
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
