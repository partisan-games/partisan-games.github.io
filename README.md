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

- ujednačiti stilove dugmića (osnovne veličine + klase za svaki stil)
- kapuera girl + iskopati još ponešto
- tenkici i top: izbor za dva igrača
- 3d top da ne bude vozilo
- promeniti joystick u četiri strelice da bude upotrebljivo za telefone
    - proveriti na telefonu
- proveriti chrome

### BAGOVI

- BUG: tač komande baguju i zakucavaju, npr. rpg special se beskonačno ponavlja
    - dugme mora da se resetuje nakon pritiska, na button leave ili slično
- BUG: avatar dosta baguje i blokira (možda ima veze tač komande)
- na početku 3D scena modeli raširenih ruku. probati bar jedan loop inicijalno (firstLoop = true)
- BUG: golemi se nekad tresu u mestu (follow)

### Završno

- createOrbitControls u async?
- restart na Žikicu i još negde
- prevod na engleski
- sistem ocenjivanja igara?

UI
- dodati indikacije za 2 igrača na naslovnu
- koristiti avatarControls
- refaktorisati da se na jedno mestu podešava RPG style za sve elemente (energija, kamera...)
    - da player čita uiStyle iz this.scene?
    - povezati komande sa raspoloživim animacijama igrača??
    - Cannon: stilizovati createInputRange
- integrisati customStartScreen ponegde (rpg-fantasy, graveyard), gde nije toliko različit?
- dodati esc: pauza u kontrole svuda?
- dodati komande i ciljeve svuda
- refaktorisati da prozori budu DOM elementi, a samo sceneUI u render loop?

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