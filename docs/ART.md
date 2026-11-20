# ART

Indeks postojećih glavnih 2D aktera i redosled dopune njihovih animacija.

**Status poslova:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked.

| # | ID | Prioritet | Posao | Obavezan rezultat | Codex · preporuka | Status |
|---|---|---|---|---|---|---|
| 1 | ART-00 | — | Indeks i pregled postojećeg arta | Matrice stanja, putanje resursa, merljivi kadrovi, ograničenja i redosled dopuna | — | ✅ Done |
| 2 | ART-01 | P1 | Tenkovi igrača: partizanski i nemački; nemački se koristi i u Do Trsta | Petlja gusenica/točkova tokom vožnje; zadržani trup, odvojena cev, sidrište i sudar | High | ✅ Done |
| 3 | ART-02 | P1 | Ranjeni partizan iz Ranjenika | Pravo puzanje u mestu umesto pomeranja jedne slike | High → Extra High po potrebi | 📋 TODO |
| 4 | ART-03 | P1 | Nemačka i italijanska patrola iz Ranjenika | Hod grupe i mirna poza za `halt`; sadašnji GIF-ovi su statični, a patrola nema stanje pucanja | High → Extra High po potrebi | 📋 TODO |
| 5 | ART-04 | P1 · ponovna upotreba pre novog arta | Opel Blitz u Do Trsta | Obezbediti animiranu vožnju: upotrebiti Kluzov atlas ako odgovara pogledu, smeru, stilu i skali; u suprotnom izraditi odgovarajući | Medium za preuzimanje; High za novu izradu | 📋 TODO |
| 6 | ART-05 | P2 | Somua S35 iz Do Trsta | Petlja gusenica na postojećem trupu, uz zadržanu odvojenu cev | High | 📋 TODO |
| 7 | ART-06 | P2 | Bombaš i Okupator | Izraditi Bombašev pad i namenski vatreni klip Okupatora bez hodanja tokom pucanja; sačuvati postojeće animacije hoda | High → Extra High po potrebi | 📋 TODO |
| 8 | ART-07 | P2 · priprema | Atlasi Ustanka | Formalni opisi ćelija, trajanja i sidrišta; po potrebi prepakivanje, bez ponovnog crtanja prihvaćenih likova | Medium | 📋 TODO |
| 9 | ART-08 | P3 | Uništeni kopneni ciljevi bez odgovarajućeg crteža | Izraditi olupine/oštećene varijante za imenovane tenkove, kamione, voz, artiljeriju i bunkere; postojeći požar ostaje prateći efekat | High | 📋 TODO |
| 10 | ART-09 | P2 | Mitraljezac iz Bunkera | Izraditi vatreni klip za ležećeg mitraljesca odozgo, sa trzajem i povratkom u nišansku pozu | High | 📋 TODO |
| 11 | ART-10 | P3 | Propeleri aviona bez pokretnog propelera | Pripremiti odvojene propelere i tela bez zalepljene statične elise, za obe oznake Poteza, Ju 87, Bf 109 iz Do Trsta i neprijateljske modele iz Visa | High za pripremu arta; Medium za povezivanje | 📋 TODO |
| 12 | ART-11 | P3 · provera pre dopune | Čamci, rovovi i ostali proceduralno prikazani ishodi | Proveriti imenovana stanja u veličini igre; svaki potvrđeni nedostatak pretvoriti u zadatak izrade sa tačnim akterom, stanjem i rezultatom | High | 📋 TODO |

**Codex:** preporučeni nivo razmišljanja agenta, a ne podešavanje kvaliteta generatora slike. Medium je za metapodatke, prepakivanje i povezivanje gotovih resursa; High za novu izradu, animacije i proveru doslednosti. Extra High koristiti kada usklađivanje mnogih kadrova, poza i ograničenja ostane nerešeno na High, naročito ako se greške ponavljaju; može se primeniti na bilo koji takav zadatak. Viši nivo nije garancija bolje slike; preporuke u tabeli nisu rezultat uporednog merenja.

**Odluka vlasnika:** ono što akteru nedostaje od arta treba izraditi. Prioritet određuje redosled, ne da li će se nedostatak rešavati. Ponovna upotreba odgovarajućeg postojećeg arta ima prednost nad crtanjem duplikata; sama procena nije završen zadatak.

## Obim i čitanje

- Obuhvaćeni su glavni igrači/neprijatelji iz [postojećeg 2D Storybook kataloga](../storybook/stories/index.js), uključujući varijante vozila, aviona i stacionarne odbrane. Ista grafika koju deli više igara ima jednu obavezu izrade. Ovo nije katalog svake nekorišćene slike u `assets`.
- **A4 / A5 / A8:** klip sa toliko kadrova, prema konfiguraciji potrošača ili metapodacima; pripremljen klip koji još nije ugrađen označen je posebno. **S:** statična slika. **P:** proceduralno pomeranje, rotacija, trzaj, treptanje ili prateći efekat; nije poseban sprite klip tela. **Poze:** različite poze/varijante u listu, ne nužno vremenska animacija. **—:** radnja nije sposobnost tog aktera u sadašnjem kodu; nije automatski zahtev za novim artom ili gameplay-em.
- Mirovanje ne mora uvek imati petlju. Mirno vozilo ili utvrđenje mogu opravdano koristiti S; vožnja gusenica, hod i puzanje imaju prednost nad sitnim idle pomeranjem. Proceduralno nišanjenje odvojene cevi ne treba zamenjivati nizom unapred nacrtanih uglova.
- „Postoji u igri” znači potvrđen resurs i put u kodu, ne potvrđenu glatkoću animacije u browseru. Gotov art bez potrošača vodi se kao pripremljen. Ovaj pregled nije pokretao igre niti projektne testove. Vizuelno su pregledani izabrani postojeći listovi i novi kadrovi tenkova; konačni pregled svake nove animacije u igri ostaje odvojen od pregleda arta.
- Merene dimenzije, broj stvarnih GIF kadrova, hashes izvora i opisani klipovi nalaze se u [generisanom indeksu](../assets/images/sprite-index.json). Obnavlja ga [skripta](../scripts/index-sprite-art.py), koja čita linkovane slike i metapodatke [Kluza](../assets/images/armies/sources/franjo-kluz/sprites.json) i [tenkova](../assets/images/armies/sources/tenkovi/sprites.json); ne menja art. Broj slika unutar PNG atlasa ne izvodi se iz njegovog jednog kontejnerskog kadra.
- Ugao i identitet postojećeg vojnog arta proveravaju se u [indeksu prikaza](../assets/images/armies/index.csv), a istorijski okvir i prihvaćen izgled u [kontekstima](KONTEKST.md). Obim Storybook-a ostaje [samo igrači i neprijatelji](STORYBOOK.md); projektili i efekti su njihovi saradnici.

## Pešadija i posade

| Akter / igre | Art i izvor upotrebe | Mirovanje | Kretanje | Pucanje / radnja | Pogodak / kraj | Šta dalje |
|---|---|---|---|---|---|---|
| Nemački strelac · Kluz | [atlas](../assets/images/armies/game-ready/vojnici/nemacki-strelac-sprites.png), [Rifleman](../core/actor/soldiers/Rifleman.js) | A4 `rest`; postoji i `idle` | A4 `walk`, korišćen u patroli | A4 `fire` i `fireUp`; držana poza između hitaca | A4 `death` | Osnovna postojeća stanja pokrivena; ne crtati ponovo |
| Nemački jurišnik · Kluz | [atlas](../assets/images/armies/game-ready/vojnici/nemacki-jurisnik-sprites.png), isti Rifleman | A4 `rest` | A4 `walk` | A4 `fire` i `fireUp` | A4 `death` | Pokriveno; zadržati postojeće klipove i klečeću pozu gde je nacrtana |
| Partizanski strelac · Ustanak | [atlas](../assets/images/armies/game-ready/vojnici/partizanski-strelac-sprites.png), [Strelac](../scenes/ustanak/Strelac.js) | A4 `idle` | — | A4 `fire` | —; klasa nema stanje smrti | Prihvaćeni art; ART-07 za formalnu pripremu, bez izmišljanja hoda/smrti |
| Partizanska posada · Ustanak | [atlas](../assets/images/armies/game-ready/artiljerija/partizanska-posada-sprites.png), [Posada](../scenes/ustanak/Posada.js) | A4 `idle` | — | A4 `load`, `fire`, `recoil` | — kao zasebna posada | ART-07; radnje ne zahtevaju nove crteže |
| Italijanska posada · Ustanak | [atlas](../assets/images/armies/game-ready/artiljerija/italijanska-posada-sprites.png), ista Posada | A4 `idle` | — | A4 `load`, `fire`, `recoil` | — | ART-07 |
| Partizanski zastavnik · Ustanak | [atlas](../assets/images/armies/game-ready/vojnici/partizanski-zastavnik-sprites.png), [Zastavnik](../scenes/ustanak/Zastavnik.js) | A4 + zasebna zastava | — | — | — | Prihvaćen izgled; ART-07 za opis ćelija |
| Italijanski zastavnik · Ustanak | [zajednički atlas](../assets/images/armies/game-ready/vojnici/zastavnici-sprites.png), drugi red | A4 + zasebna zastava | — | — | — | ART-07: opisati ćelije drugog reda; prvi red nije nastavak njegove animacije |
| Bombaš · Bunker | [atlas](../assets/images/sprites/vojnici/bombas-idle.png), [GrenadierSprite](../core/actor/derived/GrenadierSprite.js), [Grenadier](../core/actor/derived/Grenadier.js) | A2 `idle` | A8 `kretanje` | —; lik nema komandu bacanja bombe | Zaustavljen kadar + zaseban efekat krvi | ART-06: pad tela; postojeći hod ne menjati |
| Ranjeni partizan · Ranjenik | [slika](../assets/images/armies/ranjeni-partizan.png), [WoundedSoldier](../core/actor/derived/WoundedSoldier.js) | S | P: cela slika se pomera odozgo | — | Bez posebnog klipa tela | ART-02: puzanje istog čoveka, iz istog pogleda |
| Nemačka patrola · Ranjenik | [GIF](../assets/images/armies/nemci-patrola.gif), [Patrol](../core/actor/soldiers/Patrol.js) | S za `halt` | P za `search`; GIF ima **jedan** kadar | —; javljanje glasom nije paljba | Nema klipa pada grupe | ART-03; ekstenzija `.gif` nije dokaz animacije |
| Italijanska patrola · Ranjenik | [GIF](../assets/images/armies/talijani-patrola.gif), isti Patrol | S za `halt` | P za `search`; GIF ima **jedan** kadar | — | Nema klipa pada grupe | ART-03; čuvati nacionalnu varijantu |
| Mitraljezac · Bunker | [slika](../assets/images/armies/nemci/mitraljezac-01.png), [MachineGunner](../core/actor/soldiers/MachineGunner.js) | S | — | P: projektili, bez klipa posade | Nema posebnog lista tela ni imenovanog stanja smrti | ART-09: izraditi pucanje iz postojećeg pogleda odozgo; ishod pogotka proveriti kroz ART-11 |
| Nemci u rovovima · Neretva | [list](../assets/images/armies/game-ready/vojnici/nemci-spreda.png), [TrenchSoldier](../core/actor/soldiers/TrenchSoldier.js) | Skriven / poza + P disanje | P podizanje; nema hoda | Smena nišanske i vatrene poze + P trzaj | P prelaz u nacrtanu palu pozu | Tri kolone su **varijante vojnika**, četiri reda su poze; nisu četiri klipa sa tri kadra |
| Četnici u rovovima · Neretva | [list](../assets/images/armies/game-ready/vojnici/cetnici-spreda.png), isti TrenchSoldier | Kao Nemci | Kao Nemci | Kao Nemci | Kao Nemci | ART-11: proveriti prelaze postojećih poza; izraditi međupoze samo za potvrđeni nedostatak |
| Okupator · Otpisani | [atlas](../assets/images/sprites/vojnici/okupator-sprite.png), [Occupier](../core/actor/Occupier.js) | —; stanja su walk/fire/dead | A5 po smeru | Koristi `nadole` A5 i zaseban [plamen](../assets/images/pucanje.png); nema zasebnog vatrenog reda | A5 `umire` | ART-06: izraditi namensko pucanje sa mirnim nogama, uz postojeći identitet i nišansku pozu |

## Vozila i nepokretna odbrana

| Akter / igre | Art i izvor upotrebe | Mirovanje | Kretanje | Pucanje | Uništenje | Šta dalje |
|---|---|---|---|---|---|---|
| Partizanski tenk · Tenkići, Do Trsta | [trup](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-bez-cevi-pixel.png), [pripremljen atlas](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-sprites.png), [cev](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png), [TenkLevo](../scenes/tenkici/TenkLevo.js), [Tenk](../scenes/tenkici/Tenk.js) | S; isti original u idle redu | U igri P; pripremljen A4 `drive`, 0,64 s | P nišanjenje i trzaj odvojene cevi, projektil | Postojeći efekti, bez posebnog klipa olupine | ART-01: art gotov; povezati atlas u Tenk, uz nepromenjene dimenzije kadra i sudare. Olupina: ART-08 |
| Nemački tenk · Tenkići, Do Trsta | [trup](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-bez-cevi-pixel.png), [pripremljen atlas](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-sprites.png), [cev](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png), [TenkDesno](../scenes/tenkici/TenkDesno.js), [GroundEnemies](../scenes/to-trieste/GroundEnemies.js) | S; isti original u idle redu | U igri P; pripremljen A4 `drive`, 0,64 s | P odvojena cev i projektili | Bez posebnog klipa olupine | ART-01: art gotov; jedan atlas povezati u TenkDesno i GroundEnemies, sa zasebnim postojećim sidrištima cevi. Olupina: ART-08 |
| Hummel · Kluz | [atlas](../assets/images/armies/game-ready/tenkovi/hummel-sprites.png), [Vehicle](../core/actor/vehicles/Vehicle.js) | A4 `idle` | A4 `drive` | —; sadašnji Vehicle ne puca | Prvi idle kadar + postojeći požar, bez `death` reda | Vožnja pokrivena; ART-08: izraditi olupinu Hummela |
| Opel Blitz · Kluz | [atlas](../assets/images/armies/game-ready/kamioni/opel-blitz-sprites.png), isti Vehicle | A4 `idle` | A4 `drive` | — | Kao Hummel | Vožnja pokrivena; ART-08: izraditi uništenu varijantu, bez dupliranja vožnje |
| Opel Blitz, legija · Kluz | [atlas](../assets/images/armies/game-ready/kamioni/opel-blitz-legion-sprites.png), isti Vehicle | A4 `idle` | A4 `drive` | — | Kao Hummel | ART-08: uništena varijanta sa odgovarajućim oznakama legije |
| Oklopni voz BP-42 · Kluz | [atlas](../assets/images/armies/game-ready/vozovi/bp42-sprites.png), isti Vehicle | A4 `idle` | A4 `drive` | — u sadašnjem kodu | Kao Hummel | ART-08: izraditi olupinu; ne dodavati nepostojeće stanje pucanja |
| Somua S35 · Do Trsta | [trup](../assets/images/armies/game-ready/tenkovi/somua-s35-body-readable.png), [cev](../assets/images/armies/game-ready/tenkovi/somua-s35-barrel.png), [enemyArt](../scenes/to-trieste/enemyArt.js) | S | P položaj, bez gusenica | P odvojena cev | P / ista osnova | ART-05, posle tenkova igrača |
| Opel Blitz · Do Trsta | [SVG](../assets/images/armies/game-ready/kamioni/opel-blitz.svg), isti enemyArt | S | P položaj, statični točkovi | — | P / ista osnova | ART-04: najpre proveriti Kluzov atlas, ne generisati duplikat |
| Partizanski čamac · Čamac | [slika](../assets/images/armies/camac.png), [TopDownPlayerBoat](../core/actor/TopDownPlayerBoat.js), [Boat](../scenes/camac/Boat.js) | S | P plovidba i efekti vode | P projektili | P / zaustavljanje i saradnici | ART-11: proveriti plovidbu, pucanje i ishod pogotka odozgo; precizirati i izraditi potvrđene nedostatke |
| Schnellboot S-30 · Čamac | [SVG](../assets/images/armies/game-ready/brodovi/schnellboot-s30.svg), [SBoat](../scenes/camac/SBoat.js) | S | P plovidba, voda | P pokretne cevi | P potonuće / olupina | ART-11: proveriti čitljivost postojećeg potonuća; sačuvati odvojene cevi i vodu |
| Flak 38 · Kluz | [postolje](../assets/images/armies/game-ready/artiljerija/flak38-postolje.png), [cev](../assets/images/armies/game-ready/artiljerija/flak38-cev.png), [Flak](../core/actor/artillery/Flak.js) | S | — | P okretanje cevi + animiran prateći plamen | Postojeći požar, bez klipa posade | ART-08: uništeno oruđe; ART-11: proveriti potrebu za posadom, bez atlasa svih uglova cevi |
| Topovi · Ustanak | [cev](../assets/images/armies/game-ready/artiljerija/top-cev.gif), [Top](../scenes/ustanak/Top.js), posade gore | S; GIF cevi ima jedan kadar | — | P cev/trzaj/točak + A4 posade | Postojeći prikaz ishoda, bez posebnog lista topa | Nije „animirani GIF topa”; važna radnja već ima animiranu posadu |
| PaK 38 · Do Trsta | [postolje](../assets/images/armies/game-ready/artiljerija/pak38-postolje.png), [cev](../assets/images/armies/game-ready/artiljerija/pak38-cev.png), isti GroundEnemies | S | — | P odvojena cev/projektili | P / ista osnova | ART-08: uništeno oruđe; ART-11: proveriti prikaz rada posade |
| Mitraljesko gnezdo · Čamac | [SVG](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg), [ShoreMachineGun](../scenes/camac/ShoreMachineGun.js) | S | — | P cevi, plamen, projektili i prikaz posade | P prikaz uništenja i pale posade | ART-11: proveriti postojeće posade i ishod uništenja; ne crtati duplikat već prikazane radnje |
| Bunkeri · Do Trsta | [kuća](../assets/images/buildings/kuca-bunker.png), [bunker](../assets/images/buildings/bunker-02.png), [Bunker](../scenes/to-trieste/Bunker.js) | S | — | P oružje/projektili | Postojeći efekti | ART-08: izraditi uništenu varijantu za oba izgleda bunkera |

## Avioni

| Akter / igre | Art i izvor upotrebe | Glavna stanja danas | Sprite dopuna |
|---|---|---|---|
| Potez 25, obe oznake · Kluz | [partizanski](../assets/images/armies/partizani/potez-25.png), [NDH](../assets/images/armies/ndh/avioni/potez-25.png), [Potez](../scenes/franjo-kluz/Potez.js) | S trupa; P let, mitraljez, bomba i pad; nema liste klipova tela | ART-10: pripremiti pokretni propeler za oba izgleda; zadržati njihove oznake |
| Bf 109 · Kluz | [telo](../assets/images/armies/game-ready/avioni/bf109-telo.png), [propeler](../assets/images/armies/game-ready/avioni/bf109-propeler.png), [Fighter](../core/actor/aircraft/Fighter.js) | S trupa, P stvarno pomeranje odvojenog propelera, nalet/paljba/pad | Ne označavati propeler kao nedostajući samo zato što nema atlasa |
| Ju 87 · Kluz, Do Trsta | [SVG](../assets/images/armies/game-ready/avioni/ju87.svg), [DiveBomber](../core/actor/aircraft/DiveBomber.js), [Aircraft](../scenes/to-trieste/Aircraft.js) | S trupa, P let/obrušavanje/bomba/pad | ART-10: pripremiti odvojeni propeler i zajednički art za oba potrošača |
| Bf 109 · Do Trsta | [SVG](../assets/images/armies/game-ready/avioni/bf109.svg), isti Aircraft | S trupa, P putanja i napad | ART-10: pripremiti propeler koji odgovara ovom SVG-u; postojeći Kluzov upotrebiti samo ako se uklapa |
| Spitfire Mk Vb · Vis | [slika](../assets/images/armies/partizani/avioni/spitfire-mkvb-realistic.png), [Avionce](../scenes/vis/Avionce.js), [PlayerView](../scenes/vis/PlayerView.js) | S tela odozgo, P propeler, kretanje, luping, bomba/paljba i treptanje pri zaštiti | Pokriveno; ART-11 proverava čitljivost postojećih radnji, bez zahteva za novim idle atlasom |
| Hurricane Mk IV · Vis | [slika](../assets/images/armies/partizani/avioni/hurricane-mkiv-realistic.png), isti Avionce | Isto | Pokriveno; ART-11: pregled postojećeg propelera i ishoda pogotka |
| Breguet 19 · Vis | [slika](../assets/images/armies/partizani/avioni/breguet-19-realistic.png), isti Avionce | Isto | Pokriveno; ART-11: pregled postojećeg propelera i ishoda pogotka |
| Yak-1b · Vis | [slika](../assets/images/armies/partizani/avioni/yak-1b-realistic.png), isti Avionce | Isto | Pokriveno; ART-11: pregled postojećeg propelera i ishoda pogotka |
| Nemački lovci · Vis | [Bf 109](../assets/images/armies/nemci/avioni/bf-109-odozgo.png), [Fw 190](../assets/images/armies/nemci/avioni/fw-190-odozgo.png), [Enemy](../scenes/vis/Enemy.js) | S tela, P let/paljba/pogibija | ART-10: pripremiti odvojeni propeler za svaki model; ART-11: proveriti postojeću pogibiju |
| Bf 110 · Vis | [slika](../assets/images/armies/nemci/avioni/bf-110-odozgo.png), isti Enemy | S tela, P let/paljba/pogibija | ART-10: pripremiti oba propelera sa njihovim osama; ART-11: proveriti pogibiju |
| He 111 · Vis | [slika](../assets/images/armies/nemci/avioni/he-111-odozgo.png), [Boss](../scenes/vis/Boss.js) | S tela, P let/paljba/pogibija | ART-10: pripremiti oba propelera; ART-11: proveriti pogibiju, bez izmišljanja idle klipa |

## Šta prvo pripremiti, a šta ne precrtavati

1. **ART-01:** prvo jedan tenk kao stilski i tehnički uzor, potom drugi. Referenca je postojeći trup, prikazan približno 120–180 px široko, ne proizvoljan novi model tenka. Najpre odvojena petlja vožnje sa najmanje četiri jasno različita položaja gusenica; horizontalno kretanje daje igra. Idle može ostati postojeći kadar. Cev, oslonac cevi, smer, proporcije, transparentne margine, baseline i sudarne mere ostaju nezavisni od novih ćelija. Tek nakon pregleda nove petlje pripremati ostala glavna stanja koja zaista traže novi crtež.
2. **ART-02/03:** puzanje i hod su glavna vidljiva radnja igrača/patrole i sada su samo pomeranje slike. Čuvati postojeći pogled odozgo, likove, uniforme i broj ljudi u grupi. Ne preuzimati bočnog vojnika iz Kluza kao zamenu za taj pogled.
3. **ART-04:** isti naziv Opel Blitz nije dovoljan dokaz da se atlas uklapa. Uporediti pogled, smer, dimenzije i stil pre povezivanja; ako se koristi postojeći atlas, ne menjati sudare zbog njegovog padding-a.
4. **ART-07:** u Ustanku kod bira po četiri kadra u redu, ali ne postoji zajednički manifest sa anchor/duration podacima. Izmereni listovi uključuju 1774×887, 1263×1246 i 1254×1254: deljenje nije svuda na cele piksele. To samo po sebi ne dokazuje kvar rendera, ali zahteva precizan opis/prepakivanje pre dodavanja novih redova. Likovi i njihove postojeće animacije su [prihvaćeni](KONTEKST.md#ustanak), pa to nije nalog za novi generisani izgled.

## Uslovi završetka zadataka

Svaki zadatak izrade završava se upotrebljivim resursom, sačuvanim izvorom, opisom kadrova/slojeva, sidrišta i trajanja, te pregledom u veličini igre. Obnoviti ovaj indeks i njegova merenja. Izrada arta i njegovo povezivanje u igru beleže se odvojeno: gotov atlas koji igra još ne koristi nije završena integracija. Postojeći efekti nisu dokaz da nedostajući crtež tela postoji, ali proceduralni prikaz radnje nije sam po sebi mana.

| ID | Konkretna izrada i uslov završetka |
|---|---|
| ART-01 | Izraditi zasebne petlje vožnje za postojeći partizanski i nemački trup, sa najmanje četiri različite faze gusenica. U pregledu nema klizanja stopljenih gusenica, skakanja trupa ili pomeranja oslonca cevi. Ista nemačka petlja odgovara i Tenkićima i Do Trsta. Olupine vodi ART-08. |
| ART-02 | Izraditi petlju puzanja ranjenog partizana odozgo; ruke, noge i telo učestvuju u puzanju, a pomeranje po ekranu daje igra. Petlja se spaja bez skoka, zadržava identitet i sidrište; postojeća statična slika može ostati mirovanje. |
| ART-03 | Izraditi petlju patrolnog hoda za nemačku i italijansku grupu, uz miran kadar za `halt`. Oba vojnika ostaju ista i na istim relativnim mestima; koraci su vidljivi, bez pomeranja cele grupe unutar ćelije. Ne dodavati pucanje ili smrt koje Patrol nema. |
| ART-04 | Isporučiti odgovarajući art vožnje Opela za Do Trsta: postojeći Kluzov atlas uz dokumentovan izbor ćelija i sidrišta, ili novi list ako pogled/stil ne odgovaraju. Zadatak ostaje otvoren dok ne postoji upotrebljiva petlja, ne završava se beleškom „proveriti”. |
| ART-05 | Izraditi petlju gusenica Somue S35 na prihvaćenom trupu. Cev ostaje odvojena, oslonac i silueta miruju, a faze se jasno razlikuju u veličini igre. Olupinu vodi ART-08. |
| ART-06 | Izraditi Bombašev neponovljivi pad do zadržane pale poze, u stilu postojećeg lista. Za Okupatora izraditi namensko pucanje iz postojeće frontalne nišanske poze: trzaj, hitac i povratak, uz mirne noge. Sačuvati njegov hod i `umire`; postojeći plamen može ostati zaseban. Obe dopune su potrebne za zatvaranje stavke. |
| ART-07 | Opisati ćelije, aktivne redove, sidrišta i trajanja svih pet navedenih listova Ustanka. Ako treba celobrojna mreža, mehanički prepakovati prihvaćene crteže bez promene izgleda i bez odsecanja; proveriti sve krajnje ćelije. Zadatak je priprema postojećeg arta, ne novi dizajn. |
| ART-08 | Izraditi prepoznatljivu uništenu varijantu za svaki od sledećih izgleda: partizanski tenk, nemački tenk, Somua S35, Hummel, Opel Blitz, Opel legije, BP-42, Flak 38, PaK 38, kuća-bunker i zasebni bunker. Za Opel iz Do Trsta koristiti odgovarajuću istu olupinu ako deli izgled. Dovoljan je smislen završni crtež; prelaz i požar mogu ostati proceduralni. Silueta oštećenja mora biti čitljiva i bez plamena. Beležiti završetak po imenovanom izgledu; jedan crtež ne zatvara celu stavku. |
| ART-09 | Izraditi vatreni klip ležećeg mitraljesca iz Bunkera, iz istog pogleda odozgo: nišanjenje, trzaj i povratak; dodati položaj vrha cevi u metapodatke. Kadar ostaje poravnat pri rotaciji celog lika; ne uvoditi bočnog vojnika ili nepostojeći hod. |
| ART-10 | Pripremiti telo bez statične elise i odvojene slojeve propelera za Potez 25 u obe oznake, Ju 87, Bf 109 iz Do Trsta, kao i Bf 109, Fw 190, Bf 110 i He 111 iz Visa. Navesti osovinu svakog propelera i predviđen način pokreta; za dvomotorce obe. Ako odgovarajući sloj već postoji, ponovo ga upotrebiti. Propeleri igrača iz Visa i Bf 109 iz Kluza već su pokretni i ne izrađuju se ponovo. |
| ART-11 | U stvarnoj veličini proveriti: oba čamca (plovidba/paljba/uništenje), obe vrste rovovskih vojnika (podizanje/paljba/pad), mitraljesca iz Bunkera (ishod pogotka), Flak i PaK (čitljivost rada oruđa/posade), obalsko mitraljesko gnezdo (paljba/pala posada) i avione (propeler/paljba/pogibija). Za svaku potvrđenu rupu upisati imenovan resurs koji treba izraditi i uslov završetka; zatim ga izraditi u okviru odgovarajućeg prioriteta. Ako je radnja već čitljivo pokrivena, zabeležiti kojim resursom/postupkom. Sam spisak „P3, pogledati” nije rezultat; ovo nije odobrenje za pokretanje igre bez potrebne dozvole. |

**ART-01 — izrađen art:** [pregled](../assets/images/armies/sources/tenkovi/preview.html), [metapodaci](../assets/images/armies/sources/tenkovi/sprites.json), [recept](../assets/images/armies/sources/tenkovi/manifest.json), [priprema](../assets/images/armies/sources/tenkovi/prepare.py) i [tačni imagegen opisi](../assets/images/armies/sources/tenkovi/prompts.json). Svaki atlas ima četiri kolone i dva reda: originalni statični `idle`, pa četiri različita `drive` kadra. Kadrovi ostaju 300×129 i 327×137, sa postojećim centrom, smerom i odvojenim cevima. Priprema proverava da su originalna providnost i svi pikseli izvan maske gusenica sačuvani; zato se ne pomeraju silueta ni oslonac trupa. Pregledani su stripovi u punoj veličini i veličini prikaza [150 px](../assets/images/armies/sources/tenkovi/previews/partizanski-tenk-drive-game-size.png) / [121 px](../assets/images/armies/sources/tenkovi/previews/nemacki-tenk-drive-game-size.png); pripremljeni su GIF-ovi [partizanskog](../assets/images/armies/sources/tenkovi/previews/partizanski-tenk-drive.gif) i [nemačkog](../assets/images/armies/sources/tenkovi/previews/nemacki-tenk-drive.gif) tenka sa po četiri kadra. Ugradnja u igre i pregled rada u browseru nisu izvršeni. Sidrište cevi nemačkog tenka razlikuje se između Tenkića i Do Trsta; isto ime arta nije razlog da se ta sidrišta objedine.

Nepostojeće sposobnosti aktera ne dodaju se da bi tabela imala animaciju u svakoj koloni. Rezervni listovi ispod služe kao mogući izvori za konkretan zadatak, ne kao obaveza prerade svih nekorišćenih slika.

## Granica 3D arta

3D likovi iz [kataloga](../storybook/stories/characters3d.js) koriste modele i klipove iz `anim.actions`, a ne 2D spriteove. Njih ne treba proglasiti nepokrivenim samo zato što nemaju PNG atlas. 3D vozila i letelice iz [kataloga letelica](../storybook/stories/objects3d.js) imaju i proceduralne pokrete modela. Provera kompletnosti njihovih skeletnih klipova je zaseban posao; ovaj indeks ne tvrdi da je svaki takav klip proverio ili vizuelno prihvatio.

## Rezervni vojnički listovi

U [postojećem folderu](../assets/images/sprites/vojnici/) postoje i sledeći listovi bez potrošača među pregledanim akterima. Njihova veličina i PNG format nisu dokaz da je poznata mreža, sidrište, alfa ili vremenski raspored: pre nove izrade proveriti odgovarajući pogled i upotrebljive poze. Vizuelno su pogledani `nemac-04` i `vojnik-02`: sadrže više smerova/poza, nisu gotove zamene za patrolu odozgo.

| Resurs | Izmerena veličina | Stanje |
|---|---|---|
| [nemac-01](../assets/images/sprites/vojnici/nemac-01.png) | 1142×1492 | Nije povezan u pregledanim akterima; klipovi nisu potvrđeni |
| [nemac-02](../assets/images/sprites/vojnici/nemac-02.png) | 1068×2081 | Isto |
| [nemac-03](../assets/images/sprites/vojnici/nemac-03.png) | 1028×1717 | Isto |
| [nemac-04](../assets/images/sprites/vojnici/nemac-04.png) | 1211×581 | Više smerova i mirna/vatrena poza; vidljiva obojena podloga traži pripremu |
| [nemac-oficir-01](../assets/images/sprites/vojnici/nemac-oficir-01.png) | 820×1493 | Nije povezan u pregledanim akterima; klipovi nisu potvrđeni |
| [nemac-oficir-02](../assets/images/sprites/vojnici/nemac-oficir-02.png) | 898×1491 | Isto |
| [saveznik-01](../assets/images/sprites/vojnici/saveznik-01.png) | 1519×1911 | Isto |
| [vojnik-02](../assets/images/sprites/vojnici/vojnik-02.png) | 942×534 | Više smerova i faza koraka; potrebno definisati ćelije i ukloniti podlogu |

## Održavanje i granice dokaza

Pregled je napravljen 2026-11-20 iz izvora i samih slika. Svako dodavanje aktera, zamena arta ili promena mapiranja stanja zahteva ažuriranje odgovarajućeg reda i ponovno generisanje merenja. Hash označava tačnu pregledanu datoteku, ne kvalitet ili odobrenje slike. Novi art se čuva uz ostalu opremu iste vrste, sa izvorom i metapodacima; pre povezivanja proveravaju se stvarni različiti kadrovi, sidrište, providnost i izgled u veličini igre. Provere runtime-a traže svoju dozvolu; nema tvrdnje da su ovim pregledom izvršene.
