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

To try the game blocks one by one (soldiers, vehicles, aircraft, their states and shots), open the catalogue, `/pages/catalog.html`, on the same server; see [docs/KATALOG.md](docs/KATALOG.md).

To see every background picture in the project, open `/pages/pozadine.html` on the `npm start` server; it reads the folder each time, so new pictures appear without editing the page.

## TODO
See [PLAN](docs/PLAN.md).

- razrađivati postojeće nivoe redom
- ui - dugmići da pucanje i ostali na ekranu imaju providnu pozadinu pa nekad to deluje loše. mozda da dobiju neko zatamnjenje, ali da i dalje bude razlika na hover
- kraljevo: tenk je prebrz i loše puca

## Credits

- [JuniorGeneral](https://www.juniorgeneral.org/) - pixel art soldiers and ideas 

Free 3D Models are from: 
- opengameart.org
- 3dwarehouse.sketchup.com
- sketchfab.com
- turbosquid.com 
- mixamo.com
- archive3d.net
- rigmodels.com
and other respected sites.

If I have missed some source, please let me know. I've been following various books, courses, repositories and other materials for more than a decade, I don't even know where I found something anymore.
