/** Turns the stage to a world seen from above: the ground fills the whole view, and the blocks move all over it. */
export const fromAbove = stage => {
  stage.groundY = 0
}

/** The yaw of a block seen from the side that faces `way`: 1 right, -1 left. */
export const yawOf = way => way < 0 ? Math.PI : 0

/** Puts `block` on the stage and gives it back. */
export const put = (stage, block) => {
  stage.add(block)
  return block
}
