import { icons } from './icons.js'
import { attackLabels } from './keys.js'

/**
 * The input each kind of player actor is driven with, in its game and in the catalog alike: the key that attacks and
 * the buttons on the screen. The Potez drops a bomb on its `bombKey`, Enter, or the 💣 button.
 */
export const inputLayouts = {
  warplane: { attackKey: 'Space', buttonDict: { attack: icons.rocket, attack2: icons.shoot } },
  grenadier: { attackKey: 'Space', buttonDict: { attack: icons.bomb } },
  boat: { attackKey: 'Space', buttonDict: { attack: icons.shoot, attack2: icons.rocket } },
  potez: { attackKey: 'Space', buttonDict: { attack: icons.shoot, special: icons.bomb }, bombKey: attackLabels.Enter },
  fighterBomber: { attackKey: 'Space', buttonDict: { attack: icons.shoot, attack2: icons.loop, special: icons.bomb } },
}
