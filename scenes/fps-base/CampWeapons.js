import Sound from '/core/io/audio/SoundSource.js'
import { gameplayInputAllowed } from '/core/io/inputContext.js'

const pickupDistance = 2
export const takeWeapon = { code: 'KeyF', label: 'F' }

const equipment = {
  'weapon/rifle.fbx': { pose: 'rifle', attack: .48, reach: 100 },
  'weapon/luger/model.fbx': { pose: 'pistol', attack: .34, reach: 24 },
  'weapon/mg-42/lowpoly.fbx': { pose: 'heavy', attack: .24, reach: 100 },
  'weapon/flame-gun/model.fbx': { pose: 'heavy', attack: .4, reach: 7, fire: true },
}

/**
 * Handles one transfer per guard. Their actual model, sound and attack type follow the weapon. On a touch screen the
 * button of `touch`, the screen of the player's input, takes it as its `attack2` is pressed.
 */
export default class CampWeapons {
  constructor({ player, playerView, avatar, queries, canTake, guardSounds, touch }) {
    Object.assign(this, { player, playerView, avatar, queries, canTake, touch })
    this.guards = []
    this.attackSounds = new Map([...new Set(guardSounds)].map(file =>
      [file, new Sound(file, { profile: file === 'fire-swoosh.mp3' ? 'fire' : 'rifle', spatial: { getPosition: () => player.eye } })]))
    this.sounds = [...this.attackSounds.values()]
    document.addEventListener('keydown', this.onKey)
  }

  register(body, view, description) {
    const model = description.twoHandedWeapon ?? description.rightHandWeapon
    const carried = view.anim?.twoHandedWeapon ?? view.anim?.rightHandWeapon
    this.guards.push({ body, carried, model, sound: description.attackSound, taken: false })
  }

  onKey = event => {
    if (event.code !== takeWeapon.code || event.repeat || !this.canTake() || !gameplayInputAllowed(event.target)) return
    this.pickUp()
  }

  update() {
    const pressed = Boolean(this.touch?.attack2)
    if (pressed && !this.touchHeld && this.canTake()) this.pickUp()
    this.touchHeld = pressed
  }

  pickUp() {
    const { player, queries } = this
    if (!player.alive || player.swing || player.pendingBlow) return false

    let nearest = pickupDistance
    let found
    for (const guard of this.guards) {
      if (!guard.body.dead || guard.taken) continue

      const target = guard.body
      const direction = { x: target.x - player.x, y: 0, z: target.z - player.z }
      const distance = Math.hypot(direction.x, player.feet - target.feet, direction.z)
      if (distance >= nearest || (distance > 0 && queries.isBlocked(player.eye, direction, distance))
        || !queries.sees(player.eye, { x: target.x, y: target.feet + .3, z: target.z })) continue

      nearest = distance
      found = guard
    }
    if (!found) return false

    this.equip(found.model, found.sound)
    found.taken = true
    if (found.carried) found.carried.visible = false
    return true
  }

  equip(model, sound) {
    const settings = equipment[model.file]
    this.avatar.equip(model, settings)
    this.player.reach = settings.reach
    this.player.actions.attack = settings.attack
    this.playerView.attackSound = this.attackSounds.get(sound)
  }

  end() {
    document.removeEventListener('keydown', this.onKey)
  }
}
