import { fighterBomberPlane } from '/core/actor/aircraft/fighterBomberPlanes.js'
import { assets } from '/config.js'

/** The aircraft the player may fly to Vis. */
export const planes = ['spitfire', 'hurricane', 'breguet', 'yak'].map(fighterBomberPlane)

/** The aircraft to choose before the flight to Vis. */
const startScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}" id="start-screen">
    <p>Reach the Island of Vis</p>
    <h2>Choose your aircraft</h2>
    <div class="game-screen-select aircraft-select">
      ${planes.map(plane => /* html */`
        <label data-paid>
          <input type="image" data-aircraft="${plane.id}" src="${assets.images}${plane.image}" alt="Fly ${plane.name}">
          <span>${plane.name}</span>
        </label>
      `).join('')}
    </div>
  </div>
`

export default startScreen
