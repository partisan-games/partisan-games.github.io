import Input from '/core/io/Input.js'

/**
 * The game's own controls for an actor the player drives in its game. With an `inputLayout`, as games that read an
 * Input make one, the controls are its keys and, always in the catalog, the arrows and buttons on the screen, which
 * `makeController(input)` gets; without one, as in games where each player has keys of his own on one keyboard,
 * `makeController()` reads the keyboard itself. The stage runs the controller, and the story's end takes the controls
 * off the page.
 */
export function playerControls(stage, makeController, inputLayout) {
  if (!inputLayout) {
    stage.controllers.push(makeController())
    return
  }
  const input = new Input({ ...inputLayout, useJoystick: true })
  stage.controllers.push(makeController(input))
  stage.session.scope.add(() => input.end())
}
