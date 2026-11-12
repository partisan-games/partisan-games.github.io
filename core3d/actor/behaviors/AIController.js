/** The FSM writes intentions here; no keyboard or DOM event source is created. */
export default class AIController {
  constructor() {
    this.intent = {
      up: false, down: false, left: false, right: false, run: false, jump: false,
      attack: false, attack2: false, special: false, strafeLeft: false, strafeRight: false,
    }
  }
}
