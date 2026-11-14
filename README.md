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

- 2d tank: bunker loše i krajnje nerealno puca. ako koristi granate, treba da lete kao projektili, klasičnom putanjom projektila. ako koristi mitraljez, kao nivo bunker, onda može i pravolinijski da leti. osmisliti vrste pucanja i popraviti da bude bolje.
- 2d tank: uništavanje civilnih zgrada. moja inicijalna ideja je da civilne zgrade malo smetaju igraču, jer se nalaze na putu a ne sme da ih uništi. ali sada kada neprijatelji pucaju, to postaje ogromna smetnja jer igrač ne sme da uzvrati i tako gine. postoji li drugo rešenje osim da ukinemo pogađanje civilnih zgrada?
- ukloni zatamnjeni sloj sa igara na naslovnoj. smisliti drugi indikator zaključanosti. zatamnjenje smeta. treba da se lepo vide nivoi i privuku igrača.
- vis: nađi bolji zvuk pucanja
- proveri warplane na mobilnom (privremeno isključeno hide-on-mobile)

### Ideje za kasnije

- ocenjivanje igara?
- dodati profil korisnika

Ideje za nivoe:
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