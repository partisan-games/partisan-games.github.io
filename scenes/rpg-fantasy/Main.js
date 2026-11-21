import { keys } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import { createHillyTerrain } from '/core3d/ground.js'
import { createTreesOnTerrain } from '/core3d/geometry/trees.js'
import { createSun } from '/core3d/light.js'
import { sample, getEmptyCoords, putOnSolids } from '/core3d/helpers.js'
import { loadModel } from '/core3d/loaders.js'
import { thirdPersonControls } from '/ui/Controls.js'
import { description as barbarian, models as barbarianModels } from '/core3d/actor/derived/fantasy/Barbarian.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import { computerDamage } from '/core/gameplay/damage.js'
import { icons } from '/core/io/icons.js'
import { requestModels } from '/core3d/assets/models.js'

const mapSize = 400
/** Where everyone stays. */
const bounds = { min: { x: -mapSize / 2, z: -mapSize / 2 }, max: { x: mapSize / 2, z: mapSize / 2 } }

const messageDict = {
  1: 'You just killed the first Orc.<br>Middle Earth shall be free!',
  10: 'You killed half the vile creatures',
  19: 'You smell victory in the air...',
}

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen ${container}">
      <ul><li>Kill all the Orcs</li></ul>
      <button id="start" class="game-title" data-paid>Press to START!</button>
      <p>Free the land<br>from their vile presence!</p>
  </div>
`

export default class RpgFantasyScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      controlKeys: { ...thirdPersonControls, [keys.attack2.label]: 'secondary attack', [keys.special.label]: 'special' },
      customStartScreen,
      uiStyle: 'rpg',
    })
    this.score = 0
  }

  async init() {
    await requestModels([...barbarianModels])
    this.camera.position.set(0, 50, 150)

    const sun = createSun({ pos: [15, 100, 50], intensity: 2 * Math.PI })
    const terrain = await createHillyTerrain({ size: mapSize, factorY: 30 })
    const trees = createTreesOnTerrain({ terrain })
    this.addMesh(sun, terrain, trees)

    const coords = getEmptyCoords({ mapSize: mapSize * .9, fieldSize: 5 })

    const castle = await loadModel({ file: 'building/castle/fortress.fbx', size: 40 })
    putOnSolids(castle, terrain, -5)
    this.addMesh(castle)

    const solids = [terrain, castle]

    const world = worldQueries(solids)
    this.orcs = []
    const { x, z } = coords.pop()
    this.player = leadCharacter(this, barbarian, { x, z, bounds, targets: this.orcs, ...world, view: { showCameraButton: true },
      input: { buttonDict: { jump: '', attack: icons.attack, attack2: icons.unarmed, special: icons.magic } } }).body

    for (let i = 0; i < 20; i++) {
      const name = sample(['Orc', 'OrcOgre'])
      const orc = await import(`/core3d/actor/derived/fantasy/${name}.js`)
      await requestModels(orc.models)
      const { x, z } = coords.pop()
      const { body, model } = makeCharacter(orc.description, { x, z, bounds, targets: [this.player], damage: computerDamage, ...world })
      this.controllers.push(new CharacterAI(body, { target: this.player, way: 'wander', sees: world.sees }))
      this.add(body, model)
      this.orcs.push(body)
    }

    const Potion = await import('/core3d/objects/Potion.js')
    await requestModels(Potion.models)
    this.potions = Array.from({ length: 3 }, () => {
      const potion = new Potion.default({ pos: coords.pop(), solids })
      this.addMesh(potion.mesh)
      return potion
    })

    const Monument = await import('/core3d/objects/Monument.js')
    await requestModels(Monument.models)
    const monument = new Monument.default({ pos: coords.pop(), solids: terrain })
    this.addMesh(monument.mesh)

    const flamingo = await import('/core3d/actor/derived/Flamingo.js')
    await requestModels(flamingo.models)
    // flamingos wander 60 m above the sea level, not following the hills
    for (let i = 0; i < 10; i++) {
      const { x, z } = coords.pop()
      const bird = makeCharacter(flamingo.description, { x, z, bounds })
      this.controllers.push(new CharacterAI(bird.body, { way: 'wander' }))
      this.add(bird.body, bird.model)
    }

    const Cloud = await import('/core3d/objects/Cloud.js')
    await requestModels(Cloud.models)
    for (let i = 0; i < 5; i++) {
      const cloud = new Cloud.default({ mapSize, pos: coords.pop() })
      this.add(cloud)
    }

    const zeppelin = await import('/core3d/actor/derived/Zeppelin.js')
    await requestModels(zeppelin.models)
    // the airship crosses the map straight, turning back at its edge
    const airship = makeCharacter(zeppelin.description, { bounds, groundAt: worldQueries(terrain).groundAt })
    this.controllers.push(new CharacterAI(airship.body, { way: 'patrol', patrolDistance: Infinity }))
    this.add(airship.body, airship.model)
  }

  /** A potion the hurt barbarian stands by gives a point of health a frame until it is drunk. */
  drinkPotions() {
    const { health } = this.player
    for (const potion of this.potions ?? []) {
      const { x, z } = potion.position
      if (Math.hypot(this.player.x - x, this.player.z - z) >= 1 || health.current === health.maximum || !potion.energy) continue
      potion.energy--
      health.heal(1)
      if (!potion.energy) this.removeMesh(potion.mesh)
    }
  }

  showMotivationalMessage() {
    this.score ++
    const message = messageDict[this.score]
    if (message) this.ui.showMessage(message)
  }

  sceneUI() {
    this.left = this.orcs.length - this.score
    return this.ui.scoreUI('Score', this.score, 'Orcs left', this.left)
  }

  update(dt, t) {
    super.update(dt, t)
    this.drinkPotions()
    // each orc that falls earns a point, and some points a word of encouragement
    const fallen = this.orcs.filter(orc => orc.dead).length
    while (this.score < fallen) this.showMotivationalMessage()

    if (this.player.dead) this.defeat('The orcs have defeated you.')
    if (this.left === 0) this.victory()
  }
}
