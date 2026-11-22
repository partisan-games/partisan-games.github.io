import Skirmisher from '/core/gameplay/bodies/soldiers/Skirmisher.js'
import SkirmisherSprite from '/core/actor/soldiers/SkirmisherSprite.js'

/**
 * Where the guards of a partisan airfield stand, in pixels from the middle of its building: beside the runway ahead
 * of where the plane waits, and past the runway's end.
 */
export const guardPosts = [760, 820, 2420]

/**
 * Partisan riflemen guarding the airfields: they stand by, and kneel and fire at the sky while `underAttack()`. Their
 * fire hits nothing the game counts. `airfields` have their middle `x` in pixels; `groundAt(x)` is in metres. The
 * scene adds their `drawables`; `guards` are `{ body, view }`.
 */
export default class AirfieldGuard {
  constructor({ airfields, groundAt, pxPerMeter, views, underAttack }) {
    this.underAttack = underAttack
    this.guards = airfields.flatMap(airfield => guardPosts.map(offset => {
      const body = new Skirmisher({ x: (airfield.x + offset) / pxPerMeter, groundAt, yaw: 0 })
      return { body, view: new SkirmisherSprite(body, views) }
    }))
  }

  get drawables() {
    return this.guards.flatMap(({ body, view }) => [body, view])
  }

  update() {
    const wanted = this.underAttack() ? 'fire' : 'idle'
    for (const { body } of this.guards)
      if (body.alive && body.state !== wanted && body.state !== 'kneel') body.setState(wanted)
  }
}
