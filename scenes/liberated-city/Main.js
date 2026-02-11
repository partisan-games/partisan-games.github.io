import Scena3D from '/core/Scena3D.js'
import { createSun } from '/core3d/light.js'
import { ResistanceFighterPlayer } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { thirdPersonControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { truePrims } from '/core3d/mazes/algorithms.js'
import { createFloor } from '/core3d/ground.js'
import { PartisanAI } from '/core3d/actor/derived/ww2/Partisan.js'
import { PartisanAimAI } from '/core3d/actor/derived/ww2/PartisanAim.js'
import { PartisanLowpolyAI } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { SovietPartisanAI } from '/core3d/actor/derived/ww2/SovietPartisan.js'
import { sample } from '/core3d/helpers.js'

const cellSize = 10
const rows = 6

const slogans = [
  `SMRT FAŠIZMU, 
  SLOBODA NARODU!`,
  `СМРТ ФАШИЗМУ, 
  СЛОБОДА НАРОДУ!`,
  `SMRT NARODNIM IZDAJICAMA
  USTAŠAMA I ČETNICIMA`,
  'ŽIVIO DRUG TITO',
  'ŽIVELA NARODNA VOJSKA!',
  'ЖИВИЛА НАРОДНА ВОЈСКА!',
  'UNIŠTIMO FAŠIZAM!',
  `15. SEPTEMBAR
  JE ZADNJI ROK!`,
  `NAROD ĆE SVOJU SLOBODU
  PISATI SAM!`,
  'NI ZRNO ŽITA OKUPATORU!',
  'ЖИВЕЛА НАРОДНА ВЛАСТ!',
  'KOMUNIZAM ĆE POBIJEDITI',
  'КОМУНИЗАМ ЋЕ ПОБИЈЕДИТИ',
  'SMRT OKUPATORU I IZDAJICAMA!',
  'ZGRABIMO ORUŽJE SVI!',
  'CRVENA ARMIJA DOLAZI',
  'ЦРВЕНА АРМИЈА ДОЛАЗИ',
  'U BORBU PROTIV OKUPATORA!',
  'SVI U PARTIZANE!',
  'СВИ У ПАРТИЗАНЕ!',
  `SVI NA FRONT
  SVE ZA FRONT!`,
  `ZAR TI JOŠ NE ZNAŠ
  ČITATI?`,
  `ЗАР ТИ ЈОШ НЕ ЗНАШ
  ЧИТАТИ?`,
  'ŽIVJELA CRVENA ARMIJA',
  `ŽIVILA KOMUNISTIČKA 
  PARTIJA JUGOSLAVIJE`,
  'ŽIVIO DRUG STARI',
]

const posters = [
  '15_rujan_zadnji_rok.webp', 'iz_naroda_hlapcev.webp', 'kultura_fasizma.jpg', 'ni_zrno_zita_okupatoru.webp', 'omladina_jugoslavije.webp', 'partizanka.webp', 'petokolonas_vreba.jpg', 'RED_ARMY_IS_HERE.jpg', 'smrt_fasizmu_sloboda_narodu.webp', 'svi_na_front.webp', 'svi_u_NOVJ.webp', 'tko bude uhvacen da pljacka.jpg', 'zar_ti_jos_ne_znas_citati.webp', 'zgrabimo_za_orozje_vsi.webp', 'zivio_27_mart.webp'
]

export default class extends Scena3D {
  constructor() {
    super({ controlKeys: thirdPersonControls, toon: true })
  }

  init() {
    const floor = createFloor({ file: 'terrain/ground.jpg' })
    this.addMesh(floor)
    this.addMesh(createSun({ pos: [50, 100, 50], intensity: 2 * Math.PI }))

    const maze = new Maze({ rows, columns: rows, truePrims, cellSize })
    const city = maze.toGraffitiCity({ texture: 'terrain/concrete.jpg', maxHeight: cellSize * .5, posters, slogans })
    this.addMesh(city)

    const coords = maze.getEmptyCoords(true, cellSize - 1)

    this.player = new ResistanceFighterPlayer({ camera: this.camera, solids: city, pos: coords.pop(), showHealthBar: false })
    this.player.putInMaze(maze)
    this.add(this.player)

    this.comrades = []
    for (let i = 0; i < 10; i++) {
      const AIClass = sample([PartisanAI, PartisanAimAI, PartisanLowpolyAI, SovietPartisanAI])
      const comrade = new AIClass({ pos: coords.pop(), solids: city })
      this.comrades.push(comrade)
      this.add(comrade)
    }
  }
}
