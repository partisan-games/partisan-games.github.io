import * as THREE from 'three'
import Scene from './Scene.js'
import { audioListener } from '/core/io/audio/audio3d.js'
import { hasBlockingUi } from '/core/io/inputContext.js'

export const skyGradients = {
  svetla: 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)',
  modra: 'linear-gradient(180deg, #0B3D91 0%, #000000 100%)',
  suton: 'linear-gradient(to bottom, #ff8a00 0%, yellow 100%)',
  mrkla: 'linear-gradient(to bottom, #020111 70%, #191621 100%)',
}

// One renderer per canvas for the whole site: games draw on the same canvas, and a new renderer
// would leave the previous one's state and shaders on the graphics card.
const renderers = new WeakMap()
const rendererFor = canvas => {
  if (!renderers.has(canvas)) renderers.set(canvas, new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }))
  return renderers.get(canvas)
}

export default class Scene3D extends Scene {
  constructor({
    canvas = document.getElementById('platno-3d'),
    canvasWidth = window.innerWidth,
    canvasHeight = window.innerHeight,
    canvasBackground = skyGradients.svetla,
    toon = false,
    ...rest
  } = {}) {
    super({ canvas, ...rest })
    // OrbitControls handles events immediately, even when the scene loop is paused.
    const guardCanvasInput = event => {
      if (this.session.state === 'running' && !this.ui.screen && !hasBlockingUi()) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    const guardedEvents = ['pointerdown', 'pointermove', 'wheel']
    for (const type of guardedEvents)
      canvas.addEventListener(type, guardCanvasInput, { capture: true, passive: false })
    this.session.scope.add(() => {
      for (const type of guardedEvents) canvas.removeEventListener(type, guardCanvasInput, true)
    })
    this.scene = new THREE.Scene()
    this.scene.userData.audio = this.sceneAudio
    this.audioWorldOffset = { x: 0, y: 0, z: 0 }
    this.sceneAudio.setSpatialContext({
      coordinates: { dimensions: 3, unitsPerAudioUnit: 1, getWorldOffset: () => this.audioWorldOffset },
      getListener: () => audioListener(this.audioPlayer?.() ?? this.player),
    })
    this.camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000)
    this.camera.position.set(0, 5, 30)
    this.canvasBackground = canvasBackground

    this.renderer = rendererFor(this.canvas)
    this.renderer.setSize(canvasWidth, canvasHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)) // save battery by limit pixel ratio to 2
    this.renderer.shadowMap.enabled = true
    if (toon) this.createToonRenderer()

    this.handleResize = this.handleResize.bind(this)

    if (canvasWidth === window.innerWidth) {
      window.addEventListener('resize', this.handleResize)
      screen.orientation.addEventListener('change', this.handleResize)
    }
  }

  set canvasBackground(boja) {
    this.canvas.style.background = boja
  }

  set backgroundColor(boja) {
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

  /** A body has no mesh: only its model is put in the 3D scene. */
  add(...children) {
    super.add(...children)
    this.scene.add(...children.filter(child => child.mesh).map(child => child.mesh))
  }

  addMesh(...meshes) {
    this.scene.add(...meshes)
  }

  remove(...children) {
    super.remove(...children)
    this.scene.remove(...children.filter(child => child.mesh).map(child => child.mesh))
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
    this.controls?.dispose() // orbit controls listen on the canvas that the next scene reuses
    window.removeEventListener('resize', this.handleResize)
    screen.orientation.removeEventListener('change', this.handleResize)
    this.disposeScene()
  }

  /**
   * Frees what this game holds on the graphics card, which the shared renderer keeps otherwise.
   * A model shared with a later game is uploaded again when that game draws it.
   */
  disposeScene() {
    const disposeTextures = values => Object.values(values).forEach(value => {
      if (value?.isTexture) value.dispose()
      else if (value?.value?.isTexture) value.value.dispose() // a shader uniform
    })
    this.scene.traverse(object => {
      if (object.isLight) object.dispose() // its shadow map
      if (object.isSkinnedMesh) object.skeleton.dispose() // the texture with its bones
      object.geometry?.dispose()
      for (const material of [object.material].flat().filter(Boolean)) {
        disposeTextures(material)
        if (material.uniforms) disposeTextures(material.uniforms)
        material.dispose()
      }
    })
    if (this.scene.background?.isTexture) this.scene.background.dispose()
  }
}
