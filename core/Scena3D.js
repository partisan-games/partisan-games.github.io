import * as THREE from 'three'
import Scena from './Scena.js'

const platno3D = document.getElementById('platno-3d')
platno3D.style.display = 'none'

export default class Scena3D extends Scena {
  constructor({ toon = false, ...rest } = {}) {
    super({ ...rest })
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 5, 30)

    this.renderer = new THREE.WebGLRenderer({ canvas: platno3D, alpha: true, antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)) // save battery by limit pixel ratio to 2
    this.renderer.shadowMap.enabled = true
    if (toon) this.createToonRenderer()

    platno3D.style.display = 'block'
    platno3D.style.background = 'linear-gradient(180deg, #0B3D91 0%, #000000 100%)'

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
    })
  }

  set bojaPozadine(boja) {
    this.scene.background = new THREE.Color(boja)
  }

  set bojaPlatna(boja) {
    platno3D.style.background = boja
  }

  async createToonRenderer(defaultThickness = 0.0025) {
    const { OutlineEffect } = await import('three/examples/jsm/effects/OutlineEffect.js')
    this.renderer = new OutlineEffect(this.renderer, { defaultThickness })
  }

  add(...predmeti) {
    super.add(...predmeti)
    this.scene.add(...predmeti.map(predmet => predmet.mesh))
  }

  remove(...predmeti) {
    super.remove(...predmeti)
    this.scene.remove(...predmeti.map(predmet => predmet.mesh))
  }

  addMesh(...meshes) {
    this.scene.add(...meshes)
  }

  removeMesh(...meshes) {
    this.scene.remove(...meshes)
  }

  end() {
    super.end()
    platno3D.style.display = 'none'
  }

  handleInput(dt) {
    super.handleInput(dt)
    this.controls?.update(dt)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }
}
