# Dokumentacija

Partisan Games je sajt sa 39 malih 2D i 3D igara u pregledaču. Pisan je kao čisti ES moduli, bez build koraka: šta je u repozitorijumu, to se služi. Pokretanje je opisano u [README.md](../README.md), a provere i testovi u [TESTING.md](TESTING.md).

## Struktura

| Folder | Šta je u njemu |
|---|---|
| `index.html` | meni sa svim igrama, elementi stranice (`#ui`, `#modal`, platna `#platno` za 2D i `#platno-3d` za 3D) i import map koji `three` vodi u `libs/three/` |
| `scenes/` | po jedna igra u `scenes/<ime>/Main.js`; `main.js` (ruter) i `SceneManager.js` |
| `core/` | zajedničko za sve igre: `Scena`, `GameLoop`, tajmeri, ulaz (`io/`) i 2D objekti (`actor/`, `objects/`) |
| `core3d/` | 3D na three.js: likovi (`actor/`), letelice, fizika (ammo.js), lavirinti, teren, šejderi, učitavanje modela |
| `ui/` | prozori, poruke, spisak kontrola, stilovi (`style.css`, `styles.js`) |
| `assets/` | slike, teksture, modeli, zvukovi i fontovi |
| `libs/` | spoljne biblioteke (`three`, `ammo.js`, `chroma.js`); ne menjaju se |
| `config.js` | jačina zvuka, putanje do resursa, da li uređaj ima dodir ili miš |
| `scripts/`, `tests/` | lokalni server, statička provera projekta, jedinični i smoke testovi |

Svi importi idu od korena sajta (`/core/...`). Kod u `core/`, `core3d/` i `ui/` koriste sve igre, pa svaka izmena tamo traži jedinični test i ceo smoke.

## Od klika do igre

1. Klik na igru u meniju menja adresu u `#<ime>`. Stranica se ne učitava ponovo: `scenes/main.js` na `hashchange` zove `SceneManager.start(ime)`, a prazna adresa vraća meni ponovnim učitavanjem. „Play again“ na isti način pravi novu scenu iste igre, bez ponovnog učitavanja stranice.
2. `SceneManager` gasi prethodnu igru (`end()`), uvozi `/scenes/<ime>/Main.js`, pravi scenu i čeka njen async `init()`. Ako u međuvremenu krene druga igra, važi samo poslednji poziv, a zakasnelu scenu gasi čim njen `init` završi.
3. Ako igra ima uvod, prikazuje se početni ekran, a dugme „Start“ pokreće `scene.start()`. Inače igra kreće odmah.
4. Greška pri učitavanju ili tokom igre gasi igru i prikazuje ekran sa dugmetom za meni (`scenes/main.js`).

Iza menija na širokom ekranu radi igra `lookat-cursor`, na sopstvenom platnu `#malo-platno`.

## Scena

`core/Scena.js` je osnova svake igre; `Scena2D` crta na 2D platno preko `Renderer2D`, a `Scena3D` pravi three.js scenu i kameru i crta preko jednog `WebGLRenderer`-a koji sve igre na istom platnu dele. Igra nasleđuje jednu od njih i preko konstruktora zadaje opcije (`intro`, `controlKeys`, `uiStyle`, `usePointerLock` i druge).

Igra može da napiše ove metode:

- `init()` jednom, pre početka: pravi svet i objekte, i dodaje ih sa `this.add(...)`;
- `update(dt, t)` svaki frejm, posle `super.update(dt, t)`: proverava uslove kraja i zove `this.victory(tekst)` ili `this.defeat(tekst)`;
- `sceneUI(t)` vraća HTML rezultata koji se crta svaki frejm, npr. `this.ui.scoreUI('Time', t)`;
- `handleClick(e)`, a u 2D i `clear()`/`render()` za crtanje;
- `end()` uklanja sve što je igra sama dodala na stranicu; prvo zove `super.end()`.

`GameLoop` zove petlju scene preko `requestAnimationFrame` sa `dt` i `t` u sekundama:

```js
loop(dt, t) {
  timers.update(dt)     // odložene radnje
  this.handleInput(dt)  // Escape pauzira; handleInput živih objekata
  this.update(dt, t)    // update svih objekata, rekurzivno kroz njihove predmeti
  this.clear()
  this.render()
  this.ui.render(t)     // sceneUI
}
```

Pauza zaustavlja petlju. Pobeda i poraz zaustavljaju samo vreme igre, a petlja radi dalje. Zato važi samo prvi ishod: kasniji `defeat` ne prepisuje pobedu.

Vrednost koja se menja svaki frejm (potisak, trenje, ubrzanje) mora se množiti sa `dt` ili sa `frames(dt)` iz `core/konstante.js`. Inače igra radi drugačije na ekranima različite brzine.

## Objekti igre

`Scena` za svaki objekat iz `this.predmeti`, i za njegove `predmeti`, poziva:

- `update(dt, t)` svaki frejm; čestice imaju isti potpis, uz opcije kao treći argument (`Particles.update(dt, t, opcije)`);
- `handleInput(dt)` svaki frejm, samo ako je `alive` tačno: to imaju 2D objekti, a 3D objekti nemaju `alive` i unos obrađuju sami iz `update`;
- `end()` kad se scena završi; objekat tada uklanja sve što je dodao u `document`, `window` ili `body`.

**2D** (`core/actor/`): `Predmet` je slika sa položajem, brzinom (`dx`, `dy`), uglom, granicama ekrana i sudarima; stanje je `alive`/`dead`. `Player2D` mu dodaje upravljanje preko `Input`. Dodatna ponašanja se dodaju funkcijama iz `prosirenja/`: `praviEnergiju` za energiju i `praviPucanje`/`praviRakete` za pucanje, sa projektilima iz `projektili/`. Platno (`core/io/platno.js`) prati veličinu prozora, a `mish.js` kursor i nišan.

**3D** (`core3d/`): `GameObject` je mesh sa položajem, energijom i stanjem `dead`. `Actor` mu dodaje kretanje po tlu i preprekama, animacije (`Animator`) i mašinu stanja (`FSM`, stanja u `actor/states/`). Iz njega su izvedeni `Player` (ulaz, kamera koja prati, traka zdravlja) i `AI` (stanja u `states/ai/`: lutanje, patrola, potera, napad, bekstvo). Konkretni likovi su u `actor/derived/`, sa modelom koji `loaders.js` učitava pri uvozu modula. Šejderi u `shaders/` izvoze `createMaterial()`, koja svaki put pravi nov materijal sa svojim vrednostima; jedan zajednički materijal bi prenosio vreme animacije iz jedne igre ili objekta u drugi. Vozila sa fizikom (`physics/`) koriste ammo.js, a letelice su u `aircraft/`.

## Ulaz

`Input` (`core/io/Input.js`) spaja tastaturu i dodirne kontrole: na uređaju sa mišem koristi tastaturu, a na ekranu na dodir džojstik i dugmad (`Touch.js`). Igrač čita `input.up`, `input.attack` i slično, bez obzira na izvor.

`core/io/keys.js` za svaku akciju čuva kodove tastera i natpis za spisak kontrola, a `keyboard.isDown(binding)` kaže da li je pritisnut neki od kodova. CapsLock (trčanje) se čita po stanju zaključavanja, a ne dok se drži. Ubrzanje cepelina (`PageUp`/`PageDown` u `core3d/aircraft/Airship.js`) namerno nije u spisku, jer isti tasteri tamo znače bočni korak.

## Prozori i poruke

`UI` (`ui/UI.js`) vodi početni ekran, pauzu, kraj igre, rezultat i poruke.

Središnji ekrani (početni, pauza, kraj) prikazuju se na događaj, a ne u petlji: `UI.showScreen(name, html)` i `hideScreen()`, a `ui.screen` kaže koji je otvoren (`'start'`, `'pause'`, `'end'` ili `null`). Igra ne zove ove metode sama, nego `this.victory`/`this.defeat`.

Poruke (`ui.showMessage`) imaju svoj element `div.message`. Ne prikazuju se dok je otvoren središnji ekran, a poruka koja već stoji skriva se iza njega i vraća posle nastavka. `Controls` crta spisak kontrola iz `controlKeys`, a `Report` kuca uvodni tekst.

## Podešavanja na jednom mestu

- **Stil:** igra zadaje `uiStyle` (`simple`, `rpg` ili `white`). Klase svih elemenata (prozor, dugme, rezultat, kontrole, traka zdravlja, dugme kamere) su u `ui/styles.js`, a elementi ih čitaju sa `currentStyleClasses()`. Prilagođeni početni ekran je funkcija koja dobija te klase.
- **Zvuk:** `createSound(file, { volume, random })` iz `core/io/sound.js` pravi zvuk na opštoj jačini (`config.volume`) puta `volume`, ili na nasumičnoj jačini oko nje. Svaki objekat pravi svoj zvuk: jedan `Audio` ne može da svira dvaput u isto vreme.
- **Putanje:** `config.assets` (`images`, `textures`, `models`, `sounds`) koristi se za putanje koje se sastavljaju u kodu. Doslovne putanje do jednog fajla ostaju doslovne, da bi ih `npm run check` proverio.
- **Frejmovi i boje:** `FPS` i `frames(dt)` su u `core/konstante.js`. Boje tla su u `core3d/ground.js`, a boje neba u `core3d/constants.js` i `core/io/platno.js`. Razmak od ivice i slojevi su CSS promenljive (`--edge`, `--z-top`, `--z-screen`) u `ui/style.css`.

## Odložene radnje

Radnja koja treba da se desi kasnije u igri ide preko `after(seconds, action)` iz `core/timers.js` (otkazuje se sa `cancel(id)`), a ne preko `setTimeout`. Taj sat pomera petlja scene, pa radnja čeka dok je igra pauzirana. Lint ne dozvoljava `setTimeout` u `core/`, `core3d/` i `scenes/`.

Sat prazni konstruktor `Scena`, a ne `end()`, pa radnja stare igre nikad ne okine u sledećoj. Da ga prazni `end()`, zakasneli `end()` stare scene posle sporog `init` (`scenes/SceneManager.js`) obrisao bi tajmere nove.

## Gašenje igre

Pošto se stranica pri promeni igre ne učitava ponovo, sve što igra ili njen objekat doda u `document`, `window`, `body` ili na zajedničko platno `#platno-3d` mora se ukloniti u `end()`. Rukovalac se čuva u polju (ne kao anonimna arrow funkcija), da bi `end()` mogao da ga ukloni, a stilovi za celu stranicu dodaju se samo jednom. Za grafičku karticu to radi `Scena3D.end()`: oslobađa geometrije, materijale, teksture, kosti i senke svega što je na kraju u sceni, a crtač ostaje za sledeću igru. Zato igra ne menja podešavanja zajedničkog crtača, a ono što ukloni iz scene usred igre oslobađa sama. Test `tests/smoke/leaks.spec.js` hvata ono što raste posle više promena igre, uključujući teksture, bafere i programe na grafičkoj kartici.
