import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import { loadModel } from '/core3d/loaders.js'
import { terrainFromHeightmap } from '/core3d/terrain/heightmap.js'
import { createFlag } from '/core3d/geometry/index.js'
import { wave } from '/core3d/ground.js'
import { PartisanPlayer } from '/core3d/actor/derived/ww2/Partisan.js'
import { thirdPersonControls } from '/ui/Controls.js'

export default class SpomeniciScena extends Scena3D {
  constructor(manager) {
    super(manager, { controlKeys: thirdPersonControls, toon: true })
  }

  async init() {
    this.bojaPlatna = 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)'
    this.addMesh(createSun({ intensity: 2 * Math.PI }))

    const terrain = await terrainFromHeightmap({ file: 'yu-crop.png', heightFactor: 3, snow: false })

    this.player = new PartisanPlayer({ camera: this.camera, solids: terrain, altitude: .7 })
    this.player.position.z = 2

    const [kosmaj, kosovskaMitrovica, podgaric, kadinjaca, ilirskaBistrica] = await Promise.all([
      await loadModel({ file: 'building/monument/kosmaj.fbx', size: 30, texture: 'terrain/beton.gif' }),
      await loadModel({ file: 'building/monument/kosovska-mitrovica.fbx', size: 19, texture: 'walls/concrete_wall_2b.jpg' }),
      await loadModel({ file: 'building/monument/podgaric.fbx', size: 10, texture: 'terrain/concrete.jpg' }),
      await loadModel({ file: 'building/monument/kadinjaca.fbx', size: 15, texture: 'terrain/beton.gif' }),
      await loadModel({ file: 'building/monument/ilirska-bistrica.fbx', size: 8, texture: 'terrain/beton.gif' }),
    ])

    kosovskaMitrovica.position.set(-50, 6, -100)
    kosovskaMitrovica.rotateY(-Math.PI * .125)

    podgaric.position.set(40, 10, -40)
    podgaric.rotateY(Math.PI * .75)

    kosmaj.position.set(-46, 14.2, -20)
    kadinjaca.position.set(0, 11, -4)
    ilirskaBistrica.position.set(40, 10.6, 20)

    this.camera.position.y = 20

    const redFlag = createFlag({ file: 'prva-proleterska.jpg' })
    redFlag.position.set(-1.5, 11.2, 0)
    this.redCanvas = redFlag.getObjectByName('canvas')

    const yuFlag = createFlag({ file: 'sfrj.png' })
    yuFlag.position.set(1.5, 11, 0)
    this.yuCanvas = yuFlag.getObjectByName('canvas')

    const solids = [terrain, redFlag, yuFlag, kadinjaca, kosmaj, kosovskaMitrovica, podgaric, kosovskaMitrovica, ilirskaBistrica]
    this.player.addSolids(solids)

    this.addMesh(terrain, ...solids)
    this.add(this.player)
  }

  update(delta, time) {
    super.update(delta, time)
    if (!this.redCanvas) return

    wave({ geometry: this.redCanvas.geometry, time: time * 2, amplitude: 2.5, frequency: 2 })
    wave({ geometry: this.yuCanvas.geometry, time: time * 2, amplitude: 2.5, frequency: 2 })
  }
}
