/**
 * The state a body attacks in and the one it moves in. A body takes the standard `attack` and `move` when it is next
 * worked on; until then some still attack in `fire` and move in `drive`. Null for a body with no such state.
 */
export const attackState = body => ['attack', 'fire'].find(name => body.states.includes(name)) ?? null

export const movingState = body => ['move', 'drive'].find(name => body.states.includes(name)) ?? null
