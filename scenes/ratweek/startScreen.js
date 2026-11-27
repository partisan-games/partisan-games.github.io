import { assets } from '/config.js'

/** The bombers to choose from, the ones of Ratweek first, by their modules and names. */
export const planes = [['Liberator', 'B-24 Liberator'], ['FlyingFortress', 'B-17 Flying Fortress'], ['Mitchell', 'B-25 Mitchell'],
  ['Bomber', 'Avro Lancaster']].map(([id, name]) => ({ id, name }))

/** The bomber to choose before the flight. */
const startScreen = ({ container }) => {
  const options = planes.map(({ id, name }) => /* html */`
    <label data-paid>
      <input type="image" id="${id}" src="${assets.images}scenes/ratweek/${id}.webp" alt="Fly ${name}">
      <span>${name}</span>
    </label>
  `).join('')

  return /* html */`
    <div class="central-screen flex-column ${container}" id="start-screen">
        <h2>Choose your aircraft</h2>
        <div class="game-screen-select aircraft-select two-by-two-select">
            ${options}
        </div>
    </div>
  `
}

export default startScreen
