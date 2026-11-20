/**
 * The token a game with a start screen costs. The page gives the pocket it pays from; without one every game is free,
 * as in tests and pages without the arcade.
 */
export const admission = {
  /** Takes one token: gives a receipt, or null when none is left; throws when the pocket cannot be read. */
  charge: async() => ({}),
  /** Gives back the token of `receipt`. */
  refund: async() => {},
  /** Tokens left, or null when not known. */
  remaining: () => null,
}
