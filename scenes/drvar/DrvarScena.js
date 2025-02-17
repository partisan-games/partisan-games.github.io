import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import { elements } from './data.js'
import { createGround } from '/core3d/ground.js'
import { randSpread, praviPanoramu } from './utils.js'
import Sprite from './Sprite.js'
import { createOrbitControls } from '/core3d/helpers.js'

const textureLoader = new THREE.TextureLoader()

export default class DrvarScena extends Scena3D {
  constructor(manager) {
    super(manager, { showControls: false })
  }

  init() {
    this.addMesh(createGround())
    elements.forEach(el => {
      for (let i = 0; i < el.number; ++i)
        this.dodajSprite(el, i)
    })
    this.addMesh(praviPanoramu())
    this.controls = createOrbitControls(this.camera, this.renderer.domElement)
    this.controls.enablePan = false
    this.controls.minAzimuthAngle = -Math.PI / 8
    this.controls.maxAzimuthAngle = Math.PI / 8
    this.avioni = []
    this.padobranci = []
    this.vozila = []
    this.partizani = []
    this.eksplozija = new Sprite('assets/images/sprites/efekti/eksplozija-01.png', 8, 4)
    this.addMesh(this.eksplozija.mesh)
  }

  dodajSprite(el, i) {
    const src = el.urls[i % el.urls.length]
    textureLoader.load('/assets/images/' + src, texture => {
      texture.minFilter = THREE.NearestFilter // pikselizovano iz daleka
      texture.magFilter = THREE.NearestFilter // glatko blizu

      const material = new THREE.SpriteMaterial({ map: texture })
      const mesh = new THREE.Sprite(material)

      const skalar = .05
      mesh.scale.set(texture.image.width * skalar, texture.image.height * skalar, 1)

      const origin = el.origin ?? { x: 0, y: 0, z: 0 }
      const range = el.range ?? { x: 100, y: 0, z: 100 }
      const x = origin.x + randSpread(range.x)
      const y = origin.y + randSpread(range.y)
      const z = origin.z + randSpread(range.z)
      mesh.position.set(x, y + texture.image.height * skalar * .5, z)
      this.addMesh(mesh)

      if (el.type) this[el.type].push(mesh)
    })
  }

  update(dt) {
    super.update(dt)
    this.camera.lookAt(0, 10, 0)

    this.avioni.forEach(avion => {
      avion.position.x -= dt * 20
      if (avion.position.x <= -150)
        avion.position.x = 150
    })

    this.padobranci.forEach(padobranac => {
      padobranac.position.y -= dt * 5
      if (padobranac.position.y <= 0)
        padobranac.position.y = 35
    })

    this.vozila.forEach(vozilo => {
      vozilo.position.x += dt * 10
      if (vozilo.position.x >= 150)
        vozilo.position.x = -150
    })

    this.partizani.forEach(partizan => {
      partizan.position.x += randSpread(dt)
    })

    this.eksplozija.update(dt)
  }
}
