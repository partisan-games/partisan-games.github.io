import Scene3D, { skyGradients } from '/core/Scene3D.js'
import { AdditiveBlending, BoxGeometry, CanvasTexture, Mesh, MeshBasicMaterial, RingGeometry, Sprite, SpriteMaterial } from 'three'
import { ambLight, createMoon, orbitAround } from '/core3d/light.js'
import { Stars } from '/core3d/Particles.js'
import Platform from '/core3d/objects/Platform.js'
import { loadModel } from '/core3d/loaders.js'
import { createSphere } from '/core3d/geometry/index.js'
import { createJupiter, createSaturn } from '/core3d/geometry/planets.js'
import { requestModel } from '/core3d/assets/models.js'
import Lander, { model as landerModel } from './Lander.js'

const controls = {
  '← or A': 'thrust left',
  '→ or D': 'thrust right',
  '↓ or S': 'thrust down',
  '↑ or W': '',
}

function markLandingPad(platform) {
  const paint = new MeshBasicMaterial({ color: 0xe5eeec })
  const ring = new Mesh(new RingGeometry(.68, .93, 48), paint)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = platform.height + .01
  platform.mesh.add(ring)

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  glow.addColorStop(0, 'rgba(255,255,255,.95)')
  glow.addColorStop(.35, 'rgba(255,255,255,.65)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 64, 64)
  // Match the lit panes and their muted green-blue edges on the station behind the pad.
  const halo = new SpriteMaterial({ map: new CanvasTexture(canvas), color: 0x639083,
    blending: AdditiveBlending, depthWrite: false })
  const lamp = new BoxGeometry(.48, .07, .13)
  const light = new MeshBasicMaterial({ color: 0xd7d8d4 })
  light.userData.outlineParameters = { visible: false }
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const beacon = new Mesh(lamp, light)
      beacon.position.set(side * (platform.width / 2 - .3), platform.height + .035,
        end * (platform.depth / 2 - .2))
      const aura = new Sprite(halo)
      aura.scale.set(1.05, .5, 1)
      aura.position.y = .045
      beacon.add(aura)
      platform.mesh.add(beacon)
    }
  }
}

export default class MoonLandingScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      controlKeys: controls,
      intro: 'Land on the platform gently',
      startButtonText: 'Start',
      uiStyle: 'white',
      canvasBackground: skyGradients.crna,
      fixedStep: true,
    })
  }

  async init() {
    this.backgroundColor = 0x000000
    // low enough that the platform 10 m below stays whole on the screen, near its bottom
    this.camera.position.set(0, 2, 18)

    ambLight({ scene: this.scene })
    const moonLight = createMoon({ pos: [30, 30, 30], intensity: Math.PI * .2 })
    const platform = new Platform({ pos: [0, -10, 0], axis: 'x', range: 29, randomDirChange: true })
    markLandingPad(platform)
    const stars = new Stars({ minRadius: 150, minVelocity: 0.25, maxVelocity: 1.5 })

    this.jupiter = createJupiter({ r: 5 })
    this.jupiter.position.set(-125, 25, -80)
    this.moon = createSphere({ r: 1.5, file: 'planets/moon.jpg' })
    this.saturn = createSaturn({ r: 3 })
    this.saturn.position.set(85, 20, -50)

    const [arcology] = await Promise.all([
      loadModel({ file: 'space/arcology-ring/model.fbx', scale: .5, shouldCenter: true }),
      requestModel(landerModel),
    ])
    this.arcology = arcology
    this.arcology.position.z = -100
    this.addMesh(this.jupiter, this.saturn, this.moon, moonLight, this.arcology)

    this.lander = new Lander({ platform })
    this.audioPlayer = () => this.lander
    this.add(this.lander, stars, platform)
  }

  sceneUI() {
    const fuel = Math.floor(this.lander.fuel)
    return this.ui.scoreUI('Score', this.lander.hasLanded ? fuel : 0, 'Fuel left', fuel)
  }

  present(dt, time) {
    this.arcology?.rotateY(dt * .02)
    this.jupiter.rotateY(dt * .2)
    this.moon.rotateY(dt)
    orbitAround({ moon: this.moon, planet: this.jupiter, time: time * .75 })
  }

  fixedUpdate() {
    if (this.lander.hasLanded) this.victory ('Nice landing!')
    if (this.lander.broken) this.defeat('Landing failure!')
    if (this.lander.outOfFuel) this.defeat('Out of fuel, platform missed!')
    if (this.lander.lost) this.defeat('Lost in space!')
  }
}
