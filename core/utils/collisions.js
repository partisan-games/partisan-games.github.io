const levo = predmet => predmet.x - predmet.width / 2

const desno = predmet => predmet.x + predmet.width / 2

const gore = predmet => predmet.y - predmet.height / 2

const dole = predmet => predmet.y + predmet.height / 2

export function overlaps(kvadrat1, kvadrat2) {
  return (
    dole(kvadrat1) > gore(kvadrat2) &&
    gore(kvadrat1) < dole(kvadrat2) &&
    desno(kvadrat1) > levo(kvadrat2) &&
    levo(kvadrat1) < desno(kvadrat2)
  )
}

export function isInside(tacka, predmet) {
  return (
    tacka.x > levo(predmet) &&
    tacka.x < desno(predmet) &&
    tacka.y > gore(predmet) &&
    tacka.y < dole(predmet)
  )
}
