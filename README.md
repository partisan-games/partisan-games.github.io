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

- bunker: istraži online kako se pravi animirani sprite. pronađi u našem projektu klase koje to podržavaju. neka bombaš postane animirani sprite koji diše kada je idle.
- vis: nađi bolji zvuk pucanja

### Bagovi

- bunker se ne zapali kada je uništen, samo bude pobeda. ustanak: isti problem, neprijatelj ne gori kada je pobeda, zaledi se ekran. pozadina treba da nastavi da se kreće (vatra gori, zastava se vije i slično) i nakon pobede. tako mnogo lepše izgleda nego freeze. pre ai refaktora je tako radilo.
- fps-airport: nema kontrola
- warplane: komande neprirodno trzaju

Mobilni:
    - warplane ne radi na mobilnom

### Ideje za kasnije

- dodati ubacivanje žetona. želim da igrač svaki dan dobije po 10 besplatnih žetona koje može iskorititi za bilo koju igru. žetoni se ne talože, svaki dan počinje sa 10. treba osmisliti dizajn da ima izgled i osećaj stare arkadne mašine. na naslovnici svaka igra treba da bude nekako zaključana, i da ima slot da se ubaci žeton, nakon čega se može igrati. play again troši još jedan žeton. na naslovnici treba prikazivati broj žetona, možda gore desno.
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