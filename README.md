![](screen.png)

# Partisan Games ★

Small games inspired by Yugoslav partisans.

Homepage: [partisan-games.github.io](https://partisan-games.github.io/)

Repo: [github.com/partisan-games/partisan-games.github.io](https://github.com/partisan-games/partisan-games.github.io)

## Development

```
git checkout develop
npm i
npm start
```

## TODO

- BUG nestaje meni: Čisti ga uvodna poruka!!!!
    - warplane esc pauza nestaje meni
    - avatar pobeda nestaje meni
- ukloniti manager iz scene
- dodati ostale igre, scene i animacije sa create 3D worlds
- neretva energiju gore desno
- dodati tač skrin jump na avatara i drugde (baguje na three.js games)

### Završno

- prevod na engleski
- dodati bazicnu statistiku, bar brojac poseta.
- sistem ocenjivanja igara
- probati tač skrin

UI
- dodati pauzu u kontrole svuda
- dodati komande i ciljeve svuda, možda i izveštaj
- refaktorisati da prozori budu DOM elementi, a samo sceneUI u render loop?

Profil 
- dodati profil korisnika
- izbor slike partizana ili partizanke
- dodati medalje za misije

### Test i optimizacija

- proveriti sve nivoe sa sporijim i bržim fps
- probati neki build
    - vite
    - polymer-bundler
```
npm install -g polymer-bundler
polymer-bundler --inline-scripts ulaz.html > izlaz.html
```

### Bagovi za kasnije

- FPS restart igrač ne ubija

### Ideje za kasnije

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

Glavni meni
- nakon pređene misije bitka postaje spomenik

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