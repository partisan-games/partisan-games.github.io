import PlayerView from '/core3d/actor/behaviors/PlayerView.js'

/**
 * What a player sees of the character it leads: the camera chasing its model, faster as it runs, jumps or falls,
 * and its health bar. The scene adds it after the model, so the camera follows where the model was just put.
 */
export default class CharacterChase {
  constructor(body, model, { camera, showHealthBar = true, showCameraButton, height, distance, lookAt } = {}) {
    this.model = model
    this.view = new PlayerView({ mesh: model.mesh, height: body.size.height, health: body.health, camera,
      showHealthBar, showCameraButton })
    // a scene may bring the camera closer, raise it or have it look elsewhere on the model
    if (height !== undefined) this.view.chaseCamera.height = height
    if (distance !== undefined) this.view.chaseCamera.distance = distance
    if (lookAt) this.view.chaseCamera.lookAt = lookAt
  }

  update(dt) {
    this.view.update(dt, this.model.clip)
  }

  end() {
    this.view.end()
  }
}
