# Testing

Postupci, dokazni izvori i granice provera. Preostali posao je u [PLAN-u](PLAN.md); pripremljen test i raniji prolaz ne dokazuju prolaz sadašnje radne verzije. Izvršavanje prati dozvole iz [DOCS](DOCS.md).

## Komande

Katalog (2026-11-23): prošlo 19 ciljanih testova navigacije, kataloga, pokrivenosti, 2D pozornice i patrolnih plovila. Regresioni test nišanske tačke pada sa starim kodom plovila. Chromium potvrđuje pretragu malog čamca, novu adresu i prikaz na 390×844; 3D italijanski mitraljezac ima iste ranije greške pre i posle promene; kasnije su otklonjene (nedostajuća `default-grey.jpg` modela MP40). Puni smoke nije pokrenut.

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
| Animacije u katalogu | [Pregled](../pregled-animacija.html) i [podaci](references/katalog-animacije.json) iz pregleda 22. novembra 2026; čitati rezultat po konkretnom izgledu i komandi. |
| Analiza izvornih i pripremljenih snimaka | [Izvornici](references/audio/zv06-2026-11-19.json), [pripremljeni snimci](references/audio/zv06-prepared-2026-11-19.json) i [obrada](../assets/sounds/PROCESSING.json); merenja snimaka nisu dokaz miksa ili performansi igre. |
| Ammo merenja | [Fixture i rezultati](../tests/unit/fixtures/ammo-measurement.json); obuhvat čitati iz artefakta, bez zaključka o GPU prikazu. |

## Sudari vozila

[Provere sudara](../tests/unit/vehicleCollisions.test.js) koriste stvarna tela i zajedničke fizičke podatke: rangove, gaženje lakih vozila, obostranu štetu prema masi i brzini, jedan udar po kontaktu, zaustavljanje, razdvajanje, velike korake, različite frekvencije, mrtve i nepoznate modele. [Prolazak nivoa](../tests/unit/tankLevelFlow.test.js) proverava Do Trsta sa kontaktima, zaustavljanje kamere, nastavak posle uništenja prepreke, pauzu, završetak i novu igru bez starih kontakata. Radi izolovanja preživljavanja test obnavlja zdravlje igrača i nišani u prepreku; ne dokazuje težinu nivoa za igrača. Ciljane provere tela i upravljanja takođe prolaze. Pregledač nije pokretan; vizuelni osećaj sudara proverava vlasnik.

<a id="predaja-arta-iz-plana-ideja"></a>
<a id="art-verification-record"></a>
## Provere arta

Razmera i sedam vozila za Do Trsta (2026-11-24): [provere razmere](../tests/unit/aircraftScale.test.js) potvrđuju native izvore za svih 13 avionskih izgleda, obe mere bočnih aviona i Sd.Kfz. 251, ose pogotka i očuvane brzine upravljanja, metaka, razmaka pušaka i petlje u pikselima. [Provere novih vozila](../tests/unit/roadVehicles.test.js) prolaze za oba smera, stvarnu štetu projektila, usklađenost nacrtanog otvora cevi sa metkom, mirovanje tokom pauze i završnu olupinu. [Patrolna plovila](../tests/unit/patrolBoat.test.js) čitaju izvornu razmeru 40 px/m i zadržavaju razmeru nivoa; [S-30](../tests/unit/sBoatArt.test.js) zadržava poravnate cevi tokom tonjenja. Ciljane provere frontalnih vojnika, tenkova, propelera, Visa i kataloga prolaze; prolazak celog Do Trsta potvrđuje pauzu, završetak, novu igru i postojeću pratnju.

Priprema `plan-ideas-art/prepare.py --check` potvrđuje 40 paketa bez upozorenja; provereni su importi, putanje resursa, manji lossless prikazi i obnovljen indeks arta. Pregledač, ručno igranje i vlasnikovo prihvatanje izgleda nisu izvršeni; prema DOCS to radi vlasnik. Test prolaska obnavlja zdravlje igrača i zato ne potvrđuje težinu nivoa sa novim vozilima.

Vlasnik je 2026-11-24 označio AR-P04 kao završen: pregled rasporeda rekvizita i preostalih ugrađenih ambijenata je zatvoren.

Vlasnikov pregled AR-P03 završen je 2026-11-24; za zastavnika su ostala stanja ocenjena kao dobra. Četiri prijavljene greške ispravljene su sledećim proverljivim promenama, bez upisivanja novog vlasnikovog vizuelnog prihvatanja.

Zastavnici i posade obe vojske: očišćen je izvorni alfa veo i obnovljene reference; [test prikaza](../tests/unit/reinforcementArt.test.js) potvrđuje jednaku vidljivu visinu i oslonac pre i tokom pogotka u oba smera, uz manje od 0,2 px odstupanja zbog razlomljene mreže. Bombaš: kratki trzaj tekuće poze zamenjuje atlas pogotka bez bombe; [test](../tests/unit/grenadierBlood.test.js) proverava isti izvorni kadar u mirovanju, pre i posle otpuštanja bombe u oba smera, a postojeće provere bacanja i krvi prolaze. Partizan otpozadi: [test kataloga](../tests/unit/catalogStories.test.js) potvrđuje bočnu grupu 40 px/m umesto frontalnih 100, uz isto telo od 1,8 m i nepromenjen prikaz u Neretvi. Pregledač nije pokretan; izgled proverava vlasnik.

Partizanski strelac — razmera pogotka: [čišćenje izvora](../assets/images/armies/sources/ustanak/prepare.py) sa `--check` potvrđuje očišćen atlas i obe usklađene reference. Uklonjeni su samo pikseli sa alfom ispod 8/255, a dimenzije, mreža i ostali RGBA pikseli su očuvani. [Regresiona provera](../tests/unit/reinforcementArt.test.js) poredi stvarne pozive prikaza pre i tokom pogotka u oba smera: vidljiva visina i oslonac razlikuju se manje od 0,1 px, zbog izvorne razlomljene mreže. Pripreme pogotka i hodanja/padova proveravaju metapodatke; manje kopije moraju biti obnovljene posle čišćenja. Pregledač nije pokretan; vizuelno prihvatanje ostaje vlasnikovo.

Do Trsta — vraćen slojeviti pejzaž sa kućama, crkvom, drvećem, oblacima i putem (2026-11-23). Ciljani test `tankLevelFlow.test.js` prolazi: pomeranje puta, postojeće etape, borba, avioni, pauza, završetak i ponovna igra. Pre vlasnikovog naloga da samo on pokreće pregledač izvršena je jedna Chromium provera: svih pet slika se učitalo, prikaz odgovara starom slojevitom pejzažu, bez JS/HTTP grešaka. Dalje browser provere radi vlasnik prema DOCS; izgled nije upisan kao njegovo prihvatanje.

Oštećenja i olupina 3D topa (2026-11-23): [test stvarnog modela i priče kataloga](../tests/unit/fieldGunDamage.test.js) potvrđuje četiri faze prema zdravlju, razdvojene sklopove, oslonac svakog dela na podignutom i okrenutom modelu pri 30 i 60 koraka u sekundi, očuvanje svih 4.768 trouglova i izvornog modela, miran završetak i oslobađanje novih resursa. Posada ostaje odvojena od zdravlja topa i odvaja se pre raspadanja; Reset vraća zdrav top. [Testovi pogotka](../tests/unit/gunHit.test.js) potvrđuju kraće varnice, prašinu i opiljke, dim tek od pola zdravlja, krupnije komade od četvrtine, mirovanje pri pauzi, oslonac delova, ograničen broj objekata i oslobađanje zajedničke teksture i instance. Direktan izbor `dead` daje jedan završni oblačić; efekti se ne ponavljaju na mirujućoj olupini. Prošlo je 19 ciljanih testova, lint i provera projekta. Pregledač nije pokretan, po zahtevu vlasnika; izgled i prelaze vlasnik proverava u katalogu.

Minobacač 81 mm (2026-11-23): oba originalna GLB fajla prolaze stvarno učitavanje, proveru oslonca na y=0, normala, boja i odsustva spoljašnjih tekstura; provereni su imenovani delovi i smer tačke `Muzzle`. [Test stvarne posade](../tests/unit/mortarCrew.test.js) proverava poravnanje mine, dodir šaka, jedan pucanj po komandi, prekid ciklusa pri gubitku člana, završni oslonac oba tela i zabranu oživljavanja bez Reset-a. Četiri testa navigacije i pokrivenosti kataloga prolaze. Chromium: mirovanje, punjenje, paljba, obe pogibije i Reset bez browser/HTTP grešaka; prethodno i poređenje modela sa postojećim topom u zajedničkoj sceni. Minobacač je po odluci vlasnika ostao samo u katalogu; borbena integracija je povučena.

Posle vlasnikovog izbora arta uklonjeni su odbačeni izvori i zastarele reference; metapodaci prate zadržane runtime slike. Ciljane unit provere, ESLint, provera projekta i hashovi pripremljenih paketa proveravaju integraciju, ne predstavljaju vizuelno prihvatanje. Browser i puna testna serija nisu pokretani.

Frontalni kandidati: u katalogu su zasebno dostupni strelac i stražar. Šinjel ima zajedničku oznaku `allowedSeasons: ['winter']` i vidljivo ograničenje na zimu. Testovi proveravaju izbor obe stavke, stvarne radnje, oznaku godišnjeg doba i da kandidati ne ulaze u Otpisane pre vlasnikovog izbora. Postojeće provere obuhvataju ritam paljbe, pauzu, smrt, veličinu tela i efekata, providnost i oslonac; strelac i stražar koriste kadrove 512×512. Browser nije pokretan po zahtevu vlasnika; njegov pregled i prihvatanje ostaju odvojeni.

Poređenje M15/42, StuG III, Hotchkissa i BP-42 sa glavnim partizanskim tenkom izvršeno je u katalogu u veličini igre (`art-poredjenje-*`). Procena agenta: siluete i oprema ostaju čitljive; zrnastije senčenje tri manja tenka i ravnije senčenje voza nisu razlog za potpuno precrtavanje. Ovo zatvara poređenje, ne upisuje vlasnikovo prihvatanje.

Bombaš, kuća-bunker i njen mitraljezac: vraćeni originalni prikazi, njihove animacije i odgovarajući pogoci/oštećenja u igri i katalogu. Priprema koristi stare izvore; odbačeni crteži se ne uključuju automatski.

Obalsko gnezdo: nov zaklon, MG34 i sopstvena posada; provera cevi koristi stvarni prikaz i fizički izlaz metka, a završnog stanja proverava oštećene vreće i oba pala čoveka. Ciljane provere čamaca/prikaza i pokrivenosti kataloga prolaze; Chromium pregleda mirovanje, napad, pogodak i uništenje u priči i zajednički PNG u Čamcu (`gnezdo-*`). Priprema izvora i paketa prolazi bez upozorenja za ovaj akter.

Somuina cev: odvojena priprema proverava binarnu alfu, hashove i očuvanost oba prihvaćena trupa.

Ju 87 (2026-11-23): novi PNG trup i registrovano oštećenje zamenjuju geometrijski SVG u zajedničkom DiveBomberSprite; veličina tela ostaje ista, osovina odvojenog propelera je u metapodacima. Chromium: oba smera, obrušavanje, oštećenje, smrt i Reset u katalogu; poziv stvarnih fabrika/napada u Kluzu, Do Trsta i Neretvi, prikaz i pauza/nastavak bez prijavljenih grešaka. Priprema 43 paketa prolazi; prethodno navedeni ciljani testovi ponovljeni su posle povezivanja. To nije odigravanje celih nivoa ni vlasnikovo prihvatanje.

Hummel i bočni Bf 109 (2026-11-23): novi trupovi i usklađeni oštećeni prikazi; Hummelov napad ponovo pripremljen iz novog trupa, postojeća prihvaćena olupina sačuvana. Prošlo 35 ciljanih testova prikaza, geometrije, tela i kataloga; 42 paketa prolaze proveru pripreme, kao i Hummelov napad sa šest kadrova i istim završnim mirovanjem. Chromium: katalog oba smera, napad, oštećenje, smrt i Reset, uz vožnju Hummela i propeler Bf 109; Kluz oba aktera i Do Trsta Bf 109 kroz stvarne fabrike nivoa, pauza/nastavak bez prijavljenih grešaka. To nije odigravanje celih nivoa ni vlasnikovo prihvatanje izgleda.

Sd.Kfz. 251/222 (2026-11-23): novi atlasi, oštećenja i mirujuće olupine; 222 ima odvojenu kupolu, a mere tela ostaju iste. Prošlo 17 ciljanih testova tela, prikaza i kataloga i provera 41 paketa pripreme bez upozorenja. Chromium: oba smera, vožnja, napad, smrt i Reset u katalogu; oštećenje provereno na 251. Do Trsta: postojeća vozila pomerena u kadar; Kluz: oba vozila napravljena stvarnom fabrikom nivoa i dodata u kadar, jer ih početna misija nema. Prikaz i pauza/nastavak bez prijavljenih grešaka; ovo nije odigravanje misija ni vlasnikovo prihvatanje.

Panel napada (2026-11-23): tri ciljana testa potvrđuju uklanjanje duplikata i očuvanje posebnih napada i automatskog oružja. Chromium potvrđuje da motociklista ima samo `attack` i da ga dugme pokreće; Flak zadržava „Pucaj gore” i „Pucaj pravo”, bez duplirane opšte komande. Lint izmenjenog panela prolazi.

Motociklista (2026-11-23): nov atlas 156×108 po ćeliji, 4×6, sa odvojenim mitraljezom; 41 paket prolazi proveru pripreme bez upozorenja. Prošlo 17 ciljanih testova tela, prikaza i kataloga, uključujući slaganje cevi, nišanske tačke i projektila u oba smera. Chromium: u katalogu mirovanje, vožnja, pucanje, oštećenje, smrt, oba smera i Reset; prikaz novog atlasa i pauza/nastavak u Do Trsta i Kluzu, uz privremeno pomeranje postojećeg motocikliste u kadar za pregled. Bez prijavljenih grešaka; ovo nije odigravanje celih nivoa ni vlasnikovo vizuelno prihvatanje.

[Metapodaci i priprema](ART.md#resursi-i-zajednički-potrošači) proveravaju dimenzije, alfu, rubove, sidrišta i poreklo. [Reinforcement test](../tests/unit/reinforcementArt.test.js) proverava stvarna tela i prikaze sa testnim canvas-om, ali ne rasterizuje završnu sliku. Različiti hashes kadrova nisu dokaz prirodne animacije; izdvojeni PNG/GIF nije dokaz igre.

Datirani pregled animacija iz tabele iznad zamenjuje starije opšte beleške „browser nije pokretan” za obuhvaćene priče. Ne prenosi automatski pokrivenost na izmenjeni art, sve nivoe ili nove varijante. Preostale provere vode se u [planu arta](PLAN.md#art).

## Crveni krst — priprema i art

Priprema za [IG-29](PLAN.md#ig-29), 24. 11. 2026: kratka Node provera nad stvarnim `Maze` i `truePrims`, bez modela i browsera, prošla je kroz 32 generisanja. Svaki put dobijeno je 17×17 pločica, 161 puna i 128 prohodnih; svih 128 je povezano sa početkom, uključujući izlaz. Potvrđene su koordinate početka (−35, −35) i izlaza (35, 40). Ovo je polazna prohodnost, ne provera buduće geometrije, zaklona, osvetljenja ili konačnog izgleda.

Tri [likovne reference](references/ww2-yu/crveni-krst/README.md) su preuzete i vizuelno pregledane; poreklo, ograničenja i hashovi su u manifestu. Nivo i akteri nisu menjani u ovoj pripremi; postojeće lokalne izmene scene pripadaju ranijem radu. Velika testna serija i browser nisu pokretani.

Prvi [paket modela](../assets/models/building/crveni-krst/README.md), 24. 11. 2026: prošlo 14 ciljanih testova u `crveniKrstArt`, `catalogStories`, `catalogCoverage` i `catalogNavigation`; ciljani ESLint prolazi. [Test arta](../tests/unit/crveniKrstArt.test.js) parsira svih sedam stvarnih GLB fajlova, proverava hashove, geometriju, normale, UV, dodeljen atlas, oslonac i skalu, raycast između niti žice i kroz puni zaklon, otvaranje kapije, nezavisnost kloniranih reflektora i svih osam stavki kataloga. GLTFLoader u Node okruženju koristi zamenske teksture, pa ovo ne potvrđuje GPU rasterizaciju; odsustvo teksture ne sme proći samo kao upozorenje, zato test izričito zahteva dodeljenu mapu. Kloniranom spotu vezati `.target` za dete iste instance; zasebno klonirani cilj ne prati automatski rotaciju svetiljke.

Dva mala offline EEVEE rendera (960×640, po 24 uzorka) su napravljena lokalnim Blenderom 4.5.3 i vizuelno pregledana: ceo paket i pogled sa visine 1,78 m. Generisana studija ostaje likovni cilj; renderi prikazuju originalne modele uz podlogu i svetlo za pregled, bez tvrdnje da su screenshot igre. Paket koriste katalog i nivo; browser i puna testna serija nisu pokretani.

Povezivanje nivoa, 24. 11. 2026: prošlo je 36 ciljanih testova (`fpsCamp`, `crveniKrstArt`, `logic`, `characterModel`), uz čist ciljani ESLint. [Test nivoa](../tests/unit/fpsCamp.test.js) proverava 32 povezana rasporeda oko izdvojenog objekta, sve veze/pregrade jednog stvarnog sklopa, pogled i metke kroz žicu, pune zaklone, blokadu nogu pri skoku i naknadno dodate rekvizite. Učitavanje prave scene sa stvarnim FBX/GLB/OBJ fajlovima i zamenskim teksturama potvrđuje deset živih neprijatelja, dve prve pomoći, pobedu samo po starom pragu udaljenosti i čist novi ulazak. Tri vidljiva instancirana sklopa za žicu/stubove i jedan nevidljivi kolizioni oslobađaju instance bafere jednom; materijale i svetla oslobađa scena. Za instancirane tanke delove lokalno je isključena kontura, bez promene kataloških materijala. Puni zakloni koriste obične mesh-eve kako postojeći tragovi pogodaka ne bi završavali na koordinatama pogrešne instance.

Nema potvrde stvarnog FPS-a, WebGL izgleda, čitljivosti pri kretanju ili osvetljenja u browseru; njega pokreće vlasnik.

## Optimizacija resursa kataloga

Pregledano je 45 različitih baznih putanja modela; 43 FBX/GLB modela su parsirana, a dva spoljašnja glTF-a popisana bez analize geometrije. Pored partizana, još pet modela dobija manje grupa: Iron Giant 286→51, MG-42 68→11, čarobnica 32→10, kostur 23→2, puška 5→2. To su grupe materijala sa jednim implicitnim prolazom za mesh bez grupa, ne izmereni WebGL pozivi; izvorni fajlovi nisu smanjivani. [Test stvarnih modela](../tests/unit/catalogResources.test.js) potvrđuje iste trouglove, njihove materijale i redosled temena, sve atribute i iste skelete. Stvarni Bigfoot model daje iste četiri lokalne/prilagođene animacije pri serijskom i paralelnom učitavanju.

Od 170 pregledanih PNG slika aktera, 140 ima manje lossless kopije: 28.034.177→18.839.666 bajtova (32,8%, ušteda 9.194.511 bajtova pri preuzimanju celog skupa; resursi se učitavaju po potrebi). `python -B scripts/prepare-catalog-images.py --check` prolazi za sve slike: svaki RGBA piksel, dimenzije, hashovi i mapa su isti kao u manifestu. Testovi potvrđuju prepoznavanje kanonskog atlasa i deljenje odgovarajuće olupine i preko WebP adresa. Izvorni PNG fajlovi ostaju u repozitorijumu.

Završna provera 2026-11-23: svih 856 unit testova prolazi, ciljani ESLint nema nalaza, a `npm run check` potvrđuje 489 datoteka i 36 scena. Poznate dijagnostike FBX skinning težina i zamenskih slika putnika u čamcu ostaju; nisu neuspešni testovi. Pregledač nije pokretan; izgled na GPU-u, FPS i vreme mrežnog učitavanja nisu izmereni.

## Battle for Jablanica: nivo i nišanjenje

Optimizacija nivoa (2026-11-23): učitavanje tela i klipova preklopljeno je samo za Jablanicu; [testovi učitavanja](../tests/unit/parallelModels.test.js) potvrđuju čekanje oba zahteva, identitet keša, ponovni pokušaj posle greške i očuvano podrazumevano ponašanje. [Test stvarnog vojnika](../tests/unit/cannonModelOptimization.test.js) potvrđuje prelaz sa 1.423 na 10 grupa uz iste trouglove, materijale, podatke temena i animiranu pozu. Ista početna scena, učitana u Node-u sa pravim FBX/GLB modelima i zamenskim teksturama, ima 4.899 → 660 grupa materijala i 4.847 → 608 grupa koje bacaju senku, uz nepromenjenih 200.135 trouglova; to su zbirne grupe pre odbacivanja van kadra, ne izmeren broj WebGL poziva ili FPS. Merenje pre/posle isključuje optimizaciju samo u memoriji.

U istoj sceni 196 nepomičnih objekata ima zamrznute matrice; [test scene](../tests/unit/cannonScene.test.js) potvrđuje da oslobođeni delovi tvrđave ponovo prate fiziku. Uniforma je smanjena sa 2.629.254 na 1.713.114 bajtova (34,8%), uz proverene jednake piksele; ovo smanjuje prenos, ne memoriju dekodirane teksture. Svih 850 unit testova prolazi. Pregledač nije pokretan za ovu optimizaciju, pa stvarno vreme mrežnog učitavanja i FPS nisu izmereni; serija i dalje ispisuje ranije prisutne dijagnostike zamenskih slika putnika u čamcu.

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

DOM provere ne potvrđuju native tastaturu, fokus, fizički touch, pointer lock ili vidljivu geometriju. Za vidljivost proveriti stvarnu kontrolu, ne nužno omotač bez dimenzija. Pri izmeni naplate proveriti najduži natpis, sve teme, enabled/disabled/povratak i smanjeno kretanje na stvarnoj veličini dugmeta.

Vlasnik je izabrao pregled izgleda kroz igranje, bez obavezne serije screenshot-ova svake teme i veličine ekrana. Ciljana slika može potkrepiti konkretnu promenu, ali ne zamenjuje stvarnu radnju.

## Franjo Kluz sprite integration verification limits

Provere strukture i izvora ne potvrđuju osećaj leta, zvuk i svaku misiju. Koristiti postojeći pregled animacija za obuhvaćene priče i ciljano proveriti promenjene [misije](../tests/unit/franjoKluz.test.js), bez oslanjanja na ranije brojeve prolaza.

## Ustanak verification limits

[Test nivoa](../tests/unit/ustanak.test.js) proverava pravila; ugao cevi, stvarno nišanjenje, vetar, rupe u tlu, fokus i oslonci zahtevaju odgovarajući prikaz/runtime dokaz. Vlasnikovo prihvatanje terena nije automatsko prihvatanje kasnijeg miksa ili arta.

## Global audio migration verification limits

Sačuvano je da su unit provere, lint i provera projekta prošli za audio migraciju i da je vlasnik preslušao poboljšan zvuk 20. novembra 2026. To nije dokaz sadašnje radne verzije, svakog spoja petlje, native dekodiranja, kontakata, mixed peak-a, DSP troška, p95 vremena ili audio RAM-a.

[Kontrolisano opterećenje](../tests/fixtures/audioWorkload.js) poredi isti prizor sa zvukom i bez njega. Zabeležiti uređaj, browser, hladan/topao keš i ograničenja; JS vreme ne meri native DSP, a broj zadržanih snimaka nije memorija u bajtovima. CPU emulacija nije identifikovan spor uređaj.

Uspešno dekodiranje i povezani izvori ne dokazuju čujnost: prvo potvrditi da se nameravani izvor stvarno čuje u igri, pa ocenjivati udaljenost, smer, petlju i performanse. Ne pretvarati nekadašnju grešku ili pripremljen slučaj u tvrdnju da problem danas postoji ili da je danas rešen.
