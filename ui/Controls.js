import { keys, attackLabels, leftPlayerKeys, rightPlayerKeys } from '/core/io/keys.js'
import { currentStyleClasses, onStyleChange } from './styles.js'
import { hasBlockingUi } from '/core/io/inputContext.js'

export const baseControls = {
  [keys.left.label]: 'left',
  [keys.right.label]: 'right',
  [keys.up.label]: 'forward',
  [keys.down.label]: 'backward',
}

export const avatarControls = {
  ...baseControls,
  [keys.strafeLeft.label]: 'strafe left',
  [keys.strafeRight.label]: 'strafe right',
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
  ...avatarControls,
  [attackLabels.Enter]: 'attack',
}

export const orbitControls = {
  'Mouse drag': 'rotate camera',
  'Mouse wheel': 'zoom',
  'Right mouse drag': 'pan camera',
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
    canToggle = () => !hasBlockingUi(),
  } = {}) {
    this.controlsOpen = false
    this.canToggle = canToggle
    this.init({ controlKeys, positionClass })
  }

  init({ controlKeys, positionClass }) {
    this.div = document.createElement('div')
    this.div.className = positionClass

    const button = document.createElement('button')
    const content = document.createElement('div')
    const restyle = () => {
      const classes = currentStyleClasses()
      button.className = classes.controlButton
      content.className = classes.container
    }
    restyle()
    this.stopRestyling = onStyleChange(restyle)
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

    button.addEventListener('click', e => {
      e.stopPropagation()
      if (!this.canToggle()) return
      if (content.style.display === 'none') open()
      else close()
      // a mouse click gives the game its keys back; from the keyboard the focus stays, to go on with the keyboard
      if (e.detail) button.blur()
    })

    this.div.appendChild(button)
    this.div.appendChild(content)
    document.body.appendChild(this.div)
  }

  end() {
    this.stopRestyling()
    this.div.remove()
  }
}
