import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'

/** The view of a boat seen from above: its picture points down the river, along a yaw of 0, spanning its width. */
export default class HullSprite extends BodySprite {
  fit() {
    super.fit()
    this.height = this.projection.length(this.body.size.width)
  }

  /** Its rounds, made the first time each is seen. */
  syncRounds() {
    this.syncViews(this.body.bullets.projectiles, round => new BulletSprite(round, this.projection, { scale: .4 }))
  }
}
