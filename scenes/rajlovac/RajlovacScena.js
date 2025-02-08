import Scena3D from '/core/Scena3D.js'
import { createGround, createFloor } from '/core3d/ground.js'
import { createMoon } from '/core3d/light.js'
import { sample, getEmptyCoords } from '/core3d/helpers.js'
import FPSPlayer from '/core3d/actor/FPSPlayer.js'
import GUI, { fpsControls } from '/core3d/io/GUI.js'
import { createAirport } from '/core3d/city.js'
import { loadModel } from '/core3d/loaders.js'
import Report from '/core3d/io/Report.js'
import DornierBomber from '/core3d/objects/DornierBomber.js'
import JunkersStuka from '/core3d/objects/JunkersStuka.js'
import HeinkelBomber from '/core3d/objects/HeinkelBomber.js'
import { AirportTower } from '/core3d/objects/Tower.js'
import { TankAI } from '/core3d/actor/derived/Tank.js'
import { GermanMachineGunnerAI } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { SSSoldierAI } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { NaziOfficerAI } from '/core3d/actor/derived/ww2/NaziOfficer.js'

const mapSize = 200
const dornierNum = 8, stukaNum = 8, heinkelNum = 7

export default class RajlovacScena extends Scena3D {
  constructor(manager) {
    super(manager, { usePointerLock: true })
  }

  async init() {
    this.setupGUI()
    this.bojaPozadine = 0x440033
    const ground = createGround({ file: 'terrain/ground.jpg' })
    ground.position.y -= .1
    const floor = createFloor({ size: mapSize, file: 'terrain/asphalt.jpg' })
    this.solids = []

    const coords = getEmptyCoords({ mapSize: mapSize * .5 })
    this.player = new FPSPlayer({ camera: this.camera, pos: [100, 0, 0] })
    this.player.lookAt(this.scene.position)

    this.aircraft = [
      ...Array.from({ length: dornierNum }, (_, i) => new DornierBomber({ pos: [-50 + i * 15, 0, -75] })),
      ...Array.from({ length: stukaNum }, (_, i) => new JunkersStuka({ pos: [-55, 0, -55 + i * 12] })),
      ...Array.from({ length: heinkelNum }, (_, i) => new HeinkelBomber({ pos: [-50 + i * 18, 0, 50] })),
    ]

    ;[[-75, -75], [-75, 75], [75, -75], [75, 75]].forEach(([x, z]) => {
      this.dodaj(new AirportTower(x, z))
    })

    const airport = createAirport()
    airport.translateX(75)
    airport.rotateY(Math.PI * .5)

    const airport2 = airport.clone()
    airport2.translateX(25)

    const bunker = await loadModel({ file: 'building/bunker.fbx', size: 3, texture: 'terrain/concrete.jpg' })
    bunker.position.set(75, 0, 25)

    this.solids.push(airport, airport2, bunker)
    this.player.addSolids(this.solids)

    const soldiers = [GermanMachineGunnerAI, SSSoldierAI, NaziOfficerAI]
    for (let i = 0; i < 10; i++) {
      const RandomClass = sample(soldiers)
      const soldier = new RandomClass({ pos: coords.pop(), target: this.player.mesh, mapSize })
      soldier.addSolids(this.solids)
      this.dodaj(soldier)
    }

    const tank = new TankAI({ mapSize })
    tank.addSolids(this.solids)
    this.dodaj(tank)

    this.dodajMesh(ground, floor, createMoon(), airport, airport2, bunker)
    this.dodaj(...this.aircraft, this.player)

    this.report = new Report({ container: document.getElementById('central-screen'), text: 'The German planes that sow death among our combatants are stationed at the Rajlovac Airport near Sarajevo.\n\nEnter the airport and destroy all enemy aircraft.' })
  }

  setupGUI() {
    this.gui = new GUI({ subtitle: 'Aircraft left', total: dornierNum + stukaNum + heinkelNum, scoreClass: '', controls: fpsControls, controlsWindowClass: 'white-window' })
  }

  startGame() {
    super.start()
    this.report.stop()
    this.uvodniProzor = null
  }

  handleClick(e) {
    super.handleClick(e)
    this.startGame()
  }

  uvodniProzor() {
    return /* html */`
    <div class="central-screen rpgui-container" id="central-screen">
      <button id="start" class="press-start">Press to START!</button>
      <div>
        Shoot: MOUSE<br>
        Move: WASD or ARROWS<br>
        Run: CAPSLOCK
      </div>
    </div>
    `
  }

  update(dt) {
    super.update(dt)
    if (!document.pointerLockElement) return

    const destroyed = this.aircraft.filter(plane => plane.energy <= 0)
    this.gui.update({ points: destroyed.length, left: this.aircraft.length - destroyed.length, dead: this.player.dead })

    if (destroyed.length == this.aircraft.length)
      this.gui.renderText('Congratulations!<br>All enemy planes were destroyed.')
  }
}
