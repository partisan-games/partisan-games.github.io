import { keys, attackLabels, leftPlayerKeys, rightPlayerKeys } from '/core/io/keys.js'
import { currentStyleClasses } from './styles.js'

export const baseControls = {
  [keys.left.label]: 'left',
  [keys.right.label]: 'right',
  [keys.up.label]: 'forward',
  [keys.down.label]: 'backward',
  [keys.pause.label]: 'pause',
}

export const avatarControls = {
  ...baseControls,
  [keys.run.label]: 'run',
  [keys.jump.label]: 'jump',
}

export const fpsControls = {
  ...baseControls,
  [keys.strafeLeft.label]: 'strafe left',
  [keys.strafeRight.label]: 'strafe right',
  [keys.run.label]: 'run',
  [attackLabels.pointer]: 'attack',
  [keys.jump.label]: 'jump',
}

export const thirdPersonControls = {
  ...baseControls,
  [keys.run.label]: 'run',
  [attackLabels.Enter]: 'attack',
  [keys.jump.label]: 'jump',
}

const playerControls = playerKeys => ({
  [playerKeys.left.label]: 'left',
  [playerKeys.right.label]: 'right',
  [playerKeys.up.label]: 'up',
  [playerKeys.down.label]: 'down',
  [playerKeys.shoot.label]: 'shoot',
})

export const tankLeftControls = playerControls(leftPlayerKeys)
export const tankRightControls = playerControls(rightPlayerKeys)

export default class Controls {
  constructor({
    controlKeys = baseControls,
    positionClass = 'bottom-left',
  } = {}) {
    this.controlsOpen = false
    this.init({ controlKeys, positionClass })
  }

  init({ controlKeys, positionClass }) {
    this.div = document.createElement('div')
    this.div.className = positionClass

    const classes = currentStyleClasses()
    const button = document.createElement('button')
    button.className = classes.controlButton

    const content = document.createElement('div')
    content.className = classes.container
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