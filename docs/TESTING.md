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

Saborci u Crvenom krstu (2026-11-25). [Test nivoa](../tests/unit/fpsCamp.test.js) proverava različite košulje i visine, izbor dva stvarna čučeća mirovanja sa različitim fazama/tempom, pomeranje šaka i praćenje kroz sudare lavirinta. Izvedene poze iz hoda i stojećih mirovanja su uklonjene. Čučeći hod je lokalna kopija sa zajedničkim horizontalnim početkom, bez promene izvornog FBX-a ili keša. Na sva tri stvarna modela test uzorkuje više od 20 petlji hoda: koren ostaje unutar 1 cm od mirovanja; zatim proverava povratak u izabrani idle. Novi klipovi su stvarno učitani, a snimljeni i obrnuti prelaz podižu/spuštaju stvarnu kost glave za više od 20 cm.

[Provere ponašanja](../tests/unit/campCompanions.test.js) pokrivaju promenu mirovanja bez naglog okretanja tela, zastajanje tokom ustajanja/spuštanja, promenu smera prelaza bez skoka napretka, odloženi udarac do završetka ustajanja, sudarnu visinu i nepomičan oslonac nogu, prekid prelaza smrću, osmatranje u zaklonu tokom zatišja i prekid pri nastavku vatre, povlačenje i nastavak praćenja. Okretanje je lokalno ograničeno na 270°/s, najkraćim putem: testovi porede 30 i 120 FPS, prelaz preko ±π i potvrđuju da se saborac prvo okrene pa udari stražara iza sebe i stvarno nanese štetu. Na oštrom uglu zastane dok odstupanje ne padne ispod 0,3 rad; udarac počinje ispod 0,1 rad. Test sa stvarnim sudarima lavirinta potvrđuje dolazak sva tri saborca na odvojena mesta uz vođu i međusobni razmak. Stražari mogu da gađaju i ubiju saborca. Svih **25 testova** iz `fpsCamp` i `campCompanions` i ciljani ESLint prolaze. Pregledač nije pokretan: hvat cevi, kontakt deformisanih stopala, položaj osmatranja prema stvarnoj ivici zaklona i prirodnost obrnutog prelaza ostaju vizuelno neprovereni.

Razmak grupe: novi scenariji simuliraju tri logoraša sa stvarnim telima `Prisoner`, vođu koji hoda/skreće/staje i provere razmaka tokom svakog kadra, obilazak mirujućeg saborca, čekanje u tesnom prolazu i nastavak kada se put oslobodi. Promena samo igračevog pogleda ne rotira raspored grupe. Cela putanja obilaska proverava se prema drugim ljudima, ne samo njene krajnje tačke; aktivni obilazak ponovo se proverava ako neko uđe u put, a promena cilja/izbor zaklona odbacuju stari obilazak. [Navigacija](../scenes/fps-base/CampNavigation.js) proverava izvor na Y=0,75, koji logorske query funkcije spuštaju za 0,65 m na visinu stopala čučećeg čoveka, umesto više tačke na Y=0,9. Integracioni test traži stvarna mesta u formaciji, umesto samo dolaska unutar radijusa oko vođe. To ne potvrđuje ponašanje pod vatrom sa pokretnim vođom u svim rasporedima.

Sustizanje tokom sprinta: otvorena simulacija sva tri logoraša sa izvornim različitim brzinama hoda i prelazom stava od 1,567 s traje 60 s; vođa prvih 45 s sprinta 4 m/s, zatim staje. Svaki saborac smanji razmak tokom neprekinutog sprinta i ostaje uspravan pri praćenju; brzina nikad ne prelazi 4,6 m/s i razmak ljudi se proverava svakog kadra. Posle zaustavljanja svi zauzimaju svoja mesta, staju/čučnu i vraćaju početni množilac trčanja. Prekid praćenja bliskom borbom takođe vraća normalan množilac. Pokretna krajnja tačka putanje i kratak pogled unapred sprečavaju zastajanje i čučanje čim se dostigne prethodni položaj vođe. Test sa stvarnim FBX-om potvrđuje da tempo `Running` prati brzinu uz granice 0,85–1,15. Svih **27 ciljanih testova** (`fpsCamp`, `campCompanions`) i ciljani ESLint prolaze; ovo ne potvrđuje vizuelni izgled tempa niti sprint pod vatrom kroz svaki raspored logora. Browser nije pokretan.

The Germans Advance (2026-11-25): ciljane provere su `advanceArt`, `advancePromo`, `catalogCoverage` i ESLint promenjenih JS fajlova. [Provere arta](../tests/unit/advanceArt.test.js) potvrđuju da svi akteri potiču od precrtanih osnova, a originalne sličice služe kao reference; proverava se zajedničko mapiranje. Stil, paleta i proporcije originala su obavezan uslov, ne dozvola za realističniju ilustraciju. Hod, trzaj, gusenice, posada i podoficirov znak animiraju precrtani art; tokom vožnje proverom je zaštićen nepokretni deo trupa, kupole i cevi. Provera podoficira potvrđuje zastajanje pri znaku i nastavak hoda bez klizanja.

Dorada rezolucije: svi atlasi imaju tačno dvostruke dimenzije kadrova, izvorne visine i sidrišta, uz iste mere u svetu i položaj posade; to štiti ciljana regresiona provera od ponovnog umanjivanja i četvorostruke razrade. Uvećani kontaktni pregled sada se crta direktno iz gušćih atlasa, umesto da uvećava mali pregled.

Razmaci u atlasima 2D tenkova: [provere prikaza tenkova](../tests/unit/vehicleArt.test.js), [Hummelovog pucanja](../tests/unit/preparedArtIntegration.test.js), [promo tenka](../tests/unit/advanceArt.test.js) i [olupina](../tests/unit/wreckArt.test.js) proveravaju isecanje kroz providan razmak od četiri piksela oko ćelije, vožnju u oba smera, prednju i zadnju kupolu i završni kadar. [Zajednički obračun ćelije](../core/actor/atlasFrame.js) čuva dimenzije crteža, oslonce i mere tela; zasebna slika oštećenja ili olupine ne nasleđuje razmak živog atlasa. Pri prepakivanju proveriti jednakost RGBA piksela svakog kadra i providnost celog razmaka. Browser prikaz proverava vlasnik.

Klizanje je sprečeno sabiranjem pomeranja samo u intervalima hoda: položaj je miran pri spuštanju na koleno i pucanju, a šest kadrova čučećeg hoda prati pređeni put pri polovini brzine. Katalog crta sve kadrove u oba smera sa istim sidrištem; posada prati sidrište kupole i pri ogledanju.

[Promo provere](../tests/unit/advancePromo.test.js) obuhvataju 18 s scene, prelaz od 1,2 s, logo 4 s i zatamnjenje od 0,8 s (24 s ukupno), kontinuitet kamere na 60 Hz, komande iscrtavanja loga, širok/uspravan ekran, pauzu i ponavljanje kroz crno. Provera stvarnog `drawBattle` na svakih 0,25 s između 8. i 18. sekunde potvrđuje tenk i najmanje dva pratioca u kadru, sa pešakom u srednjoj polovini, uz iscrtavanje daljih aktera pre bližih. Kolona ima tri grupe po tri pešadinca i tenk, sa četiri vrste pešadije. Vizuelno prihvatanje animacije ostaje vlasnikovo.

Agent nije pokretao pregledač. Canvas test beleži komande umesto rasterizacije; prelaze aktera, ceo pokret, trajanje i završni kadar u stvarnoj sceni i katalogu pregleda vlasnik. Vlasnik je prihvatio stil i tražio doradu u duploj rezoluciji; pregled dorađenog kvaliteta ostaje u [planu](PLAN.md#ig-33). Offline kadar i prolaz testova ne predstavljaju vlasnikovo prihvatanje dorade.

Art katalog (2026-11-24): `python -B scripts/build-art-catalog.py --check` proverava podudaranje stranica sa folderom `armies` i sve lokalne veze. [Ciljani DOM test](../tests/unit/artCatalog.test.js) potvrđuje originalne slike, izabrani folder, pretragu, prazne rezultate i vraćanje navigacije; izdvojeni `game-ready` nije u stablu. Posle premeštanja pripremljenog arta u `assets/images/game-ready` prolazi 17 ciljanih testova kataloga, razmera i vozila, provera projekta, lossless kopija i 40 paketa pripremljenog arta. Pri premeštanju potvrđeno je očuvanje bajtova slika. Pregledač nije pokretan.

Gašenje posle greške (2026-11-24): [regresione provere](../tests/unit/cleanup.test.js), sesija i postojeće 3D provere prolaze, ukupno 20 testova. Pokriveni su neispravan upravljač i akter, objedinjavanje grešaka, pražnjenje vlasničkih spiskova, nastavak gašenja sesije/UI-ja/ulaza i oslobađanje preostalih GPU resursa posle greške geometrije. Provera importa i putanja takođe prolazi; pregledač nije pokretan.

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

Ispravka osovina Ju 52: zapis u Blenderovim koordinatama čitan je kao glTF lokalni položaj, pa je propeler kružio oko pogrešne tačke. Dve nove provere u [testu modela](../tests/unit/ju52Art.test.js) reprodukovale su grešku pre ponovnog izvoza; prolaze posle pretvaranja osovine `[x, y, z] → [x, z, -y]`. Proveravaju položaj osovine unutar geometrije i centar stvarnih lopatica pri rotaciji; prethodna provera samo nepomičnog pivota nije dokazivala ispravnu osovinu.

Ju 52 za Drvar, 24. 11. 2026: prošlo 13 ciljanih testova (`ju52Art`, `transport`, `presentationScenes`, `catalogNavigation`), ciljani ESLint i provera projekta. [Stvarni GLB i kataloški akter](../tests/unit/ju52Art.test.js) proveravaju očuvanje trouglova/UV, 12 primitiva, tri nepomične osovine pri rotaciji lopatica, nezavisne instance, odsustvo drugih aktera u katalogu i dim. [Transport](../tests/unit/transport.test.js) proverava raspored iskakanja, mirovanje/let/desant i prekid desanta pri padu na teren. GPU izgled i igranje novog 3D prikaza ostaju za vlasnikov pregled; browser nije pokretan.

Razmera i sedam vozila za Do Trsta (2026-11-24): [provere razmere](../tests/unit/aircraftScale.test.js) potvrđuju native izvore za svih 13 avionskih izgleda, obe mere bočnih aviona i Sd.Kfz. 251, ose pogotka i očuvane brzine upravljanja, metaka, razmaka pušaka i petlje u pikselima. [Provere novih vozila](../tests/unit/roadVehicles.test.js) prolaze za oba smera, stvarnu štetu projektila, usklađenost nacrtanog otvora cevi sa metkom, mirovanje tokom pauze i završnu olupinu. [Patrolna plovila](../tests/unit/patrolBoat.test.js) čitaju izvornu razmeru 40 px/m i zadržavaju razmeru nivoa; [S-30](../tests/unit/sBoatArt.test.js) zadržava poravnate cevi tokom tonjenja. Ciljane provere frontalnih vojnika, tenkova, propelera, Visa i kataloga prolaze; prolazak celog Do Trsta potvrđuje pauzu, završetak, novu igru i postojeću pratnju.

Priprema `plan-ideas-art/prepare.py --check` potvrđuje 40 paketa bez upozorenja; provereni su importi, putanje resursa, manji lossless prikazi i obnovljen indeks arta. Pregledač, ručno igranje i vlasnikovo prihvatanje izgleda nisu izvršeni; prema DOCS to radi vlasnik. Test prolaska obnavlja zdravlje igrača i zato ne potvrđuje težinu nivoa sa novim vozilima.

Vlasnik je 2026-11-24 označio AR-P04 kao završen: pregled rasporeda rekvizita i preostalih ugrađenih ambijenata je zatvoren.

Vlasnikov pregled AR-P03 završen je 2026-11-24; za zastavnika su ostala stanja ocenjena kao dobra. Četiri prijavljene greške ispravljene su sledećim proverljivim promenama, bez upisivanja novog vlasnikovog vizuelnog prihvatanja.

Zastavnici i posade obe vojske: očišćen je izvorni alfa veo i obnovljene reference; [test prikaza](../tests/unit/reinforcementArt.test.js) potvrđuje jednaku vidljivu visinu i oslonac pre i tokom pogotka u oba smera, uz manje od 0,2 px odstupanja zbog razlomljene mreže. Bombaš: kratki trzaj tekuće poze zamenjuje atlas pogotka bez bombe; [test](../tests/unit/grenadierBlood.test.js) proverava isti izvorni kadar u mirovanju, pre i posle otpuštanja bombe u oba smera, a postojeće provere bacanja i krvi prolaze. Partizan otpozadi: [test kataloga](../tests/unit/catalogStories.test.js) potvrđuje bočnu grupu 40 px/m umesto frontalnih 100, uz isto telo od 1,8 m i nepromenjen prikaz u Neretvi. Pregledač nije pokretan; izgled proverava vlasnik.

Partizanski strelac — razmera pogotka: uklonjeni su samo pikseli sa alfom ispod 8/255, a dimenzije, mreža i ostali RGBA pikseli su očuvani. [Regresiona provera](../tests/unit/reinforcementArt.test.js) poredi stvarne pozive prikaza pre i tokom pogotka u oba smera: vidljiva visina i oslonac razlikuju se manje od 0,1 px, zbog izvorne razlomljene mreže. Pripreme pogotka i hodanja/padova proveravaju metapodatke; manje kopije moraju biti obnovljene posle čišćenja. Pregledač nije pokretan; vizuelno prihvatanje ostaje vlasnikovo.

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

[Provere zajedničke potere](../tests/unit/pursuitAI.test.js) pokrivaju odlazak do snimljenog viđenog položaja i pogled po okolini pri 30 i 120 FPS, bez ažuriranja skrivenim kretanjem mete ili pucanja tokom potrage. Poseban slučaj koristi drugu navigaciju na koordinatama van granica logora, bez logorskog upravljača. Stvarna logorska navigacija i fizičko telo proveravaju obilazak žičane prepreke do dometa uspešnog pogotka. Provereni su zadržavanje mete pri maloj promeni udaljenosti, prebacivanje na znatno bližu/novu vidljivu metu, smrt mete, izostanak potrage bez prethodnog opažanja, prekid nedostupne potrage i ponovno uočavanje bez ponavljanja prvog povika. Integraciona provera nivoa očekuje potragu posle gubitka pogleda i povratak borbi pri ponovnom uočavanju. Vizuelno ponašanje potrage u igri još nije provereno; browser nije pokretan.

Provere [borbe saboraca](../tests/unit/campCompanions.test.js) prate [odluku vlasnika](KONTEKST.md#escape-concentration-camp): vidljiv neprijatelj unutar 4 m pokreće juriš, a započeti prilaz traje do 6 m da malo povlačenje mete ne izazove odustajanje. Puškar i plamenobacač pod vatrom dobijaju stvarni udarac tek posle prilaska u domet cevi. Bliska pretnja ima prednost nad udaljenom vatrom, oslobađa rezervisani zaklon, a posle njene smrti ponovo se procenjuje udaljena paljba. Plamenobacač izvan bliske borbe i dalje izaziva traženje zaklona prema stvarnom dometu od 7 m, smeru i vidljivosti; nastavak napada zadržava saborca u zaklonu. Izvan dometa, iza prepreke ili pri napadu u drugom smeru nema lažne uzbune. Ciljane provere su `campCompanions` i `fpsCamp`, uz ESLint izmenjenih fajlova. Browser nije pokretan; bezbedan prilaz i povlačenje bez dostupnog zaklona ostaju otvoreni u CK-05.

Dev/produkcioni režim zaštite efekata (25. 11. 2026): postojećim `isDev` iz konfiguracije bira se politika. Testovi iz `optionalEffect`, `managedSound` i `characterModel` (**34**, svi prolaze) potvrđuju originalni sinhroni izuzetak na svakom pokušaju i identičan odbijeni Promise u dev režimu, bez console fallback-a i isključivanja. Produkcioni režim i dalje jednom beleži grešku, preskače problematičan efekat i nastavlja rad. Čisti runtime prima režim kao zavisnost, a IO adapter uvozi konfiguraciju; ciljani ESLint proverava i smer zavisnosti. Postojeća vrednost konfiguracije `isDev = false` nije menjana.

Zaštita opcionog zvuka i efekata (25. 11. 2026): prošle su **82 ciljane provere** iz `optionalEffect`, `managedSound`, `sound`, `spatialAudio`, `characterModel`, `fpsCamp` i `campCompanions`, uz čist ciljani ESLint. Namerno neispravan prostorni izvor vraća neuspeh uz jednu poruku u konzoli, dok drugi zvuk normalno svira. Pokriveni su neispravno vezivanje izvora, direktno emitovanje, audio ažuriranje i odbijen Promise. Pri istovremenom kvaru zvuka pucnja i čestica dva stvarna napada i dalje nanose štetu, sledeći objekat dobija oba ažuriranja, a svaki pokvareni efekat prijavljuje se samo jednom. Poseban test potvrđuje da greška simulacije i dalje propagira. Nije uvedeno globalno prećutkivanje izuzetaka. Browser nije pokretan.

Ista ciljana provera otkrila je zastoj uz zaobljeni deo džakova koji je širi iznad donjeg zraka. [Navigacija](../scenes/fps-base/CampNavigation.js) sada proverava donji nivo, sve tri stvarne visine stojećih saboraca iz opisa izgleda i trenutnu visinu objekta koji se kreće. Regresija proverava konkretan prolaz pored džakova, a integracioni test ponovo potvrđuje dolazak grupe kroz stvarne kolizije. Ovaj problem prohodnosti je ispravljen u upitu putanje, ne prikriven zaštitom efekata.

Pucanje sa aktivnim zvukom (25. 11. 2026): ponovljena je greška `TypeError: Audio coordinates need finite world positions`. `CampWeapons` je zvuku davao `player.position`, koji fizičko telo igrača nema; izvor je ispravljen na stvarnu svetsku tačku `player.eye`. Novi test koristi pravi `SceneAudio` i postojeći testni Web Audio backend, aktivira zvuk i proverava glas puške, rafala i plamena pre i posle kretanja/čučnja. Samo test sa nevezanim/neaktivnim zvukom ne može otkriti ovu grešku. Integracioni test dodatno pokreće pucanj preko stvarnog ulaza i celog `World.update` ciklusa, uključujući efekte pogotka. Svih **39 ciljanih testova** iz `fpsCamp`, `campCompanions` i `characterModel` prolazi, kao i ciljani ESLint; browser nije pokretan.

Nove korisnikove Mixamo animacije iz Downloads, 25. 11. 2026, preuzete bez izmene i povezane u nivou. Sve tri imaju po 53 kanala, bez nepostojećih kostiju na stvarnom radniku. SHA-256 se odnosi na izvornu kopiju; priprema se izvršava na lokalnim kopijama klipova u memoriji.

| Resurs | Izvorno trajanje | Bajtovi | SHA-256 |
|---|---|---|---|
| [Crouch Idle](../assets/models/character/soldier/Crouch%20Idle.fbx) | 1,667 s | 424032 | `b21bfd22fff3b1d49701c22606c079551b9cb16f1b2298e9c0f2f9e6294aec4d` |
| [Crouch Look Around Corner](../assets/models/character/soldier/Crouch%20Look%20Around%20Corner.fbx) | 3 s | 563344 | `cf2b9e07a1d1215c4806b83a4930679d1f0ba4ccba47d78e215a730809b42579` |
| [Crouch To Stand](../assets/models/character/soldier/Crouch%20To%20Stand.fbx) | 3,333 s | 528432 | `aee873c8c72bca684839bd6d6303f7f23682b40a3ecfe3297ee8f6f77eb6a4c3` |

Ustajanje koristi frejmove 24–71 pri 30 fps (oko 1,567 s), bez početnog/završnog čekanja i horizontalnog putovanja korena od približno 30 cm. Spuštanje je taj isti pripremljeni snimak unazad; nije preuzet poseban klip. Prelaz vodi controller, model prati istu vremensku poziciju, telo postepeno menja visinu. Saborac ne počinje trk/udarac dok ne ustane, a odvojeni pragovi sustizanja sprečavaju stalno menjanje stava na jednoj udaljenosti. Corner klip zadržava svoj mali snimljeni nagib/pomeranje, ali ima zajednički početni oslonac; koristi se samo tokom zatišja u zaklonu. Kataloški pregled ovih radnji još nije povezan.

Prijem [Crouching Idle](../assets/models/character/soldier/Crouching%20Idle.fbx), 25. 11. 2026: korisnikov fajl iz Downloads kopiran je bez izmene (515.824 bajta; SHA-256 `ff12ce52fc83078ca0b21906d6d81980f0116b5d77d9feacaeebfb714063ae0c`). Stvarni FBX ima klip od 2,5 s i 53 kanala; nijedna ciljana kost ne nedostaje na `resistance-fighter`. AnimationMixer na stvarnom radniku potvrđuje promenu položaja šake. Raspon korena po X/Y/Z je 0,415/0,352/0,663 FBX jedinica (oko 3,0/2,5/4,8 mm pri razmeri radnika 0,0072). To nije dokaz hvata cevi, oslonca ili prirodnog spoja petlje. Izvorni model pri parsiranju daje postojeća upozorenja o više od četiri skinning težine. Animacija je povezana sa svom trojicom saboraca u nivou; prikaz te radnje u katalogu još nije povezan, browser nije pokretan.

Priprema za [IG-29](PLAN.md#ig-29), 24. 11. 2026: kratka Node provera nad stvarnim `Maze` i `truePrims`, bez modela i browsera, prošla je kroz 32 generisanja. Svaki put dobijeno je 17×17 pločica, 161 puna i 128 prohodnih; svih 128 je povezano sa početkom, uključujući izlaz. Potvrđene su koordinate početka (−35, −35) i izlaza (35, 40). Ovo je polazna prohodnost, ne provera buduće geometrije, zaklona, osvetljenja ili konačnog izgleda.

Tri [likovne reference](references/ww2-yu/crveni-krst/README.md) su preuzete i vizuelno pregledane; poreklo, ograničenja i hashovi su u manifestu. Nivo i akteri nisu menjani u ovoj pripremi; postojeće lokalne izmene scene pripadaju ranijem radu. Velika testna serija i browser nisu pokretani.

Prvi [paket modela](../assets/models/building/crveni-krst/README.md), 24. 11. 2026: prošlo 14 ciljanih testova u `crveniKrstArt`, `catalogStories`, `catalogCoverage` i `catalogNavigation`; ciljani ESLint prolazi. [Test arta](../tests/unit/crveniKrstArt.test.js) parsira svih sedam stvarnih GLB fajlova, proverava geometriju, normale, UV, dodeljen atlas, oslonac i skalu, raycast između niti žice i kroz puni zaklon, otvaranje kapije, nezavisnost kloniranih reflektora i svih osam stavki kataloga. GLTFLoader u Node okruženju koristi zamenske teksture, pa ovo ne potvrđuje GPU rasterizaciju; odsustvo teksture ne sme proći samo kao upozorenje, zato test izričito zahteva dodeljenu mapu. Kloniranom spotu vezati `.target` za dete iste instance; zasebno klonirani cilj ne prati automatski rotaciju svetiljke.

Dva mala offline EEVEE rendera (960×640, po 24 uzorka) su napravljena lokalnim Blenderom 4.5.3 i vizuelno pregledana: ceo paket i pogled sa visine 1,78 m. Generisana studija ostaje likovni cilj; renderi prikazuju originalne modele uz podlogu i svetlo za pregled, bez tvrdnje da su screenshot igre. Paket koriste katalog i nivo; browser i puna testna serija nisu pokretani.

Povezivanje nivoa, 24. 11. 2026: prošlo je 36 ciljanih testova (`fpsCamp`, `crveniKrstArt`, `logic`, `characterModel`), uz čist ciljani ESLint. [Test nivoa](../tests/unit/fpsCamp.test.js) proverava 32 povezana rasporeda oko izdvojenog objekta, sve veze/pregrade jednog stvarnog sklopa, pogled i metke kroz žicu, pune zaklone, blokadu nogu pri skoku i naknadno dodate rekvizite. Učitavanje prave scene sa stvarnim FBX/GLB/OBJ fajlovima i zamenskim teksturama potvrđuje deset živih neprijatelja, dve prve pomoći, pobedu samo po starom pragu udaljenosti i čist novi ulazak. Tri vidljiva instancirana sklopa za žicu/stubove i jedan nevidljivi kolizioni oslobađaju instance bafere jednom; materijale i svetla oslobađa scena. Za instancirane tanke delove lokalno je isključena kontura, bez promene kataloških materijala. Puni zakloni koriste obične mesh-eve kako postojeći tragovi pogodaka ne bi završavali na koordinatama pogrešne instance.

Nema potvrde stvarnog FPS-a, WebGL izgleda, čitljivosti pri kretanju ili osvetljenja u browseru; njega pokreće vlasnik.

Kritički pregled celog nivoa, 25. 11. 2026: [nalazi i plan IG-29](PLAN.md#ig-29) razdvajaju potvrđene uzroke od neproverenog izgleda. Pregledani su kod, stvarni FBX klipovi i postojeći offline prikazi paketa; stara slika kartice nije dokaz trenutnog nivoa. Parsiranje `Crouched Walking` na pripremljenom radniku daje pomeranje korena oko 1,495 m za petlju od 1,033 s, a poze na .12/.42/.75 imaju pomeraje oko 0,166/0,650/1,128 m prema početku, pre dodatne razmere pojedinačnih saboraca. Izvedeni idle iz `Warrior Idle` prenosi oko 1,96 cm vertikalnog raspona kukova uz nepomične rotacije nogu. Provera pokretne šake ne pokriva položaj modela prema telu i oslonac stopala; za koren meriti ceo opseg unutar petlje, jer jednak početak/kraj može prikriti pomeranje i reset. Validator plana proverio je svih sedam novih koraka, reference, pokrivenost rasporeda i zbir 4,5 / 10 / 16,5 p; postojeća IG-29 sekcija izdvojena je u memoriji, bez novih pratećih fajlova. Proverene su lokalne putanje, sidra i redni brojevi glavne tabele.

Kratke Node reprodukcije potvrđuju sprint igrača 4 m/s naspram 3/3,24/3,48 m/s kod saboraca, okret od π rad u jednom kadru i odsustvo stanja zaklona pri vidljivoj aktivnoj pretnji dometa 7 m, dok ga ista pretnja dometa 10 m pokreće. Prošlo je svih **16 testova** iz `fpsCamp`, `campCompanions` i `crveniKrstArt` komandom `node --disable-warning=ExperimentalWarning --import ./tests/unit/setup/register.js --test --test-reporter=dot tests/unit/fpsCamp.test.js tests/unit/campCompanions.test.js tests/unit/crveniKrstArt.test.js`. Postojeći test praćenja koristi zaustavljenog vođu posle teleportovanja i isključene neprijatelje; zato ne dokazuje sustizanje pokretnog igrača i ponašanje pod vatrom u stvarnom lavirintu. Pregled nije menjao igru; browser, GPU/FPS i vizuelni prolaz od početka do kraja nisu pokretani.

## Optimizacija resursa kataloga

Pregledano je 45 različitih baznih putanja modela; 43 FBX/GLB modela su parsirana, a dva spoljašnja glTF-a popisana bez analize geometrije. Pored partizana, još dva modela dobijaju manje grupa: MG-42 68→11, puška 5→2. To su grupe materijala sa jednim implicitnim prolazom za mesh bez grupa, ne izmereni WebGL pozivi; izvorni fajlovi nisu smanjivani. [Test stvarnih modela](../tests/unit/catalogResources.test.js) potvrđuje iste trouglove, njihove materijale i redosled temena, sve atribute i iste skelete.

WebP kao jedini original (2026-11-25): svih 196 PNG slika u game-ready zamenjeno je lossless WebP-om, 49→34 MB. Pre brisanja svakog PNG-a dekodirani RGBA pikseli i dimenzije upoređeni su sa WebP-om i bili su isti. Pregledač nije pokretan.

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

## Crveni krst — preuzeti džakovi

Provereno 2026-11-25: ciljani testovi `fpsCamp` i `catalogCoverage` prolaze (4/4), kao i ESLint promenjenih JS fajlova. Stvarni GLB se učitava u sklop logora; nove provere potvrđuju blokiranje hoda, pogleda i pogodaka u visini zaklona i slobodan pogled preko njega na 1,8 m. Postojeće provere potvrđuju nepromenjene veze lavirinta, otvoren izlaz, ponovno pokretanje i pobedu bez ubijanja stražara. Pregledač i igranje nisu pokretani. Izvorni art i ograničenja porekla su uz [model](../assets/models/props/sandbags/README.md).

## Bf 109 — zamena 3D modela

Provereno 2026-11-25: `bf109Art`, `warplane` i `catalogNavigation` prolaze 18/18. Stvarni GLB se parsira projektnim Three.js loaderom uz zamenu samo dekodiranja slika u testu; provereni su 1.981 trougao, ugrađene teksture, UV atributi, raspon od 9,92 m i osovina propelera na nosu prema −Z. Obe fabrike prikaza koriste novi model i nezavisno okreću njegov propeler; pripremljeni keš i druga instanca ostaju mirni. Provereni su usklađen smer sa telom, nagib, obaranje i očuvano povezivanje zasebnog propelera drugih aviona. ESLint promenjenih JS fajlova prolazi. Pregledan je offline render; pregledač i igranje nisu pokretani.

## Renault FT — tekstura

Provereno 2026-11-25: [offline priprema](../assets/models/tank/renault-ft/preview.py) ponovo uvozi izvezeni FBX i potvrđuje 712 temena, 432 poligona i očuvane svetske koordinate unutar 0,01 mm. Ciljano parsiranje izvornog i runtime FBX-a projektnim Three.js loaderom potvrđuje iste granice unutar 0,01 mm, 864 trougla, UV atribut i odsustvo ugrađenih zahteva za teksture. Lossless WebP je sačuvan bez promene dimenzija; hashovi su u manifestu uz model. Pregledani su offline kadrovi spreda i otpozadi; pregledač i igranje nisu pokretani.
