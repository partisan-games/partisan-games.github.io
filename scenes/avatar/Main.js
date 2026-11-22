import Scene3D, { skyGradients } from '/core/Scene3D.js'
import { createGround, createLava } from '/core3d/ground.js'
import { hemLight } from '/core3d/light.js'
import { avatarControls } from '/ui/Controls.js'
import { createRandomBoxes } from '/core3d/geometry/index.js'
import Coin from '/core3d/objects/Coin.js'
import Platform from '/core3d/objects/Platform.js'

const numBoxes = 400, mapSize = 200, lavaSize = 100
const numCoins = numBoxes / 4

const withinCircle = position => Math.pow(position.x, 2) + Math.pow(position.z, 2) < Math.pow(lavaSize, 2)

const inLava = player => player.feet <= .1 && withinCircle(player)

const messageDict = {
  1: 'Well, that\'s a good start!',
  10: 'Keep up the good work!',
  25: 'Nice result so far...',
  50: 'Half down, half to go!',
  75: 'You smell victory in the air...',
}

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen ${container}">
    <h2>Choose your avatar</h2>
    <div class="game-screen-select">
      <div data-paid>
        <input type="image" id="STONE" src="/assets/images/scenes/avatar/STONE.webp" /><br>
        Kamenko<br><small>(basic)</small>
      </div>
      <div data-paid>
        <input type="image" id="DISCO" src="/assets/images/scenes/avatar/DISCO.webp" /><br>
        Balonko<br><small>(can fly)</small>
      </div>
      <div data-paid>
        <input type="image" id="LAVA" src="/assets/images/scenes/avatar/LAVA.webp" /><br>
        Laveni<br><small>(immune to lava)</small>
      </div>
    </div>
  </div>
`

export default class AvatarScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      controlKeys: avatarControls,
      customStartScreen,
      uiStyle: 'rpg',
      canvasBackground: skyGradients.suton,
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
        this.solids.push(platform.mesh)
      }

      const coin = new Coin({ pos })
      this.coins.push(coin)
      this.add(coin)
    }
  }

  handleClick(e) {
    if (e.target.tagName === 'INPUT' && ['STONE', 'DISCO', 'LAVA'].includes(e.target.id)) this.play(e.target.id)
  }

  async prepare(skin) {
    const [{ default: makeAvatar, avatarAbilities }, { lead }, { default: worldQueries }] = await this.session.keep(Promise.all([
      import('/core3d/actor/characters/Avatar.js'), import('/core3d/actor/characters/leadCharacter.js'),
      import('/core3d/actor/characters/worldQueries.js'),
    ]))
    if (this.ui.ended) return
    // the platforms made with the coins are solid too
    this.solids = [this.ground, ...this.boxes]
    // jumps here push up longer than elsewhere, and the disco ball still flies as long as jump is held
    const maxLift = Math.max(.99, avatarAbilities[skin].maxLift)
    const made = makeAvatar({ skin, z: lavaSize, maxLift, ...worldQueries(this.solids) })
    this.immuneToLava = avatarAbilities[skin].immuneToLava
    this.player = made.body
    this.avatarModel = made.model
    lead(this, made, { input: { buttonDict: { jump: '' } }, view: { distance: 6, speed: 4 } })
    this.player.face({ x: 0, z: 0 })
    this.createCoins()
  }

  checkCollision(coin) {
    if (this.avatarModel.mesh.position.distanceTo(coin.mesh.position) > 1.4) return

    coin.playSound()
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
    if (!this.player || this.ui.outro) return

    this.lava.material.uniforms.time.value = t * .5
    if (inLava(this.player) && !this.immuneToLava) {
      this.ui.showMessage('Get out of the lava, you\'re burning!')
      this.player.health.damage(6 * dt) // 6 per second, the old .1 per frame at 60 fps
    }

    this.coins.forEach(coin => this.checkCollision(coin))

    if (this.player.dead) this.defeat()

    if (this.coins.length === 0) this.victory()
  }
}
