import { isTouchScreen } from '/config.js'
import { icons } from './icons.js'
import { attackLabels } from './keys.js'

/**
 * The input each kind of player actor is driven with, in its game and in the catalog alike: the key that attacks and
 * the buttons on the screen; a first-person player looks round with the mouse or a finger. The Potez drops a bomb on its `bombKey`, Enter, or the 💣 button.
 */
export const inputLayouts = {
  warplane: { attackKey: 'Space', buttonDict: { attack: icons.rocket, attack2: icons.shoot } },
  grenadier: { attackKey: 'Space', buttonDict: { attack: icons.bomb } },
  boat: { attackKey: 'Space', buttonDict: { attack: icons.shoot, attack2: icons.rocket } },
  potez: { attackKey: 'Space', buttonDict: { attack: icons.shoot, special: icons.bomb }, bombKey: attackLabels.Enter },
  // a finger on the game turns the view, so on a touch screen the fire button shoots; the mouse needs none
  firstPerson: { useKeyboard: true, attackKey: 'pointer', touchPressesPointer: false,
    ...isTouchScreen && { buttonDict: { attack: icons.shoot } } },
  fighterBomber: { attackKey: 'Space', buttonDict: { attack: icons.shoot, attack2: icons.loop, special: icons.bomb } },
}
