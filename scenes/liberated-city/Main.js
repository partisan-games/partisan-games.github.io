import { keys, attackLabels } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import { description as resistanceFighter, models as resistanceFighterModels } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { thirdPersonControls } from '/ui/Controls.js'
import Maze from '/core3d/mazes/Maze.js'
import { truePrims } from '/core3d/mazes/algorithms.js'
import { createFloor } from '/core3d/ground.js'
import { description as partisan, models as partisanModels } from '/core3d/actor/derived/ww2/Partisan.js'
import { description as partisanAim, models as partisanAimModels } from '/core3d/actor/derived/ww2/PartisanAim.js'
import { description as partisanLowpoly, models as partisanLowpolyModels } from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import { description as sovietPartisan, models as sovietPartisanModels } from '/core3d/actor/derived/ww2/SovietPartisan.js'
import { sample } from '/core3d/helpers.js'
import { requestModels } from '/core3d/assets/models.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import { icons } from '/core/io/icons.js'

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

const textures = ['ruin-01.jpg', 'ruin-02.jpg', 'ruin-03.jpg', 'ruin-04.jpg', 'ruin-back.jpg', 'warehouse.jpg']

export default class LiberatedCityScene extends Scene3D {
  constructor() {
    super({ controlKeys: { ...thirdPersonControls, [keys.jump.label]: '', [attackLabels.Enter]: 'shoot' }, toon: true })
  }

  async init() {
    await requestModels([...resistanceFighterModels, ...partisanModels, ...partisanAimModels, ...partisanLowpolyModels, ...sovietPartisanModels])
    const floor = createFloor({ file: 'terrain/ground.jpg' })
    this.addMesh(floor)
    this.addMesh(createSun({ pos: [50, 100, 50], intensity: 2 * Math.PI }))

    const maze = new Maze({ rows, columns: rows, algorithm: truePrims, cellSize })
    const city = maze.toGraffitiCity({ maxHeight: cellSize * .5, posters, slogans, postersPath: 'posters/partisan/', textures, graffitiBgTexture: 'terrain/concrete.jpg' })
    this.addMesh(city)

    const coords = maze.getEmptyCoords(true, cellSize - 1)

    const world = worldQueries(city)
    // the fighter starts in the first corridor, facing the middle of the city
    const { body } = leadCharacter(this, resistanceFighter, { ...maze.tilePosition(1, 1), ...world,
      input: { buttonDict: { attack: icons.shoot } }, view: { showHealthBar: false, distance: 1.5 } })
    body.face({ x: 0, z: 0 })

    // comrades wander the streets
    for (let i = 0; i < 10; i++) {
      const { x, z } = coords.pop()
      const comrade = makeCharacter(sample([partisan, partisanAim, partisanLowpoly, sovietPartisan]), { x, z, ...world })
      this.controllers.push(new CharacterAI(comrade.body, { way: 'wander' }))
      this.add(comrade.body, comrade.model)
    }
  }
}
