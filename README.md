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

## TODO

UI

- refaktorisati da se na jedno mestu podešava RPG style za sve elemente (energija, kamera...)
    - da player čita uiStyle iz this.scene?
    - Cannon: stilizovati createInputRange
- integrisati customStartScreen ponegde (rpg-fantasy, graveyard), gde nije toliko različit?
- ujednačiti stilove dugmića (osnovne veličine + klase za svaki stil)

Profil 
- dodati profil korisnika
- izbor slike partizana ili partizanke

### Test i optimizacija

- proveriti sve nivoe sa sporijim i bržim fps
- probati neki build
    - vite
    - polymer-bundler
```
npm install -g polymer-bundler
polymer-bundler --inline-scripts ulaz.html > izlaz.html
```

## Za kasnije

- sistem ocenjivanja igara?
- ubacivanje žetona

### Bagovi za kasnije

- BUG: golemi se nekad tresu u mestu (follow)
- bug: graveyard game over a čarobnica stoji kao živa
- na početku 3D scena modeli raširenih ruku. probati bar jedan loop inicijalno (firstLoop = true)
Mobilni:
    - warcraft ne radi na mobilnom, a trese se nekad i na PC
    - Lander potisak se ne vidi na mobilnom
    - cannon kontrole ne rade

### Refaktor

- da prozori budu DOM elementi, a samo sceneUI u render loop?

### Ideje za kasnije

- ujednačiti Predmet i GameObject (napraviti običan i 3D koji nasleđuje?)

- smisliti osnovnu mehaniku bitke
    - probati sa figuricama i kockama
    - estetika kao desant na drvar
    - dodavanje novih vojnika?
    - pucanje automatsko ili izbor neprijatelja
    - potezno ili polu-automatsko?

- iskoristi dobre slike (možda za loader)
    - Ustanak_u_Jugoslaviji_1943.png
    - captured-joe/Spanish Civil War -- Charge by CapturedJoe.png
    - captured-joe/Partisans and Chetniks by CapturedJoe.png

Ideje za nivoe:
- sremski front (topovi)
- odbrani polozaj (kamera odozgo, nadiru sa svih strana)
- podmornica

Avionce:
- dodati bombu (special)

Odbrani bunker
- partizanska verzija tower defense (odbrana Užica, Kadinjača, Bihać...)
- svaki nivo prelaziš tako što izgubiš (bilo ih je previše), ali se gleda koliko si ih ubio

Partizanski kurir
- partizanska verzija super mario ili endless runner:
- trci, uzima hranu, izbegava metkove, preskace bombe...

Refaktor
- Particles.update({ delta: dt }) -> update(dt, t, {}) ??

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