![](screen.png)

# Partisan Games ★

Small games inspired by Yugoslav partisans.

Play here: [partisan-games.github.io](https://partisan-games.github.io/)

## Development

```
git checkout develop
npm i
npm start
```

Before committing, run the lint, unit tests and project check:

```
npm run verify
```

The separate checks and how the tests work: [docs/TESTING.md](docs/TESTING.md).

To try the game blocks one by one (soldiers, vehicles, aircraft, their states and shots), open the catalogue, `/catalog.html`, on the same server; see [docs/KATALOG.md](docs/KATALOG.md).

To see every background picture in the project, open `/pozadine.html` on the `npm start` server; it reads the folder each time, so new pictures appear without editing the page.

## TODO
See [PLAN](docs/PLAN.md).

- razrađivati postojeće nivoe redom
- napraviti fantasy-backup pa onda obrisati fantasy scene i resurse
- smisli kako da 3d igre po stilu vise lice na 2d igre. ja u nekim igrama koristim Toon renderer koji daje crne ivice kao crtez. sta bi jos mogli? 
- Kako jos kreativno mozemo mesati 2d i 3d? Imamo drvar i german advance kao primere
- treba dodati kratak istorijski info za svaki nivo negde. osmisliti gde da ne guši igru.
- German advance animacija sa zivim likovima da bude promo animacija sajta, dodati na kraju tekst Partisan games
- Prosiriti katalog zgradama i predmetima?
- Mozda obrisati ostale igre? Dora voli balonka....
UVODNE ANIMACIJE NA NIVOE:
- gola zrtva izlazi iz kuce u plamenu i bezi od nemackog vojnika
- animacija Nemci streljaju civile (taoce)
- Napraviti par cetnika 2d i 3d.
  assets/images/armies/cetnici/cetnik-03.png
  assets/images/armies/cetnici/juris-01.png
  assets/images/armies/cetnici/mitraljezac-07.png
- ima li smisla napraviti prost 3d renderer za neke nivoe? Prednosti i mane?
- objasni šta je ovde: assets\images\armies\sources . deluje da to ne treba da stoji u armies
- https://upload.wikimedia.org/wikipedia/commons/b/be/Druga_proleterska_divizija_na_Sutjesci.jpg ova slika je uzor za catalog.html#drugi-svetski-rat-3d/partizan-3d/original. hoću da naš model više liči na izvornog lika u centru fotografije.


## Credits

- [JuniorGeneral](https://www.juniorgeneral.org/) - pixel art soldiers and ideas 
- Game UI: https://ronenness.github.io/RPGUI/

Free 3D Models are from: 
- 3dwarehouse.sketchup.com
- sketchfab.com
- turbosquid.com 
- mixamo.com
- archive3d.net
- rigmodels.com
and other respected sites.

If I have missed some source, please let me know. I've been following various books, courses, repositories and other materials for more than a decade, I don't even know where I found something anymore.
