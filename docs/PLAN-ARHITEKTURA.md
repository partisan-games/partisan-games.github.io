# Plan arhitekture

Prelaz na nezavisne aktere: telo bez slike, zasebni 2D i 3D prikaz i upravljač koji dodeljuje scena.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Faza | Korak | Ko | Status |
|---|---|---|---|---|---|
| 1 | [AR-01](#ar-01) | 1 | Osnova tela i lint čistoće | Claude | 📋 TODO |
| 2 | [AR-02](#ar-02) | 1 | Projekcija, crtanje prikaza i spisak upravljača u sceni | Claude | 📋 TODO |
| 3 | [AR-03](#ar-03) | 1 | Telo tenka i 2D prikaz tenka | Claude | 📋 TODO |
| 4 | [AR-04](#ar-04) | 1 | Upravljači tenka i Tenkići na novom telu | Claude | 📋 TODO |
| 5 | [AR-05](#ar-05) | 2 | Franjo Kluz: kopneni akteri | Claude | 📋 TODO |
| 6 | [AR-06](#ar-06) | 2 | Franjo Kluz: lovci, obrušavači i projektili | Claude | 📋 TODO |
| 7 | [AR-07](#ar-07) | 2 | Franjo Kluz: Potez i sastavljanje igre | Claude | 📋 TODO |
| 8 | [AR-08](#ar-08) | 2 | Ustanak | Claude | 📋 TODO |
| 9 | [AR-09](#ar-09) | 2 | Do Trsta i brisanje starog tenka | Claude | 📋 TODO |
| 10 | [AR-10](#ar-10) | 2 | Vis | Claude | 📋 TODO |
| 11 | [AR-11](#ar-11) | 2 | Čamac | Claude | 📋 TODO |
| 12 | [AR-12](#ar-12) | 2 | Bunker i Ranjenik | Claude | 📋 TODO |
| 13 | [AR-13](#ar-13) | 2 | Neretva i Otpisani | Claude | 📋 TODO |
| 14 | [AR-14](#ar-14) | 3 | Uklanjanje starih 2D osnova aktera | Claude | 📋 TODO |
| 15 | [AR-15](#ar-15) | 4 | 3D lik kao telo i 3D prikaz lika | Claude | 📋 TODO |
| 16 | [AR-16](#ar-16) | 4 | 3D upravljači: tasteri i odluke AI | Claude | 📋 TODO |
| 17 | [AR-17](#ar-17) | 4 | 3D likovi Drugog svetskog rata | Claude | 📋 TODO |
| 18 | [AR-18](#ar-18) | 4 | 3D horor likovi | Claude | 📋 TODO |
| 19 | [AR-19](#ar-19) | 4 | 3D fantazija | Claude | 📋 TODO |
| 20 | [AR-20](#ar-20) | 4 | 3D životinje i mašine | Claude | 📋 TODO |
| 21 | [AR-21](#ar-21) | 5 | 3D avioni i vazdušni brod | Claude | 📋 TODO |
| 22 | [AR-22](#ar-22) | 5 | 3D kule, rakete i mete | Claude | 📋 TODO |
| 23 | [AR-23](#ar-23) | 5 | Pravila u dokumentaciju i brisanje plana | Claude | 📋 TODO |

## Obim

- **Cilj vlasnika:** nezavisne atomske komponente koje ne znaju za okruženje i slažu se kao lego; zajedničko jezgro, različit prikaz, pa arhitektura omogućava da se svaki akter prikaže u 2D ili 3D, iako se 3D prikaz 2D aktera sada ne pravi; priča u storybook-u pokazuje čist blok, bez uloge (igrač ili neprijatelj) i bez upravljanja.
- **U obimu:** akteri (igrači i neprijatelji), njihovi projektili, upravljači, scene koje ih sastavljaju i storybook.
- **Van obima:** pozadine, okolina, efekti, kamere, HUD i ulazni uređaji ostaju posebni po dimenziji; vozila čiji položaj vodi Ammo fizika, FPS likovi i proceduralni Avatar ostaju samo 3D; nema mešanja bočnog i pogleda odozgo u jednoj igri ni prelaska 2D/3D unutar igre.
- **Zajednički kod:** `core/` i `core3d/` se menjaju, jer je to cilj plana. Svaka izmena dobija unit test; `npm run smoke` samo uz vlasnikovo odobrenje, na koracima koji to navode.

## Kako čitati

- **Rad agenta:** korak je gotov kad su ispunjeni uslovi iz „Završeno kada“; status se menja odmah.
- **Vlasnik:** igra igru ili otvara storybook gde korak to traži; korak koji menja igru čeka njegovu partiju.
- **Nastavak:** jedan korak po nalogu; sledeći tek na izričito „dalje“.
- **Procena:** min / verovatno / max, 1 p = jedan idealan radni dan izvršioca.
- **Telo:** model aktera bez slike, u metrima, sekundama i radijanima, +y nagore; zna šta ume, ne kada.
- **Prikaz:** samo čita telo i crta ga (2D sprite ili 3D model), sa animacijom, efektima i zvukom.
- **Upravljač:** odlučuje kada telo šta radi (tasteri ili AI); dodeljuje ga scena.

## Sažetak

- **Izvršioci:** Claude kod; vlasnik proverava igre.
- **Ukupno:** 53 p verovatno (36,5 min, 74,5 max).
- **Kalendar:** oko 53 radna dana (36,5 do 74,5), bez čekanja na vlasnikove partije.
- **Rizik:** promene u svih 41 sceni; zato ide igra po igra, a stari i novi akteri koji se međusobno pogađaju nikad nisu u istoj sceni.
- **Pilot na tenku** dokazuje ugovore pre nego što uđu u [ARHITEKTURU](ARHITEKTURA.md); posle njega pauza je bezbedna, a igre se sele jedna po jedna.

## Pretpostavke

- Mixamo klipovi izgledaju prihvatljivo kad se rastegnu na trajanja tela (nepotvrđeno, AR-15).
- Putanje i redovi su provereni prema `aa1523c4` i radnoj kopiji od 2026-11-21; pre koraka ih proveriti ponovo.

## Polazno stanje

Analiza od 2026-11-21 (`aa1523c4` i radna kopija) našla je:

- Svaki akter počinje od svoje slike: 2D osnova prima sliku kao prvi argument i iz nje dobija veličinu i sudarni okvir ([GameObject2D.js:16-23](../core/actor/GameObject2D.js#L16-L23)), a 3D osnova traži mesh i nosi položaj u njemu ([GameObject.js:25-32](../core3d/objects/GameObject.js#L25-L32)). Zato se logika piše u pikselima, `flipY` je smer, a `visible` znači „u igri“.
- `core3d` ne uvozi ništa iz `core/actor`; isti akteri postoje odvojeno po igri i dimenziji (četiri Bf 109, pet tenkova) sa nesaglasnim ugovorima (`alive` i `dead`, `reach` i `attackDistance`, stanja i imena animacija).
- Uloga se nasleđuje: 2D igrač sam pravi `Input` ([Player2D.js:14](../core/actor/Player2D.js#L14)), 3D igrač pravi `Input`, upravljač i traku zdravlja ([Player.js:22-23](../core3d/actor/Player.js#L22-L23)), a 3D stanja se biraju po imenu mesha.
- Stranica se dostiže preko singletona napravljenih pri uvozu (`canvas2d`, `keyboard`, `mouse`, `Renderer2D.instance`); lint čuva čistoću samo u tri foldera i samo od apsolutnih uvoza ([eslint.config.mjs:196-207](../eslint.config.mjs#L196-L207)).
- Već čisto i zajedničko: `core/gameplay` (StateMachine, Health, Cooldown, Weapon), `core/runtime`, `core/collision` i prostorni zvuk sa adapterom koordinata za 2D i 3D.

## Pravila rada

1. Telo nikad ne dira sliku, mesh, `ctx`, platno, stranicu, `config`, miš, tastaturu, `Input`, `session.state`, uloge, zvuk ni upravljač; sve dobija kao opcije: `clock`, `canFire()`, `targets`, `bounds`, `groundAt`, `isBlocked`, `random` i povratne pozive pravila.
2. Telo ima `x, y, z`, brzine, `yaw`, `pitch`, `size` (sudarni okvir i mera za prikaz), `states`/`state`/`setState`/`stateTime`, `health`/`alive`/`dead`/`takeHit`, brojače `shotsFired` i `hitsTaken` i `update(dt)` sa vrednostima po sekundi. Naoružano telo dodaje `shots`, `reach`, `aimAt(point)` i `muzzle`. Podešavanja su u jednom izvezenom objektu, u SI jedinicama.
3. Prikaz samo čita telo; animira se po `state` i `stateTime`, a efekte i zvuk pokreće kad brojač poraste. Nema pretplata ni magistrale događaja.
4. Upravljač koristi samo komande tela, `setState`, `aimAt` i očitavanja; tasteri dobijaju uređaj od scene. Spisak komandi za dugme CONTROLS ostaje u sceni.
5. Scena jedina zna uloge, timove, nivo, projekciju, kameru, uređaje, HUD i pravila (uzbuna, bodovi, životi). Podaci nivoa u pikselima pretvaraju se na granici scene.
6. Priča je telo prikazano kroz jedan svoj prikaz, bez upravljača, tastera i uloge; panel koristi samo stanja, pucanja, podešavanja, praćenje i Reset. Priča objekta se čisti u koraku koji seli taj objekat, ne zasebno.
7. Bez ECS-a, registra entiteta, DI kontejnera i drugog prikaza pre potrebe: prikaz se pravi kad ga igra ili priča traži i kad postoji pravi art, nikad zamenski oblici.
8. Bez aliasa i bez starih i novih blizanaca posle koraka koji seli njihovog poslednjeg korisnika; stari i novi akteri koji se pogađaju nikad u istoj sceni.
9. Agent ne pravi commit; smoke samo uz vlasnikovo odobrenje.

## Ukupno

| Faza | Koraci | Min | Verovatno | Max |
|---|---|---|---|---|
| 1 · Temelj i Tenkići | 4 | 7 | 9,5 | 13,5 |
| 2 · 2D igre | 9 | 16,5 | 24,5 | 34 |
| 3 · Čišćenje 2D | 1 | 1 | 1,5 | 2,5 |
| 4 · 3D likovi | 6 | 9 | 13 | 18 |
| 5 · 3D letelice, kule i završetak | 3 | 3 | 4,5 | 6,5 |

| Izvršilac | Koraci | Min | Verovatno | Max |
|---|---|---|---|---|
| Claude | 23 | 36,5 | 53 | 74,5 |

Raspored talasa je u [PLAN-ARHITEKTURA.schedule.json](PLAN-ARHITEKTURA.schedule.json).

**Provere faza**

1. **Temelj i Tenkići:** Tenkići rade na novom telu sa 1 i 2 igrača; Do Trsta radi kao pre; ugovori upisani u ARHITEKTURU.
2. **2D igre:** svaka preseljena igra prolazi testove i vlasnikovu partiju.
3. **Čišćenje 2D:** stare 2D osnove aktera uklonjene; `npm run verify` prolazi.
4. **3D likovi:** sve porodice likova su tela sa prikazom i upravljačem.
5. **3D letelice, kule i završetak:** preostali 3D akteri su tela; plan obrisan.

## Faza 1 · Temelj i Tenkići

Osnova tela, prikaza i upravljača i prva igra na njoj; ugovori ulaze u ARHITEKTURU. Posle faze pauza je bezbedna: nijedna igra nije napola preseljena.

<a id="ar-01"></a>

### AR-01 · Osnova tela i lint čistoće · 1.5 / 2 / 3 p · Claude

- **Šta:**
  - `core/gameplay/bodies/Body.js`; tela vrsta u `core/gameplay/bodies/<vrsta>/` (`soldiers`, `vehicles`, `aircraft`, `artillery`, `boats`, `projectiles`), 2D prikazi u `core/actor/<vrsta>/`, 3D u `core3d/actor/<vrsta>/`. Telo: polja i metode iz pravila rada 2, stanja preko [StateMachine](../core/gameplay/StateMachine.js), zdravlje preko postojećeg Health-a; jedini nivo nasleđivanja je telo → vrsta.
  - Lint za čiste foldere (`core/gameplay`, `core/runtime`, `core/collision` i folder tela): uvoz samo međusobno, i relativnom putanjom; zabranjeni `window`, `document`, `screen`, `Image`, `localStorage`.
- **Referenca:** čisto pravilo sa opcijama: [Top.js:62-65](../scenes/ustanak/Top.js#L62-L65) (`clock`, `canFire`, `targets` kao opcije).
- **Završeno kada:** unit test tela radi u čistom Node-u bez stranice; lint prolazi na postojećem kodu.

<a id="ar-02"></a>

### AR-02 · Projekcija, crtanje prikaza i spisak upravljača u sceni · 2 / 2.5 / 3.5 p · Claude

- **Šta:**
  - `core/actor/projection.js`: `sideProjection({ pxPerMeter, groundY })` i `topProjection({ pxPerMeter })`, svaka sa `point`, `length`, `turn`, `mirrored`, `toWorld`.
  - `Renderer2D` predaje `(ctx, camera)` u `render` i preskače tela; prikaz sam odlučuje da li je na ekranu.
  - Čist bazen projektila sa zastavicom `active`; projektil se gasi po dometu, tlu ili vremenu, ne na ivici ekrana.
  - Spisak `controllers` u sceni: `handleInput` posle ulazne kapije scene, `update` pre sveta.
- **Završeno kada:** unit test za svaki deo; postojeće igre rade kao pre (njihovi testovi i lint prolaze).
- **Zamke:** stari bazen gađa samo prikazane ciljeve ([ProjectilePool.js:29](../core/actor/ProjectilePool.js#L29)); novi i stari se ne mešaju u istoj sceni.

<a id="ar-03"></a>

### AR-03 · Telo tenka i 2D prikaz tenka · 2 / 3 / 4 p · Claude

- **Šta:**
  - Telo `Tank`: podešavanja iz [Tenk.js](../scenes/tenkici/Tenk.js) u SI jedinicama; nagib cevi umesto `diziCev`/`spustajCev` i `nisani`; usta cevi su osovina plus dužina cevi, ne dijagonala slike; strana je `yaw` 0 ili π umesto dve podklase.
  - `TankSprite`: atlas, cev, granate, olupina, plamen i zvuci tenka, po uzoru na [VehicleSprite.js](../core/actor/VehicleSprite.js).
- **Završeno kada:** unit testovi tela i prikaza bez stranice; privremena provera da se vožnja i putanja granate na referentnom `pxPerMeter` poklapaju sa starim, obrisana posle koraka.

<a id="ar-04"></a>

### AR-04 · Upravljači tenka i Tenkići na novom telu · 1.5 / 2 / 3 p · Claude

- **Šta:**
  - `TankKeys` i `TankAI` u `core/gameplay/controllers`, sa tastaturom i `random` kao opcijama.
  - Tenkići sastavljaju telo, prikaz i upravljač; granice tenka su njegova polovina polja, a priprema runde menja upravljač u spisku scene.
  - Priče tenkova koriste novo telo, bez `TankKeys`. Storybook gubi svoj sloj upravljanja: pozornica ne daje tastere blokovima (prazan `handleInput` u [Stage2D.js](../storybook/Stage2D.js)), nestaju dugme CONTROLS i polje `controlKeys` u pričama, a spiskovi komandi iz [Potez.js](../scenes/franjo-kluz/Potez.js), [Avionce.js](../scenes/vis/Avionce.js) i [Boat.js](../scenes/camac/Boat.js) vraćaju se u `Main.js` svojih igara.
  - Do Trsta zadržava stari tenk do AR-09; metode cevi starog tenka dobijaju nova imena, pa isti `TankKeys` vozi oba.
  - Novi neprijateljski tenkovi iz [IG-02](PLAN-ZA-IGRE.md#ig-02) grade se na novom telu.
  - Pre prelaska na fazu 2 proveriti 3D sudare malim pilotom prema [napomeni u AR-15](#ar-15), pa potvrditi ili dopuniti ugovor tela.
- **Završeno kada:** testovi tenka i upravljača koriste lažnu tastaturu; `npm test` i lint; vlasnik igra Tenkiće sa 1 i 2 igrača i Do Trsta; smoke uz odobrenje, jer se menjaju `core/Scene.js` i `Renderer2D`; dokazani ugovori upisani u [ARHITEKTURA](ARHITEKTURA.md) (gradivni blokovi i njihov raspored po folderima, sudari, vlasnik zvuka, put ulaza) i [STORYBOOK](STORYBOOK.md), uz ispravku rečenice da sprite i mesh dele borbenu logiku.

## Faza 2 · 2D igre

Svaka igra je zaseban korak i posle svake je pauza bezbedna; Franjo Kluz se seli ceo (AR-05–07), jer se njegovi akteri međusobno pogađaju.

<a id="ar-05"></a>

### AR-05 · Franjo Kluz: kopneni akteri · 2 / 3 / 4 p · Claude

- **Šta:** tela i prikazi za `Rifleman`, `Vehicle` i `Flak` sa prikazom posade; veličine i zdravlje vrsta iz [enemies.js](../scenes/franjo-kluz/enemies.js) prelaze u podešavanja tela.
- **Završeno kada:** testovi blokova zamenjuju postojeće jedan za jedan; storybookCatalog.
- **Zamke:** Kluz se prebacuje tek posle AR-07, jer se njegovi akteri međusobno pogađaju.

<a id="ar-06"></a>

### AR-06 · Franjo Kluz: lovci, obrušavači i projektili · 2 / 3 / 4 p · Claude

- **Šta:** potera lovca postaje upravljač `Interceptor` ([Fighter.js:163-169](../core/actor/aircraft/Fighter.js#L163-L169)), opcija `plane` nestaje, a izlazak iz pogleda postaje pravilo scene; tela `DiveBomber`, `Bullet`, `Bomb` i `FlakShell`.
- **Završeno kada:** testovi blokova i upravljača; storybookCatalog.

<a id="ar-07"></a>

### AR-07 · Franjo Kluz: Potez i sastavljanje igre · 2 / 3 / 4 p · Claude

- **Šta:**
  - Potez dobija stanja `fly`, `fire`, `bomb`, `dead`; upravljanje tasterima je `PlaneKeys`, zadnji mitraljezac upravljač `RearGunner` ([Potez.js:222-236](../scenes/franjo-kluz/Potez.js#L222-L236)), a pravilo eksplozije bombe prelazi u scenu.
  - Uzbuna menja upravljače u spisku scene.
- **Završeno kada:** testovi sastavljanja u franjoKluz.test.js; storybookCatalog; vlasnik leti sve tri misije.

<a id="ar-08"></a>

### AR-08 · Ustanak · 2 / 3 / 4 p · Claude

- **Šta:** `Top` postaje telo topa, posade i strelci prikazi ili mala tela, đule telo granate; teren je ubačen upit tla; scena redom rešava hice, pa nestaje zakrpa u priči ([stories/ustanak.js](../storybook/stories/ustanak.js)); `CannonKeys` dobija tastaturu kao opciju.
- **Završeno kada:** testovi igre i catalog; vlasnik igra Ustanak.

<a id="ar-09"></a>

### AR-09 · Do Trsta i brisanje starog tenka · 2 / 3 / 4.5 p · Claude

- **Šta:** igra koristi tela tenka, lovca, obrušavača i vozila sa `Strafer`, `Bombardier` i `Marksman`, koji umesto `target.shown` koriste ubačeno `sees`; stvaranje i pomeranje pozadine prelaze u scenu; prikazi dobijaju slojeve crtanja umesto da `CombatLayers` piše `z` tela; brišu se stari tenk, `shellPhysics` i `VehicleSprite`.
- **Završeno kada:** testovi igre i catalog; vlasnik igra Do Trsta.

<a id="ar-10"></a>

### AR-10 · Vis · 2 / 3 / 4 p · Claude

- **Šta:** telo aviona igrača sa upravljačem tastera, u pogledu odozgo; bodovi, životi, ponovno pojavljivanje i pojačanja prelaze u scenu ([Avionce.js](../scenes/vis/Avionce.js)); `Enemy` i `Boss` postaju tela aviona pod `PathFlight` i `Gunner`.
- **Završeno kada:** testovi igre i catalog; vlasnik igra sve tri etape.

<a id="ar-11"></a>

### AR-11 · Čamac · 1.5 / 2.5 / 3.5 p · Claude

- **Šta:** tela `Boat`, `SBoat` i `ShoreMachineGun`; upravljač `BoatKeys`; `Raider` i `Marksman` dobijaju `sees`.
- **Završeno kada:** testovi igre i catalog; vlasnik igra Čamac.

<a id="ar-12"></a>

### AR-12 · Bunker i Ranjenik · 1.5 / 2 / 3 p · Claude

- **Šta:** tela `MachineGunner`, `Grenadier`, `Patrol` (lutanje prelazi u upravljač) i `WoundedSoldier`.
- **Završeno kada:** testovi igara i catalog; vlasnik igra obe igre.

<a id="ar-13"></a>

### AR-13 · Neretva i Otpisani · 1.5 / 2 / 3 p · Claude

- **Šta:** tela `TrenchSoldier` i `Occupier`; scena poseduje pokazivač miša umesto globalnog [mouse.js](../core/io/mouse.js).
- **Završeno kada:** testovi igara i catalog; vlasnik igra obe igre.

## Faza 3 · Čišćenje 2D

Počinje tek kad su sve 2D igre preseljene; uklanja stare 2D osnove aktera.

<a id="ar-14"></a>

### AR-14 · Uklanjanje starih 2D osnova aktera · 1 / 1.5 / 2.5 p · Claude

- **Šta:** brišu se `Player2D`, `TopDownPlayerVehicle`, `TopDownPlayerBoat`, `GroundTarget`, `Sprite` kao osnova aktera, stari bazen projektila, 2D put u `World.handleInput`, `Renderer2D.instance` i slučajevi posade, propelera i plamena u rendereru; `GameObject2D` ostaje za okolinu, pozadine i efekte.
- **Završeno kada:** `npm run verify`; smoke uz odobrenje, jer se dira svaka 2D igra.

## Faza 4 · 3D likovi

Prvo zajednička osnova lika i upravljači (AR-15–16), pa jedna po jedna porodica likova; posle svake porodice pauza je bezbedna.

<a id="ar-15"></a>

### AR-15 · 3D lik kao telo i 3D prikaz lika · 2 / 3 / 4 p · Claude

- **Napomena za rani pilot (AR-03–04):** postojeći `core/collision` računa 2D sudare; njegova upotreba za 3D pogotke još nije dokazana. Pre masovne migracije igara proveriti mali 3D primer sa unit testovima: mete na istoj projekciji, ali različitoj dubini, izbor najbližeg pogotka i prepreka ispred mete. Na osnovu toga razjasniti da li treba čista 3D geometrija ili upit scene, dopuniti ugovor tela i obim AR-15; telo ne sme zavisiti od mesha ili prikaza.
- **Šta:** telo `Character` sa stanjima bez uloge (`idle`, `walk`, `run`, `jump`, `fall`, `attack`, `attack2`, `special`, `pain`, `death`), trajanjima izmerenim iz današnjih klipova, kretanjem po matematici iz [KinematicMovement.js](../core3d/actor/behaviors/KinematicMovement.js) i `takeHit` umesto `pendingDamage`; priče 3D likova ([characters3d.js:45-57](../storybook/stories/characters3d.js#L45-L57)) prikazuju telo bez tastature i trake zdravlja; prikaz `CharacterModel` sa Animator-om, kostima oružja, česticama i zvukom; 3D pogodak odlučuje telo preko ugovora proverenog ranim pilotom iz napomene iznad.
- **Završeno kada:** unit testovi tela bez modela; catalog pokreće telo bez stranice.
- **Zamke:** događaji miksera više ne završavaju stanje ([Actor.js:214](../core3d/actor/Actor.js#L214)).

<a id="ar-16"></a>

### AR-16 · 3D upravljači: tasteri i odluke AI · 2 / 3 / 4 p · Claude

- **Šta:** `PlayerController` postaje upravljač tastera na `Input`-u koji pravi scena; odluke iz 9 AI stanja ([states/ai](../core3d/actor/states/ai/)) postaju AI upravljači; nestaje izbor stanja po imenu mesha ([FSM.js:26-30](../core3d/actor/FSM.js#L26-L30)).
- **Završeno kada:** testovi upravljača sa lažnim ulazom; testovi fsm3d, movement3d, playerController i actor prepisani na tela.

<a id="ar-17"></a>

### AR-17 · 3D likovi Drugog svetskog rata · 1.5 / 2 / 3 p · Claude

- **Šta:** parovi Player/AI ove porodice postaju po jedna klasa tela sa prikazom; `Input`, `PlayerView` i `ChaseCamera` prelaze u scene, čime se otvara i priča `partizan-3d`, koja sada puca na [Partisan.js:39](../core3d/actor/derived/ww2/Partisan.js#L39) jer postavlja visinu kamere koje nema.
- **Završeno kada:** catalog; vlasnik igra scene ove porodice; smoke uz odobrenje.

<a id="ar-18"></a>

### AR-18 · 3D horor likovi · 1 / 1.5 / 2 p · Claude

- **Šta i završeno kada:** kao AR-17, za horor porodicu.

<a id="ar-19"></a>

### AR-19 · 3D fantazija · 1.5 / 2 / 3 p · Claude

- **Šta i završeno kada:** kao AR-17, za fantaziju.

<a id="ar-20"></a>

### AR-20 · 3D životinje i mašine · 1 / 1.5 / 2 p · Claude

- **Šta i završeno kada:** kao AR-17, za životinje i mašine; Ammo vozila ostaju van.

## Faza 5 · 3D letelice, kule i završetak

Preostali 3D akteri, pa pouke u dokumentaciju i brisanje plana.

<a id="ar-21"></a>

### AR-21 · 3D avioni i vazdušni brod · 1.5 / 2 / 3 p · Claude

- **Šta:** porodica `Warplane` prelazi na telo aviona iz AR-06 sa 3D prikazima, pa `Airship`; `Input`, kamera i HUD prelaze u scene.
- **Završeno kada:** catalog; vlasnik igra 3D avionske scene; smoke uz odobrenje.

<a id="ar-22"></a>

### AR-22 · 3D kule, rakete i mete · 1 / 1.5 / 2 p · Claude

- **Šta:** `Tower` postaje telo topa sa ubačenim ciljevima umesto traženja mesha `player`; `Missile` dobija ubačene ciljeve; statični bombarderi postaju mete sa spiska scene umesto mesha `enemy`.
- **Završeno kada:** testovi blokova; priče kula pucaju; vlasnik igra scene koje ih koriste.

<a id="ar-23"></a>

### AR-23 · Pravila u dokumentaciju i brisanje plana · 0.5 / 1 / 1.5 p · Claude

- **Šta:** pouke prelaze u [ARHITEKTURA](ARHITEKTURA.md) i [STORYBOOK](STORYBOOK.md); plan i njegov raspored se brišu.
- **Završeno kada:** nijedan dokument ne vodi na plan; lint i `npm test` prolaze.

## Rizici

| Rizik | Posledica | Ublažavanje |
|---|---|---|
| Promena osećaja igre pri prelasku na metre | Drugačija vožnja, skok ili putanja | Privremena provera putanja na referentnom `pxPerMeter` (AR-03); vlasnikova partija posle svake igre |
| Mešanje starih i novih aktera u sceni | Pogoci se ne registruju | Pravilo rada 8; Kluz se prebacuje tek posle AR-07 |
| Izmene u `core/Scene.js`, `Renderer2D` i `Scene3D` | Kvar u drugim igrama | Unit testovi, lint, smoke uz odobrenje na AR-04, AR-14 i 3D koracima |
| U telu ostane skrivena 2D pretpostavka | Kasniji 3D prikaz traži izmenu tela | Lint čistoće (AR-01) i testovi tela bez stranice |
| Postojeći 2D sudari ne pokrivaju 3D pogotke | Pogrešni pogoci po dubini ili kroz prepreke; kasna promena ugovora tela | Rani 3D pilot pre masovne migracije, prema napomeni u [AR-15](#ar-15) |
| Mixamo klipovi rastegnuti na trajanja tela | Ružna animacija | Trajanja se mere iz današnjih klipova (AR-15) |

## Nije preneto

- ECS, magistrala događaja i generički omotač aktera: za 39 malih igara dovoljni su jedan nivo nasleđivanja, opcije i obični objekti.
- Pretplate prikaza na telo: brojači stanja ne ostavljaju rukovaoce posle promene igre.
- 2D prikaz za Ammo vozila, FPS likove, kamere, HUD, okolinu i efekte.
- Stvarni 3D prikaz 2D aktera i prekidač 2D/3D u storybook-u: vlasniku sada ne treba; arhitektura ih omogućava.
