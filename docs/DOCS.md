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
  this.session.update(dt)  // sat sesije: igra i prikaz posle ishoda
  this.handleInput(dt)     // Escape pauzira; handleInput živih objekata
  this.update(dt, t)    // update svih objekata, rekurzivno kroz njihove predmeti
  this.clear()
  this.render()
  this.ui.render(t)     // sceneUI
}
```

Pauza zaustavlja petlju. Pobeda i poraz zaustavljaju samo vreme igre, a petlja radi dalje. Zato važi samo prvi ishod: kasniji `defeat` ne prepisuje pobedu.

Svaka scena ima svoju sesiju (`this.session`, `core/runtime/GameSession.js`) sa stanjima `loading` → `ready` (posle `init`) → `running` (`start`) ⇄ `paused` → `finished` (prvi ishod) → `disposed` (`end`). Igra koja pravila proverava u `update` može ih preskočiti kad stanje nije `running`; vis tako posle ishoda više ne pušta talase, pojačanja ni bodove, a svet se i dalje kreće iza završnog ekrana.

Vrednost koja se menja svaki frejm (potisak, trenje, ubrzanje) mora se množiti sa `dt` ili sa `frames(dt)` iz `core/konstante.js`. Igre su podešavane na računaru od 30 frejmova u sekundi, pa je `FPS` 30: vrednost „po frejmu“ znači po frejmu na 30 Hz. Igra podešena na bržem ekranu navodi svoju brzinu (vis: `tunedFps: 60` za igrača, koji onda koristi `frames(dt, this.tunedFps)`). Inače igra radi drugačije na ekranima različite brzine.

## Objekti igre

`Scena` za svaki objekat iz `this.predmeti`, i za njegove `predmeti`, poziva:

- `update(dt, t)` svaki frejm; čestice imaju isti potpis, uz opcije kao treći argument (`Particles.update(dt, t, opcije)`);
- `handleInput(dt)` svaki frejm, samo ako je `alive` tačno: to imaju 2D objekti, a 3D objekti nemaju `alive` i unos obrađuju sami iz `update`;
- `end()` kad se scena završi; objekat tada uklanja sve što je dodao u `document`, `window` ili `body`.

**2D** (`core/actor/`): `Predmet` je slika sa položajem, brzinom (`dx`, `dy`), uglom, granicama ekrana i sudarima; stanje je `alive`/`dead`. `Player2D` mu dodaje upravljanje preko `Input`. Dodatna ponašanja su saradnici u poljima: `Health` i `Weapon` sa `Cooldown` iz `core/gameplay/` (čista logika bez DOM-a; vreme dobija od sata sesije) i `ProjectilePool` iz `core/actor/`, koji ponovo koristi projektile iz `projektili/` van igre i proverava pogotke; najbližu živu metu daje `core/actor/targeting.js`. `Sprite` (slika sa kadrovima animacije) ima animacije tek kad se slika učita, pa `dodeliAnimaciju` pre toga ne radi ništa; crta se i kad je sakriven i bez `scaleX`/`scaleY` (vidi `scenes/vis/Explosion.js`). Platno (`core/io/platno.js`) prati veličinu prozora, a `mish.js` kursor i nišan.

**3D** (`core3d/`): `GameObject` je mesh sa položajem, energijom i stanjem `dead`. `Actor` mu dodaje kretanje po tlu i preprekama, animacije (`Animator`) i mašinu stanja (`FSM`, stanja u `actor/states/`). Iz njega su izvedeni `Player` (ulaz, kamera koja prati, traka zdravlja) i `AI` (stanja u `states/ai/`: lutanje, patrola, potera, napad, bekstvo). Konkretni likovi su u `actor/derived/`. Modul lika ili objekta samo opisuje svoj model (`model`, `models`); igra ga učitava u `init()` sa `requestModels(models)` iz `core3d/assets/models.js`, koji svaki model učitava jednom i ponovo pokušava posle greške. Pravljenje pre učitavanja baca grešku koja kaže šta treba sačekati. `GameObject` drži zdravlje u `Health`-u; `mesh.userData.energy` i `damageAmount` su samo pristupnici istom stanju, a `GameObject.ownerOf(mesh)` nalazi objekat kome pogođeni deo modela pripada. Šejderi u `shaders/` izvoze `createMaterial()`, koja svaki put pravi nov materijal sa svojim vrednostima; jedan zajednički materijal bi prenosio vreme animacije iz jedne igre ili objekta u drugi. Vozila sa fizikom (`physics/`) koriste ammo.js: svaki `new Ammo.*` ide kroz `world.own(...)` da bi ga `PhysicsWorld.dispose()` oslobodio, a ono što vrati getter je pozajmljeno i ne oslobađa se. Pomoćni objekti koji se koriste svaki frejm prave se jednom, na nivou modula. Letelice su u `aircraft/`.

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

Radnja koja treba da se desi kasnije u igri ide preko sata igre. Lint u `core/`, `core3d/` i `scenes/` ne dozvoljava `setTimeout`, `setInterval` ni zidni sat (`Date.now`, `performance.now`, `new Date`), jer oni teku i u pauzi i posle kraja igre.

- **Sesija:** `this.session.gameplay.after(seconds, action)` za pravila igre (respawn, pad, sletanje): čeka u pauzi i nestaje sa prvim ishodom. `this.session.presentation.after(...)` za ono što se vidi i posle ishoda (eksplozije bombe): čeka u pauzi, a nestaje tek sa igrom. Oba opsega gase i radnje i ono što im je dodato sa `add(cleanup)`, svako jednom.
- **3D lik:** `this.clock.after(...)` za udarac usred animacije, odložen plamen i crveni ekran bola. Sat lika (`clock`, a `age` je njegovo vreme) pomera samo njegov `update`, pa radnja stoji dok lik stoji i nestaje s njim.

## Gašenje igre

Pošto se stranica pri promeni igre ne učitava ponovo, sve što igra ili njen objekat doda u `document`, `window`, `body` ili na zajedničko platno `#platno-3d` mora se ukloniti u `end()`. Rukovalac se čuva u polju (ne kao anonimna arrow funkcija), da bi `end()` mogao da ga ukloni, a stilovi za celu stranicu dodaju se samo jednom. Za grafičku karticu to radi `Scena3D.end()`: oslobađa geometrije, materijale, teksture, kosti i senke svega što je na kraju u sceni, a crtač ostaje za sledeću igru. Zato igra ne menja podešavanja zajedničkog crtača, a ono što ukloni iz scene usred igre oslobađa sama. Test `tests/smoke/leaks.spec.js` hvata ono što raste posle više promena igre, uključujući teksture, bafere i programe na grafičkoj kartici.

Igra sa sporim `init` može se ugasiti tek pošto je sledeća igra već počela. Zato zajedničke elemente stranice čisti samo onaj ko ih je poslednji nacrtao: `UI` briše `#ui` i `#modal` samo ako ih je sam popunio, a `Scena.end()` briše i sakriva platno samo ako ga je ona poslednja prikazala. Novi zajednički element treba da prati isto pravilo.

## Stari mehanizmi koje menja migracija

Spisak se smanjuje kako migracija na kompoziciju napreduje.

- **3D šteta preko modela** (`mesh.userData.energy`, `damageAmount`, od A3-02 pristupnici zdravlju u `GameObject`-u): `core3d/actor/Actor.js` (udarac), `Player.js` (prva pomoć), `AI.js` (mrtva meta), `core3d/objects/Bullet.js` i `Tower.js` i `core3d/aircraft/Missile.js`. Pristupnici ne drže drugo stanje, pa ostaju dok ih ovi pozivi koriste.
- **Ammo fizika:** samo cannon, physics-vehicle i 3d-tank (kroz `Vehicle` i `leaveTracks`); fps-airport je ne koristi.

## Kompozicija: ugovori nove arhitekture

Odluke AD-01–AD-06 iz plana arhitekture, delom već u kodu; postojeći ugovori iz odeljaka iznad važe dok igra ne pređe na novi put. „Postoji“ označava ugovor koji kod već ima, „predlog“ izbor koji migracija tek uvodi. Nalazi iz biblioteka i izvora, sa preventivnim proverama, su u [bazi znanja o arhitekturi](ARHITEKTURA-ZNANJE.md).

**Smer importova (postoji za `core/gameplay/` i `core/runtime/`):** `scenes/` → `core/runtime/` i ponašanja → `core/gameplay/`. Čista logika u `core/gameplay/` (zdravlje, oružje, punjenje) ne uvozi DOM, three.js, platno ni sat; vreme i granice dobija kao argumente. `core/runtime/` (sesija, sat, opseg resursa) ne uvozi scene ni prikaz. Lint dozvoljava ovim dvema fasciklama samo relativne uvoze jedne iz druge. Prikaz (`Renderer2D`, `Scena3D`, `ui/`) čita stanje, a ne poseduje ga. Novi folderi su pod `core/` i `core3d/`, pa ih lint i `npm run check` već obuhvataju.

**Ko poseduje podatak:**

| Podatak | Vlasnik | Stanje |
|---|---|---|
| zdravlje, smrt | `Health` objekta; vlasnika pogođenog dela modela daje `GameObject.ownerOf(mesh)` | postoji |
| punjenje i paljba | `Weapon` sa `Cooldown` na satu igre | postoji |
| zvuk ispaljenja | projektil kad ga nosi (`scenes/vis/Bullet.js`), inače `Weapon` za prihvaćen hitac | postoji u vis; predlog za ostale |
| odložene radnje, sat | sesija igre | postoji; 3D lik ima i svoj sat |
| rezultat, talasi, ishod | pravila konkretne igre u `scenes/<ime>/` | postoji |
| položaj | kretanje za kinematički objekat, Ammo za fizički; prikaz samo preuzima | postoji za fiziku, predlog za ostalo |

**API ponašanja (`Health`, `Weapon` i `Cooldown` postoje; kontroler je predlog):** `Health` ima `current`, `maximum`, `alive`, `damage(amount)`, `heal(amount)` i `reset()`, bez `update()`; vrednosti su konačne i između 0 i maksimuma, nevalidan iznos baca grešku, a `damage()` vraća da li je ovaj pogodak ubio (drugi pogodak mrtve mete ne ubija ponovo). `Weapon` ima `tryFire(origin, direction)` koji vraća da li je hitac prihvaćen; plotun svih cevi (`barrels`, svaka sa uglom i pomakom) je jedan hitac, a trzaj i zvuk pravi pozivalac samo za prihvaćen hitac. `Cooldown.start(seconds)` može jednom čekati drugačije, da avioni iz formacije ne pucaju zajedno. Kontroler daje nameru (kretanje, akcija); igrač i AI je daju istom kretanju, a AI ne sluša tastaturu. Objekat drži saradnike u imenovanim poljima (`health`, `weapon`, `controller`, `movement`, `view`), bez registra `getComponent()`. Obaveznu saradnju radi direktan poziv ili callback (kao `onFormationDown` u `scenes/vis/Waves.js`, postoji); događaji su lokalni sesiji i samo za već nastale činjenice.

**Adapteri (postoje):** stara polja ostaju kao getteri i setteri koji čitaju i pišu jedno novo stanje, nikad kao druga kopija. Tenk iz `scenes/tenkici/Tenk.js`:

```js
this.health = new Health({ maximum: 100 })
get energija() { return this.health.current }       // HUD i stari pozivi
get alive() { return this.health.alive }
set alive(value) { value ? this.health.reset() : this.health.damage(this.health.current) } // stari setter vraća punu energiju
get zapaljen() { return this.zapaljiv && this.health.current <= burnBelow }
reagujNaPogodak(steta) { this.trzaj(); this.health.damage(steta) }
```

Adapter se briše tek kad pretraga ne nađe nijednog korisnika starog polja; postojeće putanje modula ostaju dok ih neko uvozi.

**Ko ažurira i ko gasi:**

| Poziv | Vlasnik danas (postoji) | Vlasnik posle migracije (predlog) |
|---|---|---|
| `update` objekata | `Scena.update`, rekurzivno kroz `predmeti` | registar aktivnih objekata sesije, jedan poziv po objektu |
| `handleInput` | `Scena.handleInput` za žive 2D objekte | kontroler u fazi ulaza |
| odložene radnje | sat sesije (`session.update` u petlji) i sat lika (njegov `update`) | isto |
| `end()` objekata | `Scena.end` za direktne `predmeti` i igrača; podobjekte gasi roditelj | opseg resursa sesije, i za podobjekte uklonjene ranije |
| GPU resursi | `Scena3D.end` kroz scenu; zajednički renderer ostaje | i dalje `Scena3D.end`; keš modela (`core3d/assets/models.js`, postoji) čuva samo pripremljene modele i ništa ne oslobađa, da ne postane drugi vlasnik |
| Ammo objekti | `physics/` po objektu, bez oslobađanja | `PhysicsWorld` (postoji): sve što napravi kroz `own` oslobađa u `dispose()`, koji igra veže za `this.session.scope` |

<a id="a4-01-ammo"></a>
## A4-01: lokalno izmeren Ammo ugovor

Provereno 12. 11. 2026 na Node `v22.22.2`, sa neizmenjenim [lokalnim Ammo build-om](../libs/ammo.js). SHA-256: `9ce5f6e8dd9da3aa70871786dad77dd87deb3b169f6e94d4f2d2a8d6bfe80ee9`. [Sirovi rezultati](a4-01-merenje.json) sadrže konfiguracije, numeričke rezultate i hash merne skripte. Ovo su funkcionalne Node probe, bez browser-a, GPU-a ili merenja stvarnog osećaja vožnje.

Za ostale granice migracije pogledati [bazu znanja o arhitekturi](ARHITEKTURA-ZNANJE.md); ovaj odeljak je autoritativan za lokalno izmereni Ammo ugovor.

### Kako ponoviti merenje

Merna skripta je van projekta, u `%TEMP%/partisan-architecture-a4-01/probe.mjs`; pokreće se komandom `node <putanja-do-probe.mjs> <apsolutni-koren-projekta>`. Privremeni fajl nije trajni deo baze; za ponavljanje posle njegovog uklanjanja konfiguracije i očekivanja iz ovog odeljka i JSON-a daju specifikaciju probe.

Lokalni Ammo izvozi ESM fabriku, ali njegov Node put koristi `require` i `__dirname`. Direktan ESM poziv fabrike u Node-u zato pada; u mernom procesu pre inicijalizacije postavljeni su `createRequire(fileURL)` i direktorijum Ammo fajla. To je adapter samo merne skripte: vendor i produkcioni runtime nisu menjani. Postojeći testni setup daje root-relative importe i happy-dom za scene, a ne fizički solver.

Izmerena su tri puta:

- Neposredan Ammo svet bez gravitacije i kontakata: dinamička sfera mase 1, `vx = 6`. Odvojeno se čitaju transform tela i transform iz motion state-a. U ovom delu svih 14 eksplicitno napravljenih objekata po probi ima `destroy` posle uklanjanja tela iz sveta.
- Stvarni projektni [PhysicsWorld](../core3d/physics/PhysicsWorld.js): Three sfera poluprečnika 1, masa 1, početak `(0,100,0)`, `vx = 6`, gravitacija 9.82, bez sudara. Isti kod dodavanja, simulacije i preuzimanja transformacije koji koriste fizičke scene, bez učitavanja modela ili WebGL-a. Cleanup zavisnosti samog projektnog wrapper-a ovde nije popravljen; proces završava posle probe.
- Postojeća [franjo-kluz](../scenes/franjo-kluz/Main.js) logika kroz `handleInput/update`, uz ArrowUp + ArrowRight, kao u [frameRate testovima](../tests/unit/frameRate.test.js). Slike se ne učitavaju: mere se brzina i visina scene, ne vizuelni sudari, položaj aviona ili učinak stvarnih touch kontrola.

Svaki niz traje 1.5 s: ravnomerno 30/60/120 poziva u sekundi, ili 0.5 s ravnomerno + jedan korak od 0.5 s + još 0.5 s ravnomerno. Pojedinačne native probe ispod imaju posebno navedeno trajanje.

### Potvrđeni podkoraci i povratna vrednost

Podrazumevani treći argument ponaša se kao **1/60 s**: proizvoljan niz `[1/120, 1/120, .01, .02, .03]` dao je identične rezultate sa izostavljenim argumentom i sa eksplicitnim `1/60`. Jedan `1/120` ne izvrši korak, a dva uzastopna izvrše jedan. Sa eksplicitnim `1/120` prvi takav poziv već izvrši korak.

| Poziv na svežem svetu, vx=6 | Vraćeno | Položaj tela x | Značenje |
|---|---|---|---|
| `stepSimulation(1/120, 10)` | 0 | 0 | Vreme ostaje u unutrašnjem akumulatoru |
| Dva puta `stepSimulation(1/120, 10)` | 0, pa 1 | 0.10000001 | Jedan korak 1/60 s |
| `stepSimulation(1/120, 10, 1/120)` | 1 | 0.05 | Treći argument je upotrebljiv |
| `stepSimulation(.5, 10)` | 29 | 1.00000012 | Izvršeno 10 koraka, ne 29 |
| `stepSimulation(.5, 5, 1/60)` | 29 | 0.50000006 | Izvršeno 5 koraka; ostatak se ne nadoknađuje kasnije kao ceo dug |
| `stepSimulation(.5, 0)` | 1 | 3 | Jedan promenljivi korak od .5 s; nije bezbedan nadomestak za limitiranje dt |

Vraćeno 29 pri .5 s je rezultat ovog build-a i float preciznosti oko granice, ne specifikacija da je potrebno tačno 29. Bitan ugovor: **povratna vrednost ne mora biti broj stvarno izvršenih koraka**. Broj izvršenih koraka u ovim probama utvrđen je preko poznatog `vx` i pomeraja tela.

Naknadni poziv `1/60` posle zastoja dao je još samo jedan korak: ukupno body x=1.10000014 i povratne vrednosti `[29, 1]`. Time je posebno potvrđeno da ograničeni ceo zaostatak nije ostao za kasnije nadoknađivanje.

### Poređenje 30/60/120 Hz i zastoj

Sve tri frekvencije dale su iste rezultate prikazane u tabeli, unutar apsolutne tolerancije **1e-4 prostornih jedinica** za položaj i **1e-4 jedinica/s** za brzinu. To su tolerancije ove jednostavne probe, ne automatske tolerancije svih vozila i kontakata.

| Put, 1.5 s ukupno | Body x | Body y | Mesh x | Vy |
|---|---|---|---|---|
| Postojeći PhysicsWorld, bez zastoja | 8.99999809 | 88.82974243 | 8.89999771 | -14.73000431 |
| Postojeći PhysicsWorld, jedan zastoj .5 s | 6.99999571 | 93.22147369 | 6.99999571 | -11.45666981 |

Izgubljeno vreme pri zastoju je već postojeći ugovor `maxSteps = 10`; projekat danas ne simulira svih 1.5 s ako jedan frejm premaši taj limit. Broj sfera i teren/vozilo nisu deo ovog kontrolisanog poređenja.

Kinematička franjo-kluz scena dala je na 30/60/120 Hz, sa i bez navedenog zastoja, brzinu pomeranja scene **450** i visinu **900**, unutar **1e-6**. Ovo potvrđuje konkretne veličine scene, a ne sve 2D putanje ili prihvatljivost velikog koraka za sudare.

### Jedan vlasnik vremena i interpolacije

**Odluka za postojeće scene:** zadržati izmereni put do posebne migracije fizičkih scena: Ammo poseduje akumulator i podkorake, `PhysicsWorld.maxSteps = 10`, fiksni native korak 1/60 s. Ne dodavati oko tog puta drugi catch-up akumulator niti drugi nezavisan limit za iste korake. Kinematičke igre nastavljaju sa postojećim dt ugovorom dok njihov pilot ne dokaže izmenu.

**Eksperimentalni ugovor za novi opt-in režim:** runtime poseduje akumulator, korak 1/60 s, najviše 5 koraka po crtanom frejmu, ulazni clamp .25 s i eksplicitno odbacivanje preostalih celih koraka. Ammo se tada poziva `stepSimulation(1/60, 0)` za svaki od već raspoređenih koraka. Broj 0 ovde isključuje native akumulator; poziv nije sa proizvoljnim render dt. Gameplay sat napreduje samo za izvršene korake, a odbačeno vreme ima dijagnostiku. Reset akumulatora pri povratku iz pauze mora biti deo A4-02.

Ovaj kandidat je funkcionalno proveren bez kontakata: za 1.5 s bez zastoja dobija 90 koraka i x=8.99999809; pri zastoju .5 s dobija 65 koraka, simulira 1.08333333 s, odbacuje .41666667 s i završava na x=6.49999619. Sve tri frekvencije dale su isti ishod. **To namerno odstupa od postojećeg maxSteps=10**; ne uključivati ga podrazumevano za stare fizičke igre u A4-02. A4-04 mora porediti i upravljanje/sudare pre eventualnog prelaska, a browser i stvarni uređaj proveravaju se na kraju plana.

Potvrđena je i razlika prikaza: posle 60 poziva pri vx=6, `stepSimulation(1/60, 1, 1/60)` daje body x=5.99999666, ali motion-state x=5.89999676. Sa `stepSimulation(1/60, 0)` oba su 5.99999666. Dakle, prelaz menja i native interpolaciju, ne samo limit koraka. Lokalni binding nema javni `setLatencyMotionStateInterpolation`. Za novi režim runtime može interpolirati prethodni i trenutni **body** transform samo u prikazu; ne sme dvaput interpolirati već native-obrađen motion state, niti vratiti interpolirani transform u telo.

### Dostupno oslobađanje i ograničenje heightfield-a

Runtime potvrđuje `Ammo.destroy`, `_malloc`, `removeAction`, `removeConstraint` i `removeRigidBody`; **`Ammo._free` nije izvezen**. Heap je u ovoj probi 67,108,864 bajta, što nije dokaz koliko je objekata oslobođeno. Ni `btVehicleTuning` nema `__destroy__`, pa ga `Ammo.destroy` odbija sa „Cannot destroy object“ tek na kraju igre, a „Igraj opet“ tada ne može da učita igru; zato `NativeAllocations.own` odmah odbija objekat bez `__destroy__`, a `Vehicle` tuning ne posmatra kao svoj.

`destroy()` je uspešno upotrebljen za sopstvene native objekte probe: body, construction info, motion state, transform, inertia, shape, vektore, svet i njegove pomoćne zavisnosti. To ne dokazuje da ga treba pozivati na pozajmljenim referencama koje vraćaju getteri. Za produkciju vlasnik treba da čuva originalne reference svojih alokacija i da ukloni tela/actions/constraints iz sveta pre uništavanja.

[createTerrainShape](../core3d/physics/index.js#L104) koristi `_malloc` za heightfield podatke. Trenutni javni API nema odgovarajući `_free`, a funkcija ni ne vraća pointer vlasniku. **A4-04 ne sme tvrditi da je potpuno oslobađanje heightfield podataka rešeno samo dodavanjem `destroy(shape)`**. Ne koristiti `delete` tuđeg tipa ili minifikovane interne funkcije kao zamenu za allocator. Za potpuno rešenje potreban je potvrđen javni API ili zasebno odobren obim izmene/zamene build-a; do tada ovo ograničenje ostaje izričito dokumentovano.

Postojeće [updateMesh](../core3d/physics/index.js#L168) pravi novi native transform pri svakom pozivu. Rešenje vlasništva u A4-04 može koristiti jedan sopstveni scratch transform po svetu, uz `destroy` pri gašenju; sama merna proba nije menjala taj kod. Native memoriju treba proveravati odvojeno od WebGL leak testa.

**Predaja:** A4-02 dobija odluku da postojeći put ostaje i da novi režim mora biti opt-in sa jednim vlasnikom vremena/prikaza. A4-04 dobija potvrđene native API-je, ograničenje `_free` i numeričku osnovu za poređenje. Merenje ne potvrđuje native verziju Bullet-a, stabilnost kompleksnih kontakata, vozila sa suspenzijom ili stvarni FPS. Browser/verify i ručna provera osećaja ostaju za A5-02, kako nalaže plan.

Provere ovog koraka: svi numerički assertion-i merne skripte prolaze; `npm run lint` prolazi bez upozorenja, a `npm test` prolazi 243/243 u tadašnjoj radnoj kopiji. Produkcioni kod fizike i scena nije menjan ovim korakom.
