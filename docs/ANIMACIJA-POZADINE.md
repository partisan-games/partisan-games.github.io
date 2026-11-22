# Žive pozadine

Važeći ugovor slojeva ambijenta. Resurse vodi [ART](ART.md#izvori-pozadina), a otvorene poslove [PLAN](PLAN.md#art).

## Obavezno pravilo

Pozadina ima vidljiv živ ambijent. Osnovna slika nema zamrznutu vatru, dim ili druge žive elemente; oni su odvojeni slojevi koji prate vreme scene, miruju u pauzi i nastavljaju posle ishoda. Jedna dodata animacija ne opravdava druge zamrznute efekte u osnovi. Voda ostaje mirna prema vlasnikovom izuzetku iz [ART](ART.md#pravila-pripreme-i-predaje-pozadina).

Ako postoji vetar, isti smer i jačina vode balistiku, dim i plamen. Žarište ostaje na mestu; efekti se pomeraju u odgovarajućem koordinatnom okviru, bez promene smera zbog rezolucije.

U Ustanku zastave ostaju okrenute ka sredini ekrana i nisu pokazatelji vetra. Koriste isti talas iz vremena scene; ne pomerati raspored boraca radi uklapanja efekta.

## Deljenje pozadine između nivoa

Linija tla i žarišta mere se od gornje ivice izvornog PNG-a. Linija tla nije horizont ili automatsko sidrište aktera. Slika, prednji teren, projektili i efekti koriste isto mapiranje; postojeće razlike geometrije nivoa ne zamenjuju se jednim procentom visine platna.

Zajednički [BattleBackground](../scenes/tenkici/BattleBackground.js) i podaci scena određuju trenutnu implementaciju. Dimenzije platna, koordinate žarišta i opis izgleda gotovog prizora ne prepisuju se u dokumentaciju.

## Kvalitet pokreta

Niz različitih generisanih slika nije sam po sebi povezana animacija. Oslonac, oblik i vreme treba da daju kontinuitet, bez skoka pri ponovnoj upotrebi čestice. Različiti stubovi dima traže različite siluete i parametre, ne samo pomerenu početnu fazu.

## Provera

Porediti same slojeve efekata kroz više trenutaka, oba smera i različite jačine vetra, pauzu, nastavak i ishod. Promena cele slike zbog drugog objekta ne dokazuje da dim radi. Statična kompozicija proverava raspored, ne učitavanje i kretanje u igri.

## Izvori

- [Unity: Particle System](https://docs.unity.cn/530/Documentation/Manual/PartSysWhatIs.html).
- [Pixelbolt: fire animation](https://skulitom.github.io/Pixelbolt/guides/pixel-art-fire-animation/).
