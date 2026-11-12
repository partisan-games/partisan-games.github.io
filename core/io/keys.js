/**
 * Every key the games listen to, with the name the controls list shows for it.
 * An action is on while any of its key codes is held.
 */
export const keys = {
  up: { codes: ['ArrowUp', 'KeyW'], label: '↑ or W' },
  down: { codes: ['ArrowDown', 'KeyS'], label: '↓ or S' },
  left: { codes: ['ArrowLeft', 'KeyA'], label: '← or A' },
  right: { codes: ['ArrowRight', 'KeyD'], label: '→ or D' },
  strafeLeft: { codes: ['PageUp', 'KeyQ'], label: 'Q' },
  strafeRight: { codes: ['PageDown', 'KeyE'], label: 'E' },
  // CapsLock runs while its lock is on, read from the key event, so it is not a held code
  run: { codes: ['ShiftLeft'], lock: 'CapsLock', label: 'CapsLock' },
  jump: { codes: ['Space'], label: 'Space' },
  attack2: { codes: ['KeyC'], label: 'C' },
  special: { codes: ['KeyV'], label: 'V' },
  pause: { codes: ['Escape'], label: 'Esc' },
}

/** Games pick the attack key; 'pointer' is the left mouse button. */
export const defaultAttackKey = 'Enter'
export const attackLabels = { Enter: 'Enter', Space: 'Space', pointer: 'Mouse' }

/** The two players of tenkici and ustanak share one keyboard; the left one also aims the ustanak cannon. */
export const leftPlayerKeys = {
  left: { codes: ['KeyA'], label: 'A' },
  right: { codes: ['KeyD'], label: 'D' },
  up: { codes: ['KeyW'], label: 'W' },
  down: { codes: ['KeyS'], label: 'S' },
  shoot: { codes: ['Space'], label: 'Space' },
}

export const rightPlayerKeys = {
  left: { codes: ['ArrowLeft'], label: '←' },
  right: { codes: ['ArrowRight'], label: '→' },
  up: { codes: ['ArrowUp'], label: '↑' },
  down: { codes: ['ArrowDown'], label: '↓' },
  shoot: { codes: ['Enter'], label: 'Enter' },
}
