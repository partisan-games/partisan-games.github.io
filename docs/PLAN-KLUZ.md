# Franjo Kluz: od jedne mete do misija nad Kozarom

Igra postaje let sa misijom: bombardovanje i mitraljiranje istorijskih ciljeva i sletanje na aerodrom na kraju puta, u više nivoa.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Korak | Rezultat | Status |
|---|---|---|---|---|
| 1 | [FK-01](#fk-01) | Protivnici na Kozari 1942 | Kratko u ISTORIJA: ko su protivnici i koji crtež im odgovara | ✅ Done |
| 2 | [FK-02](#fk-02) | Kamera i svet | Avion leti kroz svet sa stalnim mestima; kamera ga prati | ✅ Done |
| 3 | [FK-03](#fk-03) | Sletanje na aerodrom | Pobeda samo na pisti; drugde je pad, a promašena pista gubi nivo | ✅ Done |
| 4 | [FK-04](#fk-04) | Bombe | Bomba pada po putanji; rakete i automatsko nišanjenje nestaju | ✅ Done |
| 5 | [FK-05](#fk-05) | Prednji mitraljez | Rafal za meke ciljeve | ✅ Done |
| 6 | [FK-06](#fk-06) | Municija | Ograničeni metci i bombe u HUD-u | ✅ Done |
| 7 | [FK-07](#fk-07) | Ciljevi na zemlji i PVO | Kolona i protivavionska vatra iz FK-01 umesto Hummela | ✅ Done<br>Provera u igri: [FK-12](#fk-12) |
| 8 | [FK-08](#fk-08) | Neprijatelji u vazduhu | Lovci napadaju avion; prednji mitraljez i osmatrač pozadi ih gađaju | ✅ Done<br>Provera u igri: [FK-12](#fk-12) |
| 9 | [FK-09](#fk-09) | Misije redom | Prva misija se završava sletanjem, druga počinje poletanjem sa tog aerodroma | ✅ Done<br>Provera u igri: [FK-12](#fk-12) |
| 10 | [FK-10](#fk-10) | Druga misija: borbeni let | Poletanje, napad na kolone i sletanje | ✅ Done<br>Provera u igri: [FK-12](#fk-12) |
| 11 | [FK-11](#fk-11) | Treći nivo: odbrana baze | Napad nemačke avijacije na bazu, jul 1942 | 🔄 In progress<br>Napravljen; tekstovi odobreni. Čeka vlasnikovu partiju |
| 12 | [FK-13](#fk-13) | Produkcijski art neprijatelja | Precrtani neprijatelji sa sprite animacijama i pokretnom cevi PVO | 🔄 In progress<br>Codex: art i ugradnja pripremljeni; čekaju ciljane provere i odobrenje u igri |
| 13 | [FK-12](#fk-12) | Provere i pregled | Testovi, smoke, dokumentacija, vlasnikova partija | 🔄 In progress<br>Waiting: vlasnikova kontrolna lista |

## Obim

- **U obimu:** samo Franjo Kluz (`scenes/franjo-kluz/`), njeni testovi, art i zvuci, i istorijske beleške u [ISTORIJA](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz).
- **Zajednički kod:** avion je sada `Potez` u sceni, a core `PlayerPlane` je obrisan (FK-02; smoke u FK-12).
- **Van obima:** naslov kartice na naslovnoj, 3D igre, novi zajednički sistem nivoa za druge igre, mobilne kontrole osim onih koje [Controls](../ui/Controls.js) već daje.

## Kako se čita

- **Izvršilac:** Claude, redom, jedan korak po nalogu; posle koraka čeka „dalje”. FK-13 (art i ugradnju) radi Codex.
- **Gotovo:** kad prođu provere iz „Gotovo kada”. Vlasnikovo izričito odobrenje je uslov za FK-01 (izbor protivnika), za svaki nov art, zvuk i UI element (HUD) i za FK-12. Placeholder nije art ([pravilo](DOCS.md#pravilo-za-umetnost)); nov snimak ulazi tek kad ga vlasnik izabere.
- **Procena:** 1 p je jedan idealan radni dan; min / verovatno / max.
- **Uslovno:** FK-11 je opcion; radi se kasnije, samo ako ga vlasnik zatraži.
- **Provere:** testovi i izvršne provere pokreću se uz vlasnikovu dozvolu ([statusi](DOCS.md#statusi-u-planovima-postupne-izrade-igara)); browser samo za snimke, jedan Chrome; smoke samo uz posebno odobrenje.
- **UI:** za HUD i nove tekstove prvo se pokazuje konkretan predlog; do odobrenja se radi samo logika ([pravilo](DOCS.md#odobravanje-ui-elemenata)).

## Osnova

Provereno na `a2ad3198` uz lokalne izmene FK-02.

- Posle FK-02 avion ([Potez](../scenes/franjo-kluz/Potez.js)) leti kroz svet brzinom `airspeed` ([Potez:19](../scenes/franjo-kluz/Potez.js#L19)), kamera ide tom brzinom i diže se sa avionom, a levo i desno pomeraju avion i po ekranu, kao ranije ([Main:53-56](../scenes/franjo-kluz/Main.js#L53-L56)). Objekti u svetu ocenjuju vidljivost po kameri ([view.js](../core/actor/worldView.js)); pozadina su slojevi paralakse ([ParallaxLayer](../scenes/franjo-kluz/ParallaxLayer.js)).
- Avion leti samo udesno; okreta nema po vlasnikovoj odluci: ko promaši aerodrom, gubi nivo. Partizanski aerodrom stoji na x 24 000 (oko 75 s leta pri brzini poletanja), a pista je 2000 px asfalta iza zgrade ([Airfield](../scenes/franjo-kluz/Airfield.js)).
- Oružje: posle FK-04 avion nosi 4 bombe na Enter ([Bomb](../core/actor/projectiles/Bomb.js), [Potez dropBomb](../scenes/franjo-kluz/Potez.js)); Space puca iz prednjeg mitraljeza (FK-05, [Bullet](../core/actor/projectiles/Bullet.js)). Protivnici su posle FK-07 mete na zemlji i PVO na stalnim mestima ([enemies.js](../scenes/franjo-kluz/enemies.js)).
- Kamera sa ličnim rendererom već postoji u Čamcu ([camac/Main:77-85](../scenes/camac/Main.js#L77-L85)); [Scene2D](../core/Scene2D.js) iz `cameraX/cameraY` daje zvuku vidljivi prozor.
- Istorija: rakete i Hummel ne pripadaju 1942; Potez 25 je imao mitraljeze i bombe ([ISTORIJA](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz)).
- Postojeći art koji je kandidat, a ne potvrda: `armies/ndh/kamioni/opel-blitz-*.png`, `armies/ndh/tenkovi/`, `armies/nemci/pvo/`, `armies/nemci/avioni/` (Bf 109, Ju 87, Storch), `items/bomba.png`; zvuk `aircraft-gun.mp3`.

## Pretpostavke

- Potez 25 nosi jedan prednji mitraljez, dvojni mitraljez osmatrača pozadi i bombe pod krilima (opšti podatak o tipu, ne proverava se detaljno).
- Kluzov let 23. maja bio je bez borbe; prvi nivo je izbegavanje vatre i sletanje, ne napad (izbor igre).
- 30 fps kao u svim 2D igrama osim Visa ([constants](../core/constants.js)).

## Koraci

<a id="fk-01"></a>
### FK-01 · Protivnici na Kozari 1942 · 0.25 / 0.25 / 0.5 p · Claude

- **Šta:** osnovno, bez detaljnog istraživanja: u [ISTORIJA](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz) dopisati u nekoliko redova ko su protivnici oko Kozare 1942 (Nemci, snage NDH) i koja vozila, PVO i avioni iz `assets/images/armies/` im okvirno odgovaraju; jedan opšti izvor je dovoljan.
- **Gotovo kada:** kratka lista je u ISTORIJA; vlasnik je izabrao protivnike za FK-07, a FK-08 i FK-11 ostavio kao opcione za kasnije.

<a id="fk-02"></a>
### FK-02 · Kamera i svet · 1 / 1.5 / 2.5 p · Claude

- **Šta:** nova klasa `scenes/franjo-kluz/Potez.js` (iz PlayerPlane) ima svetske koordinate i brzinu: gas menja brzinu (osnovna 312 plus do 600 kao ranije, [Main:24-25](../scenes/franjo-kluz/Main.js#L24-L25)), gore/dole visinu do 5555. Scena drži `cameraX/cameraY` koji prate avion; pozadina se crta po slojevima sa faktorom paralakse (oblaci, šuma, žbunje kao sada, [Main:18-21](../scenes/franjo-kluz/Main.js#L18-L21)), a nebo po visini kamere. Partizanski aerodrom je objekat na stalnoj svetskoj tački, ne `Recurring`. Brišu se `ubrzavaOstale`, `dizePredmete`, `zaustaviParalax`, `audioWorldOffset`. Core `PlayerPlane` i njegovi testovi ([game2d.test:112](../tests/unit/game2d.test.js#L112), [migration2d.test:9](../tests/unit/migration2d.test.js#L9)) prelaze na `Potez`; core fajl se briše. U ovom koraku oružje i Hummel ostaju kakvi su.
- **Reference:** kamera i renderer u [camac/Main:60-85](../scenes/camac/Main.js#L60-L85); vidljivost zvuka iz [Scene2D:11-20](../core/Scene2D.js#L11-L20).
- **Gotovo kada:** unit testovi: pozicija aviona raste sa brzinom × dt nezavisno od dužine frejma; kamera drži avion u kadru; aerodrom ostaje na istoj svetskoj tački posle 60 s leta; nivelisanje iz postojećeg testa prolazi za `Potez`. Snimak: let napred i nazad pored aerodroma. Ceo unit skup i lint prolaze.
- **Zamke:** brisanje core fajla je izmena u `core/`, pa traži smoke (FK-12). `isGrounded` meri tlo u ekranu (`groundLevel = canvas2d.height`, [Main:12](../scenes/franjo-kluz/Main.js#L12)); prelazi u svetsko tlo. Smrt aviona sada spušta svet ([Main:104-106](../scenes/franjo-kluz/Main.js#L104-L106)); sa kamerom pada avion.

<a id="fk-03"></a>
### FK-03 · Sletanje na aerodrom · 0.5 / 0.75 / 1 p · Claude

- **Šta:** urađeno: asfaltna pista je 2000 px iza zgrade aerodroma ([Airfield](../scenes/franjo-kluz/Airfield.js)); dodir tla van piste, brže od 600 px/s ili spuštanje brže od 350 px/s razbija avion (vlasnik želi lako sletanje), prelet piste gubi nivo, a zaustavljanje na pisti je pobeda bez obzira na uništene neprijatelje (odluka vlasnika: cilj je uništiti što više i sleteti), sa ocenom „soft/hard landing” ([Main checkLanding](../scenes/franjo-kluz/Main.js)). Ruševina se ne vraća preko aerodroma. Pista je traka tamnog asfalta (`textures/terrain/asphalt.jpg`, kao na 3D aerodromu), pa se vidi gde se sleće. Vlasnik je probao sletanje i zatvorio korak bez zvuka točkova.
- **Gotovo kada:** unit testovi za sletanje na pisti, pad van piste, pad pri prevelikoj brzini, pobedu na pisti i prelet piste prolaze; [victory.spec](../tests/smoke/victory.spec.js) postavlja avion na pistu (smoke u FK-12).

<a id="fk-04"></a>
### FK-04 · Bombe · 0.75 / 1 / 1.5 p · Claude

- **Šta:** urađeno: 4 bombe po letu, jedna na pritisak Enter i najviše jedna u sekundi, ne sa tla; bomba pada sa 500 px/s² i uništava cilj čije telo dopire do 120 px od pada ([Bomb](../core/actor/projectiles/Bomb.js), [Potez blast](../scenes/franjo-kluz/Potez.js)); rakete aviona su obrisane, Hummel svoje zadržava do FK-07. Crtež je `items/bomba.png` (avionska bomba, kao u Visu), eksplozija je sprajt iz pada aviona, a zvuk pada `explosion.mp3`; zvuk puštanja i pada nema. Vlasnik je zatvorio korak. Plan: taster pušta bombu koja nasleđuje brzinu aviona i pada gravitacijom; na tlu eksplodira sa poluprečnikom štete. Broj bombi po letu bira se po igrivosti. Rakete i `shootAimed` (sadašnje V) se brišu iz igre i [kontrola](../scenes/franjo-kluz/Main.js#L33). Zvuk puštanja, pada i eksplozije bira vlasnik; `explosion.mp3` iz rakete je kandidat.
- **Reference:** balističko đule u [ustanak/Djule.js](../scenes/ustanak/Djule.js) (pad i eksplozija na tlu).
- **Gotovo kada:** unit testovi: putanja bombe zavisi od brzine aviona u trenutku puštanja; eksplozija oštećuje cilj u poluprečniku, a promašaj ne; ne može se pustiti više bombi nego što ih ima. Vlasnik je odobrio izgled bombe i eksplozije.
- **Zamke:** bez FK-02 avion nema stvarnu brzinu, zato je ovaj korak posle njega. `items/bomba.png` treba proveriti da li liči na avionsku bombu; ako ne, art se planira, ne crta se oblik.

<a id="fk-05"></a>
### FK-05 · Prednji mitraljez · 0.5 / 0.75 / 1 p · Claude

- **Šta:** urađeno: Space ispaljuje 10 metaka u sekundi brzinom 1000 px/s iz nosa, u pravcu nosa i sa brzinom aviona; oklopna meta izdrži više metaka, a bomba je uništava odmah (odluka vlasnika). Metak je `items/granata.gif`, kao u Visu. Plan: Space (već taster za pucanje) ispaljuje rafal u pravcu nosa aviona; pogađa pešadiju, kamione i lovca, a oklop teže. Zvuk `aircraft-gun.mp3` ako ga vlasnik odobri za ovu igru.
- **Gotovo kada:** unit testovi: brzina paljbe ne zavisi od frejmova, meci prate ugao aviona, tenk izdrži više metaka nego jednu bombu.
- **Zamke:** ESLint zabranjuje browser tajmere; hlađenje preko `Cooldown` i sata sesije kao kod sadašnjeg oružja ([Potez:34-37](../scenes/franjo-kluz/Potez.js#L34-L37)).

<a id="fk-06"></a>
### FK-06 · Municija · 0.25 / 0.25 / 0.5 p · Claude

- **Šta:** urađeno: mitraljez ima 200 metaka, a avion 4 bombe za ceo let; dopune nema (vlasnik je izbacio gorivo i usputno sletanje). HUD gore levo, kao u Visu: traka energije aviona (zajednička `progresBar`, odluka vlasnika), pa sličica metka iz igre (`items/granata.gif`) i broj metaka, ispod njih `💣` po bombi (odobrio vlasnik).
- **Gotovo kada:** unit testovi: municija se troši i staje na nuli; HUD pokazuje metke iznad bombi. Vlasnik je odobrio HUD.

<a id="fk-07"></a>
### FK-07 · Ciljevi na zemlji i PVO · 1 / 1.5 / 2 p · Claude

- **Šta:** urađeno: Hummel je obrisan; duž puta stoji 30 neprijatelja na stalnim mestima ([enemies.js](../scenes/franjo-kluz/enemies.js)): vojnici (padaju od jednog metka i nestaju), kamioni Opel Blitz, dva tenka (crtež Hummela, oko sekundu pogodaka; vlasnik želi tenk, ali ne kao obavezan cilj), dva oklopna voza BP-42 (izdrže dugi rafal) i 7 PVO Flak 38 ([Flak](../core/actor/artillery/Flak.js)) koje gađaju avion sa predviđanjem, granata se rasprsne posle izračunatog vremena, a blizu aviona oduzme petinu energije; vojnici pucaju puškom i pogodak skida 3 energije (odluka vlasnika); ispod pola zdravlja avion se dimi. Bomba uništava svaki cilj. Pobeda je sletanje bez obzira na broj uništenih (odluka vlasnika); uvod je kratak: „Destroy the enemy and land on the airfield!” (odobrio vlasnik). Plan: Hummel se briše; umesto njega ciljevi koje je vlasnik izabrao: nemačka pešadija, kolona kamiona (`ndh/kamioni/opel-blitz-*.png`) i oklopni voz (`nemci/vozovi/oklopni-vozovi/`), na stalnim svetskim mestima, više njih duž celog puta, ne jedan cilj (vlasnik želi više neprijatelja); glavna opasnost je laka PVO. PVO puca rafalom ili granatom koja se rasprsne kod aviona, sa svojim zvukom i dimom rasprskavanja; oštećenje aviona traje do pada, a oštećen avion se dimi. Kandidati za crtež PVO su u `armies/nemci/pvo/` (npr. `flak-m39.png`, `2cm-flak-madsten.png`).
- **Reference:** cilj i patrola iz [to-trieste/CombatTarget.js](../scenes/to-trieste/CombatTarget.js).
- **Gotovo kada:** unit testovi: PVO gađa samo avion u dometu i vidnom polju, pogodak smanjuje zdravlje aviona, uništen cilj ostaje uništen. Snimak napada na kolonu.
- **Zamke:** neprijateljska vatra ne sme početi pre starta ni posle kraja (proveriti `session.state`).

<a id="fk-08"></a>
### FK-08 · Neprijatelji u vazduhu · 1 / 1.5 / 2 p · Claude

- **Šta:** urađeno: 6 prolaza Bf 109 na stalnim mestima ([enemies.js](../scenes/franjo-kluz/enemies.js), [Fighter](../core/actor/aircraft/Fighter.js)): spreda lete 450 px/s nalevo, otpozadi sustižu avion za 150 px/s; prolaze 120 px iznad ili ispod aviona, pa ga ne udaraju (odluka vlasnika), i pucaju kad je avion ispred nosa i bliže od 700 px, a metak skida 5 energije, pa ceo nalet otpozadi uzme najviše oko pola; izdrže 2–4 metka, padaju goreći i eksplodiraju na tlu, gde uništavaju i pale sve u krugu bombe (odluka vlasnika); sudar sa avionom ruši oba. Dok se drži Space, osmatrač gađa lovca iza aviona (do 600 px, ±60°), bez brojanja metaka; sam ne puca (odluka vlasnika). Plan: vlasnik je zatražio neprijatelje u vazduhu. Nemački ili NDH lovci iz FK-01 (kandidati u `armies/nemci/avioni/`, npr. Bf 109) nailaze više puta tokom leta, spreda i otpozadi, i gađaju avion; prednji mitraljez ih obara, a osmatrač gađa unazad u ograničenom uglu.
- **Gotovo kada:** unit testovi: lovac gađa samo u dometu i posle starta, metak ga obara, ugao i domet zadnjeg strelca; vlasnik je odobrio crtež lovca i zvuk.
- **Zamke:** lovci su u svetskim koordinatama i brži od Poteza; ne smeju se pojaviti iza kraja nivoa ni posle ishoda.

<a id="fk-09"></a>
### FK-09 · Misije redom · 1 / 1.5 / 2 p · Claude

- **Šta:** urađeno: misije su podaci u [missions.js](../scenes/franjo-kluz/missions.js) i igraju se redom, bez ekrana izbora (odluka vlasnika). Prva misija je dosadašnji borbeni let i završava se sletanjem; druga počinje na pisti (poletanje strelicom gore), ima samo PVO i vojnike i aerodrom na x 16 000 (odluka vlasnika). Uvod prve misije je „Break through the enemy and join the partisans!” (Kluz prelazi iz NDH partizanima), druge „Destroy the enemy and land on the airfield!” (odobrio vlasnik). U prvoj misiji avion leti u oznakama NDH ([crtež](../assets/images/armies/ndh/avioni/potez-25.png)), pa ga protivnici do pola puta ne gađaju prvi; tada se diže uzbuna i svi pucaju (odluka vlasnika). Pre uzbune je avion pritajen: njegov hitac ili bomba uzbunjuju samo naoružane neprijatelje na ekranu, a oni koji uđu na ekran uzbunjuju se ako tamo neko već puca na avion, inače ćute (odluka vlasnika). Neprijatelji ne znaju za uzbunu: igra ih prebacuje u stanje `fire` (`soundAlarm` i `alertInView` u [Main](../scenes/franjo-kluz/Main.js)), a „borba na ekranu” znači da je neko na ekranu u stanju `fire`. Uzbunu prati sirena za vazdušni napad (`air-raid-siren.mp3`, jedan ciklus snimka koji je izabrao vlasnik, [izvor](../assets/sounds/SOURCES.md)). Sletanje u prvoj pokaže poruku „You joined the partisans! Your plane gets the red star.” (odobrio vlasnik) i posle 3 s pokrene startni ekran druge misije, bez novog novčića. Pobeda u igri je tek na poslednjoj misiji; nova igra uvek počinje prvom.
- **Gotovo kada:** unit testovi: druga misija počinje na pisti i poleće, sletanje na kraju prve vodi u drugu, samo poslednja misija je pobeda, nova igra počinje prvom. Vlasnik je odigrao obe misije.

<a id="fk-10"></a>
### FK-10 · Druga misija: borbeni let · 0.5 / 1 / 1.5 p · Claude

- **Šta:** urađeno uz FK-09: druga misija poleće sa partizanskog aerodroma, napada kamione, tenk i oklopni voz pod vatrom PVO i vojnika, bez lovaca, i sleće na aerodrom na x 16 000 ([missions.js](../scenes/franjo-kluz/missions.js)). Uništeni ciljevi nisu uslov za pobedu (odluka vlasnika).
- **Gotovo kada:** unit testovi iz FK-09 (poletanje, prelaz, pobeda samo na kraju) prolaze; vlasnik je odigrao misiju (kontrolna lista FK-12).

<a id="fk-11"></a>
### FK-11 · Treći nivo: odbrana baze · 0.75 / 1 / 1.5 p · Claude

- **Zadatak (odluka vlasnika):** omaž napadu na aerodrom u Lušci Palanci 6. jula 1942, ne istorijska simulacija: događaj daje povod, a igrivost odlučuje o detaljima. Potez stoji na pisti, sirena svira i on mora da poleti pre nego što ga Ju 87 unište na zemlji. Pobeda je kad obori ili otera sve napadače i ponovo sleti; poraz je pad Poteza, na zemlji ili u vazduhu.
- **Šta:**
  - treća misija u [missions.js](../scenes/franjo-kluz/missions.js): start na pisti kao druga misija, uzbuna od početka, talasi napadača;
  - napadači su lovac [Fighter](../core/actor/aircraft/Fighter.js) i novi blok Ju 87 [DiveBomber](../core/actor/aircraft/DiveBomber.js) (crtež iz Do Trsta), koji u stanju `fire` obrušava se na tačku i baca bombu; obojicu vodi [Gunner](../core/gameplay/controllers/Gunner.js), a Ju 87 cilja Potez samo dok je na zemlji;
  - pravila (talasi, „oteran” napadač koji izađe iz ekrana, pobeda posle poslednjeg talasa i sletanja) su u sceni, ne u blokovima.
- **Gotovo kada:** unit testovi misije (start na pisti, uzbuna, pobeda, poraz na zemlji) i bloka Ju 87 prolaze; vlasnik je odigrao nivo.

<a id="fk-13"></a>
### FK-13 · Produkcijski art neprijatelja · 2 / 3 / 5 p · Codex

- **Primopredaja arta (Codex, 2026-11-20):** izrađeno sedam PNG listova, ukupno 84 kadra i 21 animacija: dva vojnika (`idle/fire/death/rest/walk/fireUp`), dva Opel Blitz kamiona, Hummel i BP-42 (`idle/drive`), zaseban plamen pucnja (`fire`). Konačni fajlovi su u `game-ready/vojnici`, `kamioni`, `tenkovi`, `vozovi` i `efekti`. [Metapodaci](../assets/images/armies/sources/franjo-kluz/sprites.json) daju tačne putanje, veličine kadrova, redove, trajanja, smer i sidrišta; [animirani pregled](../assets/images/armies/sources/franjo-kluz/preview.html) ima izbor animacije i svetlu/tamnu podlogu. Svi listovi imaju četiri kolone kao gotovi borci iz Ustanka. Izvornici, konačni imagegen promptovi i dodatne ispravke su u [receptu](../assets/images/armies/sources/franjo-kluz/manifest.json), odvojeno od konačnog arta; [prepare.py](../assets/images/armies/sources/franjo-kluz/prepare.py) ponavlja mehaničko pakovanje uz Pillow.
- **Provereno na artu:** dekodiranje sedam PNG listova, svaki kadar neprazan, providni uglovi/rubovi, sadržaj unutar polja i različiti kadrovi svake animacije. Uočeni prelazi poza/dima preko granica ispravljeni su pre pakovanja; slabi alfa ostaci pozadine uklonjeni su u pripremi. Generisani su i GIF pregledi svih animacija. Ovo nije dokaz ponašanja u igri; projektni testovi i browser za novu integraciju još nisu pokrenuti.
- **Ugradnja:** [GroundTarget](../core/actor/GroundTarget.js) koristi postojeći `Sprite` uz četiri kolone, lokalno crtanje oko stalnog oslonca na tlu i stare sudarne dimenzije iz [enemies](../scenes/franjo-kluz/enemies.js). [Rifleman](../core/actor/soldiers/Rifleman.js) vezuje `fire` za stvarni hitac; `death` se odigra jednom i zadržava poslednji kadar čak i pri velikom dt ili kasnom učitavanju slike. Mirujuća vozila koriste `idle`, po uništenju zamrzavaju motor i nastavljaju postojeći požar; `drive` ne uvodi novo kretanje meta. [MuzzleFlash](../core/actor/effects/MuzzleFlash.js) prati PVO `muzzle` i ugao cevi, počinje stvarnim hicem i traje jedan ciklus. Runtime podaci [spriteArt](../core/actor/spriteArt.js) izvoze se iz istih metapodataka pri pripremi arta.
- **Kamera delova:** cev PVO i propeler koriste lokalni [WorldPart](../core/actor/WorldPart.js), koji vidljivost računa u odnosu na kameru. Obični GameObject2D ih je odbacivao po ekranskim granicama kada njihove svetske x koordinate pređu širinu platna. Cev se postavlja na svoje ležište i pri učitavanju roditelja, pre prvog gameplay koraka. Core i ponašanje drugih igara nisu menjani.
- **Preostale provere:** pripremljen [franjoKluzArt test](../tests/unit/franjoKluzArt.test.js) za dimenzije/sidrišta, ćelije/mirroring, pucanj i pad, kasno učitavanje, požar, plamen i vidljivost delova na udaljenoj kameri; prilagođena je stara provera vidljivosti palog vojnika u [franjoKluz testu](../tests/unit/franjoKluz.test.js). JS sintaksa novih/menjanih runtime modula i novog testa prolazi. Oba ciljana test-fajla, lint promenjenih JS modula i pregled u igri čekaju dozvolu/izvršavanje; raniji rezultati FK-12 ne predstavljaju prolaz ove nove integracije. FK-13 ostaje In progress do provera i vlasnikovog odobrenja u igri.
- **Pregled izvora:** nezavisan pregled konačne integracije obuhvatio je renderer, Sprite/World, učitavanje, stanja, ugovor dimenzija, podatke atlasa i nove testove, bez potvrđenih otvorenih grešaka. To ne zamenjuje neizvršene provere i vlasnikov pregled; [ograničenja dokaza](TESTING.md#franjo-kluz-sprite-integration-verification-limits).
- **Zahtev 2 (Codex, 2026-11-20): vojnici mirni i uzbunjeni · ✅ Done za art.** Vlasnik želi da vojnici dok su mirni patroliraju, stoje ili šetaju, bez nišanjenja, a čim su uzbunjeni (sirena ili napad aviona koji vide) odmah nišane i pucaju u avion iznad sebe. Za oba vojnika (`rifleman` i `assault`) dodati tri reda ispod postojeća tri, sa istom veličinom kadra 128 × 128, četiri kolone, istim sidrištem (64, 120), razmerom, smerom („right”) i stilom. Postojeći redovi i njihov redosled ostaju nepromenjeni.
- **Zahtev 3 (Codex) · 📋 TODO: pilot i mitraljezac u Potezu.** Vlasnik želi da se u kabini Poteza vide pilot i osmatrač-mitraljezac, u obe oznake (NDH i partizanske), a mitraljez osmatrača pozadi da se okreće kad puca unazad. Zahtev za Codexa još nije napisan; bez arta se ne ubacuje.
  - Red 3, `rest`, petlja 1,6 s: stoji opušteno, puška na ramenu ili o remenu, nije uperena. Kadrovi se razlikuju samo disanjem i okretanjem glave.
  - Red 4, `walk`, petlja 0,8 s: korak patrole u mestu, sa puškom kao u `rest`. Stopala su na liniji sidrišta, a kretanje po x daje igra.
  - Red 5, `fireUp`, jednom, 0,32 s: kao red `fire`, ali cev je podignuta oko 50° iznad horizontale, napred. Kadar 1 je nišanjenje i služi i kao držana poza između hitaca, kadar 2 plamen, kadar 3 dim, kadar 4 povratak. Kleči li vojnik u `idle`, kleči i ovde.
  - U `sprites.json` dodati animacije sa `name`, `row`, `frameCount`, `duration` i `loop`. Za `fireUp` dodati i `muzzle: {x, y}`, vrh cevi u pikselima kadra 1, da metak izlazi iz cevi.
  - Ponovo pokrenuti `prepare.py` da se obnove listovi, [spriteArt](../core/actor/spriteArt.js), GIF pregledi i [preview.html](../assets/images/armies/sources/franjo-kluz/preview.html).
  - **Urađeno 2026-11-20:** Codex je nacrtao redove `rest`, `walk` i `fireUp` za oba vojnika. Claude ih je ugradio kroz stanja vojnika `idle`, `patrol`, `fire` i `dead` na zajedničkoj [mašini stanja](../core/gameplay/StateMachine.js): miran vojnik naizmenično stoji i patrolira oko svog mesta, a uzbunjen staje, okreće se ka avionu i puca iz cevi, uvis kad je avion visoko, inače vodoravno ([Rifleman](../core/actor/soldiers/Rifleman.js), [test](../tests/unit/rifleman.test.js)).
  - **Predato za ugradnju:** oba lista su sada 512 × 768; nova tri reda, metapodaci, `muzzle`, generisani spriteArt i šest GIF pregleda su pripremljeni. Prvi kadar `fireUp` je čista nišanska poza bez plamena i dima, za držanje između hitaca; položaj vrha cevi čita se iz klipa, u koordinatama tog kadra. Pregled kreće mirnim stajanjem, a „Kadar 1” zadržava prvu pozu. HTML se ponovo izvozi iz [šablona](../assets/images/armies/sources/franjo-kluz/preview.template.html). Originalne reference i promptovi dopune sačuvani su u receptu pod `append`; originalni redovi provereni su po pikselima, ostali listovi ostali su nepromenjeni. [Obim provere](TESTING.md#franjo-kluz-sprite-integration-verification-limits); kod ponašanja igre nije menjan.
- **Zašto:** vlasnikova recenzija FK-07: sadašnji neprijatelji su prihvatljivi samo kao privremeni; sve je statično, a artiljerija ne pomera cev.
- **Šta:** precrtati postojeće crteže iz FK-07 (`nemci/vojnici/vojnik-01.png`, `juris-01.png`, `ndh/kamioni/opel-blitz-01/02.png`, `hummel.png`, `nemci/vozovi/oklopni-vozovi/bp42.png`, `nemci/pvo/flak38.png`) i lovca iz FK-08 (`nemci/avioni/Messerschmitt-Bf-109.png`, sa propelerom koji se okreće) u isti produkcijski stil, kao sprite listove: vojnici (stajanje, pucanje, pad), vozila (točkovi ili gusenice, dim izduva), PVO kao postolje i zasebna cev koja prati avion, uz plamen pucnja, i rasprskavanje granate kao crni oblak umesto vatrene eksplozije. Gotov art ide u `assets/images/armies/game-ready` po vrsti opreme ([pravilo](DOCS.md#pravilo-za-umetnost)); postojeći tamo (npr. `tenkovi/nemacki-tenk-cev.png` sa zasebnom cevi, `artiljerija/pak38-cev.png`) koristiti kao uzor stila.
- **Urađeno skriptom (Claude):** PVO je podeljena na postolje i cev ([flak38-postolje](../assets/images/armies/game-ready/artiljerija/flak38-postolje.png), [flak38-cev](../assets/images/armies/game-ready/artiljerija/flak38-cev.png)); cev se okreće ka tački nišana 1,5 rad/s, ne ispod horizonta, i puca tek kad nanišani. Bf 109 je podeljen na telo i propeler ([bf109-telo](../assets/images/armies/game-ready/avioni/bf109-telo.png), [bf109-propeler](../assets/images/armies/game-ready/avioni/bf109-propeler.png)) koji se okreće. Rasprskavanje PVO granate je postojeća eksplozija pretvorena u crni dim. Povezivanje novih listova i preostale provere opisani su iznad.
- **Ugradnja:** animacije preko `Sprite` kao [Explosion](../core/actor/effects/Explosion.js); cev PVO se okreće ka tački nišana iz [Flak.aim](../core/actor/artillery/Flak.js).
- **Gotovo kada:** vlasnik je odobrio svaki crtež i animaciju u igri; unit test da cev PVO prati avion; nijedan neprijatelj iz FK-07 nema statičan privremeni crtež.

<a id="fk-12"></a>
### FK-12 · Provere i pregled · 0.5 / 0.75 / 1 p · Claude

- **Šta:** ceo unit skup, lint i `npm run check`; smoke uz vlasnikovo odobrenje, jedan Chrome, zbog brisanja core `PlayerPlane` (FK-02). Ugovor sveta i kamere ove igre u [opis igre](KONTEKST.md); izvršene provere u [TESTING](TESTING.md); nove slike na naslovnoj za Franju Kluza.
- **Urađeno 2026-11-20:** unit (607), lint, `npm run check` i smoke u jednom Chrome-u: 167/171, a 4 pada su u Ustanku, čije fajlove ovaj plan ne menja ([TESTING](TESTING.md#franjo-kluz-checks--2026-11-20)).
- **Gotovo kada:** provere prolaze ili su pošteno navedene; vlasnik je prošao kontrolnu listu i rekao da li igra ostaje ovakva. Posle toga se plan briše, a pouke ostaju u dokumentaciji.
- **Kontrolna lista** (vlasnik igra na kraju; što se vidi samo u igri):
  - [ ] FK-07: napad na kolonu; zvuk pucnja PVO `cannon-shot.mp3`; crteži meta kao privremeni do FK-13.
  - [ ] FK-08: borba sa lovcima spreda i otpozadi, prolaz iznad ili ispod aviona, osmatrač puca unazad samo dok se drži Space; zvuk mitraljeza lovca `aircraft-gun.mp3`.
  - [ ] FK-09: obe misije redom; prelaz posle sletanja u prvoj i poletanje u drugoj.
  - [ ] FK-09: Potez u oznakama NDH u prvoj misiji; protivnici ćute do pola puta, pa sirena i uzbuna.
  - [ ] Mirni vojnici stoje i patroliraju; uzbunjeni pucaju uvis iz cevi na visok avion, a vodoravno na nizak.
  - [ ] Pre sirene napad uzbunjuje samo neprijatelje na ekranu; novi na ekranu pucaju ako vide borbu, a ćute ako je mirno.
  - [ ] FK-13: cev PVO prati avion, propeler lovca se okreće, crni oblak rasprskavanja.
  - [ ] Posle sirene vojnici se okreću ka avionu, i kad ih je preleteo.
  - [ ] Oboren lovac zadržava brzinu, nos mu sve strmije pada niz putanju, a propeler usporava i dokreće.
  - [ ] Ravnoteža borbe: energija aviona, šteta od vojnika, lovaca i PVO.

## Raspored

Jedan izvršilac. Ukupno **9.25 / 13.75 / 20.5 p** bez uslovnog koraka; uslovni FK-11 dodaje **0.75 / 1 / 1.5 p**. FK-01 je kratak i ide prvi jer od njega zavise ciljevi; FK-02 se radi dok vlasnik bira protivnike. [Raspored](plan-kluz.json).

**Kontrolne tačke**
1. **Posle FK-02:** let kroz svet sa stalnim aerodromom, stara igra i dalje radi.
2. **Posle FK-08:** let sa napadom na više ciljeva na zemlji, PVO i lovcima i sletanjem.
3. **Posle FK-10:** dve misije igrive od početka do kraja.

## Rizici

| Rizik | Posledica | Ublažavanje |
|---|---|---|
| Nema crteža za izabrana vozila | Nivo čeka art | Bira se cilj sa postojećim crtežom; nedostajući art ide u poseban plan |
| Prelazak na kameru menja osećaj leta | Igra deluje drugačije od sadašnje | Brzine i ubrzanja prenose se iz sadašnjih konstanti; vlasnik proba posle FK-02 |
| Brisanje core `PlayerPlane` | Neka igra koja ga uvozi pukne | Pretraga uvoza je prazna; smoke u FK-12 |
