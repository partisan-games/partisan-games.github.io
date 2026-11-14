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

Before committing, run every check (lint, unit tests, project check and the browser smoke test):

```
npx playwright install chromium   # once
npm run verify
```

The separate checks and how the tests work: [docs/TESTING.md](docs/TESTING.md).

## TODO

- vis: nađi bolji zvuk pucanja
- proveriti koje se igre sa index skrivaju na mobilnom

### Ideje za kasnije

- ocenjivanje igara?
- dodati profil korisnika

Ideje za nivoe:
- tenkic ide
- sremski front (topovi)
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