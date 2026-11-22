import * as THREE from 'three'
import { assets } from '/config.js'

const flag = { pole: 6, width: 1.4, height: .9 }
/** The Italian flag drawn for Ustanak, and where its cloth lies in that picture, in pixels. */
const italian = { file: 'armies/talijani/vojnici/strelci/zastava.svg', size: { width: 134, height: 196 }, cloth: { x: 1, y: 24, width: 121, height: 78 } }

/** The cloth of the Italian flag, cut from its picture. */
function italianCloth() {
  const texture = new THREE.TextureLoader().load(`${assets.images}${italian.file}`)
  const { size, cloth } = italian
  texture.repeat.set(cloth.width / size.width, cloth.height / size.height)
  texture.offset.set(cloth.x / size.width, 1 - (cloth.y + cloth.height) / size.height)
  return new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide, transparent: true })
}

/** The fort's flagpole at `x, z` on the ground: the Italian flag flies at its top until the garrison surrenders. */
export default class FortFlag {
  constructor({ x, z }) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, flag.pole, 12), new THREE.MeshPhongMaterial({ color: 0x5a4632 }))
    this.mesh = pole
    pole.position.set(x, flag.pole / 2, z)
    this.cloth = new THREE.Mesh(new THREE.PlaneGeometry(flag.width, flag.height), italianCloth())
    this.cloth.position.set(flag.width / 2 + .05, (flag.pole - flag.height) / 2, 0)
    pole.castShadow = this.cloth.castShadow = true
    pole.add(this.cloth)
  }

  /** Display the white flag at full height before the surrender dialog pauses the scene. */
  surrender() {
    this.cloth.material.map.dispose()
    this.cloth.material.dispose()
    this.cloth.material = new THREE.MeshLambertMaterial({ color: 0xf4f1e8, side: THREE.DoubleSide })
  }
}
