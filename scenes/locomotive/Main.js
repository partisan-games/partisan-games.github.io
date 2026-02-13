import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import { createGround } from '/core3d/ground.js'
import { Smoke } from '/core3d/Particles.js'
import { followPath, createEllipse, createRailroadTracks } from '/core3d/path.js'
import { loadModel } from '/core3d/loaders.js'
import { createOrbitControls } from '/core3d/helpers.js'
import { createTrees } from '/core3d/geometry/trees.js'

export default class extends Scena3D {
  constructor() {
    super({ toon: true })
  }

  async init() {
    this.controls = createOrbitControls(this.camera, this.renderer.domElement)
    this.camera.position.z = 20

    this.addMesh(createSun())
    this.addMesh(createGround({ size: 50, circle: true }))
    const trees = createTrees({ mapSize: 25, size: 1, n: 0, nFirTrees: 100 })
    this.addMesh(trees)

    const xRadius = 40, yRadius = 15

    const line = createEllipse({ xRadius, yRadius })
    this.path = line.userData.path
    const outerLine = createEllipse({ xRadius: xRadius + .4, yRadius: yRadius + .4 })
    const innerLine = createEllipse({ xRadius: xRadius - .4, yRadius: yRadius - .4 })
    this.addMesh(outerLine, innerLine)

    this.locomotive = await loadModel({
      file: 'vehicle/train/toy-locomotive/scene.glb', angle: Math.PI, axis: [0, 1, 0]
    })
    this.addMesh(this.locomotive)

    this.mixer = new THREE.AnimationMixer(this.locomotive)
    const action = this.mixer.clipAction(this.locomotive.userData.animations[0])
    action.play()

    this.particles = new Smoke({ num: 10, maxRadius: .1, })
    this.particles.mesh.position.set(0, 1.5, 1.25)
    this.particles.mesh.rotateX(-.2)
    this.locomotive.add(this.particles.mesh)

    const tracks = createRailroadTracks(this.path, 200)
    this.addMesh(...tracks)
  }

  update(delta, elapsedTime) {
    super.update(delta, elapsedTime)

    followPath({ path: this.path, mesh: this.locomotive, elapsedTime, speed: .025 })
    this.particles.update({ delta })
    this.mixer.update(delta * 15)
  }
}
