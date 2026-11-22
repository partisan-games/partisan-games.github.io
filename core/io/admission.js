/**
 * Token admission for paid games. Free scenes bypass it; the page gives paid games the pocket they pay from.
 * The default adapter allows tests and pages without the arcade to start without spending a real token.
 */
export const admission = {
  /** Takes one token: gives a receipt, or null when none is left; throws when the pocket cannot be read. */
  charge: async() => ({}),
  /** Gives back the token of `receipt`. */
  refund: async() => {},
  /** Tokens left, or null when not known. */
  remaining: () => null,
}
