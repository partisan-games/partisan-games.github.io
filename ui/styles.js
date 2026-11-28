import { readSetting, saveSetting } from './settings.js'

const whiteStyle = {
  container: 'white-container',
  button: 'white-button',
  score: '',
  controlButton: 'white-button',
  healthBar: '',
}

/** The classes that each UI style gives to the shared elements. */
export const styleClasses = {
  white: whiteStyle,
  ww2: { ...whiteStyle, container: `${whiteStyle.container} ww2-container` },
}

/** What the player can pick in Settings: the style each game has, or one style for every game. */
export const styleChoices = { predefined: 'Predefined', white: 'White', ww2: 'WW2' }

// only one scene lives at a time, and it sets its style before it creates any element
const defaultStyle = 'ww2'
let gameStyle = defaultStyle
const savedChoice = readSetting('uiStyle')
let playerChoice = savedChoice in styleChoices ? savedChoice : 'predefined'
const listeners = new Set()

const currentStyle = () => playerChoice === 'predefined' ? gameStyle : playerChoice

/** The style the game gives its UI; the player's choice in Settings, if any, wins over it. */
export function setUiStyle(style = defaultStyle) {
  gameStyle = Object.hasOwn(styleClasses, style) ? style : defaultStyle
}

export const currentStyleClasses = () => styleClasses[currentStyle()]

export const uiStyleChoice = () => playerChoice

/** Picks the style of every game, keeps it for later visits and restyles what is on the page now. */
export function chooseUiStyle(choice) {
  if (!(choice in styleChoices)) return
  const before = currentStyleClasses()
  playerChoice = choice
  saveSetting('uiStyle', choice)
  for (const listener of listeners) listener(before, currentStyleClasses())
}

/** Calls `listener(before, after)` with the classes of each style change; gives the function that stops it. */
export function onStyleChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
