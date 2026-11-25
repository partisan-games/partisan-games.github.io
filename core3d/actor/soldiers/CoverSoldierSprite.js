import { Group } from 'three'
import { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import { billboard, showFrame } from '/core3d/assets/pixelArt.js'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'

/**
 * The German soldier of Neretva seen from the front, a 1.8 m man 63 px tall. The whole figure has seven poses:
 * standing with his rifle, kneeling and lying as he dies, three walking steps and firing; it covers `stride` metres
 * in one cycle of its steps. The upper body, which rises behind cover, has a row each for peeking, aiming, firing
 * and being hit, each in three faces; behind cover his head is `headroom` metres above it.
 */
export const coverSoldierArt = {
  whole: 'game-ready/vojnici/nemci-spreda-celo.webp',
  upper: 'game-ready/vojnici/nemci-spreda.webp',
  pxPerMeter: 63, poses: 7, faces: 3, rows: 4, stride: 1.3, headroom: .45,
}

const pose = { stand: 0, kneel: 1, lie: 2, steps: [3, 4, 5, 4], fire: 6 }
const row = { aim: 1, fire: 2, hit: 3 }
/** Seconds of each shot of a burst that his muzzle flashes. */
const flash = .055

/**
 * A `CoverSoldier` facing the camera, drawn from the `whole` and `upper` textures of `coverSoldierArt`, with one of
 * its three `face`s. In the open his whole figure walks, stands, fires and lies where he falls. Behind cover he is out
 * of sight until he rises to aim and fire; shot there, he sinks back behind it. His burst sounds from where he is.
 */
export default class CoverSoldierSprite {
  constructor(body, { whole, upper, face = 0, art = coverSoldierArt }) {
    Object.assign(this, { body, face, art })
    this.whole = billboard(whole, { pxPerMeter: art.pxPerMeter, columns: art.poses })
    this.upper = billboard(upper, { pxPerMeter: art.pxPerMeter, columns: art.faces, rows: art.rows })
    this.mesh = new Group()
    this.mesh.add(this.whole, this.upper)
    /** Metres walked, so the steps keep pace with the body. */
    this.walked = 0
    this.burstSound = new Sound('rafal.mp3', { loop: true, profile: 'rifle', spatial: audioPoint(this) })
    this.sounds = [this.burstSound]
    this.update(0)
  }

  update(dt) {
    const { body } = this
    if (body.state === 'move') this.walked += Math.hypot(body.vx, body.vz) * dt
    this.mesh.position.set(body.x, body.y - body.size.height / 2, body.z)
    this.burstSound.setPlaying(body.state === 'attack')
    this.whole.visible = !body.inCover
    this.upper.visible = body.inCover && this.upperRow !== null
    if (this.whole.visible) showFrame(this.whole, this.wholePose)
    if (this.upper.visible) {
      showFrame(this.upper, this.face, this.upperRow)
      this.upper.position.y = body.goal.cover + this.art.headroom - this.upper.scale.y
    }
  }

  get wholePose() {
    const { state, stateTime } = this.body
    if (state === 'move') return pose.steps[Math.floor(this.walked / this.art.stride * 4) % 4]
    if (state === 'dead') return stateTime < .12 ? pose.stand : stateTime < .75 ? pose.kneel : pose.lie
    if (state === 'attack' && stateTime % trench.shotInterval < flash) return pose.fire
    return pose.stand
  }

  /** The row of the upper body behind cover, or null while he is out of sight. */
  get upperRow() {
    const { state, stateTime } = this.body
    if (state === 'aim') return row.aim
    if (state === 'attack') return stateTime % trench.shotInterval < flash ? row.fire : row.aim
    if (state === 'dead' && stateTime < trench.fallTime) return row.hit
    return null
  }
}
