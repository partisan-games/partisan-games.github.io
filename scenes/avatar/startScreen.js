/** The avatar to choose before the game: each has his own power. */
const startScreen = ({ container }) => /* html */`
  <div class="central-screen ${container}">
    <h2>Choose your avatar</h2>
    <div class="game-screen-select">
      <div data-paid>
        <input type="image" id="STONE" src="/assets/images/scenes/avatar/STONE.webp" /><br>
        Kamenko<br><small>(basic)</small>
      </div>
      <div data-paid>
        <input type="image" id="DISCO" src="/assets/images/scenes/avatar/DISCO.webp" /><br>
        Balonko<br><small>(can fly)</small>
      </div>
      <div data-paid>
        <input type="image" id="LAVA" src="/assets/images/scenes/avatar/LAVA.webp" /><br>
        Laveni<br><small>(immune to lava)</small>
      </div>
    </div>
  </div>
`

export default startScreen
