# ART

Trajna dokumentacija postojećeg arta: pokrivenost stanja, izvori, priprema i zajednička upotreba u igrama i Storybook-u. Zadaci, prioriteti i statusi vode se u [PLAN-ART](PLAN-ART.md), a izvršene provere u [TESTING](TESTING.md#art-verification-record).

**Princip:** odgovarajući postojeći art ima prednost nad duplikatom. Nedostajući art treba izraditi; prioritet u planu određuje redosled, ne da li će nedostatak biti rešen. Proceduralna radnja ili sposobnost koju akter nema nisu sami po sebi nedostatak spriteova.

## Obim i čitanje

- Obuhvaćeni su glavni igrači/neprijatelji iz [postojećeg 2D Storybook kataloga](../storybook/stories/index.js), uključujući varijante vozila, aviona i stacionarne odbrane. Ista grafika koju deli više igara ima zajednički opis. Ovo nije katalog svake nekorišćene slike u `assets`.
- **A4 / A5 / A8:** klip sa toliko kadrova, prema konfiguraciji potrošača ili metapodacima; pripremljen klip koji još nije ugrađen označen je posebno. **S:** statična slika. **P:** proceduralno pomeranje, rotacija, trzaj, treptanje ili prateći efekat; nije poseban sprite klip tela. **Poze:** različite poze/varijante u listu, ne nužno vremenska animacija. **—:** radnja nije sposobnost tog aktera u sadašnjem kodu; nije automatski zahtev za novim artom ili gameplay-em.
- Mirovanje ne mora uvek imati petlju. Mirno vozilo ili utvrđenje mogu opravdano koristiti S; vožnja gusenica, hod i puzanje imaju prednost nad sitnim idle pomeranjem. Proceduralno nišanjenje odvojene cevi ne treba zamenjivati nizom unapred nacrtanih uglova.
- „Postoji u igri” znači potvrđen resurs i put u kodu, ne potvrđenu glatkoću animacije u browseru. Gotov art bez potrošača vodi se kao pripremljen. Početni inventar nije pokretao igre niti testove; izvršene ciljane unit provere i granice neposrednog pregleda PNG/GIF kadrova beleži [TESTING](TESTING.md#art-verification-record). Konačni pregled pokreta u igri ostaje odvojen od tih dokaza.
- Merene dimenzije, broj stvarnih GIF kadrova, hashes izvora i opisani klipovi nalaze se u [generisanom indeksu](../assets/images/sprite-index.json). Obnavlja ga [skripta](../scripts/index-sprite-art.py), koja čita direktno linkovane slike iz ART.md i PLAN-ART.md i opise koji se završavaju sa `sprites.json`, uključujući [Kluz](../assets/images/armies/sources/franjo-kluz/sprites.json) i [tenkove](../assets/images/armies/sources/tenkovi/sprites.json), kao i dopune navedene niže. Skripta ne menja art; PNG atlas nije jedan animacioni kadar samo zato što je jedan kontejnerski kadar.
- Ugao i identitet postojećeg vojnog arta proveravaju se u [indeksu prikaza](../assets/images/armies/index.csv), a istorijski okvir i prihvaćen izgled u [kontekstima](KONTEKST.md). Obim Storybook-a ostaje [samo igrači i neprijatelji](STORYBOOK.md); projektili i efekti su njihovi saradnici.

## Pešadija i posade

| Akter / igre | Art i izvor upotrebe | Mirovanje | Kretanje | Pucanje / radnja | Pogodak / kraj | Napomena |
|---|---|---|---|---|---|---|
| Nemački strelac · Kluz | [atlas](../assets/images/armies/game-ready/vojnici/nemacki-strelac-sprites.png), [Rifleman](../core/actor/soldiers/Rifleman.js) | A4 `rest`; postoji i `idle` | A4 `walk`, korišćen u patroli | A4 `fire` i `fireUp`; držana poza između hitaca | A4 `death` | Osnovna postojeća stanja pokrivena; ne crtati ponovo |
| Nemački jurišnik · Kluz | [atlas](../assets/images/armies/game-ready/vojnici/nemacki-jurisnik-sprites.png), isti Rifleman | A4 `rest` | A4 `walk` | A4 `fire` i `fireUp` | A4 `death` | Pokriveno; zadržati postojeće klipove i klečeću pozu gde je nacrtana |
| Partizanski strelac · Ustanak | [atlas](../assets/images/armies/game-ready/vojnici/partizanski-strelac-sprites.png), [Strelac](../scenes/ustanak/Strelac.js) | A4 `idle` | — | A4 `fire` | —; klasa nema stanje smrti | ART-07: opis i trajanja povezani; prihvaćeni crteži ostaju isti |
| Partizanska posada · Ustanak | [atlas](../assets/images/armies/game-ready/artiljerija/partizanska-posada-sprites.png), [Posada](../scenes/ustanak/Posada.js) | A4 `idle` | — | A4 `load`, `fire`, `recoil` | — kao zasebna posada | ART-07: zajednički opis ćelija, trajanja i sidrišta povezan |
| Italijanska posada · Ustanak | [atlas](../assets/images/armies/game-ready/artiljerija/italijanska-posada-sprites.png), ista Posada | A4 `idle` | — | A4 `load`, `fire`, `recoil` | — | ART-07: zajednički opis povezan, bez precrtavanja |
| Partizanski zastavnik · Ustanak | [atlas](../assets/images/armies/game-ready/vojnici/partizanski-zastavnik-sprites.png), [Zastavnik](../scenes/ustanak/Zastavnik.js) | A4 + zasebna zastava | — | — | — | ART-07: opis ćelija i sidrišta povezan |
| Italijanski zastavnik · Ustanak | [zajednički atlas](../assets/images/armies/game-ready/vojnici/zastavnici-sprites.png), drugi red | A4 + zasebna zastava | — | — | — | ART-07: koristi drugi red; prvi red je označen kao neupotrebljen |
| Bombaš · Bunker | [atlas](../assets/images/armies/game-ready/vojnici/bombas-sprites.png), [GrenadierSprite](../core/actor/derived/GrenadierSprite.js), [Grenadier](../core/actor/derived/Grenadier.js) | A2 `idle` | A8 `kretanje` | —; lik nema komandu bacanja bombe | A6 `death`, 0,6 s, poslednji kadar ostaje | Bombašev deo ART-06 povezan; dva prethodna reda su sačuvana |
| Ranjeni partizan · Ranjenik | [atlas](../assets/images/armies/game-ready/vojnici/wounded-sprites.png), [WoundedSoldier](../core/actor/derived/WoundedSoldier.js) | S | A4 `crawl`, 1,2 s, samo pri stvarnom pomeranju | — | Bez posebnog klipa tela | ART-02: isto sidrište i mere 69×27, originalno mirovanje sačuvano |
| Nemačka patrola · Ranjenik | [atlas](../assets/images/armies/game-ready/vojnici/german-patrol-sprites.png), [izvorni GIF](../assets/images/armies/nemci-patrola.gif), [Patrol](../core/actor/soldiers/Patrol.js) | S za `halt` | A4 `walk`, 0,8 s za `search` | —; javljanje glasom nije paljba | Nema klipa pada grupe | ART-03: tri vojnika u istoj grupi, originalni mirni kadar za `halt` |
| Italijanska patrola · Ranjenik | [atlas](../assets/images/armies/game-ready/vojnici/italian-patrol-sprites.png), [izvorni GIF](../assets/images/armies/talijani-patrola.gif), isti Patrol | S za `halt` | A4 `walk`, 0,8 s za `search` | — | Nema klipa pada grupe | ART-03: ista tri vojnika i posebna italijanska varijanta; `halt` koristi original |
| Mitraljezac · Bunker | [atlas](../assets/images/armies/game-ready/vojnici/mitraljezac-sprites.png), [MachineGunner](../core/actor/soldiers/MachineGunner.js) | S, originalni pikseli | — | A4 `fire`, 0,1 s po stvarnom hicu; rotira se ceo kadar | A4 `death`, 0,6 s, zadržana završna poza | ART-09 i dopuna ART-11 povezani; isti krupan kadar, sidrište i rotacija |
| Nemci u rovovima · Neretva | [list](../assets/images/armies/game-ready/vojnici/nemci-spreda.png), [TrenchSoldier](../core/actor/soldiers/TrenchSoldier.js) | Skriven / poza + P disanje | P podizanje; nema hoda | Smena nišanske i vatrene poze + P trzaj | P prelaz u nacrtanu palu pozu | Tri kolone su **varijante vojnika**, četiri reda su poze; nisu četiri klipa sa tri kadra |
| Četnici u rovovima · Neretva | [list](../assets/images/armies/game-ready/vojnici/cetnici-spreda.png), isti TrenchSoldier | Kao Nemci | Kao Nemci | Kao Nemci | Kao Nemci | Iste četiri nacrtane poze i proceduralni prelazi kao kod Nemaca; pregled pokreta u igri ostaje odvojen |
| Okupator · Otpisani | [izvor](../assets/images/sprites/vojnici/okupator-sprite.png), [atlas](../assets/images/armies/game-ready/vojnici/occupier-sprites.png), [Occupier](../core/actor/Occupier.js) | —; stanja su walk/fire/dead | A5 po smeru | A5 `fire`, petlja 0,5 s, mirne noge; zaseban [plamen](../assets/images/pucanje.png) | A5 `umire` | Zaseban šesti red; originalnih pet redova i mere ostaju isti |

## Vozila i nepokretna odbrana

| Akter / igre | Art i izvor upotrebe | Mirovanje | Kretanje | Pucanje | Uništenje | Napomena |
|---|---|---|---|---|---|---|
| Partizanski tenk · Tenkići, Do Trsta | [referentni trup](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-bez-cevi-pixel.png), [atlas u upotrebi](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-sprites.png), [cev](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png), [TenkLevo](../scenes/tenkici/TenkLevo.js), [Tenk](../scenes/tenkici/Tenk.js) | S; original u idle redu | A4 `drive`, 0,64 s; obrnut redosled pri vožnji unazad | P nišanjenje i trzaj odvojene cevi, projektil | S olupine + postojeći požar | ART-01/08 povezano kroz TenkLevo u oba nivoa i Storybook-u |
| Nemački tenk · Tenkići, Do Trsta | [referentni trup](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-bez-cevi-pixel.png), [atlas u upotrebi](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-sprites.png), [cev](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png), [TenkDesno](../scenes/tenkici/TenkDesno.js), [GroundEnemies](../scenes/to-trieste/GroundEnemies.js) | S; original u idle redu | A4 `drive`, 0,64 s; u Do Trsta i tokom paljbe u pokretu | P odvojena cev i projektili | S olupine + postojeći požar | ART-01/08: isti atlas i olupina u TenkDesno i GroundEnemy, uz zasebna sidrišta cevi |
| Hummel · Kluz | [atlas](../assets/images/armies/game-ready/tenkovi/hummel-sprites.png), [izvorni Hummel](../assets/images/armies/hummel.png), [Vehicle](../core/actor/vehicles/Vehicle.js) | S `idle` | A4 `drive` | —; sadašnji Vehicle ne puca | S sopstvene olupine + požar | Izvorni trup, cev i tri člana posade; nove faze gusenica i odgovarajuća olupina |
| Opel Blitz · Kluz | [atlas](../assets/images/armies/game-ready/kamioni/opel-blitz-sprites.png), isti Vehicle | A4 `idle` | A4 `drive` | — | S sopstvene olupine + požar | ART-08 povezan; ista olupina deli se sa Opelom iz Do Trsta |
| Opel Blitz, legija · Kluz | [atlas](../assets/images/armies/game-ready/kamioni/opel-blitz-legion-sprites.png), isti Vehicle | A4 `idle` | A4 `drive` | — | S posebne olupine legije + požar | ART-08 povezan, odgovarajuće oznake sačuvane |
| Oklopni voz BP-42 · Kluz | [atlas](../assets/images/armies/game-ready/vozovi/bp42-sprites.png), isti Vehicle | S `idle`, jedan aktivni kadar | A4 `drive` | — u sadašnjem kodu | S sopstvene olupine + požar | Jedan mirni kadar; vožnja ostaje četvorokadarska |
| Somua S35 · Do Trsta | [atlas](../assets/images/armies/game-ready/tenkovi/somua-s35-sprites.png), [cev](../assets/images/armies/game-ready/tenkovi/somua-s35-barrel.png), [enemyArt](../scenes/to-trieste/enemyArt.js) | S, originalni trup | A4 `drive`, 0,64 s | P odvojena cev | S sopstvene olupine + požar | ART-05/08 povezani; isti sudari i odvojena cev |
| Opel Blitz · Do Trsta | [prethodni SVG](../assets/images/armies/game-ready/kamioni/opel-blitz.svg), [zajednički atlas u upotrebi](../assets/images/armies/game-ready/kamioni/opel-blitz-sprites.png), isti enemyArt | A4 `idle` | A4 `drive`, 0,64 s; skrolovanje ne pokreće točkove | — | S deljene Opelove olupine + požar | ART-04/08: isti atlas/olupina kao Kluz; sudarni okvir 137×60 |
| Partizanski čamac · Čamac | [slika](../assets/images/armies/camac.png), [TopDownPlayerBoat](../core/actor/TopDownPlayerBoat.js), [Boat](../scenes/camac/Boat.js) | S | P plovidba i efekti vode | P projektili | S oštećenog trupa; zaustavljanje | ART-11: nova oštećena varijanta, isti Boat i reset u nivou/Storybook-u |
| Schnellboot S-30 · Čamac | [SVG](../assets/images/armies/game-ready/brodovi/schnellboot-s30.svg), [SBoat](../scenes/camac/SBoat.js) | S | P plovidba, voda | P pokretne cevi | P potonuće / olupina | ART-11: pregledani izvorni trup i faze potonuća; pokret u igri odložen |
| Flak 38 · Kluz | [postolje](../assets/images/armies/game-ready/artiljerija/flak38-postolje.png), [cev](../assets/images/armies/game-ready/artiljerija/flak38-cev.png), [Flak](../core/actor/artillery/Flak.js) | S + mirna poza posade | — | P cev/plamen/projektil + A4 rad posade pri hicu | S olupine + A4 pad posade + požar | ART-08/11 povezani; zasebne posade i cev, nepromenjeni sudari |
| Topovi · Ustanak | [cev](../assets/images/armies/game-ready/artiljerija/top-cev.gif), [Top](../scenes/ustanak/Top.js), posade gore | S; GIF cevi ima jedan kadar | — | P cev/trzaj/točak + A4 posade | Postojeći prikaz ishoda, bez posebnog lista topa | Nije „animirani GIF topa”; važna radnja već ima animiranu posadu |
| PaK 38 · Do Trsta | [postolje](../assets/images/armies/game-ready/artiljerija/pak38-postolje.png), [cev](../assets/images/armies/game-ready/artiljerija/pak38-cev.png), isti GroundEnemies | S + mirna poza posade | — | P odvojena cev/projektili + A4 rad posade | S olupine + A4 pad posade | ART-08/11 povezani kroz GroundEnemy; zasebna cev |
| Mitraljesko gnezdo · Čamac | [SVG](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg), [ShoreMachineGun](../scenes/camac/ShoreMachineGun.js) | S | — | P cevi, plamen, projektili i prikaz posade | P prikaz uništenja i pale posade | ART-11: odvojena posada i nacrtana odbačena puška već postoje; pregled pokreta odložen |
| Bunkeri · Do Trsta | [kuća](../assets/images/buildings/kuca-bunker.png), [bunker](../assets/images/buildings/bunker-02.png), [Bunker](../scenes/to-trieste/Bunker.js) | S | — | P oružje/projektili | S odgovarajuće ruševine + postojeći efekti | ART-08: oba izgleda povezana kroz zajednički Bunker |

## Avioni

| Akter / igre | Art i izvor upotrebe | Glavna stanja danas | Napomena |
|---|---|---|---|
| Potez 25, obe oznake · Kluz | [Potez](../scenes/franjo-kluz/Potez.js): trupovi [partizanski](../assets/images/armies/game-ready/avioni/potez-25-partisan-bez-mitraljeza.png) / [NDH](../assets/images/armies/game-ready/avioni/potez-25-ndh-bez-mitraljeza.png), [posada](../assets/images/armies/game-ready/avioni/potez-25-posada-sprites.png), [propeler](../assets/images/armies/game-ready/avioni/potez-25-propeler-sprites.png), [mitraljez](../assets/images/armies/game-ready/avioni/potez-25-zadnji-mitraljez.png) | U igri ceo pixel art: A4 `idle` posade / 1,6 s, A4 `spin` propelera / 0,12 s i mitraljez koji prati cilj | Ugrađeno i odobreno, i u obe storybook priče. [Ugovor slojeva](../assets/images/armies/sources/franjo-kluz/potez-crew/crew.json), [opisi atlasa](../assets/images/armies/sources/franjo-kluz/potez-crew/sprites.json), [pregled](../assets/images/armies/sources/franjo-kluz/potez-crew/preview.html). Potezov propeler ne izrađivati ponovo kroz ART-10 |
| Bf 109 · Kluz | [telo](../assets/images/armies/game-ready/avioni/bf109-telo.png), [propeler](../assets/images/armies/game-ready/avioni/bf109-propeler.png), [Fighter](../core/actor/aircraft/Fighter.js) | S trupa, P stvarno pomeranje odvojenog propelera, nalet/paljba/pad | Ne označavati propeler kao nedostajući samo zato što nema atlasa |
| Ju 87 · Kluz, Do Trsta | [SVG](../assets/images/armies/game-ready/avioni/ju87.svg), [DiveBomber](../core/actor/aircraft/DiveBomber.js), [Aircraft](../scenes/to-trieste/Aircraft.js) | S istog trupa + A4 odvojene elise; P let/obrušavanje/bomba/pad | ART-10 povezan kroz DiveBomber i Aircraft; ista izmerena osovina |
| Bf 109 · Do Trsta | [SVG](../assets/images/armies/game-ready/avioni/bf109.svg), isti Aircraft | S istog trupa + A4 odvojene elise; P putanja/napad/pad | ART-10 povezan kroz Aircraft, uz elisu prilagođenu ovom trupu |
| Spitfire Mk Vb · Vis | [slika](../assets/images/armies/partizani/avioni/spitfire-mkvb-realistic.png), [Avionce](../scenes/vis/Avionce.js), [PlayerView](../scenes/vis/PlayerView.js) | S tela odozgo, P propeler, kretanje, luping, bomba/paljba i treptanje pri zaštiti | ART-11: postojeća elisa i pad ostaju; browser pregled odložen |
| Hurricane Mk IV · Vis | [slika](../assets/images/armies/partizani/avioni/hurricane-mkiv-realistic.png), isti Avionce | Isto | ART-11: postojeća elisa i pad ostaju; browser pregled odložen |
| Breguet 19 · Vis | [slika](../assets/images/armies/partizani/avioni/breguet-19-realistic.png), isti Avionce | Isto | ART-11: postojeća elisa i pad ostaju; browser pregled odložen |
| Yak-1b · Vis | [slika](../assets/images/armies/partizani/avioni/yak-1b-realistic.png), isti Avionce | Isto | ART-11: postojeća elisa i pad ostaju; browser pregled odložen |
| Nemački lovci · Vis | [Bf 109](../assets/images/armies/nemci/avioni/bf-109-odozgo.png), [Fw 190](../assets/images/armies/nemci/avioni/fw-190-odozgo.png), [Enemy](../scenes/vis/Enemy.js) | S tela, A4 propelera; P let/paljba/pogibija | ART-10/11: obe varijante povezane kroz Enemy, postojeći pad ostaje |
| Bf 110 · Vis | [slika](../assets/images/armies/nemci/avioni/bf-110-odozgo.png), isti Enemy | S tela, A4 oba propelera; P let/paljba/pogibija | ART-10/11: obe osovine povezane kroz isti Enemy |
| He 111 · Vis | [slika](../assets/images/armies/nemci/avioni/he-111-odozgo.png), [Boss](../scenes/vis/Boss.js) | S tela, A4 oba propelera; P let/paljba/pogibija | ART-10/11: obe osovine povezane kroz Boss/Enemy; bez suvišnog idle atlasa |

## Pravila pripreme i ponovne upotrebe

1. **Tenkovi:** prvo jedan tenk kao stilski i tehnički uzor, potom drugi. Referenca je postojeći trup, prikazan približno 120–180 px široko, ne proizvoljan novi model tenka. Najpre odvojena petlja vožnje sa najmanje četiri jasno različita položaja gusenica; horizontalno kretanje daje igra. Idle može ostati postojeći kadar. Cev, oslonac cevi, smer, proporcije, transparentne margine, baseline i sudarne mere ostaju nezavisni od novih ćelija. Tek nakon pregleda nove petlje pripremati ostala glavna stanja koja zaista traže novi crtež.
2. **Ranjenik i patrole:** puzanje i hod su glavna vidljiva radnja igrača/patrole; pre dopune bili su pomeranje jedne slike. Čuvati postojeći pogled odozgo, likove, uniforme i sva tri čoveka u grupi. Ne preuzimati bočnog vojnika iz Kluza kao zamenu za taj pogled.
3. **Ponovna upotreba vozila:** isti naziv Opel Blitz nije dovoljan dokaz da se atlas uklapa. Uporediti pogled, smer, dimenzije i stil pre povezivanja; ako se koristi postojeći atlas, ne menjati sudare zbog njegovog padding-a.
4. **Atlasi Ustanka:** u Ustanku kod bira po četiri kadra u redu; sada su sidrišta i trajanja opisana i povezana kroz zajednički manifest. Listovi uključuju 1774×887, 1263×1246 i 1254×1254, pa ćelije nisu svuda celobrojne; to je važeći izvorni pravougaonik Canvas-a, a ne dokaz greške. Pošto neprozirne siluete ne dotiču susedne ćelije, prihvaćeni listovi nisu prepakivani niti precrtavani.
5. **Pregled izvornika pre tumačenja plana:** mitraljezac 63×27 je krupan kadar, a patrole sadrže tri čoveka; naziv klase/opis u planu nisu dovoljni da se pretpostavi celo telo ili broj ljudi. Generator može ostaviti poluprovidan svetli veo ili prekinuti tanke crne cevi. Meriti stvarnu alfu, pregledati na neprozirnoj podlozi i u veličini igre, sačuvati pokušaje i ispraviti izvor pre pakovanja. Različiti hashes ne dokazuju čitljiv pokret.

## Uslovi završetka zadataka

Svaki zadatak dopune aktera završava se upotrebljivim resursom, sačuvanim izvorom, opisom kadrova/slojeva, sidrišta i trajanja, povezivanjem sa kodom i pregledom u Storybook-u i svim pogođenim nivoima. Izrada i integracija beleže se odvojeno kao dokazi, ali status cele stavke ostaje `🔄 In progress` dok oba dela i potrebne provere nisu završeni. Obnoviti ovaj indeks i njegova merenja. Postojeći efekti nisu dokaz da nedostajući crtež tela postoji, ali proceduralni prikaz radnje nije sam po sebi mana. Za pozadine važi poseban obim i podela [ART-12](PLAN-ART.md#art-12-priprema-i-izrada).

Ako vlasnik izričito odloži neku proveru, dovršena izrada i integracija mogu imati `✅ Done` uz navedenu neizvršenu proveru i njegovu odluku; to nije tvrdnja da je pregled obavljen. Bez takve odluke važe svi navedeni uslovi završetka.

<a id="obavezna-integracija"></a>

### Obavezan korak svake dopune: kod, Storybook i svi nivoi

1. **Naći sve potrošače.** Pre povezivanja pretražiti putanje starog resursa, klasu objekta i njegove fabrike/konfiguracije. Zabeležiti sve nivoe i Storybook priče koje koriste isti objekat, uključujući posebne konfiguracije istog arta.
2. **Povezati u zajedničkom kodu objekta.** U istoj stavci uvesti novi resurs i mapiranje stanja u zajedničku klasu ili konfiguraciju koju koriste nivoi. Ako nivoi imaju odvojene stare putanje ili fabrike, prebaciti ih na to zajedničko mapiranje u okviru istog posla. Promena se tada automatski vidi u svim postojećim i budućim nivoima koji koriste objekat; ne ostavljati ručnu zamenu slike po nivou kao naknadni posao. Čuvati mere za sudare, smer, sidrišta, odvojene cevi i različite istorijske varijante.
3. **Omogućiti pregled u Storybook-u.** Dopuniti postojeću priču ili dodati nedostajuću priču igrača/neprijatelja kroz [katalog](../storybook/stories/index.js). Priča mora stvarati isti objekat sa istim mapiranjem arta kao igra i omogućiti relevantna stanja/radnje; ne praviti posebnu kopiju animacije samo za pregled. Link do priče uneti uz rezultat stavke. Izdvojeni HTML/GIF ostaju pomoćni izvori.
4. **Proveriti Storybook i sve pogođene nivoe.** Proveriti stvarno učitavanje novog resursa, stanja, prelaze, mirovanje, kretanje i završnu pozu kada postoje, kao i sidrišta, razmeru, cevi i sudare. U nivoima proveriti i pauzu/nastavak i ponovno stvaranje objekta. Gde nivo već pomera miran objekat skrolovanjem, to ne sme pokretati animaciju vožnje. Zabeležiti koji nivoi/priče i provere su stvarno pregledani; pokretanje izvršnih provera prati važeću dozvolu, a neizvršena potrebna provera ostaje otvoren deo zadatka.
5. **Zatvoriti tek celinu.** `✅ Done` znači da art radi kroz zajednički kod, dostupan je u Storybook-u i koristi se u svim pronađenim nivoima, uz zabeležene provere i obnovljen indeks. Gotov fajl, izbor postojećeg atlasa ili samostalni pregled ne ispunjavaju ovaj uslov. Pravilo važi i za ponovno upotrebljen art i tehničko prepakivanje postojećeg lista.

## Resursi i zajednički potrošači

**Tenkovi i Opel — zajednički potrošači:** tenkovi su povezani kroz [Tenk](../scenes/tenkici/Tenk.js) i potrošače nemačkog trupa u [GroundEnemies](../scenes/to-trieste/GroundEnemies.js), u Tenkićima i Do Trsta, kao i u postojećim pričama [partizanskog tenka](../storybook.html#vozila/partizanski-tenk), [nemačkog tenka](../storybook.html#vozila/nemacki-tenk) i [nemačkog tenka iz Do Trsta](../storybook.html#vozila/nemacki-tenk-do-trsta). Opel je povezan kroz zajednički izbor arta kamiona u Do Trsta; isti atlas koristi Kluz, uključujući priče [Opela iz Do Trsta](../storybook.html#vozila/opel-blitz-do-trsta) i [Opela iz Kluza](../storybook.html#vozila/opel-blitz). To su svi potrošači pronađeni pretragom putanja, klasa i konfiguracija. Granice izvršenih provera vodi [TESTING](TESTING.md#art-verification-record).

### Tenkovi

[metapodaci](../assets/images/armies/sources/tenkovi/sprites.json), [recept](../assets/images/armies/sources/tenkovi/manifest.json), [priprema](../assets/images/armies/sources/tenkovi/prepare.py), [imagegen opisi](../assets/images/armies/sources/tenkovi/prompts.json) i pomoćni [pregled](../assets/images/armies/sources/tenkovi/preview.html). Kadrovi ostaju 300×129 i 327×137, sa originalnim statičnim `idle` redom i četiri različita `drive` kadra. Providnost i pikseli izvan maske gusenica ostaju originalni. Pregledani stripovi: [150 px](../assets/images/armies/sources/tenkovi/previews/partizanski-tenk-drive-game-size.png) / [121 px](../assets/images/armies/sources/tenkovi/previews/nemacki-tenk-drive-game-size.png); GIF-ovi: [partizanski](../assets/images/armies/sources/tenkovi/previews/partizanski-tenk-drive.gif) / [nemački](../assets/images/armies/sources/tenkovi/previews/nemacki-tenk-drive.gif). Zajednički [VehicleSprite](../core/actor/VehicleSprite.js) prikazuje atlas bez promene mera aktera, a [generisani opis](../core/actor/vehicleArt.js) koriste TenkLevo, TenkDesno i nemački GroundEnemy. Time su povezani svi pronađeni potrošači u Tenkićima, Do Trsta i postojećim Storybook pričama. Sidrišta cevi ostaju različita prema postojećim potrošačima. Animacija prati pomeranje, menja smer unazad i staje pri uništenju; prvi korak posle pauze ima `dt=0`, pa taj korak čuva prethodnu fazu umesto da nepomeranje protumači kao prelazak na idle.

### Opel Blitz

Postojeći Opel iz Kluza koristi bočni pogled ulevo, otvoreni sanduk sa četiri nosača, dva vidljiva točka, oznaka vrata i tamni obrubi. Nije izrađen niti kopiran novi atlas. [Opis korišćenja](../assets/images/armies/sources/do-trsta/opel-blitz.json) zadržava iste klipove i okvir 137×60; sadržajni okvir (15, 7)–(306, 149) proporcionalno se uklapa i centrira. Pregledani su [kadrovi u veličini igre](../assets/images/armies/sources/do-trsta/previews/opel-blitz-drive-137.png); dostupni su [GIF](../assets/images/armies/sources/do-trsta/previews/opel-blitz-drive-137.gif), pomoćni [pregled sa prethodnim SVG-om](../assets/images/armies/sources/do-trsta/preview.html) i [priprema](../assets/images/armies/sources/do-trsta/prepare.py). GroundEnemy i njegova Storybook priča sada koriste isti atlas i iste definicije klipova kao Kluzov Vehicle. Vožnja se prikazuje kad se brzina razlikuje od skrolovanja, uključujući paljbu u pokretu; uništeni kamion drži idle kadar 0, a reset vraća početnu fazu. Izmene nisu zahvatile Kluzov Vehicle.

**Obnavljanje opisa vozila:** [izvoz opisa vozila](../scripts/prepare-vehicle-art.py) generiše zajednički runtime modul iz postojećih tank metapodataka i Opel opisa; obe pripremne skripte ga pozivaju automatski.

Nepostojeće sposobnosti aktera ne dodaju se da bi tabela imala animaciju u svakoj koloni. Rezervni listovi ispod služe kao mogući izvori za konkretan zadatak, ne kao obaveza prerade svih nekorišćenih slika.

### Somua S35

[atlas](../assets/images/armies/game-ready/tenkovi/somua-s35-sprites.png), [četiri faze u veličini igre](../assets/images/armies/sources/tenkovi/previews/somua-s35-drive-game-size.png), [GIF](../assets/images/armies/sources/tenkovi/previews/somua-s35-drive.gif) i [tačan prompt](../assets/images/armies/sources/tenkovi/somua-prompt.json). Zajednički [vehicleArt](../core/actor/vehicleArt.js) i [enemyArt](../scenes/to-trieste/enemyArt.js) povezuju isti atlas sa Do Trsta i postojećom [Storybook pričom](../storybook.html#vozila/somua-s35). Ćelija 379×166 je mehanički uzorak izvornog trupa na petinu rezolucije; van maske gusenica boje i alfa su identični tako uzorkovanom originalu. Četiri faze petlje 0,64 s su različite, cev i fizičke mere 151×(151/1895×830) ostaju iste.

### Bombaš i Okupator

[Bombašev atlas](../assets/images/armies/game-ready/vojnici/bombas-sprites.png), [šest faza pada u veličini igre](../assets/images/armies/sources/infantry-art/previews/bombas-death-game-size.png), [GIF](../assets/images/armies/sources/infantry-art/previews/bombas-death.gif), [metapodaci](../assets/images/armies/sources/infantry-art/sprites.json) i [priprema](../assets/images/armies/sources/infantry-art/prepare.py). Dva stara reda mirovanja/hoda ostaju identična; novi treći red ima šest kadrova, 0,6 s, bez ponavljanja i sa zadržanim poslednjim kadrom čak pri velikom `dt`. Isti Grenadier/GrenadierSprite koriste Bunker i postojeća [priča Bombaša](../storybook.html#vojnici/bombas), sa dostupnim završnim stanjem. Ranije [odbijene generacije](../assets/images/armies/sources/infantry-art/occupier-attempts.json) ostaju zabeležene; zaseban uspešan izvor sada daje namenski vatreni klip opisan niže.

### Atlasi Ustanka

[pet izmerenih atlasa](../assets/images/armies/sources/ustanak/sprites.json), [priprema](../assets/images/armies/sources/ustanak/prepare.py), [pregled postojećih klipova](../assets/images/armies/sources/ustanak/preview.html) i zajednički [ustanakArt](../core/actor/ustanakArt.js) koji koriste Posada, Strelac i Zastavnik, pa isti podaci važe u nivou i postojećim Storybook pričama. Slike nisu menjane. Razlomljene ćelije su važeći postojeći izvorni pravougaonici; nijedna silueta sa alfom ≥128 ne dodiruje ivicu ćelije, pa prepakivanje prihvaćenog arta nije potrebno. Opisani su aktivni redovi, trajanja, sidrišta i neupotrebljeni prvi red zajedničkog lista zastavnika.

### Mitraljezac iz Bunkera

[atlas](../assets/images/armies/game-ready/vojnici/mitraljezac-sprites.png), [četiri kadra u veličini igre](../assets/images/armies/sources/bunker-gunner/fire-game-size.png), [GIF](../assets/images/armies/sources/bunker-gunner/fire.gif), [metapodaci](../assets/images/armies/sources/bunker-gunner/sprites.json), [priprema](../assets/images/armies/sources/bunker-gunner/prepare.py) i [prompt](../assets/images/armies/sources/bunker-gunner/prompt.json). Mirovanje čuva original 63×27; četiri vatrene poze traju 0,1 s po prihvaćenom hicu. Sidrište ostaje donji desni ugao, a projektil polazi iz izmerenog vrha cevi, rotiranog zajedno sa slikom. Isti MachineGunner koriste Bunker i [postojeća priča](../storybook.html#vojnici/mitraljezac). Rafali i pauze ostaju u postojećem kodu oružja.

### Olupine kopnenih ciljeva

[partizanski tenk](../assets/images/armies/game-ready/wrecks/partisan-tank.png), [nemački tenk](../assets/images/armies/game-ready/wrecks/german-tank.png), [Somua](../assets/images/armies/game-ready/wrecks/somua-s35.png), [Hummel](../assets/images/armies/game-ready/wrecks/hummel.png), [Opel](../assets/images/armies/game-ready/wrecks/opel-blitz.png), [Opel legije](../assets/images/armies/game-ready/wrecks/opel-blitz-legion.png), [BP-42](../assets/images/armies/game-ready/wrecks/bp42.png), [Flak](../assets/images/armies/game-ready/wrecks/flak38.png), [PaK](../assets/images/armies/game-ready/wrecks/pak38.png), [kuća-bunker](../assets/images/armies/game-ready/wrecks/house-bunker.png) i [bunker](../assets/images/armies/game-ready/wrecks/bunker.png). [Metapodaci](../assets/images/armies/sources/wrecks/sprites.json), [priprema](../assets/images/armies/sources/wrecks/prepare.py), [pregled](../assets/images/armies/sources/wrecks/preview.html) i [zajedničko mapiranje](../core/actor/wreckArt.js). Svaki izvor i prompt je sačuvan; ćelija i linija tla nasleđuju živi model. VehicleSprite, GroundTarget i Renderer2D biraju olupinu samo dok je stvarni akter mrtav, uz bezbedan prethodni kadar dok se slika učitava. Tenkovi, GroundEnemy, Vehicle, Flak i oba Bunkera zato koriste iste olupine u Tenkićima, Do Trsta, Kluzu i postojećim Storybook pričama. Operativne cevi se skrivaju, efekti požara ostaju, reset vraća živi art.

### Propeleri aviona

[bočni atlas](../assets/images/armies/game-ready/avioni/propeller-side-sprites.png), [atlas odozgo](../assets/images/armies/game-ready/avioni/propeller-top-sprites.png), [metapodaci sa svim osovinama](../assets/images/armies/sources/aircraft-propellers/sprites.json), [priprema iz izvornih SVG slojeva](../assets/images/armies/sources/aircraft-propellers/prepare.py), [GIF pregledi svih šest modela](../assets/images/armies/sources/aircraft-propellers/preview.html) i [četiri faze sa trupovima u veličini igre](../assets/images/armies/sources/aircraft-propellers/propellers-game-size.png). Postojeći trupovi imaju glavčine, bez precrtane elise preko prečnika, pa nije potrebno menjati njihove piksele/putanje. Četiri projekcije elise gledane s boka/odozgo daju petlju 0,12 s; svaka osovina je u izvornim koordinatama svog aviona. AircraftPropellers se ugrađuje u DiveBomber, Aircraft i Enemy (uključujući Boss), a Renderer2D crta slojeve pod istom rotacijom, ogledanjem i skalom kao trup. Time su pokriveni Kluz, Do Trsta i Vis i postojeće priče Ju 87, Bf 109, Fw 190, Bf 110 i He 111; prihvaćeni drugi propeleri ostaju isti. Zaustavljen motor, smrt i `dt=0` zadržavaju fazu.

### Posade i proceduralna stanja

[statičan pregled stvarnih veličina](../assets/images/armies/sources/actor-state-review/states-game-size.png), [imenovani nalazi i postupci](../assets/images/armies/sources/actor-state-review/review.json) i [priprema pregleda](../assets/images/armies/sources/actor-state-review/prepare.py). Izrađeni su [Flakova posada](../assets/images/armies/game-ready/artiljerija/flak38-crew-sprites.png), [PaK-ova posada](../assets/images/armies/game-ready/artiljerija/pak38-crew-sprites.png), [metapodaci posada](../assets/images/armies/sources/infantry-art/crew-sprites.json), [priprema](../assets/images/armies/sources/infantry-art/prepare-crews.py), [pregled sa oruđima](../assets/images/armies/sources/infantry-art/previews/crews-game-size.png), [mitraljesčev pad](../assets/images/armies/sources/bunker-gunner/death-game-size.png) i [oštećen čamac](../assets/images/armies/game-ready/wrecks/player-boat.png). Posade imaju mirnu pozu, četiri radne faze pokrenute stvarnim hicem i četiri faze pada; GunCrew ih crta iza postojećeg oruđa, bez promene sudara, uz zadržanu završnu pozu i reset. MachineGunner dobija terminalno stanje i neponovljiv pad 0,6 s. Boat koristi istu stvarnu klasu u nivou i Storybook-u, dostupno stanje poraza i zajednički izbor oštećenog trupa. Potonuće S-30 (4 s, skaliranje/providnost, voda i dim), oba rovovska lista (tri varijante i četiri već nacrtane poze), obalska posada i proceduralni pad aviona već imaju prikaz radnje; ovaj pregled nije našao razlog za dupliranje tih prihvaćenih poza.

### Ranjenik i patrole

[partizan](../assets/images/armies/game-ready/vojnici/wounded-sprites.png), [nemačka patrola](../assets/images/armies/game-ready/vojnici/german-patrol-sprites.png), [italijanska patrola](../assets/images/armies/game-ready/vojnici/italian-patrol-sprites.png), [metapodaci](../assets/images/armies/sources/ranjenik/sprites.json), [priprema](../assets/images/armies/sources/ranjenik/prepare.py), [pregled](../assets/images/armies/sources/ranjenik/preview.html) i [prikaz u veličini igre](../assets/images/armies/sources/ranjenik/previews/ranjenik-game-size.png). Svaki atlas čuva originalne piksele mirovanja i dodaje četiri različite faze: puzanje 1,2 s, patrolni hod 0,8 s. Sve tri figure ostaju u svojoj nacionalnoj grupi; izvorne mere 69×27, 71×80 i 71×78 i centralna sidrišta ostaju ista. LocomotionSprite crta atlas pod postojećom rotacijom; WoundedSoldier ga pokreće stvarnim pomeranjem, Patrol stanjem `search`, a `halt` odmah bira sačuvani original. Postojeće priče [ranjenika](../storybook.html#vojnici/ranjeni-partizan), [nemačke](../storybook.html#vojnici/nemacka-patrola) i [italijanske patrole](../storybook.html#vojnici/italijanska-patrola) i nivo stvaraju iste klase. Prelaz u drugi deo nivoa takođe koristi zajednički `Patrol.setFaction('italian')`, koji zajedno menja atlas, opis kadra i mere.

**Priprema patrola:** svi originalni gornji delovi tela, glave, puške i raspored grupe ostaju identični. Iz generisanih faza izdvojeni su koraci svakog čoveka i preneti na njegovo izvorno mesto jednom fiksnom registracijom za sve četiri faze; van tih donjih maski pikseli ostaju originalni. Priprema proverava bar dve različite faze za svakog od sva tri čoveka, a četiri za ceo klip. Italijanski svetli veo uklonjen je generatorom; odbijen pokušaj dodatne popravke i svi izvori ostaju sačuvani, bez potrebe za novim potezima na prihvaćenim puškama.



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

## Pozadine i stilske probe

**Živi elementi u ambijentu:** ljudi, zastave, životinje, pokretna vozila, dim i plamen ne ostaju zamrznuti u osnovnom PNG-u. Ako ih scena sadrži, moraju biti odvojeno animirani i pratiti vreme scene, uključujući pauzu. U protivnom se uklanjaju iz osnove. Naslikana zvezda ili grafit na zidu ostaju statični. Voda je po izričitoj odluci vlasnika zasad mirna; pokušaj sa svetlim tragovima je odbačen. Nova izabrana grupa nema naslikane ljude, zastave, oblake ni dim/plamen; ranije verzije koje ih imaju ostaju samo arhivske reference.

**Postojeći resursi:** Codex je nacrtao Bihać, Drvar, Neretvu, Sutjesku i Užice (svaka 1536×1024, linija tla na 80 % visine, [metapodaci](../assets/images/sources/pozadine/backgrounds.json)). Bihać, Drvar i Užice su ugrađeni u smenu bojišta Tenkića kroz [BattleBackground](../scenes/tenkici/BattleBackground.js), uz žarišta vatre i dima iz metapodataka. Sutjeska nema zapis u metapodacima (linija tla i žarišta), pa nije ugrađena dok ga Codex ne doda. Pozadina Neretve je bočna, kao ostale, i ne odgovara igri Neretva, koja gleda pravo u rovove; zaseban zahtev za taj pogled vodi [IG-01](PLAN-ZA-IGRE.md#ig-01).

**Razrada ratne atmosfere:** [poređenje B2 i B3 sa jedinicama](../assets/images/sources/pozadine/styles/scene-preview.html), [B2 — grafit, zastava i nagoreli zidovi](../assets/images/sources/pozadine/styles/b2-partisan-atmosphere.png), [B3 — ljudi i mali ratni prizori](../assets/images/sources/pozadine/styles/b3-lived-wartime-scene.png). B3 dodaje mitraljesko mesto, dalekog stražara, patrolu, porodicu u zaklonu i borce između zaklona. Izvornici, stvarni promptovi i hash referenci sačuvani su kroz [manifest proba](../assets/images/sources/pozadine/styles/manifest.json). Obe su zasebne sačuvane probe; nisu ugrađene u igru niti konačno prihvaćene.

**Stilske probe:** [uporedni pregled](../assets/images/sources/pozadine/styles/preview.html) prikazuje isti Bihać u tri različita pravca: [A — arkadni sa obrubima](../assets/images/sources/pozadine/styles/a-8bit-arcade.png), [B — 16-bit bez obruba](../assets/images/sources/pozadine/styles/b-16bit-clusters.png) i [C — grubi monohromatski](../assets/images/sources/pozadine/styles/c-four-color-handheld.png), uz postojeće jedinice radi poređenja. [Tačni promptovi i izvori](../assets/images/sources/pozadine/styles/manifest.json), [priprema kompozicija](../assets/images/sources/pozadine/styles/prepare.py) i [dokaz očuvanih izvornika](../assets/images/sources/pozadine/styles/review.json). To su probe, bez izbora konačnog stila ili ugradnje; ostatak grupe se ovim ne nastavlja automatski. Browser i igra nisu pokretani.

Preostala izrada, usmerenje vlasnika i uslovi predaje nalaze se u [ART-12](PLAN-ART.md#art-12-priprema-i-izrada); ove probe ne predstavljaju odobren konačni stil.

## Održavanje i granice dokaza

**Čuvanje izvora pozadina:** stilske probe sa izvorima i jedinstveni pokušaj Kozare ostaju sačuvani. Pet izabranih generacija i dva projektna uzora čuvaju se jednom, na postojećim kanonskim putanjama; zapisi generacija zadržavaju prvobitne nazive i hashove, uz `preservedImage`/`repositoryImage` za pronalaženje sačuvanih piksela. Preuzete istraživačke fotografije zamenjuju njihovi zabeleženi URL-ovi i hashovi. Podrazumevani `prepare.py` obnavlja lagani HTML pregled iz postojećih slika, bez ponovnog kopiranja uzora i bez menjanja `backgrounds.json` koji koriste igre. Velike lokalne kompozicije sa jedinicama prave se samo opcijom `--compositions`; eksplicitni izvoz predaje je zaseban `--export-handoff`. Pregledi u veličini igre i ranija merenja nisu novo odobrenje pozadina.

Svako dodavanje aktera, zamena arta ili promena mapiranja stanja zahteva ažuriranje odgovarajućeg reda i ponovno generisanje merenja. Hash označava tačnu pregledanu datoteku, ne kvalitet ili odobrenje slike. Novi art se čuva uz ostalu opremu iste vrste, sa izvorom i metapodacima; pre povezivanja proveravaju se stvarni različiti kadrovi, sidrište, providnost i izgled u veličini igre. Izvršene provere i njihova ograničenja beleže se u [TESTING](TESTING.md#art-verification-record), a statusi dopuna u [planu](PLAN-ART.md).


## Dorade Hummela, BP-42 i Okupatora

Hummel koristi providni izvornik 298×138, postavljen na (11,10) u ćeliji 320×160, sidrište (160,148). Mirovanje je jedan kadar, vožnja četiri faze generisanih gusenica pod maskom; originalna alfa, trup, cev i tri člana posade ostaju isti. [Izvor i tačni promptovi](../assets/images/armies/sources/franjo-kluz/hummel-native-generation.json), [novi izvor faza](../assets/images/armies/sources/franjo-kluz/hummel-native-tracks-generated.png), [recept](../assets/images/armies/sources/franjo-kluz/manifest.json) i [odgovarajuća olupina](../assets/images/armies/game-ready/wrecks/hummel.png). Vehicle, Kluz i postojeća priča koriste isto mapiranje.

BP-42 u istom atlasu 4×2 ima jedan aktivni kadar mirovanja i četiri vožnje; ćelija 576×256 i sidrište (288,232) ostaju isti. Priprema, GIF, metapodaci i runtime izvoz poštuju broj aktivnih kadrova po klipu; GroundTarget prihvata taj broj uz broj kolona kao podrazumevanu vrednost za stare opise. Izvorni prompt ostaje u originalPrompt, a novi zahtev izričito zabranjuje vibraciju parkiranog vagona.

Okupatorov [atlas](../assets/images/armies/game-ready/vojnici/occupier-sprites.png) ima 5×6 ćelija 210×210; prvih pet redova je identično izvorniku. Novi red fire koristi pet faza trzaja ruku/oružja u petlji 0,5 s, uz sačuvane originalne noge, glavu i držanje. [Metapodaci](../assets/images/armies/sources/infantry-art/occupier-sprites.json), [tačan prompt](../assets/images/armies/sources/infantry-art/occupier-fire-generation.json), [priprema](../assets/images/armies/sources/infantry-art/prepare-occupier.py), [GIF](../assets/images/armies/sources/infantry-art/previews/occupier-fire.gif) i [pregled](../assets/images/armies/sources/infantry-art/occupier-preview.html). Otpisani i postojeća Storybook priča stvaraju isti Occupier; hod, pad, sudari i pozivi paljbe ostaju isti.


## Šest ambijenata sadašnjih nivoa

Projektni uzori ostaju [kameno selo](../assets/images/background/crnogorsko-selo-1941-pixel.png) i [razrušeni grad](../assets/images/background/razrusen-grad-ww2-pixel.png); nove slike koriste postojeću [stilsku probu B3](../assets/images/sources/pozadine/styles/b3-lived-wartime-scene.png) kao vizuelnu referencu, bez tvrdnje da je vlasnik prihvatio konačan stil cele grupe.

Šest ambijenata je ugrađeno u Tenkiće i Ustanak. Pet koristi statičnu osnovu sa živim efektima; za Batinu je vlasnik izabrao slojevitu animiranu verziju. Obrisane ranije verzije ne vraćati: njihovi promptovi i hashovi ostaju zapis porekla, a ne zahtev da fajlovi postoje.

| Ambijent | Nivo | Resurs | Dimenzije | Linija tla, izvorni px |
|---|---|---|---|---|
| Sremski front · jesen 1944 | tenkici | [čista osnova](../assets/images/background/sremski-front-1944-static.png) | 1536×1024 | 828 |
| Batina · novembar 1944 | tenkici | [izabrana animirana verzija](../assets/images/sources/pozadine/batina-layered/preview.html) | 1536×1024 | 852 |
| Sremski front · proboj 1945 | tenkici | [čista osnova](../assets/images/background/sremski-front-1945-static.png) | 1536×1024 | 852 |
| Grahovo · 1941 | ustanak | [čista osnova](../assets/images/background/grahovo-1941-war-sparse-static.png) | 1536×1024 | 852 |
| Vilusi · 1941 | ustanak | [čista osnova](../assets/images/background/vilusi-1941-static.png) | 1536×1024 | 854 |
| Okolina Nikšića · 1941 | ustanak | [čista osnova](../assets/images/background/niksic-1941-static.png) | 1536×1024 | 798 |

[Manifest sa stvarnim promptovima i hashovima](../assets/images/sources/pozadine/current-levels.json), [predaja za ugradnju](../assets/images/sources/pozadine/current-backgrounds.json), [pregled sa jedinicama](../assets/images/sources/pozadine/current-preview.html), [ponovljiva priprema](../assets/images/sources/pozadine/prepare-current-levels.py) i [zapis provere](../assets/images/sources/pozadine/current-review.json). Priprema proverava dimenzije, neprozirnost pet statičnih pozadina, hashove izvora i zadržanih referenci, slojeve Batine i granice žarišta; pravi deset kompozicija i link do animiranog pregleda Batine, bez pokretanja igre. Izvornik se čuva jednom na konačnoj PNG putanji, uz prvobitni naziv izlaza generatora.

Pri povezivanju koristiti izmereni groundY svake slike: gornji i donji deo se poravnavaju sa fizičkim tlom, a isti prelom važi i za efekte. Metapodaci žarišta su u punim pikselima izvora; sadašnji BattleBackground radi na upola manjem sloju efekata, pa se obe koordinate moraju dosledno prevesti. Pomoćni pregledi koriste stvarni art jedinica, a nisu simulacija kretanja, borbe, mrežnog učitavanja, zvuka ili živih efekata.


**Svedena proba Grahova** (PNG obrisan po odluci vlasnika): [poređenje sa prethodnom verzijom i jedinicama](../assets/images/sources/pozadine/grahovo-sparse-preview.html), [stvarni prompt i hashovi](../assets/images/sources/pozadine/grahovo-sparse-study.json). Ista rezolucija 1536×1024 i linija tla 852 px; jedna oštećena kuća, mali ostatak zida, jedna sedeća osoba i otvoreno polje. Nema platnene zastave; zvezda na zidu je nepokretna dekoracija. Ovo je sačuvana proba prema novom smeru vlasnika, ne prihvaćena zamena cele grupe.


**Sveden ratni pejzaž:** manje objekata i više praznog prostora ne znači netaknutu livadu. Rat se može čitati iz nekoliko većih tragova u samom tlu — kratera, ugažene zemlje, spaljene trave i urušenog rova — bez vraćanja mnoštva kuća, ljudi i sitnog otpada; pojas za jedinice ostaje miran i prohodan.


**Dorada svedenog Grahova:** [nova slika](../assets/images/background/grahovo-1941-war-sparse-study.png), [prompt i hashovi](../assets/images/sources/pozadine/grahovo-war-sparse-study.json). Otvoreno polje sada ima jedan krater, kratak urušen rov, ugaženu zemlju i nekoliko zgarišta trave, bez vraćanja gustog skupa objekata; rezolucija ostaje 1536×1024, nema zastave. [Poređenje](../assets/images/sources/pozadine/grahovo-sparse-preview.html) čuva sve tri varijante.


## Provera živih elemenata pozadina

Ponovnim pregledom uklonjeni su ljudi, zastave i oblaci iz svih šest izabranih osnova; Grahovo koristi svedenu ratnu varijantu. Raniji izvori sa takvim elementima ne služe kao gotove osnove: ostaju arhiva za poređenje i čuvanje porekla. [Tačni edit promptovi i izvori](../assets/images/sources/pozadine/dynamic-cleanup.json), [pregled pre čišćenja](../assets/images/sources/pozadine/dynamic-audit.webp) i [očišćene kompozicije](../assets/images/sources/pozadine/current-preview.html).

Voda ostaje bez dodatnog efekta. Vlasnik je odbacio svetle proceduralne tragove kao nedovoljno uverljive; renderer, njegovi pozivi i kontrola vode u pregledu su uklonjeni. Buduća animacija vode zahteva novo odgovarajuće rešenje. Ljudi i zastave ostaju zabranjeni u statičnoj osnovi.

Batina ne zahteva water preset. Ugrađena je izabrana animirana verzija sa zasebnim oblacima, zastavom i ljudima; ranije statične varijante ne koristiti umesto nje.

**Arhivski originali sa živim elementima, bez prava na direktnu ugradnju:** [batina-1944](../assets/images/background/batina-1944-pixel.png). Svedene probe sa osobom u vratima takođe su arhivske; za upotrebu izabrana je nova čista osnova.


**Sezona ambijenta:** kada je datum izabrane bitke poznat, zelenilo, sneg po visini, vlažnost tla i svetlo treba da odgovaraju tom delu godine, ne istoj opštoj paleti za sva bojišta. [Vremenski oslonci i izvori](ISTORIJA.md#godišnja-doba-ratnih-ambijenata). Sutjeska se prepoznaje po reci u šumovitom kanjonu; sama planinska panorama nije dovoljna. Nabujala prolećna reka je potvrđen zahtev vlasnika, dok voda zasad ostaje bez odbačenog dodatnog efekta.


## Sezonske varijante rezervnih bojišta

Četiri nove verzije imaju godišnje doba izabrane bitke. Sutjeska je ponovo komponovana oko nabujale reke u šumovitom kanjonu; visok vodostaj je zahtev vlasnika, ne tvrdnja o izmerenom nivou reke 1943.

| Ambijent | Vremenski okvir | PNG | Linija tla |
|---|---|---|---|
| Sutjeska | maj-jun 1943 | [zvanična verzija sa oblacima](../assets/images/background/sutjeska-1943-pixel.png) | 822 px |
| Neretva | februar-mart 1943 | [sezonska verzija](../assets/images/background/neretva-late-winter-1943-pixel.png) | 842 px |
| Drvar | 25. maj 1944 | [sezonska verzija](../assets/images/background/drvar-spring-1944-pixel.png) | 814 px |
| Kozara | jun-jul 1942 | [sezonska verzija](../assets/images/background/kozara-early-summer-1942-pixel.png) | 854 px |

[Tačni promptovi, izvori datuma i hashovi](../assets/images/sources/pozadine/seasonal-backgrounds.json); [uređivanje neba Sutjeske](../assets/images/sources/pozadine/seasonal/sutjeska-sky-edit.json). Nova izdanja su 1536×1024, bez ljudi i zastava; vlasnik je za Sutjesku izabrao verziju sa oblacima, dok su ostale sezonske osnove bez njih. Voda je ilustracija bez dodatnog odbačenog efekta. Dim i plamen ostaju izvan osnovnog PNG-a.

Ove četiri verzije ostaju sezonske rezerve, a nisu dodatni nivoi u postojećem nizu šest ambijenata. Bočna Neretva i dalje nije direktna zamena za frontalni pogled rova u igri Neretva. Bihać i Užice ostaju u jesenjem okviru; šest aktuelnih ambijenata zadržava svoje slike i potvrđeni redosled, uz zabeležene season i battlePeriod oznake. Priprema galerije proverava dimenzije, neprozirnost i hashove svake spremne sezonske verzije i referenci.


## Batina: izabrana animirana pozadina

Vlasnik je izabrao slojevitu animiranu Batinu kao konačnu verziju; Tenkići je koriste u svom postojećem nizu bojišta. [Pregled sa pauzom i poređenjem originala](../assets/images/sources/pozadine/batina-layered/preview.html), [raspored i trajanja](../assets/images/background/batina-1944/layout.json), [tačni promptovi i hashovi](../assets/images/sources/pozadine/batina-layered/generation.json). Statične alternative služe samo kao izvor ili poređenje; konačni prikaz sastavljaju isti renderer i slojevi u igri i pregledu.

[Osnova](../assets/images/background/batina-1944/base.png) nema ljude ni platnenu zastavu; nebo je providno, a originalni odsjaji i tekstura vode sačuvani bez dodatnog efekta. [Oblaci](../assets/images/background/batina-1944/clouds.png) prolaze iza ambijenta. [Atlas](../assets/images/background/batina-1944/actors.png) ima četiri kolone i četiri reda ćelija 128×128: zastava 1,6 s, osmatrač 2,8 s, mitraljezac 3,2 s; sedeći par ima četiri poze koje se ne ponavljaju u stalnoj petlji. Zastavina gornja ivica i donji oslonci ljudi su nepomični; vreće sa peskom se ponovo iscrtavaju preko donjeg dela posmatrača, radi pravilnog zaklanjanja.

[Priprema](../assets/images/sources/pozadine/batina-layered/prepare.py) pakuje [generisane faze](../assets/images/sources/pozadine/batina-layered/actors-generated.png) jednim zajedničkim isečkom i razmerom po redu; ne pretpostavlja da izvor 1254×1254 ima celobrojne ćelije. [Renderer](../scenes/tenkici/renderLayers.js) prima vreme od pozivaoca; u igri ga vodi vreme pozadine, pa pauza zadržava kadar. Učitavanje scene čeka sve slojeve i prijavljuje grešku ako neki nedostaje. Agent nije pokretao browser; izbor izgleda potvrdio je vlasnik.


**Ispravke oznaka i civila u slojevitoj Batini:** zastava je svetla sa crvenom petokrakom; u ovom artu borci nose partizanske kape sa crvenom zvezdom, bez šlemova. To su smernice vlasnika za ovu scenu, ne tvrdnja o svakoj istorijskoj uniformi. [Ispravljen izvor i prompt](../assets/images/sources/pozadine/batina-layered/correction.json). Ne preslikavati pogrešne oznake iz postojeće AI reference bez provere.

Civili ne igraju četiri poze ukrug: neutralna poza preovlađuje, a kratki gest deteta ili majke pojavljuje se posle duže pauze čija se dužina menja. Raspored zavisi od vremena scene i determinističkog semena, pa pauza zadržava isti kadar; ne koristi se zidni sat. Novi izvor ograničava promene na sitne gestove, bez zajedničkog podizanja glava.
