# Plan ideja

Dogovoreno u [kontekstu igara](KONTEKST.md), a još neurađeno. Igra koja preraste u višednevni posao dobija svoj plan.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Igra | Posao | Ko | Status |
|---|---|---|---|---|---|
| 1 | [IG-01](#ig-01) | Neretva | Dva ekrana: prvo Nemci, pa četnici, svaki sa svojom pozadinom | Claude, Codex | 🔄 In progress<br>Kod gotov: Nemci prvih 60 s, pa četnici uz poruku; test u [migration2d](../tests/unit/migration2d.test.js). Čeka pozadine (Codex) i vlasnikovu partiju |
| 2 | [IG-02](#ig-02) | Tenkići | Više nivoa u različitim bitkama; redom početak Sremskog fronta, Batina, proboj Sremskog fronta | Claude, Codex | 🔄 In progress<br>Meč do dve pobede, najviše tri runde, kao u Ustanku; svaka runda na sledećem bojištu ([BattleBackground](../scenes/tenkici/BattleBackground.js)): Sremski front 1944, Batina, proboj 1945, pa grad, Bihać, Drvar, Užice. Čeka neprijateljske tenkove (Codex) i vlasnikovu partiju |
| 3 | [IG-03](#ig-03) | Vis | Tri etape: posle prve dve sletanje na aerodrom, posle treće na Vis | Claude | 🔄 In progress<br>Kod gotov: tri etape talasa, sirena i poruka posle prve dve; testovi u [vis.test.js](../tests/unit/vis.test.js). Čeka vlasnikovu partiju |
| 4 | [IG-04](#ig-04) | Do Trsta | Četiri etape: Lika, Senj, Rijeka, Trst | Claude, Codex | 🔄 In progress<br>Istorija etapa upisana; čeka pozadine etapa (Codex). Etape nemaju svoje tekstove (odluka vlasnika: tekst samo kad je potreban) |
| 5 | [IG-05](#ig-05) | Čamac | Tri etape: isplovljavanje sa Visa, desant na Šoltu, povratak pod napadom S-čamaca | Claude, Codex | 📋 TODO |
| 6 | [IG-06](#ig-06) | Tenkići, Ustanak | Igrač vidi mesto i godinu istorijskog bojišta | Claude | 📋 TODO<br>Čeka vlasnikovo odobrenje UI-ja |
| 7 | [IG-07](#ig-07) | Tenkići | Više vatre i dima na Sremu 1944 | Claude | ✅ Done<br>Tri žarišta na Sremu 1944 i tri na Sremu 1945; vlasnik pregledao |
| 8 | [IG-08](#ig-08) | Tenkići | Manji razoreni top na pozadini Srema 1945 | Codex, Claude | 📋 TODO |
| 9 | [IG-09](#ig-09) | Cannon | Top diže i spušta cev, bar malo | Claude | 📋 TODO |
| 10 | [IG-10](#ig-10) | Avatar | Kocke i novčići se nikada ne preklapaju, a svaki novčić može da se skupi | Claude | 📋 TODO |

Pravila rada: [DOCS](DOCS.md) i [CLAUDE.md](../.claude/CLAUDE.md). Nov art radi Codex po pravilima iz [ART](ART.md); placeholder nije art. Novi UI elementi i tekstovi traže vlasnikovo odobrenje. Agent ne pravi commit bez naloga.

<a id="ig-01"></a>
## IG-01 · Neretva: dva ekrana

- **Dogovor ([kontekst](KONTEKST.md#neretva)):** prvi ekran protiv Nemaca, drugi protiv četnika; pozadine vezane za izabrani položaj. Sada je jedan ekran na kome su Nemci i četnici izmešani u rovu ([Main](../scenes/neretva/Main.js)), na podlozi od suve trave.
- **Šta:** prvi ekran samo nemački vojnici, drugi samo četnici; posle prvog ekrana prelaz na drugi, a pobeda tek posle drugog. Bez ograničenja municije, kao sada.
- **Art (Codex):** po jedna pozadina za svaki ekran, u pogledu iz kog se igra (pravo u rovove; postojeća bočna pozadina Neretve iz ART-12 tom pogledu ne odgovara) i po pejzažu Neretve (kanjon, reka, srušeni most kod Jablanice), po pravilima iz [pravila pozadina](ART.md#pravila-pripreme-i-predaje-pozadina); likovi u rovovima već postoje.
- **Tekst prelaza (odobrio vlasnik):** „Chetniks are next”.
- **Gotovo kada:** unit test da prvi ekran ima samo Nemce, drugi samo četnike i da je pobeda tek posle drugog; vlasnik je odigrao oba ekrana.

<a id="ig-02"></a>
## IG-02 · Tenkići: više nivoa

- **Dogovor ([kontekst](KONTEKST.md#tenkići)):** svaki nivo je druga bitka sa svojim tenkovima i bojištem; Sremski front je ravnica sa rovovima.
- **Šta:** meč do dve pobede, najviše tri runde, kao u Ustanku (odluka vlasnika); svaka runda se bije na sledećem bojištu kroz pozadine iz [pravila pozadina](ART.md#pravila-pripreme-i-predaje-pozadina) (Sremski front, Batina i ostale; Sremski front se javlja dva puta, sa razlikom u stanju bojišta); grad ostaje jedno od bojišta.
- **Redosled (odluka vlasnika):** bojišta idu hronološki: početak Sremskog fronta (kraj oktobra 1944), Batina (novembar 1944), proboj Sremskog fronta (april 1945), pa ostala, a posle poslednjeg ispočetka. Beograd (oktobar 1944) je opcion i išao bi prvi, samo ako se ista pozadina ne koristi već u drugoj igri, da se ne ponavlja.
- **Tenkovi (odluka vlasnika):** igračev partizanski tenk je isti na svim nivoima; nivo menja bojište i neprijateljski tenk. Neprijateljski tenk svake bitke traži istorijsku proveru u [ISTORIJA](ISTORIJA.md) i nov art (Codex), sa ugradnjom kroz zajednički [Tenk](../scenes/tenkici/Tenk.js) i storybook priču; dok novog arta nema, nivo koristi postojeći nemački tenk.
- **Gotovo kada:** unit test rundi i smene bojišta; vlasnik je odigrao meč na novim bojištima.

<a id="ig-03"></a>
## IG-03 · Vis: tri etape

- **Dogovor ([kontekst](KONTEKST.md#vis)):** tri etape; posle prve dve sletanje na aerodrom, posle treće na Vis. Sada postoji jedna etapa sa talasima iz [levels.js](../scenes/vis/levels.js) i sletanjem na Vis na kraju.
- **Šta:** još dve etape talasa ispred postojeće, svaka završena sletanjem na aerodrom, kao Kluzove misije redom; sledeća etapa ne troši novi žeton, a nova igra počinje prvom.
- **Posle sletanja (odobrio vlasnik):** oglasi se sirena (`air-raid-siren.mp3`, kao kod Kluza) i poruka „Sirens! The enemy is attacking the base!”, pa sledeća etapa počinje poletanjem pod napadom.
- **Ugrađeno:** etape su u [levels.js](../scenes/vis/levels.js); prva lakša, druga sa teškim lovcima, treća postojeća sa bosom. Rezultat, životi i bombe prelaze u sledeću etapu. Aerodrom na putu za sada koristi postojeću sliku baze sa Visa; poseban crtež aerodroma je kandidat za art.
- **Gotovo kada:** unit test redosleda etapa i pobede tek na Visu; vlasnik je odigrao sve tri.

<a id="ig-04"></a>
## IG-04 · Do Trsta: etape

- **Dogovor ([kontekst](KONTEKST.md#to-trieste)):** nekoliko povezanih etapa, sa dolaskom tenka do Trsta na kraju.
- **Etape (odluka vlasnika):** četiri, geografskim redom trase 4. armije i 1. tenkovske brigade u Tršćanskoj operaciji 1945: Lika (Gospić, početak aprila), Senj i primorje, Rijeka (obavezna, želja vlasnika), Trst (ulazak 1. maja). Rijeka je konačno oslobođena 3. maja, posle Trsta; igra ide redom trase, ne datuma.
- **Zatim:** u [ISTORIJA](ISTORIJA.md#istorijsko-polazište-za-pohod-na-trst) upisati izvore za svaku etapu i protivnike na njoj; pozadine po pejzažu etape (Codex, [pravila pozadina](ART.md#pravila-pripreme-i-predaje-pozadina)); razraditi korake ugradnje etapa redom, kao IG-03.

<a id="ig-05"></a>
## IG-05 · Čamac: dalje etape

- **Dorada postojećeg nivoa (zahtev vlasnika):** nivo treba da traje duže i da ima više neprijatelja.
- **Dogovor ([kontekst](KONTEKST.md#čamac)):** desant na Šoltu; prva etapa se završava iskrcavanjem. Plovilo, radnja i ciljevi daljih etapa su za razradu.
- **Etape (odluka vlasnika):** tri, redom: noćno isplovljavanje iz luke na Visu; postojeći desant na Šoltu sa iskrcavanjem; povratak na Vis pod napadom S-čamaca, kojima je [izvor](ISTORIJA.md#šolta-911-maj-1944--sastav-za-igru-čamca) potvrdio prisustvo na povratnom pravcu. Sledeća etapa ne troši novi žeton, a nova igra počinje prvom.
- **Opcione kasnije etape:** drugi desanti sa Visa 1944, Brač (jun, partizani sa britanskim komandosima; prvi kandidat), Mljet (maj) i Korčula; pre razrade proveriti izvore u [ISTORIJA](ISTORIJA.md).
- **Ime igre (odluka vlasnika kasnije):** „Landing on Šolta” više ne pokriva sve etape; novo ime poželjno pominje desant ili partizansku mornaricu.
- **Zatim:** pozadine i obala po pejzažu Visa i kanala (Codex, [pravila pozadina](ART.md#pravila-pripreme-i-predaje-pozadina)); razraditi korake ugradnje etapa redom, kao IG-03.

<a id="ig-06"></a>
## IG-06 · Mesto i godina bojišta

- **Zahtev vlasnika:** kada pozadina prikazuje istorijsko mesto, igrač treba da sazna koje je mesto i koja godina, npr. „Sremski front, jesen 1944” ili „Grahovo, 1941”.
- **Odakle:** imena i periodi već postoje u metapodacima pozadina ([current-backgrounds.json](../assets/images/sources/pozadine/current-backgrounds.json), polje `name`); igra ih ne prepisuje, nego čita odatle ili iz zajedničkog spiska bojišta u [BattleBackground](../scenes/tenkici/BattleBackground.js).
- **UI:** gde i kako se prikazuje (poruka na početku runde, natpis uz rezultat ili drugo) odlučuje vlasnik pre izrade ([pravilo](DOCS.md#odobravanje-ui-elemenata)); agent predlaže, ne menja UI sam.
- **Gotovo kada:** vlasnik je odobrio prikaz; u svakoj rundi Tenkića i Ustanka igrač vidi mesto i godinu tog bojišta; unit test da runda prikazuje podatke svog bojišta.

<a id="ig-07"></a>
## IG-07 · Više vatre i dima na Sremu 1944

- **Zahtev vlasnika:** na prvom ekranu Tenkića (Sremski front 1944) fali vatre i dima; ranije su bila bar tri stuba dima.
- **Sada:** metapodaci pozadine daju jedno žarište vatre i dima ([current-backgrounds.json](../assets/images/sources/pozadine/current-backgrounds.json)), pa [BattleBackground](../scenes/tenkici/BattleBackground.js) crta jednu vatru i jedan stub; stari grad je imao tri vatre i dva stuba.
- **Šta:** bar tri žarišta sa vatrom i stubovima dima na mestima koja slika opravdava (ruševine, olupine); izabrao ih je Claude sa slike: polomljen krov, drvo rova i salaš u ravnici (vlasnik je izabrao tri) ([BattleBackground](../scenes/tenkici/BattleBackground.js)). Isto proveriti na ostalim novim bojištima.
- **Gotovo kada:** na Sremu 1944 gore tri žarišta sa dimom koji prati vetar; vlasnik je to video u igri.

<a id="ig-08"></a>
## IG-08 · Manji razoreni top na Sremu 1945

- **Zahtev vlasnika:** razoreni top desno na pozadini proboja Sremskog fronta 1945 ([slika](../assets/images/background/sremski-front-1945-static.png)) je prevelik.
- **Šta (Codex):** precrtati top manjim, u razmeri sa tenkovima i rovom, na istom mestu ili blizu; veličina slike i linija tla (852 px) se ne menjaju, prema [pravilima pozadina](ART.md#pravila-pripreme-i-predaje-pozadina).
- **Zatim (Claude):** pomeriti žarište dima sa topa na novo mesto u [BattleBackground](../scenes/tenkici/BattleBackground.js).
- **Gotovo kada:** top je u razmeri sa tenkovima, dim izlazi iz njega, a vlasnik je to video u igri.

<a id="ig-09"></a>
## IG-09 · Cannon: dizanje i spuštanje cevi

- **Zahtev vlasnika:** 3D top u igri Cannon treba da može da diže i spušta cev, bar malo.
- **Sada:** top se samo okreće levo-desno; hitac uvek ide pod istim nagibom (smer cevi plus 0,25 naviše, u [sceni](../scenes/cannon/Main.js)).
- **Šta:** gore i dole menjaju ugao cevi u ograničenom opsegu, a hitac kreće pod tim uglom; ugao je stanje tela topa, a prikaz okreće cev na modelu ako je ona zaseban deo modela, inače ceo top.
- **Gotovo kada:** unit test da se ugao drži u opsegu i da hitac kreće pod njim; vlasnik je to video u igri.

<a id="ig-10"></a>
## IG-10 · Avatar: kocke i novčići se ne preklapaju i svi se mogu skupiti

- **Zahtev vlasnika:** naći algoritam po kome se kocke i novčići u igri Avatar nikada ne preklapaju, i da je svaki novčić sigurno moguće skupiti.
- **Sada:** [createRandomBoxes](../core3d/geometry/index.js) baca 400 kocki od 5 m nasumično po mapi od 200 m i na visini od -5 do 50 m, bez provere preklapanja. [Scena](../scenes/avatar/Main.js) stavlja novčić (i ponekad platformu) 6,15 m iznad svake od prvih 100 kocki, pa novčić može da upadne u drugu kocku; niko ne proverava da li se do njega može doći.
- **Šta:** kocka se postavlja samo ako ne seče već postavljene, uz razmak (odbacivanje i novo izvlačenje, ili Poisson-disk raspored); novčić i platforma samo na mesto koje nije u kocki niti zaklonjeno njome: oko novčića i iznad svakog oslonca ima mesta za ceo lik avatara, a nijedna kocka ne preseca put skoka. Svaki novčić mora biti dostižan Kamenku i Laveniju, koji samo skaču: od tla, preko kocki i platformi, svaki sledeći oslonac je na dohvat jednog skoka (visina i daljina skoka se mere iz tela lika), a novčić je na dohvat skoka sa nekog dostižnog oslonca; raspored koji to ne ispuni se odbacuje ili dopunjuje. Broj pokušaja je ograničen, da raspored uvek završi.
- **Gotovo kada:** unit test da se nijedne dve kocke, nijedan novčić ni platforma i nijedna kocka ne seku i da je svaki novčić dostižan lancem skokova od tla, sa mestom za lik oko novčića i na putu skoka, za više nasumičnih semena; vlasnik je to video u igri.
