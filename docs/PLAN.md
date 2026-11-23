# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Art](#art)** | | | |
| 1 | [IG-13](#ig-13) | Dopuniti pogodak Okupatora, povezati i proveriti | Codex, Claude | 🔄 In progress<br>Waiting: jedan resurs [1](#note-1) |
| 2 | [AR-P02](#ar-p02) | Dovršiti odložene provere postojećih dopuna u Storybook-u i igrama | Agent | 📋 TODO |
| 3 | [AR-P03](#ar-p03) | Pregledati dopune aktera koje nemaju zabeleženo vizuelno prihvatanje | Vlasnik | 📋 TODO |
| 4 | [AR-P04](#ar-p04) | Pregledati rasporede rekvizita i preostale ugrađene ambijente | Vlasnik | 📋 TODO |
| | **[Arhitektura](#arhitektura)** | | | |
| 5 | [ARH-01](#arh-01) | Prevesti preostala osnovna stanja na zajednička imena uz rad na telu ili nivou | Agent | 📋 TODO |
| 6 | [ARH-02](#arh-02) | Rešiti zadržavanje Ammo heightfield memorije pri ponovnom učitavanju terena | Agent | 📋 TODO |
| 7 | [ARH-03](#arh-03) | Dovršiti potvrdu prostornog zvuka, miksa i rada na sporom uređaju | Agent | 📋 TODO |
| | **[Storybook](#storybook)** | | | |
| 8 | [SB-03](#sb-03) | Pripremiti pregled topa kroz Ammo pozornicu pri radu na njegovom nivou | Agent | 📋 TODO |
| 9 | [SB-04](#sb-04) | Otkloniti postojeća upozorenja 3D pešadije i njen zavisan uvoz iz scene | Agent | 📋 TODO |
| | **[UI](#ui)** | | | |
| 10 | [UI-01](#ui-01) | Proveriti preostale izbore početka, greške naplate/povraćaja i fizički touch | Agent | 📋 TODO |
| | **[Igre i ideje](#igre)** | | | |
| 11 | [IG-14](#ig-14) | Izabrati sledeće aktere od postojećeg arta | Vlasnik, Claude, Codex | 📋 TODO<br>Waiting: izbor kandidata [2](#note-2) |
| 12 | [IG-17](#ig-17) | Razrađivati postojeće nivoe redom | Vlasnik, Agent | 📋 TODO |
| 13 | [IG-18](#ig-18) | Razmotriti pomeranje prizora i iskakanje protivnika u Otpisanima ili Neretvi | Vlasnik | 📋 TODO |
| 14 | [IG-19](#ig-19) | Dogovoriti nazive nivoa i prikaz žanra i godine na naslovnoj | Vlasnik | 📋 TODO |
| 15 | [IG-20](#ig-20) | Razmotriti nivo odbrane položaja odozgo, sa napadima sa svih strana | Vlasnik | 📋 TODO |
| 16 | [IG-21](#ig-21) | Razmotriti kampanju Jablanice i kolonu kamiona | Vlasnik | 📋 TODO |
| 17 | [IG-22](#ig-22) | Razraditi dodatne etape Neretve | Vlasnik | 📋 TODO |
| 18 | [IG-23](#ig-23) | Proveriti dostižnost novčića i pokretne platforme u Avataru | Agent | 📋 TODO |
| 19 | [IG-24](#ig-24) | Odlučiti o anahronim parolama u Liberated City | Vlasnik | 📋 TODO |
| 20 | [HIS-01](#his-01) | Razjasniti nepotvrđene istorijske tvrdnje izabranih nivoa | Agent, Vlasnik | 📋 TODO |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki; stalne sekcije se ne brišu. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Vlasnikovi pregledi su odvojeni od završenog povezivanja; ne uvode novu blokadu bez njegovog izričitog uslova. Ranije završene provere ne ponavljati zbog reorganizacije plana.

## Art

<a id="ig-13"></a>
### IG-13 · Preostala stanja „pogođen”

Napraviti preostali pogodak Okupatora, povezati ga sa zajedničkim prikazom igre i Storybook-a i proveriti vidljivu reakciju na pogodak. Ugovor: [ART](ART.md#dopune-iz-plana-ideja--predaja-arta); dokazi: [TESTING](TESTING.md#predaja-arta-iz-plana-ideja).

<a id="ar-p02"></a>
### AR-P02 · Odložene provere

Pre pokretanja proveriti sadašnji dokaz u [TESTING](TESTING.md#art-verification-record), da se već izvršene provere ne ponavljaju. Za preostale dopune proveriti učitavanje, mirovanje, kretanje, radnju, pogodak, završnu pozu, oba smera, pauzu i reset u stvarnim potrošačima. Raniji unit ili statični pregled ne dokazuje prirodan pokret.

Obuhvat prenet iz beleški o dopunama: tenkovi i Somua, oba Opela, Hummel i BP-42, pešadija i posade, propeleri i olupine aviona, S-30 i obalsko gnezdo, nova plovila i podrška iz paketa plana ideja. Posebno su bili odloženi pokret, vatra, voda i stvarno učitavanje iz ART-11; za obuhvaćene priče koristiti noviji [izmereni pregled](TESTING.md#sačuvani-dokazni-izvori), umesto stare opšte tvrdnje da browser nije pokretan. Uključiti fizičko poravnanje tla i živih efekata za dopunjene pozadine gde to još nije provereno. Obim izabrati prema promeni i važećoj dozvoli; puna testna serija nije automatski deo ovog posla.

<a id="ar-p03"></a>
### AR-P03 · Pregledi aktera

U ranijim beleškama ostali su otvoreni: punjenje nemačkog strelca; hod i oba pada partizanskog strelca; Bombašev završni pad i krv; posade topa i precrtani poljski top sa olupinom; Hummelov i BP-42 napad; Okupatorova paljba; obe Potezove olupine. Pregledi su dostupni uz svaki resurs u [ART](ART.md#resursi-i-zajednički-potrošači), a za Potez u [tabeli aviona](ART.md#avioni). Ne upisivati prihvatanje na osnovu same dostupnosti slike ili prolaska testa.

<a id="ar-p04"></a>
### AR-P04 · Ambijenti i rekviziti

Pregledati [deset rasporeda rekvizita](ART.md#rasporedi-u-igri), uključujući novi raspored Batine, i preostale ambijente iz [šest ugrađenih pozadina](ART.md#šest-ambijenata-sadašnjih-nivoa). Izbor slojevite Batine već je potvrđen; time nije potvrđen novi raspored poginulih. Otpisani koriste izabranu crno-belu pozadinu, ali pregled njene kompozicije u igri nije zabeležen kao završen. Očuvati postojeće potvrđene izbore; nedostatak pregleda nije nalog za novu generaciju.

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Dodatni desanti na Brač, Mljet i Korčulu ostaju ideje za igru uz istorijsku proveru, a ne zadaci izrade arta. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

## Arhitektura

<a id="arh-01"></a>
### ARH-01 · Zajednička imena stanja

Sačuvati [standard](ARHITEKTURA.md#standardna-stanja-aktera) `idle`, `move`, `attack`, `dead`. Prelazak raditi uz stvarnu izmenu tela ili nivoa, ne kao odvojenu masovnu kampanju; nivo na kome se radi prelazi sa svojim povezanim telima i Storybook pričama.

Preostala osnovna stanja napada `fire` proverena su u AttackPlane, Fighter, AntiTankGun, Bunker, Flak, CannonCrew, MachineGunner, Rifleman i Skirmisher. Skirmisher još koristi `walk`, a Rifleman `patrol` kao osnovno kretanje. Ove nazive razlikovati od klipova, profila oružja i dodatnih radnji koje mogu zadržati isti naziv.

Svako telo prevesti zajedno sa prikazima, upravljačima, scenama, pričama i testovima, bez aliasa. Posle poslednjeg potrošača ukloniti privremeni [stateNames](../core/gameplay/bodies/stateNames.js) i koristiti direktno standardna imena. Proveriti stringove i dinamičke pristupe, ponašanje pri napadu u kretanju, prekid smrću, pauzu, reset i stvarne Storybook komande.

<a id="arh-02"></a>
### ARH-02 · Ammo memorija terena

[Izrada terena](../core3d/physics/index.js) alocira heightfield podatke preko `Ammo._malloc`. Lokalni build ne izlaže `_free`, pa oslobađanje shape-a ne oslobađa zaseban bafer. [NativeAllocations](../core3d/physics/NativeAllocations.js) zato ne može dokazati da je sav heap vraćen.

Utvrditi podržan način upravljanja ovim baferom i povezati ga sa životom terena; ne menjati vendored `libs` usput. Pre izmene pregledati sve potrošače i posledice eventualne promene Ammo build-a. Provera ponovljenog ulaska/izlaska mora meriti native alokacije, ne samo JavaScript reference. Ne pokušavati oslobađanje `btVehicleTuning` kroz nepodržan destruktor.

<a id="arh-03"></a>
### ARH-03 · Provere audio sistema

Tačan preostali obim i dokazi su u [TESTING](TESTING.md#global-audio-migration-verification-limits). Ne ponavljati završene ciljane provere samo zbog reorganizacije dokumentacije.

Potvrditi browser ponašanje i preslušati 2D/3D položaje, slabljenje, promenu slušaoca, Dopler, pauzu i gašenje; posebno proveriti stvarni odziv filtera i odsustvo klipovanja. Na identifikovanom sporom uređaju uporediti isti prizor sa zvukom i bez njega i izmeriti native/DSP trošak. Cilj je očuvati 30 FPS prizora koji bez zvuka održava tu brzinu, bez čujnih prekida; početni p95 cilj za sinhroni JS audio update je najviše 1 ms. To još nije dokazano. CPU emulacija mora biti tako označena. Pripremljeni testovi, ograničenja broja glasova i kratko JS vreme nisu dokaz tih rezultata.

Provere se pokreću u dozvoljenom obimu prema [DOCS](DOCS.md); ovaj plan ne daje dozvolu za punu seriju ili zahtevna merenja.

## Storybook

<a id="sb-03"></a>
### SB-03 · Ammo akteri

Pri sređivanju nivoa pripremiti samostalan pregled njegovog topa i potrebnog fizičkog sveta. Sadašnja 3D pozornica nema Ammo; ne prikazivati nepostojeću sposobnost lažnom animacijom niti tvrditi da je postojeći katalog time potpun.

<a id="sb-04"></a>
### SB-04 · 3D pešadija

Stari i novi ulaz za italijanskog mitraljesca prikazuju figuru, ali prijavljuju nedostajuću `weapon/machine-gun/default-grey.jpg` i dva dodavanja `undefined` u Three.js. Provereno na istom ulazu pre i posle razdvajanja kataloga. Postojeći uvoz `surrenderPose` iz scene u priču krši ESLint granicu biblioteke; ukloniti zavisnost pri sređivanju predaje pešadije, uz proveru oba potrošača.

## UI

<a id="ui-01"></a>
### UI-01 · Preostale izvršne provere

Proći prilagođene početne izbore, grešku pripreme, naplatu i povraćaj žetona. Na stvarnom touch uređaju proveriti istovremene pritiske, držanje, otkazivanje, blur i vraćanje iz pauze; DOM nije taj dokaz. Ciljano proveriti lokalne DevelopmentCoins slučajeve samo ako ih noviji dokaz još ne pokriva. Ne uvoditi obavezu serije slika svake teme i ekrana: vlasnik je birao pregled kroz igru.

<a id="igre"></a>
## Igre i ideje

<a id="ig-14"></a>
### IG-14 · Kandidati za vlasnikov izbor

Kandidati nisu nalog za izradu. Posle izbora dopuniti art, telo, zajednički prikaz i Storybook priču, povezati aktera sa igrom i odigrati nivo.

- **Frontalni neprijatelji:** [strelac](../storybook.html#vojnici/otpisani-strelac) i [stražar](../storybook.html#vojnici/otpisani-strazar) čekaju vlasnikov izbor za nivo. Stražar u šinjelu dozvoljen je samo zimi.

- **Vis:** partizanski [Hurricane, Spitfire i Il-2](../assets/images/armies/partizani/avioni/) odozgo.
- **Do Trsta i Tenkići:** [italijanski tenkovi](../assets/images/armies/talijani/tenkovi/), [AB41](../assets/images/armies/talijani/vozila/), [BMW R11](../assets/images/armies/nemci/motori/) i ostala [nemačka vozila](../assets/images/armies/nemci/vozila/). Tenkići zahtevaju novu odluku o proširenju dvoboja.
- **Ustanak:** [italijanski top 47 mm sa posadom i minobacači](../assets/images/armies/talijani/artiljerija/); zahteva novu odluku o proširenju dvoboja.
- **Pešadija:** italijanski, britanski, ruski, četnički i SS vojnici; potrebni su atlasi pokreta.
- **Otpisani:** nemački motociklista sa mitraljezom u postojećem realističnom crno-belom stilu.

<a id="ig-17"></a>
### IG-17 · Postojeći nivoi

Razrađivati postojeće nivoe redom prema vlasnikovom izboru sledećeg nivoa i obima; to nije nalog za istovremenu preradu svih igara. Za put ka Trstu pre nastavka uporediti četiri dogovorene etape sa stvarnim nivoom i izdvojiti samo preostale lokacije, događaje, ciljeve i sastav protivnika. Za Vis isto razlikovati dogovoreni tok sletanja od sadašnje implementacije.

<a id="ig-18"></a>
### IG-18 · Arkadni prizor iz prvog lica

Ideja iz README-a: Otpisani ili Neretva mogu dobiti pomeranje prizora i protivnike koji iskaču. Konkretna igra, tok i obim još nisu izabrani.

<a id="ig-19"></a>
### IG-19 · Nazivi i oznake nivoa

Osmisliti nazive nivoa i dogovoriti prikaz žanra i godine na naslovnoj. Pre izmene UI-ja odobriti konkretne tekstove i elemente prema [DOCS](DOCS.md#odobravanje-ui-elemenata).

<a id="ig-20"></a>
### IG-20 · Odbrana položaja

Ideja iz README-a: pogled odozgo i napadi sa svih strana. Kontekst, akteri i cilj nivoa još nisu razrađeni.

<a id="ig-21"></a>
### IG-21 · Kampanja Jablanice

Moguće etape su Prozor, Rama i Jablanica, sa zasedom kod Drežnice kao kandidatom. Kolona kamiona pokušava proboj putem uz reku. To su ideje, ne nalog za izradu; mesta imaju različite događaje i ne treba ponavljati isti bunker. Istorijske granice su u [ISTORIJA](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica).

<a id="ig-22"></a>
### IG-22 · Dodatne etape Neretve

Italijanske i ustaške etape ostaju kandidati uz postojeće Nemce i četnike. Izabrati mesta, datume, jedinice i borbene uloge, trajanje i prelaze, pa tek onda art i tok igre. Postojeći rov nije istorijski dokaz budućeg sastava.

<a id="ig-23"></a>
### IG-23 · Avatar

Proveriti da su novčići dostižni i izvan kocki i da sudari sa pokretnim platformama rade. Očuvati prihvaćen rasuti nasumični izgled: rešenje nije pravilna mreža ili unapred povezana putanja. Raniji test lifta ne potvrđuje dostižnost svih mesta.

<a id="ig-24"></a>
### IG-24 · Parole Bihaća

Liberated City je Bihać krajem 1942. Natpisi o dolasku Crvene armije i plakat RED_ARMY_IS_HERE pripadaju drugom okviru; vlasnik bira zamenu ili uklanjanje pre izmene sadržaja.

<a id="his-01"></a>
### HIS-01 · Istorijska ograničenja

Pre novih tvrdnji proveriti: sastav i Žikičinu ulogu u krupanjskom napadu; konkretno oružje i artiljerijski sukob Ustanka; Luftwaffe nad Visom; model plovila i sastav protivnika na Šolti; beogradsku ilegalu u oktobru 1944; primarne izvore za Jablanicu. Koristiti [postojeće izvore](ISTORIJA.md), uključujući zbornik ustanka/istoriju Valjevskog odreda. Nepotvrđena pojedinost ne otvara ponovo već prihvaćen postojeći art, niti izmišlja potvrdu njegovog istorijskog učešća. Nove pomorske kandidate istraživati tek posle izbora događaja.

## Notes

Waiting: čeka navedeni zavisni posao.

1. <a id="note-1"></a>**IG-13:** preostaje pogodak Okupatora. Ugovor: [ART](ART.md#dopune-iz-plana-ideja--predaja-arta); izvršene provere: [TESTING](TESTING.md#predaja-arta-iz-plana-ideja).
2. <a id="note-2"></a>**IG-14:** pet prethodno izabranih aktera je povezano; [art](ART.md#dopune-iz-plana-ideja--predaja-arta) i [provere](TESTING.md#predaja-arta-iz-plana-ideja). Čeka se izbor novih kandidata.
