/** One player against the computer or two at one keyboard. */
const startScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}" id="start-screen">
    <h2>Choose mode</h2>
    <button class="bg-olive" id="jedan-igrac" data-paid>
      1 player
    </button>
    <button class="bg-olive" id="dva-igraca" data-paid>
      2 players
    </button>
  </div>
`

export default startScreen
