import Scena3D, { bojeNeba } from '/core/Scena3D.js'
import { createGround, createLava } from '/core3d/ground.js'
import { hemLight } from '/core3d/light.js'
import { baseControls } from '/ui/Controls.js'
import { createRandomBoxes } from '/core3d/geometry/index.js'
import Coin from '/core3d/objects/Coin.js'
import Platform from '/core3d/objects/Platform.js'

const numBoxes = 400, mapSize = 200, lavaSize = 100
const numCoins = numBoxes / 4

const withinCircle = position => Math.pow(position.x, 2) + Math.pow(position.z, 2) < Math.pow(lavaSize, 2)

const inLava = player => player.position.y <= .1 && withinCircle(player.position)

const messageDict = {
  1: 'Well, that\'s a good start!',
  10: 'Keep up the good work!',
  25: 'Nice result so far...',
  50: 'Half down, half to go!',
  75: 'You smell victory in the air...',
}

const customStartScreen = /* html */`
  <div class="central-screen rpgui-container framed">
    <h2>Choose your avatar</h2>
    <div class="game-screen-select">
      <div>
        <input type="image" id="STONE" src="/assets/images/scenes/avatar/STONE.webp" /><br>
        Kamenko<br><small>(basic)</small>
      </div>
      <div>
        <input type="image" id="DISCO" src="/assets/images/scenes/avatar/DISCO.webp" /><br>
        Balonko<br><small>(can fly)</small>
      </div>
      <div>
        <input type="image" id="LAVA" src="/assets/images/scenes/avatar/LAVA.webp" /><br>
        Laveni<br><small>(immune to lava)</small>
      </div>
    </div>
  </div>
`

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      controlKeys: { ...baseControls, Space: 'jump' },
      customStartScreen,
      uiStyle: 'rpg',
      bojaPlatna: bojeNeba.suton,
    })
  }

  async init() {
    this.camera.position.set(0, 2, 56)
    hemLight({ intensity: Math.PI * 1.25, scene: this.scene })
    this.ground = createGround({ file: 'terrain/ground.jpg' })
    this.boxes = createRandomBoxes({ n: numBoxes, mapSize })
    this.lava = await createLava({ size: lavaSize })

    this.player = null
    this.addMesh(this.ground, ...this.boxes, this.lava)

    this.score = 0
  }

  createCoins() {
    this.coins = []
    for (let i = 0; i < numCoins; i++) {
      const pos = this.boxes[i].position.clone()
      pos.y += 6.15

      if (Math.random() > .8) {
        const platform = new Platform({ pos, file: null })
        this.add(platform)
        this.player.addSolids(platform.mesh)
      }

      const coin = new Coin({ pos })
      this.coins.push(coin)
      this.add(coin)
    }
  }

  async handleClick(e) {
    super.handleClick(e)
    if (e.target.tagName != 'INPUT') return

    const Avatar = await import('/core3d/actor/Avatar.js')
    this.player = new Avatar.default({ camera: this.camera, solids: [this.ground, ...this.boxes], skin: e.target.id, showHealthBar: true, maxJumpTime: .99, rpgStyle: true })
    this.player.chaseCamera.distance = 6
    this.addMesh(this.player.mesh)

    this.createCoins()
    this.player.position = [0, 0, lavaSize]
    this.player.energy = 100
    this.player.lookAt(this.scene.position)
    this.start()
  }

  /* LOOP */

  checkCollision(coin) {
    if (this.player.distanceTo(coin.mesh) > 1.4) return

    this.coins.splice(this.coins.findIndex(c => c === coin), 1)
    this.removeMesh(coin.mesh)
    this.score ++
    this.showMotivationalMessage()
  }

  showMotivationalMessage() {
    const message = messageDict[this.score]
    if (message) this.ui.showMessage(message)
  }

  sceneUI() {
    return this.ui.scoreUI('Score', this.score, 'coins left', this.coins.length)
  }

  update(dt, t) {
    super.update(dt)
    if (!this.player) return

    this.lava.material.uniforms.time.value = t * .5
    if (inLava(this.player) && this.player.skin != 'LAVA') {
      this.ui.showMessage('Get out of the lava, you\'re burning!')
      this.player.energy -= .1
    }

    this.coins.forEach(coin => this.checkCollision(coin))

    if (this.player.dead)
      this.defeat()
    else
      this.player.update(dt)

    if (this.coins.length === 0) this.victory()
  }
}
