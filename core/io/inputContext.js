/** DOM boundaries shared by gameplay inputs; native UI activation stays with the browser. */
export const isUiTarget = target => Boolean(target?.closest?.(
  'button, input, select, textarea, a, [contenteditable], [role="button"], #ui, #modal, dialog, .joystick, .button-container'
))

export const hasBlockingUi = () => Boolean(
  document.getElementById('modal')?.childElementCount || document.querySelector('dialog[open]')
)

export const gameplayInputAllowed = target => !hasBlockingUi() && !isUiTarget(target ?? document.activeElement)

export const resetGameplayInput = () => document.dispatchEvent(new Event('game-input-reset'))
