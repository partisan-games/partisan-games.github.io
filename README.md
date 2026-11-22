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

To try the game blocks one by one (soldiers, vehicles, aircraft, their states and shots), open `/storybook.html` on the same server; see [docs/STORYBOOK.md](docs/STORYBOOK.md).

To see every background picture in the project, open `/pozadine.html` on the `npm start` server; it reads the folder each time, so new pictures appear without editing the page.

## TODO

- razrađivati postojeće nivoe redom (npr. pucanje iz prvog lica, poput otpisani i neretva, može da postane čuveni arkadni žanr gde se ekran zapravo pomera a neprijatelji iskaču)
- dodati biranje težine za neke igre, jer trenutno mnogo zavisi od uređaja. npr. otpisani na tač skrinu je mnogo lakše nego mišem.

Ideje za nivoe:
- odbrani polozaj (kamera odozgo, nadiru sa svih strana)

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
