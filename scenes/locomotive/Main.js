import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import { createGround } from '/core3d/ground.js'
import { Smoke } from '/core3d/Particles.js'
import { followPath, createEllipse, createRailroadTracks } from '/core3d/path.js'
import { requestModel, requestModels } from '/core3d/assets/models.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { createOrbitControls } from '/core3d/helpers.js'
import { createTrees } from '/core3d/geometry/trees.js'

export default class extends Scena3D {
  constructor() {
    super({ toon: true })
  }

  async init() {
    this.controls = await this.session.keep(createOrbitControls(this.camera, this.renderer.domElement), controls => controls.dispose())
    this.camera.position.z = 25

    this.addMesh(createSun())
    this.addMesh(createGround({ size: 100, circle: true }))
    const trees = createTrees({ mapSize: 20, size: 1, n: 0, nFirTrees: 80 })
    trees.position.x = 17
    this.addMesh(trees)

    const xRadius = 40, yRadius = 15

    const line = createEllipse({ xRadius, yRadius })
    this.path = line.userData.path
    const outerLine = createEllipse({ xRadius: xRadius + .4, yRadius: yRadius + .4 })
    const innerLine = createEllipse({ xRadius: xRadius - .4, yRadius: yRadius - .4 })
    this.addMesh(outerLine, innerLine)

    const train = await this.session.keep(requestModel({
      file: 'vehicle/train/toy-locomotive/scene.glb', angle: Math.PI, axis: [0, 1, 0], size: 4
    }))
    this.locomotive = clone(train)
    this.addMesh(this.locomotive)
    const mine = await this.session.keep(requestModel({ file: 'building/mine/scene.gltf', size: 5, shouldCenter: true, shouldAdjustHeight: true }))
    const rudnik = clone(mine)
    rudnik.position.x = -8
    // rudnik.position.z = -14
    // rudnik.position.x = -50
    this.addMesh(rudnik)

    this.mixer = new THREE.AnimationMixer(this.locomotive)
    const action = this.mixer.clipAction(train.userData.animations[0])
    action.play()
    this.session.scope.add(() => {
      this.mixer.stopAllAction()
      this.mixer.uncacheRoot(this.locomotive)
    })

    const { default: Factory, models: factoryModels } = await this.session.keep(import('/core3d/objects/Factory.js'))
    await this.session.keep(requestModels(factoryModels))
    const tvornica = new Factory()
    tvornica.position.z = -35
    this.add(tvornica)

    this.particles = new Smoke({ num: 10, maxRadius: .1, })
    this.particles.mesh.position.set(0, 1.5, 1.25)
    this.particles.mesh.rotateX(-.2)
    this.locomotive.add(this.particles.mesh)

    const tracks = createRailroadTracks(this.path, 200)
    this.addMesh(...tracks)
  }

  update(delta, elapsedTime) {
    super.update(delta, elapsedTime)

    followPath({ path: this.path, mesh: this.locomotive, elapsedTime, speed: .025, y: 2 })
    this.particles.update(delta, elapsedTime)
    this.mixer.update(delta * 15)
  }
}
