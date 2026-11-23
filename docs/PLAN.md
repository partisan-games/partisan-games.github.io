# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Art](#art)** | | | |
| 1 | [IG-13](#ig-13) | Dopuniti pogodak Okupatora i oštećenja Bf 109 i Ju 87, povezati i proveriti | Codex, Claude | 🔄 In progress<br>Waiting: tri resursa [1](#note-1) |
| 2 | [IG-16](#ig-16) | Precrtati slabe prikaze prema popisu od 18 kandidata; započet motociklista | Codex | 🔄 In progress |
| 3 | [AR-P01](#ar-p01) | Uporediti BP-42, M15/42, StuG III i Hočkis sa dorađenim tenkovima | Codex | 📋 TODO |
| 4 | [AR-P02](#ar-p02) | Dovršiti odložene provere postojećih dopuna u Storybook-u i igrama | Agent | 📋 TODO |
| 5 | [AR-P03](#ar-p03) | Pregledati dopune aktera koje nemaju zabeleženo vizuelno prihvatanje | Vlasnik | 📋 TODO |
| 6 | [AR-P04](#ar-p04) | Pregledati rasporede rekvizita i preostale ugrađene ambijente | Vlasnik | 📋 TODO |
| | **[Arhitektura](#arhitektura)** | | | |
| 7 | [ARH-02](#arh-02) | Rešiti zadržavanje Ammo heightfield memorije pri ponovnom učitavanju terena | Agent | 📋 TODO |
| 8 | [ARH-03](#arh-03) | Dovršiti potvrdu prostornog zvuka, miksa i rada na sporom uređaju | Agent | 📋 TODO |
| | **[Storybook](#storybook)** | | | |
| 9 | [SB-03](#sb-03) | Pripremiti pregled topa kroz Ammo pozornicu pri radu na njegovom nivou | Agent | 📋 TODO |
| | **[UI](#ui)** | | | |
| 10 | [UI-01](#ui-01) | Proveriti preostale izbore početka, greške naplate/povraćaja i fizički touch | Agent | 📋 TODO |
| | **[Igre i ideje](#igre)** | | | |
| 11 | [IG-14](#ig-14) | Izabrati sledeće aktere od postojećeg arta | Vlasnik, Claude, Codex | 📋 TODO<br>Waiting: izbor kandidata [2](#note-2) |
| 12 | [IG-18](#ig-18) | Razmotriti pomeranje prizora i iskakanje protivnika u Otpisanima ili Neretvi | Vlasnik | 📋 TODO |
| 13 | [IG-19](#ig-19) | Dogovoriti nazive nivoa i prikaz žanra i godine na naslovnoj | Vlasnik | 📋 TODO |
| 14 | [IG-20](#ig-20) | Razmotriti nivo odbrane položaja odozgo, sa napadima sa svih strana | Vlasnik | 📋 TODO |
| 15 | [IG-21](#ig-21) | Razmotriti kampanju Jablanice i kolonu kamiona | Vlasnik | 📋 TODO |
| 16 | [IG-22](#ig-22) | Razraditi dodatne etape Neretve | Vlasnik | 📋 TODO |
| 17 | [IG-24](#ig-24) | Odlučiti o anahronim parolama u Liberated City | Vlasnik | 📋 TODO |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki; stalne sekcije se ne brišu. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Vlasnikovi pregledi su odvojeni od završenog povezivanja; ne uvode novu blokadu bez njegovog izričitog uslova. Ranije završene provere ne ponavljati zbog reorganizacije plana.

## Art

<a id="ig-13"></a>
### IG-13 · Preostala stanja „pogođen”

Napraviti tri preostala resursa, povezati ih sa zajedničkim prikazima igara i Storybook-a i proveriti vidljivu reakciju na pogodak; oštećenje aviona prikazuje se ispod polovine zdravlja. Ugovor i već završene dopune: [ART](ART.md#dopune-iz-plana-ideja--predaja-arta); dokazi: [TESTING](TESTING.md#predaja-arta-iz-plana-ideja).

<a id="ig-16"></a>
### IG-16 · Popis za precrtavanje

Popis je zasnovan na pregledu crteža i njihovih potrošača; ne potvrđuje sve animacije niti odigrane nivoe.

Tabela je procena agenta prema sadašnjim slikama i vlasnikovoj primedbi na motociklistu, ne vlasnikovo odbijanje svakog navedenog aktera. Merilo su čitljive siluete, uverljive proporcije i usklađeno senčenje u veličini igre, kao kod dorađenog Poteza, glavnih tenkova i novije pešadije. Sam piksel stil nije nedostatak. Precrtavanje je započeto po nalogu vlasnika: prvi je motociklista sa prikolicom, posadom i svim radnjama; ostali čekaju.

| # | Akter / deo | Gde se koristi | Šta treba zameniti i zašto |
|---|---|---|---|
| 1 | [Sd.Kfz. 251](../storybook.html#vozila/sdkfz-251) | Do Trsta, Kluz | Ceo [atlas](../assets/images/armies/game-ready/vozila/sdkfz251-sprites.png): zrnasti obrubi, nerazgovetne gusenice i lice mitraljesca; ćelija 128×65. |
| 2 | [Sd.Kfz. 222](../storybook.html#vozila/sdkfz-222) | Do Trsta, Kluz | [Trup i kupola](../assets/images/armies/game-ready/vozila/sdkfz222-sprites.png): grub mali raster, slabo odvojene ploče i točkovi; ćelija 108×52. Kupolu zadržati kao zaseban deo. |
| 3 | [Hummel](../storybook.html#vozila/hummel) | Kluz | [Trup i posada](../assets/images/armies/game-ready/tenkovi/hummel-sprites.png): ostali su izvorni pikseli, šumasta kamuflaža i skicirana lica. Dopune gusenica i trzaja nisu precrtavanje vozila. |
| 4 | [Bf 109, bočno](../storybook.html#avioni/bf109) | Kluz, Do Trsta | [Trup](../assets/images/armies/game-ready/avioni/bf109-telo.png): stari šematski crtež, tanke crne linije preko ravnih sivih površina. Uskladiti sa Potezom i novim bočnim avionima. |
| 5 | [Ju 87, bočno](../storybook.html#avioni/ju87-obrusavac) | Kluz, Do Trsta, Neretva | [Trup](../assets/images/armies/game-ready/avioni/ju87.svg): pojednostavljena geometrijska zamena; propeler i putanja leta ne nadoknađuju detalje aviona. |
| 6 | [Flak 38](../storybook.html#artiljerija/flak38) | Kluz | [Postolje](../assets/images/armies/game-ready/artiljerija/flak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/flak38-cev.png): stari tanki crni obrubi, slabo senčenje i zelena traka tla u slici. Nova posada nije razlog da se ponovo crta. |
| 7 | [PaK 38](../storybook.html#artiljerija/pak38) | Do Trsta | [Postolje](../assets/images/armies/game-ready/artiljerija/pak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/pak38-cev.png): skiciran točak i lafet, zelena traka tla i neusklađena obrada delova. Sačuvati odvojenu posadu. |
| 8 | [Schnellboot S-30](../storybook.html#brodovi/schnellboot) | Čamac | [Trup](../assets/images/armies/game-ready/brodovi/schnellboot-s30.svg) i palubna oruđa: gladak šematski prikaz odstupa od teksturisanih čamaca; nedostatak je naročito vidljiv na sadašnjoj dužini oko 819 px. |
| 9 | [Mitraljesko gnezdo odozgo](../storybook.html#artiljerija/mitraljesko-gnezdo) | Čamac | [Vreće i zaklon](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg), oružje crtano pravougaonicima i stara posada preuzeta iz patrole; sadašnji delovi pripadaju različitim stilovima. |
| 10 | [Kuća-bunker](../storybook.html#artiljerija/kuca-bunker) | Bunker, Do Trsta; dekoracija Ustanka i Drvara | [Čitava kuća](../assets/images/buildings/kuca-bunker.png): šumaste teksture i ravne površine ne uklapaju se uz noviju nacrtanu ruševinu i ambijente. Jedan resurs dele borbeni i dekorativni potrošači. |
| 11 | [Bunker](../storybook.html#artiljerija/bunker-do-trsta) | Do Trsta | [Čitav bunker](../assets/images/buildings/bunker-02.png): gruba ponovljena tekstura i urezane linije puškarnice; uskladiti sa kvalitetom nacrtane ruševine. |
| 12 | [Bombaš](../storybook.html#vojnici/bombas) | Bunker | [Osnovni lik](../assets/images/armies/game-ready/vojnici/bombas-sprites.png): stari raster stajanja i hoda je sačuvan, dok su kasnije dodati bacanje i pad. Za usklađen kvalitet potreban je isti novi lik kroz sve radnje, ne još jedno prepakivanje. |
| 13 | Mitraljezac u kući | Bunker, Do Trsta | [Figura i mitraljez](../assets/images/armies/game-ready/vojnici/mitraljezac-sprites.png): sačuvan je krupan kadar 63×27 sa blokovskom glavom i rukama; novi trzaj i pad nisu nova osnovna figura. Ne pretpostaviti da izvor sadrži celo telo. |
| 14 | [Ranjeni partizan](../storybook.html#vojnici/ranjeni-partizan) | Ranjenik | [Osnovni lik](../assets/images/armies/game-ready/vojnici/wounded-sprites.png) i povezane radnje: izvornih 69×27 px, ravne obojene plohe i slabo razdvojene ruke/oprema. Sačuvati pogled odozgo. |
| 15 | [Nemačka patrola](../storybook.html#vojnici/nemacka-patrola) | Ranjenik; delovi figure i u obalskom gnezdu | [Sva tri čoveka](../assets/images/armies/game-ready/vojnici/german-patrol-sprites.png): prvobitna mala tela i glave zadržani su pri dodavanju koraka. Potrebno precrtavanje grupe u istom pogledu. |
| 16 | [Italijanska patrola](../storybook.html#vojnici/italijanska-patrola) | Ranjenik | [Sva tri čoveka](../assets/images/armies/game-ready/vojnici/italian-patrol-sprites.png): isti problem sa sačuvanim starim osnovnim crtežom; uskladiti mirovanje, hod, pogodak i pad. |
| 17 | Somua S35 · samo cev | Do Trsta | [Cev](../assets/images/armies/game-ready/tenkovi/somua-s35-barrel.png) je teksturisana izvorna slika, stilski različita od [čitljivog nacrtanog trupa](../assets/images/armies/game-ready/tenkovi/somua-s35-sprites.png). Nema osnova za ponovno crtanje celog tenka. |

Dodatna četiri kandidata za poređenje vodi [AR-P01](#ar-p01).

**Nije pronađen razlog za potpuno precrtavanje:** novi nemački strelac i jurišnik, partizanski strelac, zastavnici i posade Ustanka, četiri nove partizanske uloge, Nemac i Četnik spreda, glavni tenkovi, Somuin trup, oba Opela, Potez sa obe oznake, bočni He 111 i Storch, postojeći avioni odozgo i šest teksturisanih neprijateljskih plovila. Okupator ostaje u posebnom realističnom stilu Otpisanih; nedostajući pogodak vodi IG-13. To nije novo vlasnikovo odobrenje ni potvrda svih pokreta.

Za svaki izabrani novi crtež uskladiti i njegovo oštećenje, pad/olupinu i odvojene delove, uz očuvanje sudarnih mera, orijentacije, oslonca i tačke pucnja. Već upotrebljive odvojene posade i efekte zadržati. Pozadine, UI, neupotrebljena zbirka izvora i 3D modeli nisu deo ovog popisa 2D aktera.

<a id="ar-p01"></a>
### AR-P01 · Poređenje kvaliteta

BP-42, M15/42, StuG III i Hočkis su izdvojeni pri pregledu IG-16: imaju novije pripremljene crteže, ali ravnije ili zrnastije senčenje. Uporediti ih u veličini igre sa glavnim tenkovima i tek tada odlučiti da li traže doradu ili precrtavanje. Nema naloga za automatsku izradu četiri nova atlasa.

<a id="ar-p02"></a>
### AR-P02 · Odložene provere

Pre pokretanja proveriti sadašnji dokaz u [TESTING](TESTING.md#art-verification-record), da se već izvršene provere ne ponavljaju. Za preostale dopune proveriti učitavanje, mirovanje, kretanje, radnju, pogodak, završnu pozu, oba smera, pauzu i reset u stvarnim potrošačima. Raniji unit ili statični pregled ne dokazuje prirodan pokret.

Obuhvat prenet iz beleški o dopunama: tenkovi i Somua, oba Opela, Hummel i BP-42, pešadija i posade, Ranjenik i patrole, propeleri i olupine aviona, S-30 i obalsko gnezdo, nova plovila i podrška iz paketa plana ideja. Posebno su bili odloženi pokret, vatra, voda i stvarno učitavanje iz ART-11; za obuhvaćene priče koristiti noviji [izmereni pregled](TESTING.md#sačuvani-dokazni-izvori), umesto stare opšte tvrdnje da browser nije pokretan. Uključiti fizičko poravnanje tla i živih efekata za dopunjene pozadine gde to još nije provereno. Obim izabrati prema promeni i važećoj dozvoli; puna testna serija nije automatski deo ovog posla.

<a id="ar-p03"></a>
### AR-P03 · Pregledi aktera

U ranijim beleškama ostali su otvoreni: punjenje nemačkog strelca; hod i oba pada partizanskog strelca; Bombašev završni pad i krv; posade topa i precrtani poljski top sa olupinom; Hummelov i BP-42 napad; Okupatorova paljba; obe Potezove olupine. Pregledi su dostupni uz svaki resurs u [ART](ART.md#resursi-i-zajednički-potrošači), a za Potez u [tabeli aviona](ART.md#avioni). Ne upisivati prihvatanje na osnovu same dostupnosti slike ili prolaska testa.

<a id="ar-p04"></a>
### AR-P04 · Ambijenti i rekviziti

Pregledati [deset rasporeda rekvizita](ART.md#rasporedi-u-igri), uključujući novi raspored Batine, i preostale ambijente iz [šest ugrađenih pozadina](ART.md#šest-ambijenata-sadašnjih-nivoa). Izbor slojevite Batine već je potvrđen; time nije potvrđen novi raspored poginulih. Otpisani koriste izabranu crno-belu pozadinu, ali pregled njene kompozicije u igri nije zabeležen kao završen. Očuvati postojeće potvrđene izbore; nedostatak pregleda nije nalog za novu generaciju.

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Dodatni desanti na Brač, Mljet i Korčulu ostaju ideje za igru uz istorijsku proveru, a ne zadaci izrade arta. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

## Arhitektura

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

## UI

<a id="ui-01"></a>
### UI-01 · Preostale izvršne provere

Proći prilagođene početne izbore, grešku pripreme, naplatu i povraćaj žetona. Na stvarnom touch uređaju proveriti istovremene pritiske, držanje, otkazivanje, blur i vraćanje iz pauze; DOM nije taj dokaz. Ciljano proveriti lokalne DevelopmentCoins slučajeve samo ako ih noviji dokaz još ne pokriva. Ne uvoditi obavezu serije slika svake teme i ekrana: vlasnik je birao pregled kroz igru.

<a id="igre"></a>
## Igre i ideje

<a id="ig-14"></a>
### IG-14 · Kandidati za vlasnikov izbor

Kandidati nisu nalog za izradu. Posle izbora dopuniti art, telo, zajednički prikaz i Storybook priču, povezati aktera sa igrom i odigrati nivo.

- **Vis:** partizanski [Hurricane, Spitfire i Il-2](../assets/images/armies/partizani/avioni/) odozgo.
- **Do Trsta i Tenkići:** [italijanski tenkovi](../assets/images/armies/talijani/tenkovi/), [AB41](../assets/images/armies/talijani/vozila/), [BMW R11](../assets/images/armies/nemci/motori/) i ostala [nemačka vozila](../assets/images/armies/nemci/vozila/). Tenkići zahtevaju novu odluku o proširenju dvoboja.
- **Ustanak:** [italijanski top 47 mm sa posadom i minobacači](../assets/images/armies/talijani/artiljerija/); zahteva novu odluku o proširenju dvoboja.
- **Pešadija:** italijanski, britanski, ruski, četnički i SS vojnici; potrebni su atlasi pokreta.
- **Otpisani:** nemački motociklista sa mitraljezom u postojećem realističnom crno-belom stilu.

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

<a id="ig-24"></a>
### IG-24 · Parole Bihaća

Liberated City je Bihać krajem 1942. Natpisi o dolasku Crvene armije i plakat RED_ARMY_IS_HERE pripadaju drugom okviru; vlasnik bira zamenu ili uklanjanje pre izmene sadržaja.

## Notes

Waiting: čeka navedeni zavisni posao.

1. <a id="note-1"></a>**IG-13:** imagegen je odbio tri preostala resursa; [ograničenja i zapis odbijanja](ART.md#dopune-iz-plana-ideja--predaja-arta). Ostali pripremljeni paketi su povezani; obuhvat izvršenih [provera](TESTING.md#predaja-arta-iz-plana-ideja) i datirani browser dokaz čitaju se odvojeno.
2. <a id="note-2"></a>**IG-14:** pet prethodno izabranih aktera je povezano; [art](ART.md#dopune-iz-plana-ideja--predaja-arta) i [provere](TESTING.md#predaja-arta-iz-plana-ideja). Čeka se izbor novih kandidata.
