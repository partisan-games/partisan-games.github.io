import PlayerView from '/core3d/actor/behaviors/PlayerView.js'

/** What the body does, as far as the chasing camera cares: it hurries after one rising, falling or running. */
const motion = body => {
  if (body.leap > 0 || body.vy > 0) return 'jump'
  if (body.airborne) return 'fall'
  return body.state === 'move' && body.running ? 'run' : body.state
}

/**
 * What a player sees of the character it leads: the camera chasing its model, faster as it runs, jumps or falls,
 * and its health bar. The scene adds it after the model, so the camera follows where the model was just put.
 */
export default class CharacterChase {
  constructor(body, model, { camera, showHealthBar = true, showCameraButton, height, distance, lookAt, speed } = {}) {
    this.body = body
    this.view = new PlayerView({ mesh: model.mesh, height: body.size.height, health: body.health, camera,
      showHealthBar, showCameraButton })
    // a scene may bring the camera closer, raise it, have it look elsewhere on the model or follow faster
    if (height !== undefined) this.view.chaseCamera.height = height
    if (distance !== undefined) this.view.chaseCamera.distance = distance
    if (lookAt) this.view.chaseCamera.lookAt = lookAt
    if (speed !== undefined) this.view.chaseCamera.speed = speed
  }

  update(dt) {
    this.view.update(dt, motion(this.body))
  }

  end() {
    this.view.end()
  }
}
