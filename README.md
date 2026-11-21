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

- razrađivati postojeće nivoe redom
- proveri warplane na mobilnom (privremeno isključeno hide-on-mobile)
- otpisani: napravi 2 pozadine ratom razorenog beograda 1944. jednu u stilu ostalih pozadina, a drugu u stilu postojeće crno-bele pozadine.

Otpisani: novi red pucanja Okupatora (zamena odbijenog šestog reda).

Atlas: assets/images/armies/game-ready/vojnici/occupier-sprites.png, 5 kolona × 6 redova, ćelija 210 × 210, sidrište (105, 210) na dnu sredine. Priprema: assets/images/armies/sources/infantry-art/prepare-occupier.py, metapodaci occupier-sprites.json, pregled previews/occupier-fire.gif.

Problem sa sadašnjim šestim redom (`fire`): trup i ruke su zaseban komad koji se između kadrova pomera levo-desno u odnosu na glavu i noge. Šavovi se vide u visini ramena i kukova (oko y 60 i y 135 u ćeliji), pa vojnik u igri izgleda kao polomljena slika. Vlasnik ga je odbio.

Potrebno: pet novih kadrova u šestom redu, petlja 0,5 s. Vojnik stoji licem ka gledaocu i rafalom puca iz MP40 koji drži na grudima, pravo ka gledaocu.
- Osnova je poslednji kadar drugog reda (`nadole`): isti lik, uniforma, šlem, traka, puška i razmera.
- Glava, obris trupa, noge i čizme moraju biti piksel po piksel isti u svih pet kadrova. Pomeraju se samo šake, puška i podlaktice, malim trzajem od 1 do 3 px, i vraćaju se u početni položaj u petom kadru.
- Bez šavova, bez komada slike koji klize jedan preko drugog, bez promene osnovne linije i sidrišta.
- Bez plamena i dima iz cevi: igra crta zaseban plamen (assets/images/pucanje.png, 19 × 21). U occupier-sprites.json za svaki kadar upiši tačku usta cevi u pikselima ćelije, na primer "muzzle": [{ "x": 98, "y": 87 }, ...], da igra stavi plamen tačno na cev.
- Ostalih pet redova i mere atlasa ostaju nepromenjeni.

Provera pre predaje: razlika između bilo koja dva kadra novog reda postoji samo u predelu šaka i puške; glava i čizme se ne razlikuju ni u jednom pikselu. Pregledaj GIF u veličini igre (210 px) uz drugi red, pa ažuriraj prepare-occupier.py, occupier-sprites.json, GIF i occupier-preview.html.


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
