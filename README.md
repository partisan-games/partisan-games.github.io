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
TAČ SKRIN TESTIRANJE:
- BUG: tač skrin kontrole otvaraju context menu. verovatno treba ukinuti context menu potpuno u igrama.
- fps (pointer lock) igre neigrive na tač skrinu
- jablanica: nema dugme za pucanje topa, samo kontrole za pomeranje. prođi svaki nivo i proveri dodaju li se sve potrebne komande za igru bez miša i tastature, na tač skrinu
- nema načina da se otvori esc dugme prozor sa pauzom na tač skrinu
- neretva: ai slop je ubacio besmisleni prvi red saboraca koji očajno izgleda, treba ih obrisati. razmotriti dodavanje pravih 3d saboraca ili kvazi-3d okrenutih leđima
- vis: greška, igra neće da se učita
- crveni krst: dodati još neki stojeći idle za saborce, svi rade isto, rastežu se. ne slaže se uz bekstvo iz logora

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
