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

export const slogans = [
  `BE REALISTIC
  DEMAND THE IMPOSSIBLE!`,
  `THE BARRICADE BLOCKS THE
  STREET BUT OPENS THE WAY`,
  'READ LESS - LIVE MORE',
  `NO REPLASTERING,
  THE STRUCTURE IS ROTTEN`,
  `WE WILL CLAIM NOTHING
  WE WILL ASK FOR NOTHING
  WE WILL TAKE, WE WILL OCCUPY!`,
  `DON\`T NEGOTIATE WITH BOSSES
  ABOLISH THEM!`,
  `NEITHER GOD
  NOR MASTER!`,
  `RUN COMRADE, 
  THE OLD WORLD
  IS BEHIND YOU!`,
  'POETRY IS IN THE STREET',
  `ART IS DEAD! 
  DON\`T CONSUME ITS CORPSE`,
  `POWER TO THE
  IMAGINATION!`,
  `THE ECONOMY IS SUFFERING
  LET IT DIE`,
  'ABOLISH ALIENATION!',
  'NEVER WORK!',
  `BELOW THE COBBLESTONES
  IS THE BEACH!`,
  `IT IS FORBIDDEN
  TO FORBID!`,
  `FREEDOM IS THE CRIME
  THAT CONTAINS ALL CRIMES;
  IT IS OUR ABSOLUTE WEAPON!`,
  `CONSUME LESS
  YOU'LL LIVE MORE`,
  'LIVE WITHOUT DEAD TIME!',
  `I TAKE MY DESIRES FOR REALITY
  BECAUSE I BELIEVE
  IN THE REALITY OF MY DESIRES`,
  'ALREADY 10 DAYS OF HAPPINESS',
  'DOWN WITH THE STATE!',
  'POLITICS IS IN THE STREETS',
  'LABOR UNIONS ARE WHOREHOUSES',
  'CONCRETE BREEDS APATHY',
  'YOU WILL END UP DYING OF COMFORT',
  `THOSE WHO LACK IMAGINATION
  CANNOT IMAGINE WHAT IS LACKING`,
  `A COP SLEEPS INSIDE
  EACH ONE OF US.
  WE MUST KILL HIM.`,
  `CAN YOU BELIEVE
  THAT SOME PEOPLE
  ARE STILL CHRISTIANS?`,
  `COMMODITIES ARE 
  THE OPIUM OF THE PEOPLE`,
  `THE FUTURE WILL ONLY CONTAIN
  WHAT WE PUT INTO IT NOW`
]

export const banksyArt = [
  'anarchy.jpg', 'change.png', 'cleaning.jpg', 'cop.jpg', 'flower.jpg', 'heart.png', 'monaliza.png', 'bomb.jpg', 'cops.jpg', 'peace.jpg', 'kids.jpg', 'airplanes.jpg'
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
