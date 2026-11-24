/**
 * Fires a player's gun from the attack key, as a shooter who holds his place: each shot the gun allows is a blow of
 * the body, which takes the gun's reach and damage. Something else turns him, as the mouse; he does not walk.
 */
export default class TriggerKeys {
  constructor(body, input, firearm) {
    this.body = body
    this.input = input
    this.equip(firearm)
  }

  /** Takes up another gun, as one left by a fallen comrade. */
  equip(firearm) {
    this.firearm = firearm
    this.body.reach = firearm.reach
    this.body.damage = firearm.damage
  }

  update(dt) {
    const { body } = this
    if (body.dead) return
    const ready = !body.swing && !(body.hurt > 0)
    if (this.firearm.pull(Boolean(this.input.attack) && ready, dt)) body.attack()
  }

  end() {
    this.input.end?.()
  }
}
