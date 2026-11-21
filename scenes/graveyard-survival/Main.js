import * as THREE from 'three'
import Scene3D from '/core/Scene3D.js'
import { thirdPersonControls } from '/ui/Controls.js'
import { keys } from '/core/io/keys.js'
import { createGround } from '/core3d/ground.js'
import { createMoon, orbiting } from '/core3d/light.js'
import { getEmptyCoords, sample } from '/core3d/helpers.js'
import { createTombstone } from '/core3d/geometry/shapes.js'
import { description as gothGirl, models as gothModels } from '/core3d/actor/derived/horror/GothGirl.js'
import { description as zombieBarefoot, models as barefootModels } from '/core3d/actor/derived/horror/ZombieBarefoot.js'
import { description as zombieCop, models as copModels } from '/core3d/actor/derived/horror/ZombieCop.js'
import { description as zombieDoctor, models as doctorModels } from '/core3d/actor/derived/horror/ZombieDoctor.js'
import { description as zombieGuard, models as guardModels } from '/core3d/actor/derived/horror/ZombieGuard.js'
import { description as ghost, models as ghostModels } from '/core3d/actor/derived/horror/Ghost.js'
import DeadTree, { models as treeModels } from '/core3d/objects/DeadTree.js'
import { description as sorceress, models as sorceressModels } from '/core3d/actor/derived/fantasy/Sorceress.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import { computerDamage } from '/core/gameplay/damage.js'
import { icons } from '/core/io/icons.js'
import { Smoke } from '/core3d/Particles.js'
import { requestModels } from '/core3d/assets/models.js'
import ZombieWaves from './ZombieWaves.js'

const moonSpeed = .005
const totalTime = 300
const mapSize = 100
/** Where everyone on the graveyard stays. */
const bounds = { min: { x: -mapSize / 2, z: -mapSize / 2 }, max: { x: mapSize / 2, z: mapSize / 2 } }

const customStartScreen = ({ container, button }) => /* html */`
  <div class="central-screen ${container}">
    <ul><li>Survive until morning</li><li>Bonus: Kill zombies</li></ul>
    <button id="start" class="${button}" data-paid>Press to START!</button>
    <p>Meet the morning at the cursed graveyard.<p>
  </div>
`

export default class GraveyardSurvivalScene extends Scene3D {
  constructor() {
    super({
      controlKeys: { ...thirdPersonControls, [keys.attack2.label]: 'secondary attack' },
      customStartScreen,
      uiStyle: 'rpg',
      toon: true
    })
  }

  async init() {
    await this.session.keep(requestModels([
      ...gothModels, ...barefootModels, ...copModels, ...doctorModels, ...guardModels,
      ...ghostModels, ...treeModels, ...sorceressModels,
    ]))
    this.npcs = []
    this.solids = []
    this.zombies = []
    this.backgroundColor = 0x202030

    this.coords = getEmptyCoords({ mapSize, fieldSize: 1, emptyCenter: 1 })
    this.moon = createMoon({ intensity: Math.PI * 1.5, pos: [15, 25, -30] })
    this.addMesh(this.moon)
    this.addMesh(createGround({ size: mapSize }))

    for (let i = 0; i < 60; i++) {
      const tombstone = createTombstone({ pos: this.coords.pop() })
      this.solids.push(tombstone)
      this.addMesh(tombstone)
    }

    for (let i = 0; i < 10; i++) {
      const tree = new DeadTree({ pos: this.coords.pop(), scale: Math.random() * 1 + 1, rotateY: Math.random() * Math.PI })
      this.solids.push(tree.mesh)
      this.addMesh(tree.mesh)
    }

    this.world3d = worldQueries(this.solids)
    // ghosts drift through the tombstones
    for (let i = 0; i < 30; i++) {
      const { x, z } = this.coords.pop()
      const spirit = makeCharacter(ghost, { x, z, bounds })
      this.controllers.push(new CharacterAI(spirit.body, { way: 'wander' }))
      this.npcs.push(spirit.body)
      this.add(spirit.body, spirit.model)
    }

    this.player = leadCharacter(this, sorceress, { ...this.world3d, bounds, targets: this.npcs,
      input: { attackKey: 'Enter', buttonDict: { attack: icons.magic, attack2: icons.magic } } }).body

    this.particles = new Smoke({ size: 1, num: 100, minRadius: 0, maxRadius: .5, minVelocity: .2, maxVelocity: .5, min: -1, max: 0, loop: false })
    this.add(this.particles)
    this.spawner = new ZombieWaves({ session: this.session, spawn: () => this.addZombie() })
  }

  spawnZombie(interval) {
    this.spawner.update(interval / 1000)
  }

  addZombie() {
    const pos = sample(this.coords)
    const zombie = sample([gothGirl, zombieBarefoot, zombieCop, zombieDoctor, zombieGuard])
    const { body, model } = makeCharacter(zombie,
      { x: pos.x, z: pos.z, ...this.world3d, bounds, targets: [this.player], damage: computerDamage })
    this.controllers.push(new CharacterAI(body, { ...zombie.ai, target: this.player, way: 'wander', sees: this.world3d.sees }))
    this.particles.reset({ pos })
    this.add(body, model)
    this.npcs.push(body)
    this.zombies.push(body)
  }

  sceneUI() {
    const kills = this.zombies.filter(zombie => zombie.dead)
    return this.ui.scoreUI('Zombies killed', kills.length, 'Time left', Math.max(this.timeLeft, 0), 'blink')
  }

  update(delta, time) {
    super.update(delta)

    this.timeLeft = Math.ceil(totalTime - time)
    const isNight = this.timeLeft >= 0

    const moonTime = isNight ? time * moonSpeed : (time - totalTime) * moonSpeed
    orbiting(this.moon, moonTime, 150, 1)

    if (isNight) {
      if (!this.ui.outro) this.spawnZombie(10000) // no new zombies behind the end screen
      if (this.player.dead) this.defeat('You have been killed at the cursed graveyard.')
    } else {
      this.moon.material.color = new THREE.Color(0xFCE570)
      this.moon.scale.set(2, 2, 2)
      this.scene.background.lerp(new THREE.Color(0x7ec0ee), delta * .2)
      if (!this.player.dead) this.victory('Victory!<br>You met the morning at the cursed graveyard.')
    }
  }
}
