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

### Scene dorada

Franjo Kluz
- UI u kontrole
- probati da tenkovi dolaze i pucaju
- granatom razara i pali kuce?

DurmitorScena / Ustanak u Crnoj Gori 1941
- dodati dinamičku pozadinu, dim, avione kako lete...
- italijanski tenk

Bombas 
- broj prepreka da zavisi od veličine ekrana, na većim ekranima prazno

Neretva
- dodati vremensku pobedu, ali da ne prekida partiju ranije (pobeda: Odbranio si položaj, ranjenici su spašeni.)
- hercegovina 1942, četnici iskaču iza kamenja, pa zajedno sa italijanima

1944
- smisliti pobedu

Drvar 
- https://mudroljub.github.io/partisans/ uporediti

Bihać
- dodati nemce

### Bagovi

- popraviti visoku rezoluciju (renderovati sniženu ako je ekran prevelik?)
- FPS restart igrač ne ubija

### Završno

- prevod na engleski
- prevesti nazive klasa na engleski
- proveriti zaostale TODO poruke
- prebaciti potisak na predmet?

UI
- refaktorisati da prozori budu DOM elementi, a samo sceneUI u render loop?
- dodati komande i ciljeve svuda, možda i izveštaj
- prozor premali na prevelikim ekranima?

Profil 
- dodati profil korisnika
- izbor slike partizana ili partizanke
- dodati medalje za misije

- smisliti skaliranje ekrana
- dodati bazicnu statistiku, bar brojac poseta. koristiti arduino servise, firebase, napraviti api??

### Test i optimizacija

- proveriti sve nivoe sa sporijim i bržim fps
- probati neki build
    - vite
    - polymer-bundler
```
npm install -g polymer-bundler
polymer-bundler --inline-scripts ulaz.html > izlaz.html
```

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

