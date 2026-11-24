# ART

Pravila izrade i veze do izvora. Otvoreni poslovi su u [PLAN-u](PLAN.md#art), provere u [TESTING](TESTING.md#art-verification-record), a tema i prihvaćeni izbori igara u [KONTEKST](KONTEKST.md).

## Pravila pripreme i ponovne upotrebe

- Koristiti postojeći odgovarajući resurs pre izrade duplikata. Istorijsko prihvatanje izvora ne znači da je crtež konačan: `game-ready`, novi atlas, povezivanje i prolaz testova nisu ocena kvaliteta.
- Crtati za stvarnu veličinu u igri: čitljiva silueta, uverljive proporcije, usklađena paleta i senčenje. Uvećana ilustracija koja se ne čita kao mali sprite nije upotrebljiva predaja. Proceduralni pokret je dovoljan kada jasno prikazuje radnju.
- Posadu proveriti na sastavljenom vozilu: odnos glave prema telu, čoveka prema vozilu i položaj iza oklopa moraju biti prirodni u svim kadrovima. Vlasnik je na [Sd.Kfz. 251](../assets/images/armies/game-ready/vozila/sdkfz251-sprites.png) ukazao na nesrazmernu glavu i vojnika; čitljivost nije opravdanje za karikaturalno uvećanje.
- Poboljšanje crteža ne podrazumeva promenu prihvaćenog stila. Odvojeni deo uporediti sa starim crtežom i u sklopu celog aktera; ne razvlačiti ga nezavisno po širini i visini samo da popuni zadati pravougaonik. Somuina cev pokazala je gubitak metalnog izgleda i promenu proporcija pri takvoj zameni.
- Pre izmene utvrditi identitet, pogled, smer, razmeru, sidrište, oslonac i dozvoljene promene. Prazne margine atlasa ne menjaju mere tela i sudara. Isti tip vozila u različitom pogledu nije automatski zamenljiv resurs.
- Sačuvati prihvaćene delove. Za ograničene pokrete proveriti piksele izvan dozvoljene maske; različit hash ne dokazuje dobru animaciju. Nova poza ne sme promeniti razmeru prethodnih kadrova. Razlomljene ćelije postojećeg atlasa nisu same po sebi greška.
- Pregledati alfu, providne rubove i prelivanje u susednu ćeliju na neprozirnoj podlozi. Slab generisani veo može pokvariti granice figure; ukloniti ga na izvoru, obnoviti reference i porediti vidljivu visinu i oslonac pre i tokom pogotka, umesto ispravljanja razmere u rendereru. [Čišćenje strelca](../assets/images/armies/sources/ustanak/prepare.py) beleži tačan prag i očuvane piksele u [poreklu obrade](../assets/images/armies/sources/ustanak/sprites.json). Poze jednog klipa dele razmeru i registraciju, bez pojedinačnog sabijanja tela.
- Razdvojiti telo, pokretne delove i efekte. Metak/plamen izlazi iz stvarne cevi; bomba ostaje u šaci do otpuštanja. Ogledanje prati ceo sklop i njegove tačke događaja. Rov i teren nisu deo figure; krupan kadar nije celo telo.
- Stvarni propeler menja projekciju oko osovine, ne okreće se kao ploča u ravni slike. Generisano preokrenuta olupina ne sme ponovo dobiti istu rotaciju u igri. Završni kadar pada ostaje prema ugovoru aktera.
- Konačni vojni art čuvati po vrsti opreme u [game-ready](../assets/images/armies/game-ready/). Izvor, stvarni prompt, poreklo, hashovi i ponovljiva priprema ostaju uz resurs; tok pokušaja i duplirani opisi rada ne pripadaju ovoj dokumentaciji.

<a id="stil-aerodromske-posade"></a>
**Stil:** ceo projekat koristi jedan stil, realističan piksel art; nivo ne dobija zaseban stil (vlasnik, 2026-11-23). Za pešadiju to znači ozbiljna odrasla lica i uverljive proporcije. Korekcija karikaturalnosti nije nalog za fotorealizam.

<a id="razmera"></a>
**Razmera (vlasnik, 2026-11-23):** telo u metrima je stvarne veličine, a crtež ima izvornu razmeru svoje grupe igara: 40 px po metru za bočne igre i igre odozgo, 100 px po metru za igre spreda (Otpisani, Neretva). Osnova grupe je najveći prikaz u bilo kojoj njenoj igri, pa slika nikad nije manja od veličine u kojoj je igra crta; slika se ne umanjuje ispod toga, a sitnija slika se precrtava, ne uvećava. Katalog prikazuje predmete u toj prirodnoj razmeri ([scales.js](../catalog/scales.js)); samo igra sme da ih umanji. To je jedini dopušten tok.

### Uklapanje cele scene — pouke pokušaja Bunkera

- Pre nove grafike istražiti datum, teren, rastinje i objekte; potvrđeno odvojiti od procene. Za Bunker koristiti [istraživanje Krupnja](ISTORIJA.md#krupanj-1941--polazište-za-igru-bunker).
- Prvo složiti jedan zajednički kadar u stvarnoj veličini igre: lik, mina, zgrada i teren. Utvrditi jedinstven ugao gledanja, razmeru prema čoveku, ravan tla, stil detalja i osvetljenje; tek potom dorađivati zasebne resurse. Dobra pojedinačna slika ne dokazuje dobru scenu.
- Bočni lik, mina odozgo, frontalna zgrada i kosa pozadina ne postaju usklađeni samom paletom i senkama. Proveriti veličinu mine prema stopalu, vrata i spratova prema čoveku, dodir sa tlom i zaklanjanje; pozadina ne sme nadjačati aktere.
- Promena arta nije razlog za usputno menjanje sudara, broja prepreka ili rasporeda igre. Sačuvana bolnica je studija za buduće uklapanje, nije prihvaćena kao konačan art i nije povezana sa igrom; odbačeni teren i mine ne čuvaju se kao alternative.

## Uslovi završetka zadataka

<a id="obavezna-integracija"></a>
### Obavezan korak svake dopune: kod, katalog i svi nivoi

1. Pretragom resursa, klase i konfiguracija pronaći sve potrošače.
2. Povezati novi art u zajedničkom prikazu ili mapiranju aktera, uz očuvanje mera, oslonaca i tačaka pucnja. Nivoi i katalog koriste isti resurs.
3. Omogućiti relevantne radnje u [katalogu aktera](KATALOG.md#stavke-kataloga-i-varijante); poseban HTML/GIF nije zamena za priču i upotrebu u igri.
4. Proveriti učitavanje, prelaze, pokret, završetak, oba smera, pauzu i reset u katalogu i pogođenim nivoima. Skrolovanje ne pokreće animaciju vožnje mirnog vozila. Izvršne provere prate važeću dozvolu.
5. Sačuvati izvor i metapodatke, obnoviti indeks i zabeležiti stvarne dokaze u TESTING. Stavku zatvoriti kada je dogovorena celina gotova; vlasnikov pregled i izričito odložene provere navode se odvojeno.

## Resursi i zajednički potrošači

Kadar, trajanje, sidrište, tačke događaja i putanje završnih slika čitaju se iz metapodataka ispod. Trenutna stanja i upotreba pripadaju kodu i [katalogu](../catalog.html); ovde se ne prepisuju opisi gotovih animacija.

### Pešadija i posade

| Resurs | Metapodaci / izvor |
|---|---|
| Kluz: pešadija i vozila | [sprites](../assets/images/armies/sources/franjo-kluz/sprites.json) |
| Ustanak: strelac, zastavnici i posade | [sprites](../assets/images/armies/sources/ustanak/sprites.json), [hod i pad strelca](../assets/images/armies/sources/partisan-rifleman/sprites.json), [pad posada](../assets/images/armies/sources/cannon-crew-fall/sprites.json) |
| Bombaš | [mirovanje, hod i pad](../assets/images/armies/sources/infantry-art/sprites.json), [bacanje](../assets/images/armies/sources/grenadier-throw/sprites.json); priprema: [osnovni atlas](../assets/images/armies/sources/infantry-art/prepare.py) i [bacanje udesno](../assets/images/armies/sources/grenadier-throw/prepare-right.py) |
| Okupator | [sprites](../assets/images/armies/sources/infantry-art/occupier-sprites.json) |
| Frontalni kandidati sa animacijama | [animacije](../assets/images/armies/sources/enemy-front-variants/animation-sprites.json), [priprema](../assets/images/armies/sources/enemy-front-variants/prepare-animations.py), izvori [strelca](../assets/images/armies/sources/enemy-front-variants/rifleman-redraw-generation.json) i [stražara](../assets/images/armies/sources/enemy-front-variants/winter-sentry-animation-generation.json); zasebne priče [strelca](../catalog.html#vojnici/otpisani-strelac) i [stražara](../catalog.html#vojnici/otpisani-strazar). Privremeno u Otpisanima: crtani su kao strip i odskaču od realističnog piksel arta, pa ih zameniti kad stigne bolji crtež. |
| Nemac i Četnik spreda | [cele figure](../assets/images/armies/sources/infantry-art/front-standing/sprites.json) |
| Mitraljezac iz Bunkera | [sprites](../assets/images/armies/sources/bunker-gunner/sprites.json) |
| Posade Flaka i PaK-a | [sprites](../assets/images/armies/sources/infantry-art/crew-sprites.json) |
| Punjenje nemačkog strelca | [sprites](../assets/images/armies/sources/rifleman-reload/sprites.json); klip prati spremnik nacrtanog oružja i nije zamena za punjenje drugih pušaka |

Šinjel je isključivo zimska uniforma; [metapodaci kandidata](../core/gameplay/frontEnemyKinds.js) ograničavaju stražara na zimu.

Partizan otpozadi ima pogled iz zadnje tri četvrtine i bočnu izvornu razmeru 40 px/m u [katalogu](../catalog/stories/partisans.js); nije frontalni neprijatelj od 100 px/m. Neretva ga prikazuje pri 38 px/m. Njegovo telo ostaje visoko 1,8 m; pogrešnu grupu prikaza ne ispravljati smanjivanjem tela ili samo pojedinačne slike.

Neretva i Otpisani imaju istu perspektivu spreda i dele pešadiju spreda (odluka vlasnika, 2026-11-23): frontalni kandidati, Okupator i Nemac i Četnik spreda crtaju se i biraju za obe igre, a godišnje doba i dalje ograničava izbor po nivou. Hod spreda prati pređeni put, pa dužina koraka nacrtanog lika ide uz njegove metapodatke.

### Vozila i oruđa

| Resurs | Metapodaci / izvor |
|---|---|
| Glavni tenkovi i Somua | [sprites](../assets/images/armies/sources/tenkovi/sprites.json), [priprema slojeva](../scripts/prepare-vehicle-art.py) |
| M15/42, StuG III i Hočkis | [sprites](../assets/images/armies/sources/battlefield-tanks/sprites.json) |
| Hummel: novi trup, posada i napad | [mirovanje i vožnja](../assets/images/armies/sources/franjo-kluz/sprites.json), [izvor i prompt](../assets/images/armies/sources/franjo-kluz/hummel-redraw-generation.json), [napad](../assets/images/armies/sources/hummel-fire/sprites.json); postojeća priprema čuva oslonac i vezu cevi sa projektilom |
| Motociklista sa prikolicom | [atlas i odvojeni mitraljez](../assets/images/armies/sources/plan-ideas-art/sprites.json), [izvor i prompt](../assets/images/armies/sources/plan-ideas-art/generation.json), [ponovljiva priprema](../assets/images/armies/sources/plan-ideas-art/prepare.py) |
| Sd.Kfz. 251 i Sd.Kfz. 222 | [atlasi, posada, kupola i olupine](../assets/images/armies/sources/plan-ideas-art/sprites.json), [poreklo i promptovi](../assets/images/armies/sources/plan-ideas-art/generation.json); priprema čuva registrovane delove i sidrišta, a olupina drži jedan kadar |
| Sedam vozila za Do Trsta | [atlasi i mere](../assets/images/armies/sources/road-vehicles/sprites.json), [izvori i promptovi](../assets/images/armies/sources/road-vehicles/generation.json), [priprema](../assets/images/armies/sources/road-vehicles/prepare.py); Zündapp K600, BMW R12, Sd.Kfz. 231, Pz.Kpfw. 612, Horch 830 BL, Marder II i Elefant dele telo i prikaz u katalogu i nivou. Motori i automobil nemaju montirano oružje. |
| BP-42 napad | [sprites](../assets/images/armies/sources/bp42-fire/sprites.json) |
| Poljski top Ustanka | [sklop](../assets/images/armies/sources/field-gun/layout.json), [priprema](../assets/images/armies/sources/field-gun/prepare.py), [olupina](../assets/images/armies/sources/field-gun/wreck-sprites.json) |
| Olupine | [sprites](../assets/images/armies/sources/wrecks/sprites.json) |
| Odvojene cevi glavnih tenkova | [partizanska](../assets/images/armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png), [nemačka](../assets/images/armies/game-ready/tenkovi/nemacki-tenk-cev-pixel.png), [Somua](../assets/images/armies/game-ready/tenkovi/somua-s35-barrel.png) |
| Delovi oruđa | [poljski top: cev](../assets/images/armies/game-ready/artiljerija/field-gun-barrel-pixel.png) i [lafet](../assets/images/armies/game-ready/artiljerija/field-gun-carriage-pixel.png); [Flak: postolje](../assets/images/armies/game-ready/artiljerija/flak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/flak38-cev.png); [PaK: postolje](../assets/images/armies/game-ready/artiljerija/pak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/pak38-cev.png) |
| Utvrđeni položaji | [kuća-bunker](../assets/images/buildings/kuca-bunker.png), [bunker](../assets/images/buildings/bunker-02.png), [obalni položaj](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.png), [mitraljez](../assets/images/armies/game-ready/polozaji/shore-mg-gun.png), [posada](../assets/images/armies/game-ready/polozaji/shore-mg-crew.png) |
| Bunker: sačuvana studija bolnice, nije povezana sa igrom | [slika](../assets/images/buildings/bunker-house.png), [sprites](../assets/images/sources/bunker/sprites.json), [poreklo i prompt](../assets/images/sources/bunker/generation.json), [priprema](../assets/images/sources/bunker/prepare.py) |
| Osnovni brodovi | [partizanski čamac](../assets/images/armies/camac.png), [S-30: trup](../assets/images/armies/game-ready/brodovi/schnellboot-s30.png), [palubno oruđe](../assets/images/armies/game-ready/brodovi/s30-deck-gun.png), [priprema](../assets/images/armies/sources/plan-ideas-art/prepare-s30.py) |

Poljski top Ustanka je zajednički prihvaćen crtež za obe posade. Sličnost sa [Schneiderom 155 L iz 1918.](https://en.wikipedia.org/wiki/Canon_de_155_L_mod%C3%A8le_1918_Schneider) je procena vlasnika i agenta, bez potvrde tipa ili istorijske upotrebe u tom nivou; pri novom artu ne predstavljati ga kao potvrđen laki top od 75 mm.

Registraciju betonskog bunkera vodi [priprema utvrđenja](../assets/images/armies/sources/plan-ideas-art/prepare-fortifications.py), a Somuine cevi [odvojena priprema](../assets/images/armies/sources/plan-ideas-art/prepare-somua-barrel.py), koja proverava da trupovi ostanu netaknuti.

[Priprema obalskog gnezda](../assets/images/armies/sources/plan-ideas-art/prepare-shore.py) čuva zajedničku registraciju zdravog i oštećenog zaklona, a mitraljez i sopstvenu posadu izvozi odvojeno.

### Avioni


| Resurs | Metapodaci / izvor |
|---|---|
| Potez: trupovi, posada i delovi | [sprites](../assets/images/armies/sources/franjo-kluz/potez-crew/sprites.json), [sklop](../assets/images/armies/sources/franjo-kluz/potez-crew/crew.json) |
| Propeleri | [sprites i osovine](../assets/images/armies/sources/aircraft-propellers/sprites.json) |
| Bočni avioni | [Bf 109: trup](../assets/images/armies/game-ready/avioni/bf109-telo.png), [oštećenje](../assets/images/armies/game-ready/avioni/bf109-damaged.png), [priprema](../assets/images/armies/sources/plan-ideas-art/prepare-bf109.py) i [propeler](../assets/images/armies/game-ready/avioni/bf109-propeler.png); [Ju 87: trup](../assets/images/armies/game-ready/avioni/ju87.png), [oštećenje](../assets/images/armies/game-ready/avioni/ju87-damaged.png) i [priprema](../assets/images/armies/sources/plan-ideas-art/prepare-ju87.py) |
| Avioni Visa i Il-2 iz kataloga | [13 slika i osovine propelera](../assets/images/armies/sources/aircraft-scale/sprites.json), [izvori i poreklo](../assets/images/armies/sources/aircraft-scale/generation.json), [priprema](../assets/images/armies/sources/aircraft-scale/prepare.py), [mere modela](../core/actor/aircraft/fighterBomberPlanes.js); varijanta žutog nosa koristi veliki Bf 109 sa lokalnom promenom palete. Il-2 ostaje samo u katalogu. |

Pripremljeni Sd.Kfz. 251, He 111, Storch, M15/42, StuG III, Hotchkiss i plovila imaju osnovu od 40 px/m; cele figure Nemca i Četnika spreda imaju vidljivu visinu 180 px pri 100 px/m. Veći dostupni izvori ponovo se pripremaju bez uvećavanja sitnog rastera. Prikaz patrolnog plovila čita `pixelsPerMetre` iz njegovih metapodataka; fiksnih 25 px/m posle promene izvora pogrešno bi uvećalo brod. Pri promeni atlasa obnoviti i geometriju priključaka, izlazne slike i manje kopije za učitavanje.

<a id="dopune-iz-plana-ideja--predaja-arta"></a>
### Zajedničke dopune aktera

[Manifest](../assets/images/armies/sources/plan-ideas-art/sprites.json) povezuje nove aktere, reakcije na pogodak i oštećenja. [Priprema](../assets/images/armies/sources/plan-ideas-art/prepare.py), [izvoz u kod](../assets/images/armies/sources/plan-ideas-art/export-runtime.py) i [poreklo](../assets/images/armies/sources/plan-ideas-art/generation.json) su uz resurse. Odbijanje generisanja nije ocena postojećeg arta; nedostajuće resurse i ograničenja vodi [plan](PLAN.md#art).

[Dodatna plovila](../assets/images/armies/sources/camac-enemies/sprites.json) imaju zasebne opise. Generički nacrtan brod ili projektna mera nisu potvrda istorijske klase i njenog prisustva u konkretnoj bici.

### 3D

Modele, skinove i klipove pregledati u [katalogu](../catalog.html) i [pregledu animacija](../pregled-animacija.html). Poreklo i licence ostaju uz modele; organizacija kataloga prati [pravila kataloga](KATALOG.md#stavke-kataloga-i-varijante).

Poljski top u [katalogu](../catalog.html#artiljerija-3d/poljski-top-3d) ima [poseban prikaz oštećenja](../core3d/actor/artillery/FieldGunDamage.js): na 75% zdravlja boja je potamnela i nagorela, na 50% se razlabavljuje točak, na 25% spušta lafet, a `dead` ostavlja razdvojene točkove, spuštenu cev i rasklopljene krakove lafeta. Delovi su izvedeni iz trouglova izvornog GLB-a, uz očuvanje njegovih normala i boja; izvorni model i materijali se ne menjaju. Svaki otkinuti sklop zasebno naleže na tlo. U katalogu zdravlje pripada topu; „Pogođena posada” obara zasebnog člana, a Reset vraća zdrav top i živu posadu. Ovaj prikaz nije uključen u Jablanicu, gde smrt posade ostavlja top uspravno.

Pogoci topa u katalogu koriste [slojeviti efekat](../core3d/actor/artillery/GunImpactCloud.js): varnice traju oko desetinke sekunde, uz kratak oblačić prašine i sitne metalne opiljke. Ispod polovine zdravlja dodaje se malo dima, a na četvrtini i niže nekoliko krupnijih komada. Efekti završavaju sami, delovi padaju do tla, a ponovljeni pogoci koriste isti ograničeni skup objekata. Katalog izričito uključuje ovu dopunu; postojeći efekat u Jablanici ostaje zaseban.

<a id="minobacac-81-3d"></a>
Minobacač za Jablanicu je originalna vizuelna interpretacija italijanskog tipa 81/14 Mod. 35: [GLB](../assets/models/weapon/mortar-81-mod35/model.glb), [odvojena mina](../assets/models/weapon/mortar-81-mod35/round.glb), [izvori, razmera i ograničenja](../assets/models/weapon/mortar-81-mod35/source.json), [ponovljiva priprema](../assets/models/weapon/mortar-81-mod35/build.mjs) i [MIT licenca](../assets/models/weapon/mortar-81-mod35/LICENSE.txt). Cev ima tačku `Muzzle`; ovo nije precizna muzejska rekonstrukcija.

[Proba u katalogu](../catalog.html#artiljerija-3d/minobacac-81-3d) koristi [posadu i radnju](../core3d/actor/artillery/MortarCrew.js): dva postojeća italijanska lika bez pušaka, `idle`, `load` (držanje mine iznad otvora), `attack` (ubacivanje, blesak/dim i povratak), `dead`, pojedinačni pogoci i Reset. Šake prate minu i komande minobacača; gubitak jednog člana zaustavlja rad. Po poslednjoj odluci vlasnika minobacač ostaje samo u katalogu; uklonjen je iz Jablanice zajedno sa zaklonom i borbenom logikom.

<a id="cannon-kanjon-neretve"></a>
<a id="battle-for-jablanica-kanjon-neretve"></a>
Za Battle for Jablanica važe [kontekst i izbor scene](KONTEKST.md#battle-for-jablanica); [model topa](../assets/models/weapon/cannon/field-gun-75.glb) i podaci scene određuju postojeći prikaz.

Jablanica koristi [WebP uniforme bez gubitka](../assets/models/character/soldier/partisan-wool-uniform.webp), izveden iz [prihvaćenog PNG-a](../assets/models/character/soldier/partisan-wool-uniform.png) pomoću [pripreme](../scripts/prepare-jablanica-texture.py). Skripta proverava jednakost dekodiranih RGBA piksela; dimenzije ostaju 1254×1254. [Lokalna optimizacija figura](../scenes/cannon/optimizeFigure.js) grupiše neprozirne trouglove po materijalu, bez promene položaja, normala, UV koordinata, boja, kostiju i težina; providni materijali zadržavaju redosled. Izvorni modeli se ne menjaju, a instance u nivou dele pripremljenu geometriju.

## Manje slike aktera bez promene arta

[Priprema runtime slika](../scripts/prepare-catalog-images.py) pravi lossless WebP kopije iz `assets/images/armies/game-ready`. Prihvaćeni PNG atlasi, njihove dimenzije, metapodaci i hashovi ostaju izvor istine; kopije imaju potpuno iste RGBA piksele, uključujući providne. Preuzima se manja kopija preko [zajedničkog mapiranja](../core/actor/imageSources.js), u katalogu i igrama, uključujući posadu, elise i olupine. Nepokrivene slike zadržavaju izvornu putanju; promenu formata ne koristiti za zaključivanje identiteta aktera.

Posle izmene arta ponovo pokrenuti pripremu; `python -B scripts/prepare-catalog-images.py --check` proverava svaki piksel, dimenzije, hashove i usklađenost mape sa [manifestom](../assets/images/optimized/manifest.json). Kopije se dodaju samo uz najmanje 10% i 512 bajtova uštede. Provera je obavezna posle promene izvora da igra ne učitava zastarelu kopiju. Ova kompresija smanjuje prenos; dekodirana memorija i broj frejmova ostaju isti.

## Pravila pripreme i predaje pozadina

- Čitljivi oblici, manje sitnih elemenata i miran prostor iza jedinica. Koristiti istorijski primerenu arhitekturu, sezonu i opremu; [izvori](ISTORIJA.md) određuju granice rekonstrukcije.
- Paletu, osvetljenje i gustinu piksela uskladiti sa prihvaćenim uzorom igre. Loše uklapanje ne prikrivati nasumičnim rotacijama, sečenjem silueta ili globalnim zamućenjem; ponavljanje izdvojenih slika nije zamena za celovit ambijent.
- Osnovna slika nema zamrznute žive ljude, zastave, životinje, vozila, oblake, dim ili plamen. Potrebni živi elementi su odvojeni i prate vreme scene i pauzu prema [pravilima animacije](ANIMACIJA-POZADINE.md). Naslikan znak na zidu može ostati statičan. Voda zasad ostaje mirna po odluci vlasnika; odbačeni efekat svetlih tragova ne vraćati.
- Metapodaci čuvaju dimenzije, liniju tla i žarišta u izvornim pikselima. Linija tla nije horizont ni sidrište čizama. Pri promeni razmere slike jednako prevesti tlo, efekte i projektile.
- Predaja sadrži izvor, stvarni prompt, poreklo, hashove, ponovljivu pripremu i pregled sa jedinicama u 1280×720 i 1024×768. Pozadine i rekviziti imaju svoje preglede, ne zasebne priče u katalogu.
- Prihvaćena pozadina ostaje PNG, a igre učitavaju WebP iste slike, oko sedam puta manji, koji pravi [skripta](../scripts/webp-backgrounds.py) za svaku pozadinu koju kod igre navodi. Posle izmene PNG-a pokrenuti je ponovo.

<a id="šest-ambijenata-sadašnjih-nivoa"></a>
<a id="batina-izabrana-animirana-pozadina"></a>
### Izvori pozadina

| Grupa | Podaci i pregled |
|---|---|
| Tenkići i Ustanak | [manifest](../assets/images/sources/pozadine/current-levels.json), [podaci za ugradnju](../assets/images/sources/pozadine/current-backgrounds.json), [pregled](../assets/images/sources/pozadine/current-preview.html) |
| Batina | [slojevi](../assets/images/background/batina-1944/layout.json), [pregled](../assets/images/sources/pozadine/batina-layered/preview.html) |
| Do Trsta | [Slojeviti pejzaž](../scenes/to-trieste/Route.js), prema [izboru vlasnika](KONTEKST.md#to-trieste); slikane panorame iz [ranijeg manifesta](../assets/images/sources/pozadine/do-trsta/backgrounds.json) nisu uključene u igru. |
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
