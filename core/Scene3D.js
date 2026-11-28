import * as THREE from 'three'
import Scene from './Scene.js'
import { audioListener } from '/core/io/audio/audio3d.js'
import { hasBlockingUi } from '/core/io/inputContext.js'
import runCleanups from './runtime/runCleanups.js'
import { skyGradients } from '/core/constants.js'

// One renderer per canvas for the whole site: games draw on the same canvas, and a new renderer
// would leave the previous one's state and shaders on the graphics card.
const renderers = new WeakMap()

/**
 * Textures that the shared renderer uploaded again after their game had freed them. Three.js r160 keeps the last
 * shadow caster's texture in its shared depth material and can upload it in a later game, so the next game end frees it.
 */
const revived = new Set()

const freeTexture = texture => {
  texture.dispose()
  texture.onUpdate = () => revived.add(texture)
}
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
    // Compare outlines in place without changing the scene's materials or lighting.
    const outline = new URLSearchParams(window.location.search).get('outline')
    if (outline === 'soft')
      this.createToonRenderer({ defaultThickness: 0.0015, defaultAlpha: 0.55 })
    else if (outline === 'on' || (toon && outline !== 'off'))
      this.createToonRenderer()

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

  async createToonRenderer(options = {}) {
    const { OutlineEffect } = await import('three/examples/jsm/effects/OutlineEffect.js')
    this.renderer = new OutlineEffect(this.renderer, { defaultThickness: 0.0025, ...options })
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
    runCleanups([
      () => super.end(),
      () => this.controls?.dispose(), // orbit controls listen on the canvas that the next scene reuses
      () => window.removeEventListener('resize', this.handleResize),
      () => screen.orientation.removeEventListener('change', this.handleResize),
      () => this.disposeScene(),
    ])
  }

  /**
   * Frees what this game holds on the graphics card, which the shared renderer keeps otherwise.
   * A model shared with a later game is uploaded again when that game draws it.
   */
  disposeScene(scene = this.scene) {
    const cleanups = [...revived].map(texture => () => freeTexture(texture))
    revived.clear()
    const disposeTextures = values => Object.values(values).forEach(value => {
      if (value?.isTexture) cleanups.push(() => freeTexture(value))
      else if (value?.value?.isTexture) cleanups.push(() => freeTexture(value.value)) // a shader uniform
    })
    scene.traverse(object => {
      if (object.isLight) cleanups.push(() => object.dispose()) // its shadow map
      if (object.isSkinnedMesh) cleanups.push(() => object.skeleton.dispose()) // the texture with its bones
      if (object.isInstancedMesh) cleanups.push(() => object.dispose()) // the places and colours of its copies
      if (object.geometry) cleanups.push(() => object.geometry.dispose())
      for (const material of [object.material].flat().filter(Boolean)) {
        disposeTextures(material)
        if (material.uniforms) disposeTextures(material.uniforms)
        cleanups.push(() => material.dispose())
      }
    })
    if (scene.background?.isTexture) cleanups.push(() => freeTexture(scene.background))
    runCleanups(cleanups)
  }
}
