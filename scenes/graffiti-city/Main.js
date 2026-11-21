import { keys, attackLabels } from '/core/io/keys.js'
import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import { description as worker, models as workerModels } from '/core3d/actor/derived/ww2/Worker.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import { requestModels } from '/core3d/assets/models.js'
import { thirdPersonControls } from '/ui/Controls.js'
import { getEmptyCoords, sample } from '/core3d/helpers.js'
import { createFloor, grassColor } from '/core3d/ground.js'
import { createGraffitiBuilding } from '/core3d/city.js'
import { createTrees } from '/core3d/geometry/trees.js'

const mapSize = 200

const slogans = [
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

const posters = [
  'anarchy.jpg', 'change.png', 'cleaning.jpg', 'cop.jpg', 'flower.jpg', 'heart.png', 'monaliza.png', 'bomb.jpg', 'cops.jpg', 'peace.jpg', 'kids.jpg', 'airplanes.jpg'
]

const webFonts = ['Arial', 'Verdana', 'Trebuchet MS', 'Brush Script MT', 'Brush Script MT']
const fontColors = ['red', 'blue', 'black', '#222222', 'green', 'purple']

// return an array with a file at random index and rest empty
const getFiles = () => {
  const files = []
  files[sample([0, 1, 3, 4])] = 'posters/banksy/' + sample(posters)
  return files
}

export default class GraffitiCityScene extends Scene3D {
  constructor() {
    super({ controlKeys: { ...thirdPersonControls, [keys.jump.label]: '', [attackLabels.Enter]: '' }, toon: true })
  }

  async init() {
    await this.session.keep(requestModels(workerModels))
    const solids = []

    this.addMesh(createSun({ pos: [50, 100, 50], intensity: 2 * Math.PI }))
    const floor = createFloor({ size: mapSize * 1.2, color: grassColor })
    this.addMesh(floor)

    const coords = getEmptyCoords({ mapSize })
    const trees = createTrees({ coords, n: 20, nFirTrees: 10 })
    this.addMesh(trees)
    solids.push(trees)

    for (let i = 0; i < 40; i++) {
      const { x, z } = coords.pop()
      const building = Math.random() > .10
        ? createGraffitiBuilding({ x, z, slogans, webFonts, fontColors })
        : createGraffitiBuilding({ x, z, slogans, webFonts, fontColors, files: getFiles() })
      this.addMesh(building)
      solids.push(trees, building)
    }

    const { groundAt, isBlocked } = worldQueries(solids)
    const { body } = leadCharacter(this, worker, { ...coords.pop(), groundAt, isBlocked,
      input: { buttonDict: { jump: '', attack: '' } }, view: { showHealthBar: false, distance: 1.5 } })
    body.face({ x: 0, z: 0 })
  }
}
