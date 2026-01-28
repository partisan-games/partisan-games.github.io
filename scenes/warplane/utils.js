import * as THREE from 'three'
import { createWarehouse, createWarehouse2, createWarRuin, createRuin, createAirport } from '/core3d/city.js'
import Building from '/core3d/objects/Building.js'
import Tower from '/core3d/objects/Tower.js'
import Factory from '/core3d/objects/Factory.js'

const { randInt } = THREE.MathUtils

export const createBuilding = async time => {
  const minutes = Math.floor(time / 60)
  switch (randInt(1, 7 + minutes)) {
    case 1: return new Factory()
    case 2: return new Building({ mesh: createAirport() })
    case 3: return new Building({ mesh: createWarRuin(), name: 'civil' })
    case 4: return new Building({ mesh: createRuin(), name: 'civil' })
    case 5: return new Building({ mesh: createWarehouse() })
    case 6: return new Building({ mesh: createWarehouse2() })
    default: return new Tower()
  }
}

export const createStartScreen = () => {
  const style = 'border: 3px solid black; height: 140px'
  const options = ['Biplane', 'Triplane', 'Messerschmitt', 'Bomber', 'F18']
    .map(name => `<input type="image" id="${name}" src="/assets/images/scenes/${name}.png" style="${style}" />`)
    .join('')

  return /* html */`
    <div class="central-screen simple-container" style="width:540px">
        <h2>Choose your aircraft</h2>
        <div class="game-screen-select">
            ${options}
        </div>
    </div>
`
}