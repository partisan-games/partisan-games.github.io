# ART

Pravila izrade i veze do izvora. Otvoreni poslovi su u [PLAN-u](PLAN.md#art), provere u [TESTING](TESTING.md#art-verification-record), a tema i prihvaćeni izbori igara u [KONTEKST](KONTEKST.md).

## Pravila pripreme i ponovne upotrebe

- Koristiti postojeći odgovarajući resurs pre izrade duplikata. Istorijsko prihvatanje izvora ne znači da je crtež konačan: `game-ready`, novi atlas, povezivanje i prolaz testova nisu ocena kvaliteta.
- Crtati za stvarnu veličinu u igri: čitljiva silueta, uverljive proporcije, usklađena paleta i senčenje. Uvećana ilustracija koja se ne čita kao mali sprite nije upotrebljiva predaja. Proceduralni pokret je dovoljan kada jasno prikazuje radnju.
- Pre izmene utvrditi identitet, pogled, smer, razmeru, sidrište, oslonac i dozvoljene promene. Prazne margine atlasa ne menjaju mere tela i sudara. Isti tip vozila u različitom pogledu nije automatski zamenljiv resurs.
- Sačuvati prihvaćene delove. Za ograničene pokrete proveriti piksele izvan dozvoljene maske; različit hash ne dokazuje dobru animaciju. Nova poza ne sme promeniti razmeru prethodnih kadrova. Razlomljene ćelije postojećeg atlasa nisu same po sebi greška.
- Pregledati alfu, providne rubove i prelivanje u susednu ćeliju na neprozirnoj podlozi. Slab generisani veo može pokvariti granice figure. Poze jednog klipa dele razmeru i registraciju, bez pojedinačnog sabijanja tela.
- Razdvojiti telo, pokretne delove i efekte. Metak/plamen izlazi iz stvarne cevi; bomba ostaje u šaci do otpuštanja. Ogledanje prati ceo sklop i njegove tačke događaja. Rov i teren nisu deo figure; krupan kadar nije celo telo.
- Stvarni propeler menja projekciju oko osovine, ne okreće se kao ploča u ravni slike. Generisano preokrenuta olupina ne sme ponovo dobiti istu rotaciju u igri. Završni kadar pada ostaje prema ugovoru aktera.
- Konačni vojni art čuvati po vrsti opreme u [game-ready](../assets/images/armies/game-ready/). Izvor, stvarni prompt, poreklo, hashovi i ponovljiva priprema ostaju uz resurs; tok pokušaja i duplirani opisi rada ne pripadaju ovoj dokumentaciji.

<a id="stil-aerodromske-posade"></a>
**Stil pešadije:** zadržati projektni piksel stil, ozbiljna odrasla lica i uverljive proporcije. Korekcija karikaturalnosti nije nalog za fotorealizam. Za Otpisane važi njihov [realistični crno-beli stil](KONTEKST.md#otpisani).

## Uslovi završetka zadataka

<a id="obavezna-integracija"></a>
### Obavezan korak svake dopune: kod, Storybook i svi nivoi

1. Pretragom resursa, klase i konfiguracija pronaći sve potrošače.
2. Povezati novi art u zajedničkom prikazu ili mapiranju aktera, uz očuvanje mera, oslonaca i tačaka pucnja. Nivoi i Storybook koriste isti resurs.
3. Omogućiti relevantne radnje u [katalogu aktera](STORYBOOK.md#stavke-kataloga-i-varijante); poseban HTML/GIF nije zamena za priču i upotrebu u igri.
4. Proveriti učitavanje, prelaze, pokret, završetak, oba smera, pauzu i reset u Storybook-u i pogođenim nivoima. Skrolovanje ne pokreće animaciju vožnje mirnog vozila. Izvršne provere prate važeću dozvolu.
5. Sačuvati izvor i metapodatke, obnoviti indeks i zabeležiti stvarne dokaze u TESTING. Stavku zatvoriti kada je dogovorena celina gotova; vlasnikov pregled i izričito odložene provere navode se odvojeno.

## Resursi i zajednički potrošači

Kadar, trajanje, sidrište, tačke događaja i putanje završnih slika čitaju se iz metapodataka ispod. Trenutna stanja i upotreba pripadaju kodu i [Storybook-u](../storybook.html); ovde se ne prepisuju opisi gotovih animacija.

### Pešadija i posade

| Resurs | Metapodaci / izvor |
|---|---|
| Kluz: pešadija i vozila | [sprites](../assets/images/armies/sources/franjo-kluz/sprites.json) |
| Ustanak: strelac, zastavnici i posade | [sprites](../assets/images/armies/sources/ustanak/sprites.json), [hod i pad strelca](../assets/images/armies/sources/partisan-rifleman/sprites.json), [pad posada](../assets/images/armies/sources/cannon-crew-fall/sprites.json) |
| Bombaš | [mirovanje, hod i pad](../assets/images/armies/sources/infantry-art/sprites.json), [bacanje](../assets/images/armies/sources/grenadier-throw/sprites.json) |
| Okupator | [sprites](../assets/images/armies/sources/infantry-art/occupier-sprites.json) |
| Nemac i Četnik spreda | [cele figure](../assets/images/armies/sources/infantry-art/front-standing/sprites.json) |
| Ranjenik i patrole | [sprites](../assets/images/armies/sources/ranjenik/sprites.json) |
| Mitraljezac iz Bunkera | [sprites](../assets/images/armies/sources/bunker-gunner/sprites.json) |
| Posade Flaka i PaK-a | [sprites](../assets/images/armies/sources/infantry-art/crew-sprites.json) |
| Punjenje nemačkog strelca | [sprites](../assets/images/armies/sources/rifleman-reload/sprites.json); klip prati spremnik nacrtanog oružja i nije zamena za punjenje drugih pušaka |

### Vozila i oruđa

| Resurs | Metapodaci / izvor |
|---|---|
| Glavni tenkovi i Somua | [sprites](../assets/images/armies/sources/tenkovi/sprites.json), [priprema slojeva](../scripts/prepare-vehicle-art.py) |
| M15/42, StuG III i Hočkis | [sprites](../assets/images/armies/sources/battlefield-tanks/sprites.json) |
| Hummelov napad | [sprites](../assets/images/armies/sources/hummel-fire/sprites.json) |
| Motociklista sa prikolicom | [atlas i odvojeni mitraljez](../assets/images/armies/sources/plan-ideas-art/sprites.json), [izvor i prompt](../assets/images/armies/sources/plan-ideas-art/generation.json), [ponovljiva priprema](../assets/images/armies/sources/plan-ideas-art/prepare.py) |
| BP-42 napad | [sprites](../assets/images/armies/sources/bp42-fire/sprites.json) |
| Poljski top Ustanka | [sklop](../assets/images/armies/sources/field-gun/layout.json), [priprema](../assets/images/armies/sources/field-gun/prepare.py), [olupina](../assets/images/armies/sources/field-gun/wreck-sprites.json) |
| Olupine | [sprites](../assets/images/armies/sources/wrecks/sprites.json) |
| Odvojene cevi glavnih tenkova | [partizanska](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png), [nemačka](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png), [Somua](../assets/images/armies/game-ready/tenkovi/somua-s35-barrel.png) |
| Delovi oruđa | [poljski top: cev](../assets/images/armies/game-ready/artiljerija/field-gun-barrel-pixel.png) i [lafet](../assets/images/armies/game-ready/artiljerija/field-gun-carriage-pixel.png); [Flak: postolje](../assets/images/armies/game-ready/artiljerija/flak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/flak38-cev.png); [PaK: postolje](../assets/images/armies/game-ready/artiljerija/pak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/pak38-cev.png) |
| Utvrđeni položaji | [kuća-bunker](../assets/images/buildings/kuca-bunker.png), [bunker](../assets/images/buildings/bunker-02.png), [obalni položaj](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg) |
| Osnovni brodovi | [partizanski čamac](../assets/images/armies/camac.png), [S-30](../assets/images/armies/game-ready/brodovi/schnellboot-s30.svg) |

Poljski top Ustanka je zajednički prihvaćen crtež za obe posade. Sličnost sa [Schneiderom 155 L iz 1918.](https://en.wikipedia.org/wiki/Canon_de_155_L_mod%C3%A8le_1918_Schneider) je procena vlasnika i agenta, bez potvrde tipa ili istorijske upotrebe u tom nivou; pri novom artu ne predstavljati ga kao potvrđen laki top od 75 mm.

### Avioni

| Resurs | Metapodaci / izvor |
|---|---|
| Potez: trupovi, posada i delovi | [sprites](../assets/images/armies/sources/franjo-kluz/potez-crew/sprites.json), [sklop](../assets/images/armies/sources/franjo-kluz/potez-crew/crew.json) |
| Propeleri | [sprites i osovine](../assets/images/armies/sources/aircraft-propellers/sprites.json) |
| Bočni avioni | [Bf 109: trup](../assets/images/armies/game-ready/avioni/bf109-telo.png) i [propeler](../assets/images/armies/game-ready/avioni/bf109-propeler.png), [Ju 87](../assets/images/armies/game-ready/avioni/ju87.svg) |
| Avioni igrača odozgo | [Spitfire](../assets/images/armies/partizani/avioni/spitfire-mkvb-realistic.png), [Hurricane](../assets/images/armies/partizani/avioni/hurricane-mkiv-realistic.png), [Breguet 19](../assets/images/armies/partizani/avioni/breguet-19-realistic.png), [Yak-1b](../assets/images/armies/partizani/avioni/yak-1b-realistic.png); [Il-2](../assets/images/armies/partizani/avioni/il-2-realistic.png) samo u katalogu, za neki drugi nivo |
| Nemački avioni odozgo | [Bf 109](../assets/images/armies/nemci/avioni/bf-109-odozgo.png), [Fw 190](../assets/images/armies/nemci/avioni/fw-190-odozgo.png), [Bf 110](../assets/images/armies/nemci/avioni/bf-110-odozgo.png), [He 111](../assets/images/armies/nemci/avioni/he-111-odozgo.png), [lovac 01](../assets/images/armies/nemci/avioni/avion-odozgo-01.png), [02](../assets/images/armies/nemci/avioni/avion-odozgo-02.png), [03](../assets/images/armies/nemci/avioni/avion-odozgo-03.png), [05](../assets/images/armies/nemci/avioni/avion-odozgo-05.png) |

<a id="dopune-iz-plana-ideja--predaja-arta"></a>
### Zajedničke dopune aktera

[Manifest](../assets/images/armies/sources/plan-ideas-art/sprites.json) povezuje nove aktere, reakcije na pogodak i oštećenja. [Priprema](../assets/images/armies/sources/plan-ideas-art/prepare.py), [izvoz u kod](../assets/images/armies/sources/plan-ideas-art/export-runtime.py) i [poreklo](../assets/images/armies/sources/plan-ideas-art/generation.json) su uz resurse. Odbijanje generisanja nije ocena postojećeg arta; nedostajuće resurse i ograničenja vodi [plan](PLAN.md#art).

[Dodatna plovila](../assets/images/armies/sources/camac-enemies/sprites.json) imaju zasebne opise. Generički nacrtan brod ili projektna mera nisu potvrda istorijske klase i njenog prisustva u konkretnoj bici.

### 3D

Modele, skinove i klipove pregledati u [Storybook-u](../storybook.html) i [pregledu animacija](../pregled-animacija.html). Poreklo i licence ostaju uz modele; organizacija kataloga prati [pravila Storybook-a](STORYBOOK.md#stavke-kataloga-i-varijante).

<a id="cannon-kanjon-neretve"></a>
<a id="battle-for-jablanica-kanjon-neretve"></a>
Za Battle for Jablanica važe [kontekst i izbor scene](KONTEKST.md#battle-for-jablanica); [model topa](../assets/models/weapon/cannon/field-gun-75.glb) i podaci scene određuju postojeći prikaz.

## Pravila pripreme i predaje pozadina

- Čitljivi oblici, manje sitnih elemenata i miran prostor iza jedinica. Koristiti istorijski primerenu arhitekturu, sezonu i opremu; [izvori](ISTORIJA.md) određuju granice rekonstrukcije.
- Paletu, osvetljenje i gustinu piksela uskladiti sa prihvaćenim uzorom igre. Loše uklapanje ne prikrivati nasumičnim rotacijama, sečenjem silueta ili globalnim zamućenjem; ponavljanje izdvojenih slika nije zamena za celovit ambijent.
- Osnovna slika nema zamrznute žive ljude, zastave, životinje, vozila, oblake, dim ili plamen. Potrebni živi elementi su odvojeni i prate vreme scene i pauzu prema [pravilima animacije](ANIMACIJA-POZADINE.md). Naslikan znak na zidu može ostati statičan. Voda zasad ostaje mirna po odluci vlasnika; odbačeni efekat svetlih tragova ne vraćati.
- Metapodaci čuvaju dimenzije, liniju tla i žarišta u izvornim pikselima. Linija tla nije horizont ni sidrište čizama. Pri promeni razmere slike jednako prevesti tlo, efekte i projektile.
- Predaja sadrži izvor, stvarni prompt, poreklo, hashove, ponovljivu pripremu i pregled sa jedinicama u 1280×720 i 1024×768. Pozadine i rekviziti imaju svoje preglede, ne zasebne Storybook priče.

<a id="šest-ambijenata-sadašnjih-nivoa"></a>
<a id="batina-izabrana-animirana-pozadina"></a>
### Izvori pozadina

| Grupa | Podaci i pregled |
|---|---|
| Tenkići i Ustanak | [manifest](../assets/images/sources/pozadine/current-levels.json), [podaci za ugradnju](../assets/images/sources/pozadine/current-backgrounds.json), [pregled](../assets/images/sources/pozadine/current-preview.html) |
| Batina | [slojevi](../assets/images/background/batina-1944/layout.json), [pregled](../assets/images/sources/pozadine/batina-layered/preview.html) |
| Do Trsta | [manifest](../assets/images/sources/pozadine/do-trsta/backgrounds.json), [pregled](../assets/images/sources/pozadine/do-trsta/preview.html) |
| Čamac | [metapodaci](../assets/images/sources/pozadine/camac-etape/assets.json), [pregled](../assets/images/sources/pozadine/camac-etape/preview.html) |
| Otpisani | [manifest](../assets/images/sources/pozadine/beograd-1944/backgrounds.json), [pregled](../assets/images/sources/pozadine/beograd-1944/preview.html) |
| Neretva | [izvori](../assets/images/sources/pozadine/neretva-polozaji/generation.json), [pregled](../assets/images/sources/pozadine/neretva-polozaji/preview.html) |
| Rezervni sezonski ambijenti | [manifest](../assets/images/sources/pozadine/seasonal-backgrounds.json); rezerva nije nalog za ugradnju |

Za Batinu je izabrana slojevita osnova sa pokretnim oblacima; ljudi, civili i platnena zastava ostaju isključeni. Obrisane alternative ne vraćati. Ostale prihvaćene izbore vodi [kontekst igara](KONTEKST.md#potvrđena-grupa-pozadina-za-ustanak-i-tenkiće).

## Zasebni rekviziti bojišta

Olupine, poginuli i krv su opcioni odvojeni resursi, bez sudara i borbene logike. Poginuli namerno ostaju nepomični; krv se crta ispod tela, a zaklanjanje prati položaj u prizoru. Uniforma, pogled i oprema moraju odgovarati bojištu.

[Katalog](../assets/images/armies/sources/scenery/catalog.json) čuva putanje, sidrišta i mere, [sprites](../assets/images/armies/sources/scenery/sprites.json) podatke novih resursa. Agent bira i ugrađuje raspored prema sceni, uz očuvanje čitljivosti borbe; alat za postavljanje nije obaveza vlasnika.

### Rasporedi u igri

[Pregled i postavljanje rekvizita](../props.html) učitava iste podatke koje koristi igra. Opis položaja svakog predmeta ne prepisuje se u dokumentaciju; vlasnikovi preostali pregledi vode se u [planu](PLAN.md#art).

## Održavanje

[Indeks arta](../assets/images/sprite-index.json) obnavlja [skripta](../scripts/index-sprite-art.py) iz direktno povezanih resursa i opisa `sprites.json` u ovom dokumentu. Indeks meri datoteke i kadrove; hash, različiti kadrovi i broj slika ne dokazuju kvalitet, prirodan pokret ili prihvatanje.

Stvarne mere i ponašanje održavaju se u metapodacima i kodu, potvrđene odluke u kontekstu, otvoreni poslovi u planu, a izvršene provere u TESTING. Ne čuvati dnevnik dorada, opise već ugrađenih vizuelnih scena ni kopije tih podataka u ovom dokumentu.
