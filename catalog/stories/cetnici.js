import ArtClip from '/core/actor/ArtClip.js'
import MuzzleFlash from '/core/actor/effects/MuzzleFlash.js'
import Sound from '/core/io/audio/SoundSource.js'
import * as art from '/core/actor/soldiers/cetnikArt.js'
import scales from '../scales.js'

const height = 1.8
const pxPerMeter = scales.side

export const soldiers = [
  ['strelac', 'Četnik strelac', 'rifle.mp3'],
  ['jurisnik', 'Četnik jurišnik', 'rifle.mp3'],
  ['mitraljezac', 'Četnik mitraljezac', 'rafal.mp3'],
].map(([role, name, sound]) => ({
  id: `cetnik-${role}`, name, game: 'Katalog', block: art, pxPerMeter, way: 1,
  create(stage, way = 1) {
    const sheet = new ArtClip(art.sheets[role])
    const { anchor, standingPixels, clips, muzzle } = sheet.art
    const scaleX = height * pxPerMeter / standingPixels
    const { ms, frameColumns, soundFrames = [1] } = clips.attack
    let elapsed = 0
    const frameTimes = ms.map(duration => {
      const start = elapsed / 1000
      elapsed += duration
      return start
    })
    const fireTimes = frameTimes.filter((_, frame) => (frameColumns?.[frame] ?? frame) === 1)
    const soundTimes = soundFrames.map(frame => frameTimes[frame])
    const attackDuration = elapsed / 1000
    const burst = fireTimes.length > 1
    const flash = new MuzzleFlash(stage)
    const shot = new Sound(sound, { profile: 'rifle', volume: .25 })
    const actor = {
      x: stage.width / 2, states: Object.keys(clips), state: 'idle', stateTime: 0,
      afterAttack: 'idle', children: [sheet, flash], sounds: [shot],
      setState(state) {
        if (!this.states.includes(state) || this.state === 'dead' || this.state === state) return
        if (state === 'attack') this.afterAttack = this.state
        if (burst && this.state === 'attack' && this.stateTime < attackDuration) shot.stop()
        this.state = state
        this.stateTime = 0
        flash.hide()
      },
      update(dt) {
        const previous = this.stateTime
        this.stateTime += dt
        if (this.state !== 'attack') return
        if (this.stateTime >= attackDuration) return this.setState(this.afterAttack)
        const crossed = time => previous < time && this.stateTime >= time
        if (soundTimes.some(crossed)) shot.play()
        const firing = !burst || sheet.sample('attack', this.stateTime).frame === 1
        if (!firing) return flash.hide()
        if (fireTimes.some(crossed)) flash.start({ x: this.x + way * (muzzle[0] - anchor.x) * scaleX,
          y: stage.groundY + (muzzle[1] - anchor.y) * scaleX }, way > 0 ? 0 : Math.PI)
      },
      render(ctx) {
        sheet.draw(ctx, { name: this.state, time: this.stateTime, x: this.x, y: stage.groundY, scaleX, flip: way })
      },
    }
    stage.add(actor)
    return actor
  },
}))
