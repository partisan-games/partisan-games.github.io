import * as THREE from 'three'
import Scena from './Scena.js'

export const bojeNeba = {
  svetla: 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)',
  modra: 'linear-gradient(180deg, #0B3D91 0%, #000000 100%)',
  suton: 'linear-gradient(to bottom, #ff8a00 0%, yellow 100%)',
  mrkla: 'linear-gradient(to bottom, #020111 70%, #191621 100%)',
}

export default class Scena3D extends Scena {
  constructor({
    canvas = document.getElementById('platno-3d'),
    canvasWidth = window.innerWidth,
    canvasHeight = window.innerHeight,
    bojaPlatna = bojeNeba.svetla,
    toon = false,
    ...rest
  } = {}) {
    super({ canvas, ...rest })
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000)
    this.camera.position.set(0, 5, 30)
    this.bojaPlatna = bojaPlatna

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true })
    this.renderer.setSize(canvasWidth, canvasHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)) // save battery by limit pixel ratio to 2
    this.renderer.shadowMap.enabled = true
    if (toon) this.createToonRenderer()

    this.handleResize = this.handleResize.bind(this)

    if (canvasWidth == window.innerWidth) {
      window.addEventListener('resize', this.handleResize)
      screen.orientation.addEventListener('change', this.handleResize)
    }
  }

  set bojaPlatna(boja) {
    this.canvas.style.background = boja
  }

  set bojaPozadine(boja) {
    this.scene.background = new THREE.Color(boja)
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
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

  end() {
    super.end()
    window.removeEventListener('resize', this.handleResize)
    screen.orientation.removeEventListener('change', this.handleResize)
  }
}
