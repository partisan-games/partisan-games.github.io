import canvas2d from '../io/canvas2d.js'

export const exitedBottom = predmet => predmet.y > canvas2d.height
export const exitedBottomFully = predmet => predmet.y > canvas2d.height + predmet.height / 2

export const exitedTop = predmet => predmet.y < 0
export const exitedTopFully = predmet => predmet.y < -predmet.height / 2

export const exitedRight = predmet => predmet.x > canvas2d.width
export const exitedRightFully = predmet => predmet.x > canvas2d.width + predmet.width / 2

export const exitedLeft = predmet => predmet.x < 0
export const exitedLeftFully = predmet => predmet.x < -predmet.width / 2

export const exitedAnywhere = predmet => exitedLeft(predmet) || exitedRight(predmet) || exitedTop(predmet) || exitedBottom(predmet)
export const offScreen = predmet => exitedLeftFully(predmet) || exitedRightFully(predmet) || exitedTopFully(predmet) || exitedBottomFully(predmet)