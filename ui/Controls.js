import { uiStyles, containers, buttons } from './UI.js'

export const baseControls = {
  '← or A': 'left',
  '→ or D': 'right',
  '↑ or W': 'forward',
  '↓ or S': 'backward',
}

export const avatarControls = {
  ...baseControls,
  CapsLock: 'run',
  Space: 'jump',
}

export const fpsControls = {
  ...baseControls,
  Q: 'strafe left',
  E: 'strafe right',
  CapsLock: 'run',
  Mouse: 'attack',
  Space: 'jump',
}

export const thirdPersonControls = {
  ...baseControls,
  CapsLock: 'run',
  Enter: 'attack',
  Space: 'jump',
}

export const tankLeftControls = {
  'A': 'left',
  'D': 'right',
  'W': 'up',
  'S': 'down',
  Space: 'shoot'
}

export const tankRightControls = {
  '←': 'left',
  '→': 'right',
  '↑': 'up',
  '↓': 'down',
  Enter: 'shoot'
}

export default class Controls {
  constructor({
    controlKeys = baseControls,
    uiStyle = uiStyles.simple,
    positionClass = 'bottom-left',
  } = {}) {
    this.controlsOpen = false
    this.uiStyle = uiStyle
    this.init({ controlKeys, positionClass })
  }

  init({ controlKeys, positionClass }) {
    this.div = document.createElement('div')
    this.div.className = positionClass

    const button = document.createElement('button')
    button.className = buttons[this.uiStyle]

    const content = document.createElement('div')
    content.className = containers[this.uiStyle]
    content.innerHTML = Object.keys(controlKeys)
      .filter(key => controlKeys[key])
      .map(key => `${key} - ${controlKeys[key]}<br>`)
      .join('')

    const open = () => {
      content.style.display = 'block'
      button.innerHTML = 'CONTROLS &#9654;'
    }

    const close = () => {
      content.style.display = 'none'
      button.innerHTML = 'CONTROLS &#9660;'
    }

    if (this.controlsOpen) open()
    else close()

    button.addEventListener('pointerup', e => {
      e.stopPropagation()
      if (content.style.display == 'none') open()
      else close()
    })

    this.div.appendChild(button)
    this.div.appendChild(content)
    document.body.appendChild(this.div)
  }

  end() {
    this.div.remove()
  }
}