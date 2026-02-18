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

- ubacivanje žetona
- ocenjivanje igara?

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
- refaktorisati da se na jedno mestu podešava RPG style za sve elemente (energija, kamera...)
- Cannon: stilizovati createInputRange ili koristiti progress
- ujednačiti Predmet i GameObject (napraviti običan i 3D koji nasleđuje?)
- Particles.update({ delta: dt }) -> update(dt, t, {}) ??

### Ideje za kasnije

- dodati profil korisnika

Avionce:
- dodati bombu (special)

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