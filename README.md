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

- dodati ostale igre, scene i animacije
    - Zeppelin
    - Urban guerrilla promeniti lika i ime, revolutionary-city tour?
    - dark-city
    - planets
    - tank
    - train
    - parting-the-sea
    - flying-through-space
    - lava
    - third-person-camera
    - city-led
    - minas-tirith
    - pyramid
    - ruins
    - walls
    - city-colorful (dodati kruženje kamere)
    - city-night
    - physics-vehicle
    - model-lookat-cursor
    - follow (okupi sve sledbenike)
    - rasporediti preostale karaktere po scenama
        - demon mora negde, možda u ruševine
        - dodati  partisan-lowpoly u oslobođeni grad 
- probati grid nejednakih slika, možda staviti i neku uspravnu
- promeniti joystick u četiri strelice da bude upotrebljivo za telefone
    - proveriti na telefonu
- proveriti chrome
- ujednačiti stilove dugmića (osnovne veličine + klase za svaki stil)

### BAGOVI

- BUG: tač komande baguju i zakucavaju, npr. rpg special se beskonačno ponavlja
    - dugme mora da se resetuje nakon pritiska, na button leave ili slično
- BUG: avatar dosta baguje i blokira (možda ima veze tač komande)

### Završno

- restart na Žikicu i još negde
- prevod na engleski
- sistem ocenjivanja igara?

UI
- refaktorisati da se na jedno mestu podešava RPG style za sve elemente (energija, kamera...)
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