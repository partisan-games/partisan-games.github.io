import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

const maxMarks = 36
const markSize = new THREE.Vector3(.85, .85, .24)

/** Persistent shell soot projected onto the masonry it struck. */
export default class ScorchMarks {
  constructor(scene) {
    this.scene = scene
    this.marks = []
    this.texture = new THREE.TextureLoader().load('/assets/images/textures/decal-diffuse.png')
  }

  add(point, parts) {
    let target, distance = Infinity
    for (const part of parts) {
      part.updateWorldMatrix(true, false)
      const gap = new THREE.Box3().setFromObject(part).distanceToPoint(point)
      if (gap < distance) [target, distance] = [part, gap]
    }
    if (!target || distance > .4) return

    target.geometry.computeBoundingBox()
    const local = target.worldToLocal(point.clone())
    const box = target.geometry.boundingBox
    const faces = [
      [Math.abs(local.x - box.min.x), new THREE.Vector3(-1, 0, 0)],
      [Math.abs(local.x - box.max.x), new THREE.Vector3(1, 0, 0)],
      [Math.abs(local.y - box.min.y), new THREE.Vector3(0, -1, 0)],
      [Math.abs(local.y - box.max.y), new THREE.Vector3(0, 1, 0)],
      [Math.abs(local.z - box.min.z), new THREE.Vector3(0, 0, -1)],
      [Math.abs(local.z - box.max.z), new THREE.Vector3(0, 0, 1)],
    ]
    const normal = faces.sort((a, b) => a[0] - b[0])[0][1].transformDirection(target.matrixWorld)
    const orientation = new THREE.Euler()
    const helper = new THREE.Object3D()
    helper.position.copy(point)
    helper.lookAt(point.clone().add(normal))
    helper.rotation.z = Math.random() * 2 * Math.PI
    orientation.copy(helper.rotation)

    const geometry = new DecalGeometry(target, point, orientation, markSize)
    geometry.applyMatrix4(target.matrixWorld.clone().invert())
    const material = new THREE.MeshPhongMaterial({
      color: 0x211b16,
      map: this.texture,
      transparent: true,
      opacity: .88,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    })
    const mark = new THREE.Mesh(geometry, material)
    target.add(mark)
    this.marks.push(mark)
    if (this.marks.length > maxMarks) this.remove(this.marks[0])
  }

  remove(mark) {
    mark.removeFromParent()
    mark.geometry.dispose()
    mark.material.dispose()
    this.marks.splice(this.marks.indexOf(mark), 1)
  }

  end() {
    [...this.marks].forEach(mark => this.remove(mark))
    this.texture.dispose()
  }
}
