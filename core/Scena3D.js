import * as THREE from 'three'
import Scena from './Scena.js'

const platno3D = document.getElementById('platno-3d')

export default class Scena3D extends Scena {
  constructor({ canvas = platno3D, canvasWidth = window.innerWidth, canvasHeight = window.innerHeight, toon = false, ...rest } = {}) {
    super({ canvas, ...rest })
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000)
    this.camera.position.set(0, 5, 30)

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true })
    this.renderer.setSize(canvasWidth, canvasHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)) // save battery by limit pixel ratio to 2
    this.renderer.shadowMap.enabled = true
    if (toon) this.createToonRenderer()

    this.bojaPlatna = 'linear-gradient(180deg, #0B3D91 0%, #000000 100%)'

    window.addEventListener('resize', () => {
      this.renderer.setSize(canvasWidth, canvasHeight)
      this.camera.aspect = canvasWidth / canvasHeight
      this.camera.updateProjectionMatrix()
    })
  }

  set bojaPozadine(boja) {
    this.scene.background = new THREE.Color(boja)
  }

  set bojaPlatna(boja) {
    this.canvas.style.background = boja
  }

  async createToonRenderer(defaultThickness = 0.0025) {
    const { OutlineEffect } = await import('three/examples/jsm/effects/OutlineEffect.js')
    this.renderer = new OutlineEffect(this.renderer, { defaultThickness })
  }

  /* dodaje mesh i radi update */
  add(...predmeti) {
    super.add(...predmeti)
    this.scene.add(...predmeti.map(predmet => predmet.mesh))
  }

  addMesh(...meshes) {
    this.scene.add(...meshes)
  }

  remove(...predmeti) {
    super.remove(...predmeti)
    this.scene.remove(...predmeti.map(predmet => predmet.mesh))
  }

  removeMesh(...meshes) {
    this.scene.remove(...meshes)
  }

  handleInput(dt) {
    super.handleInput(dt)
    this.controls?.update(dt)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }
}
