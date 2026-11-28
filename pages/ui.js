import { icons, iconImages } from '/core/io/icons.js'
import Touch from '/core/io/Touch.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import { assets } from '/config.js'
import { styleChoices, styleClasses } from '/ui/styles.js'
import { defeatOutcome, endScreen, markPaid, messageScreen, pauseButton, pauseScreen, scoreBoard, settingsScreen,
  startScreen, victoryOutcome } from '/ui/UI.js'
import Controls, { baseControls } from '/ui/Controls.js'
import PowerMeter from '/ui/PowerMeter.js'
import Report from '/ui/Report.js'
import { healthBar } from '/ui/components.js'
import { createWallet, showBalance } from '/ui/Arcade.js'
import avatarStart from '/scenes/avatar/startScreen.js'
import warplaneStart from '/scenes/ratweek/startScreen.js'
import tankStart from '/scenes/tenkici/startScreen.js'
import uprisingStart from '/scenes/ustanak/startScreen.js'
import visStart from '/scenes/vis/startScreen.js'

const themes = Object.entries(styleClasses).map(([key, classes]) => ({ name: styleChoices[key], classes }))

/** Every window the games show, as each theme draws it; the windows come from the games' own code. */
const windows = [
  ['Početak', classes => startScreen(classes, { intro: 'Reach the Island of Vis', startText: 'Start mission' })],
  ['Izbor režima (Tenkići)', tankStart],
  ['Izbor režima (Ustanak)', uprisingStart],
  ['Izbor aviona (Vis)', visStart],
  ['Izbor aviona (Warplane)', warplaneStart],
  ['Izbor avatara', avatarStart],
  ['Pauza', classes => pauseScreen(classes, { costsToken: true })],
  ['Podešavanja', settingsScreen],
  ['Pobeda', classes => endScreen(classes, { outcome: victoryOutcome('All the factories are destroyed.'), costsToken: true })],
  ['Poraz', classes => endScreen(classes, { outcome: defeatOutcome('Your plane is down.'), costsToken: true })],
  ['Poruka', () => messageScreen('Destroy the factories')],
]

/** The briefing that types itself above the start window. */
const reportText = 'Adriatic Sea, autumn 1944\n\nThe partisan squadron moves to Vis. Your task is to deliver a new Allied fighter from Italy.'

/** What a game shows over itself while it runs. */
const hud = [
  ['Rezultat', classes => scoreBoard(classes, { text: 'Score', points: 12, subtext: 'Time left', subpoints: 45, smallClass: 'blink' })],
  ['Zdravlje', () => healthBar(.7)],
  ['Snaga hica', classes => {
    const meter = new PowerMeter({ min: 0, max: 1, chargePerSecond: 1 })
    meter.stopRestyling()
    meter.charge(.6)
    meter.element.className = `progress potisak ${classes.healthBar}`.trim()
    return meter.element
  }],
  ['Municija i bombe', () => `<div><img src="${assets.images}${iconImages.ammunition}" alt="Rounds" width="32" height="8"> 120
    <br>${icons.bomb.repeat(3)}</div>`],
  ['Bombe (Otpisani)', () => `<button class="hud-button" aria-label="Grenades" aria-pressed="true">${icons.bomb} 3</button>`],
  ['Kontrole', classes => {
    const controls = new Controls({ controlKeys: baseControls, positionClass: '', canToggle: () => true })
    controls.stopRestyling()
    const [button, content] = controls.div.children
    button.className = classes.controlButton
    content.className = classes.container
    return controls.div
  }],
  ['Pauza na dodir', () => pauseButton()],
]

/** Names on the page for the UI pictures known in code by another name. */
const pictureNames = { sight: 'Nišan' }

/** The picture shown while a game loads, and every UI picture. */
const pictures = [
  ['Učitavanje', '/assets/images/ui/loader.gif'],
  ...Object.entries(iconImages).map(([name, path]) => [pictureNames[name] ?? name, `${assets.images}${path}`]),
]

const cell = content => {
  const td = document.createElement('td')
  const stage = document.createElement('div')
  stage.className = 'preview-stage'
  if (content instanceof Node) stage.append(content)
  else stage.innerHTML = content
  td.append(stage)
  return td
}

/** A table of `rows`, one column for each theme. */
function themeTable(rows) {
  const table = document.createElement('table')
  table.className = 'preview-table'
  table.innerHTML = `<thead><tr><td></td>${themes.map(({ name }) => `<th scope="col">${name}</th>`).join('')}</tr></thead>`
  const body = table.createTBody()
  for (const [name, draw] of rows) {
    const row = body.insertRow()
    row.innerHTML = `<th scope="row">${name}</th>`
    for (const { classes } of themes) row.append(cell(draw(classes)))
  }
  return table
}

const section = (title, ...content) => {
  const element = document.createElement('section')
  element.innerHTML = `<h2>${title}</h2>`
  element.append(...content)
  return element
}

/** The touch arrows and buttons, as a touch screen shows them: all the buttons the Vis fighter has, and a jump. */
function touchControls() {
  const touch = new Touch({ useJoystick: true, buttonDict: { jump: null, ...inputLayouts.fighterBomber.buttonDict } })
  touch.buttonsResize.disconnect()
  const element = document.createElement('div')
  element.className = 'preview-touch'
  element.append(touch.joystick, touch.buttonContainer)
  return element
}

function iconList() {
  const list = document.createElement('dl')
  list.className = 'preview-icons'
  list.innerHTML = [
    ...Object.entries(icons).map(([name, icon]) => `<div><dt>${name}</dt><dd class="preview-icon">${icon}</dd></div>`),
    ...pictures.map(([name, src]) => `<div><dt>${name}</dt><dd><img src="${src}" alt=""></dd></div>`),
  ].join('')
  return list
}

/**
 * Draws into `root` every UI element the games use, the windows and the HUD in each theme, and gives the function
 * that shows tokens as available or not on the paid buttons.
 */
export default function renderPreview(root) {
  const windowTable = themeTable(windows)
  const wallet = createWallet('10 coins every day')
  root.append(
    section('Prozori', windowTable),
    section('Tokom igre', themeTable(hud)),
    section('Dodir', touchControls()),
    section('Žetoni', wallet),
    section('Ikonice i slike', iconList()),
  )
  for (const start of windowTable.querySelectorAll('tbody tr:first-child .central-screen'))
    new Report({ text: reportText, container: start })
  const screens = [...windowTable.querySelectorAll('.preview-stage')]
  return available => {
    screens.forEach(screen => markPaid(screen, available ? 1 : 0))
    showBalance(wallet, available ? 7 : 0)
  }
}
