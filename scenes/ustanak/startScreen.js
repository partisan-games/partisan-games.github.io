/** Turn based or real time, then one player against the computer or two at one keyboard. */
const startScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}" id="start-screen">
    <h2>Choose mode</h2>
    <fieldset class="mode-choice">
      <label><input type="radio" name="tempo" value="turns" checked> Turn based</label>
      <label><input type="radio" name="tempo" value="real-time"> Real time</label>
    </fieldset>
    <button class="bg-olive" id="jedan-igrac" data-paid>
      Player vs computer
    </button>
    <button class="bg-olive" id="dva-igraca" data-paid>
      2 players
    </button>
  </div>
`

export default startScreen
