# Testing

Postupci, dokazni izvori i granice provera. Preostali posao je u [PLAN-u](PLAN.md); pripremljen test i raniji prolaz ne dokazuju prolaz sadašnje radne verzije. Izvršavanje prati dozvole iz [DOCS](DOCS.md).

## Komande

Storybook katalog (2026-11-23): prošlo 19 ciljanih testova navigacije, kataloga, pokrivenosti, 2D pozornice i patrolnih plovila. Regresioni test nišanske tačke pada sa starim kodom plovila. Chromium potvrđuje pretragu malog čamca, novu adresu i prikaz na 390×844; 3D italijanski mitraljezac ima iste ranije greške pre i posle promene, opisane u [PLAN-u](PLAN.md#sb-04). Puni smoke nije pokrenut.

| Komanda | Obuhvat |
|---|---|
| `npx eslint <putanje>` | Ciljana provera bez automatskih ispravki. `npm run lint` koristi `--fix` i može izmeniti kod. |
| `node --import ./tests/unit/setup/register.js --test <test>` | Ciljana Node provera. |
| `npm test` | Cela unit serija. |
| `npm run check` | Importi, literalne putanje resursa i scene kartica. |
| `npm run verify` | Lint sa ispravkama, unit serija i provera projekta; prethodi komitu u dozvoljenom obimu. |
| `npm run smoke` | Chromium specifikacije iz [tests/smoke](../tests/smoke/); obuhvat se čita iz postojećih fajlova. |
| `npm run probe -- <adresa> [koraci]` | Jedna igra ili priča, stvarni ulaz, `eval:` i `shot`; alat pokreće i gasi svoj server. |

Za browser je potreban instaliran Chromium. Velike serije, buildovi i paralelni browseri traže posebno izričito odobrenje; odobrena ciljana provera ne odobrava ceo `verify` ili smoke.

## Unit tests (`tests/unit/`)

- Čista logika i runtime proveravaju se bez DOM-a; prikazi koriste [testno okruženje](../tests/unit/setup/register.js) i [DOM pomoćnike](../tests/unit/helpers/dom.js). Module koji čitaju stranicu učitati tek posle pripreme elemenata.
- Koristiti stvarno telo i relevantan lanac saradnika; stub koji uvek prihvata napad ne dokazuje red, prekid ili odloženi udar. Blok proverava svoje sposobnosti, scena sastavljanje i pravila nivoa.
- Test sam postavlja potrebne mere i simulira učitavanje slika; fake Image ne dokazuje rasterizaciju. Model pripremiti pre stvaranja aktera; poreklo geometrije mora odgovarati modelu.
- Sat sesije ili aktera pokreće vreme igre, ne mock browserovih tajmera. Proveriti pauzu, velike korake, različite frekvencije, reset i ponovnu upotrebu.
- Ammo se može učitati u ciljane Node provere preko [adaptera](../tests/unit/setup/ammo-node.js); time se ne proveravaju WebGL teksture, svetlo ili korisnički osećaj.
- Gašenje proverava stvarne dispose događaje i život kasnih rezultata; uklonjen mesh nije dokaz oslobođenog GPU resursa. Čistiti ulaz, sesije i tajmere koje test napravi.
- Happy DOM ne završava sve browser animacije. Zamenu napraviti samo na granici potrebnoj testu; ne tvrditi da takav test dokazuje prirodan završetak u browseru.
- `todo` beleži otvoren problem, ne izvršen dokaz ispravnosti. Lokalni prolaz nije dokaz prolaza CI-ja.

## Smoke test (`tests/smoke/`)

Aktuelne provere uključuju [curenje pri smeni igara](../tests/smoke/leaks.spec.js), [pripremljeni art](../tests/smoke/prepared-art.spec.js) i [krv pri padu bombaša](../tests/smoke/grenadier-blood.spec.js). To nije automatski prolaz kroz svaku partiju ili potvrda svake touch komande. Nedostajuće teksture modela koje su poznato ograničenje vodi [known-issues](../tests/smoke/known-issues.js).

Za ciljanu probu koristiti [probe](../scripts/probe.js). Sačekati stvarnu posledicu držanog tastera; softverski 3D prikaz može biti spor. `waitForFunction` ima sinhron predikat. Headless Escape ne dokazuje fizičko oslobađanje pointer lock-a; poziv `exitPointerLock` je samo ograničenje probe. Pravi touch zahteva držanje i nezavisne pokazivače, ne samo `tap`.

## Sačuvani dokazni izvori

Ovo su datirani dokazi svog obuhvata, ne tvrdnja da je sve danas provereno. Dnevnici pojedinačnih prolaza i promenljivi ukupni brojevi testova se ne održavaju u dokumentaciji.

| Oblast | Dokaz / obuhvat |
|---|---|
| Storybook animacije | [Pregled](../pregled-animacija.html) i [podaci](references/storybook-animacije.json) iz pregleda 22. novembra 2026; čitati rezultat po konkretnom izgledu i komandi. |
| Analiza izvornih i pripremljenih snimaka | [Izvornici](references/audio/zv06-2026-11-19.json), [pripremljeni snimci](references/audio/zv06-prepared-2026-11-19.json) i [obrada](../assets/sounds/PROCESSING.json); merenja snimaka nisu dokaz miksa ili performansi igre. |
| Ammo merenja | [Fixture i rezultati](../tests/unit/fixtures/ammo-measurement.json); obuhvat čitati iz artefakta, bez zaključka o GPU prikazu. |

<a id="predaja-arta-iz-plana-ideja"></a>
<a id="art-verification-record"></a>
## Provere arta

Panel napada (2026-11-23): tri ciljana testa potvrđuju uklanjanje duplikata i očuvanje posebnih napada i automatskog oružja. Chromium potvrđuje da motociklista ima samo `attack` i da ga dugme pokreće; Flak zadržava „Pucaj gore” i „Pucaj pravo”, bez duplirane opšte komande. Lint izmenjenog panela prolazi.

Motociklista (2026-11-23): nov atlas 156×108 po ćeliji, 4×6, sa odvojenim mitraljezom; 41 paket prolazi proveru pripreme bez upozorenja. Prošlo 17 ciljanih testova tela, prikaza i kataloga, uključujući slaganje cevi, nišanske tačke i projektila u oba smera. Chromium: Storybook mirovanje, vožnja, pucanje, oštećenje, smrt, oba smera i Reset; prikaz novog atlasa i pauza/nastavak u Do Trsta i Kluzu, uz privremeno pomeranje postojećeg motocikliste u kadar za pregled. Bez prijavljenih grešaka; ovo nije odigravanje celih nivoa ni vlasnikovo vizuelno prihvatanje.

[Metapodaci i priprema](ART.md#resursi-i-zajednički-potrošači) proveravaju dimenzije, alfu, rubove, sidrišta i poreklo. [Reinforcement test](../tests/unit/reinforcementArt.test.js) proverava stvarna tela i prikaze sa testnim canvas-om, ali ne rasterizuje završnu sliku. Različiti hashes kadrova nisu dokaz prirodne animacije; izdvojeni PNG/GIF nije dokaz igre.

Datirani pregled animacija iz tabele iznad zamenjuje starije opšte beleške „browser nije pokretan” za obuhvaćene priče. Ne prenosi automatski pokrivenost na izmenjeni art, sve nivoe ili nove varijante. Preostale provere vode se u [planu arta](PLAN.md#art).

## Battle for Jablanica: nivo i nišanjenje

[Test scene](../tests/unit/cannonScene.test.js) inicijalizuje stvarni GLB i Ammo, uz zamenske teksture i bez GPU renderera. Potvrđuje ugovor simulacije i ulaza, ne svetlo, maglu, teksture i konačan osećaj nišanjenja.

## Battle for Jablanica: stabilnost bunkera

[Fizički test](../tests/unit/cannonFort.test.js) proverava stabilnost, udar, razaranje i vlasništvo native resursa. Eksplozije zadate neposredno na delovima nisu dokaz da ih igrač sve može pogoditi putanjom granate.

## Battle for Jablanica: izbor pri predaji

[Test predaje](../tests/unit/cannonSurrender.test.js) koristi stvarni UI, sesiju i petlju, ali ne WebGL. Provera izbora i fokusa nije vizuelna potvrda scene.

## Avatar: prevoženje liftom

[Test lifta](../tests/unit/avatarLift.test.js) koristi telo i simulaciju nivoa; konačan izgled ostaje zaseban dokaz.

<a id="camac-enemy-vessels"></a>
## Čamac: neprijateljska plovila

[Test plovidbe](../tests/unit/camac.test.js) proverava tok etapa i susrete. Kada je zdravlje pojačano radi prolaska, rezultat ne ocenjuje težinu preživljavanja. Simulacija ne potvrđuje vizuelni izgled i čujnost svakog plovila.

## UI verification limits

DOM provere ne potvrđuju native tastaturu, fokus, fizički touch, pointer lock ili vidljivu geometriju. Za vidljivost proveriti stvarnu kontrolu, ne nužno omotač bez dimenzija. Pri izmeni naplate proveriti najduži natpis, sve teme, enabled/disabled/povratak i smanjeno kretanje na stvarnoj veličini dugmeta. Preostali izbori početka, povraćaj i realni touch vode se u [planu UI-ja](PLAN.md#ui).

Vlasnik je izabrao pregled izgleda kroz igranje, bez obavezne serije screenshot-ova svake teme i veličine ekrana. Ciljana slika može potkrepiti konkretnu promenu, ali ne zamenjuje stvarnu radnju.

## Franjo Kluz sprite integration verification limits

Provere strukture i izvora ne potvrđuju osećaj leta, zvuk i svaku misiju. Koristiti postojeći pregled animacija za obuhvaćene priče i ciljano proveriti promenjene [misije](../tests/unit/franjoKluz.test.js), bez oslanjanja na ranije brojeve prolaza.

## Ustanak verification limits

[Test nivoa](../tests/unit/ustanak.test.js) proverava pravila; ugao cevi, stvarno nišanjenje, vetar, rupe u tlu, fokus i oslonci zahtevaju odgovarajući prikaz/runtime dokaz. Vlasnikovo prihvatanje terena nije automatsko prihvatanje kasnijeg miksa ili arta.

## Global audio migration verification limits

Sačuvano je da su unit provere, lint i provera projekta prošli za audio migraciju i da je vlasnik preslušao poboljšan zvuk 20. novembra 2026. To nije dokaz sadašnje radne verzije, svakog spoja petlje, native dekodiranja, kontakata, mixed peak-a, DSP troška, p95 vremena ili audio RAM-a.

[Kontrolisano opterećenje](../tests/fixtures/audioWorkload.js) poredi isti prizor sa zvukom i bez njega. Zabeležiti uređaj, browser, hladan/topao keš i ograničenja; JS vreme ne meri native DSP, a broj zadržanih snimaka nije memorija u bajtovima. CPU emulacija nije identifikovan spor uređaj. Tačan preostali scenario i kriterijumi su u [planu arhitekture](PLAN.md#arhitektura).

Uspešno dekodiranje i povezani izvori ne dokazuju čujnost: prvo potvrditi da se nameravani izvor stvarno čuje u igri, pa ocenjivati udaljenost, smer, petlju i performanse. Ne pretvarati nekadašnju grešku ili pripremljen slučaj u tvrdnju da problem danas postoji ili da je danas rešen.
