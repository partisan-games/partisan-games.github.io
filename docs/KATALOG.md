# Katalog

[pages/catalog.html](../pages/catalog.html) je vlasnikov katalog aktera igre: igrača i neprijatelja koje može pojedinačno da pregleda i isproba na praznoj pozornici. Otvara se na istom serveru kao igre, npr. `/pages/catalog.html`. Nije deo igre, pa ne troši novčiće i nije u meniju; njegove kontrole bira agent, a vlasnik ih pregleda ([pravilo](DOCS.md#odobravanje-ui-elemenata)). Pravila samih blokova su u [arhitekturi](ARHITEKTURA.md#gradivni-blokovi).

## Art katalog

Dodir ili klik naziva slike kopira putanju relativnu od korena projekta, npr. `assets/images/armies/ameri/diverzanti/diverzant-01.png`, i prikazuje potvrdu; dodir same slike otvara original. Ako kopiranje nije dostupno ili je odbijeno, prikazuje se neuspeh umesto lažne potvrde.

Pripremljeni art za igre je u `assets/images/game-ready`, izvan izvornog foldera `armies`, pa se ne prikazuje u Art katalogu; katalog aktera i nivoi ga i dalje koriste.

[Art katalog](../art/index.html), povezan sa naslovne, ima dve osnovne sekcije: **2D** prati celu strukturu `assets/images/armies`, a **3D** strukturu `assets/models`. U obe je levo pretraživo stablo foldera, desno galerija izabranog foldera. To je jedna stranica: [catalog.js](../art/catalog.js) iz spiska [catalog.json](../art/catalog.json) crta stablo i folder koji adresa imenuje, npr. `#2d/ameri/diverzanti`, sa podfolderima i slikama koje se nalaze neposredno u njemu. Slike se ne kopiraju, čuvaju providnost i GIF animaciju, prikazuju izvorne dimenzije i otvaraju original klikom. U sekciji **3D** stablo navodi i imena modela u folderima sa više modela; klik na ime ili na folder sa jednim modelom odmah prikazuje model, a adresa (`#3d/folder/ime-fajla`) pamti izbor. Folder pokazuje svoje modele, a izabrani se učitava tek kad je izabran, u [prikazivač](../art/modelViewer.js) sa tlom kataloga, svetlim nebom i okretanjem mišem; FBX fajlovi sa samo animacijom, bez modela, i folderi u kojima su samo teksture se ne prikazuju. Posle dodavanja ili uklanjanja slika, modela ili foldera pokrenuti `python -B scripts/build-art-catalog.py`: menja samo `catalog.json`, i to samo redove promenjenih fajlova; `--check` proverava da je spisak ažuran.

## Stavke kataloga i varijante

**Dogovor vlasnika, dopunjen 2026-11-24.** Lik u katalogu ima jednu stavku koja prati njegov identitet. Kod vozila stavku određuju tip i model.

- **Jedan tip i model vozila je jedna stavka.** Mali čamac, patrolni brod, desantna teglenica i različiti modeli tenkova imaju zasebne stavke, čak i kada koriste istu klasu. Različiti modeli vozila ne skrivaju se pod „Izgled”.
- **Skinovi ostaju unutar iste stavke.** Boje, oznake i druge vizuelne varijacije istog aktera biraju se kroz „Izgled”; dodat predmet poput cevi bira se kao varijanta opreme istog aktera. Promena strane prikaza takođe pripada istoj stavci.
- **Jedan vojnik ima jedno mesto u katalogu.** Čuvamo lice i identitet lika kroz priču. Sava može da nosi pušku, nož ili mitraljez, a svako oružje i svaka uniforma su varijante u Savinoj stavci.
- **2D partizani se nazivaju po ulozi.** Koristimo nazive poput „Partizanski zastavnik“ i „Partizanski strelac“, bez ličnih imena i nadimaka.
- **Različiti ljudi imaju zasebne stavke.** Više likova može koristiti isti 3D model tela, uz lice koje pripada svakom od njih.
- **Sekcije služe snalaženju.** Akteri koji dele kod mogu biti u istoj sekciji, ali to nije obavezno. Imena i raspored treba da pomognu vlasniku da pronađe aktera, nezavisno od organizacije klasa i datoteka.

Ovo je pravilo organizacije.

Pripremljeni kandidati mogu biti u katalogu pre izbora za nivo. Panel ih označava kao kandidate i nudi samo postojeće crteže i radnje; uvrštavanje u katalog nije dozvola da se automatski dodaju u nivo.

Sezonska namena mora biti vidljiva u panelu. Stražar u šinjelu ima `allowedSeasons: ['winter']`: šinjel je isključivo zimska uniforma i ne koristi se u prolećnim, letnjim ili jesenjim nivoima. Ograničenje se poštuje i pri kasnijem izboru sastava nivoa.

## Upotreba

- Katalog prikazuje aktere i scenografiju. Svaka nova ili precrtana zgrada i svaki rekvizit dobija svoju stavku u **Scenografiji**, pod odgovarajućom vrstom. Igra i katalog učitavaju isti crtež. Pozadine nivoa i efekti poput eksplozije vide se uz scenu ili aktera.
- Levo je sklopivo stablo **2D / 3D → vrsta → podvrsta**, npr. **3D → Vojnici → Italijanski**. Nadgrupe rade mišem i tastaturom i pamte stanje u lokalnom skladištu pregledača. Pretraga po nazivu, igri ili skinu otvara put do rezultata; brisanje pretrage vraća zapamćene grupe. Direktan link otvara sve grupe izabranog aktera, a Reset ih ne gradi ponovo.
- Priča ima adresu `#vrsta/priča`, a varijanta `#vrsta/priča/izgled`. Zasebne stavke imaju pojedinačni likovi i različiti modeli čamaca, tenkova i aviona. Pregledač preusmerava stare adrese na odgovarajuću stavku i varijantu. Primer je [mali nemački čamac](../pages/catalog.html#brodovi/nemacki-mali-camac).
- Akter kojim igrač upravlja u svojoj igri u katalogu se vodi istim, standardnim kontrolama: tastaturom igre i strelicama i dugmadima na ekranu, preko kontrolera te igre ([kontrole igrača](../catalog/playerControls.js), [rasporedi unosa](../core/io/inputLayouts.js)). Strelice stoje na sceni između spiska i panela. Panel tada nema dugmad koja ponavljaju kontrole, poput „Levo” ili „Ispali”; komande ostaju samo za ono što kontrole ne mogu, kao meta za vežbu ili sletanje (odluka vlasnika, 2026-11-25). Ostali blokovi nemaju upravljanje: pokreću se dugmadima svojih stanja i pucanja.
- Desno su izbor strane („Nalevo”, „Nadesno”), dugmad stanja bloka sa „Pogođen” ispred `dead` i „Reset” kao poslednjim u tom redu, zatim pucanja koja blok podržava („Pucaj gore”, „Pucaj pravo”), „Prati kamerom”, a na dnu traka trenutnog zdravlja bloka koji može biti pogođen. Panel nema podešavanja (odluka vlasnika, 2026-11-22). Nema ni pasusa sa opisima i napomenama: ime stavke navodi model, kao „Bombarder Avro Lancaster” (odluka vlasnika, 2026-11-25).
- Svaka priča stavlja svoj blok na sredinu pozornice, bez obzira na to odakle on ulazi u igri (odluka vlasnika, 2026-11-22).
- Isti akter okrenut na drugu stranu nije posebna priča (odluka vlasnika, 2026-11-22): bočna priča navodi `way`, stranu na koju je akter okrenut u svojoj igri (1 desno, -1 levo), a njen `create(stage, way)` pravi telo okrenuto na izabranu stranu; prikaz sliku sam ogleda po pravcu tela. Izbor strane ostaje dok se priča pravi ponovo, a „Reset” i druga priča vraćaju njen `way`. Za skinove istog aktera, kao oznake Poteza, priča navodi `looks` (`id`, ime i vrednost koju `create(stage, way, look)` dobija), a panel ima dugmad „Izgled”. Svaki izgled ima svoju adresu, `#vrsta/priča/izgled`, pa se može otvoriti i iz testa. Zajednički kod nije osnov da se različiti akteri spoje kroz `looks`.
- „Reset” ponovo pravi priču; potreban je jer stanje ne vraća mrtav blok, a blok koji odleti ili odveze se ostaje van ekrana. Isto radi klik na priču u spisku.
- Kamera stoji; „Prati kamerom” drži blok u sredini ekrana. Avion igrača, koji leti brzinom leta, prati od početka.
- Dugme napada prvo nanišani top pravo, a Ju 87 prema tlu ispred aviona. Komanda „Obruši se” pokreće isti nalet iz trenutnog položaja. Bombarderi iz Ratweeka koriste strelice za upravljanje, Space za raketu i C za rafal, i nanišane metu ispred, iznad ili iza aviona. [Messerschmitt Bf 109](../pages/catalog.html#letelice-3d/lovac-bf-109-3d) je jedna priča sa svim stanjima lovca; strelice ga preuzimaju (stanje `flown`), a Space puca pravo iz nosa. Kuli se može postaviti meta koju njen top može da pogodi.

## Pozornica

[Stage2D](../catalog/Stage2D.js) je prazna 2D scena: nebo, tlo, kamera i nevidljivi zamenik igrača (`stage.target`), koga prate blokovi koji lete ili voze za igračem, kao lovac. Zamenik prima pogotke, ali ne strada; razmera dolazi iz priče. Pozornica crta samo blok.

[Stage3D](../catalog/Stage3D.js) je prazna 3D scena: svetlo, pod i kamera koja se okreće oko sredine. Mišem se okreće prevlačenjem; na touchpadu pomeranje dva prsta u bilo kom smeru rotira pogled, a širenje ili sklapanje dva prsta zumira. Oba pokreta rade nad istim OrbitControls ciljem, pa promena izgleda i animacije ne resetuje ugao. Priča koja traži 3D pozornicu to kaže poljem `stage`; njen `create` je asinhron, jer prvo učitava modele. Za 3D lika panel pravi dugmad i od njegovih animacija (`anim.actions`), a lik igrača se vodi tastaturom igre.

## Dodavanje priče

Sklapaju se prva dva nivoa od korena: **2D/3D** i **vrsta aktera**, bez obzira na sadržaj grupe. Treći i dublji nivoi, npr. nacionalnosti vojnika, imaju stalno vidljiv naslov i spisak unutar otvorene nadgrupe. Pretraga skriva prazne grupe i otvara put do rezultata.

Priče su u [catalog/stories](../catalog/stories/), po jedna datoteka za igru, a [index.js](../catalog/stories/index.js) ih raspoređuje po vrstama. Priča ne uvozi scene igara: pravi samo objekat, koji igre koriste u istoj implementaciji, a sastav nivoa ostaje u igri. Priča je `{ id, name, game, block, create(stage) }`: `block` je modul bloka (`import Flak, * as flakModule from ...`), a `create` pravi blok, stavlja ga na pozornicu i vraća ga. Za čisto telo `create` stavlja na pozornicu telo i njegov prikaz, a vraća telo, kao u [pričama tenkova](../catalog/stories/tenkici.js).

`catalogGroup` je niz naziva grupa unutar dimenzije; njime se izričito određuje mesto aktera u stablu. `aliases` na priči ili skinu čuva stare putanje `priča[/izgled]` unutar vrste. [catalogEntries](../catalog/stories/catalogEntries.js) izdvaja modele sa zajedničkom fabrikom; `modelIds` daje njihove javne adrese. Dodavanje nove klase ne dodaje automatski stavku: autor dodaje svaki njen tip/model/ulogu i proverava katalog.

**Vrsta arta nije vrsta pozornice.** Ravna slika koja se prikazuje na `Stage3D` navodi `dimension: '2d'`; 3D pozornica joj omogućava prikaz u prostoru, ali je ne pretvara u 3D model. Bez izričite dimenzije zadržava se dosadašnji izbor prema pozornici. Drvarski spriteovi su prvobitno završili pod 3D zbog tog podrazumevanja; premeštanje između nizova u indeksu samo po sebi ne menja koren navigacije. [Provera navigacije](../tests/unit/catalogNavigation.test.js) zato proverava stvarne 2D/3D grupe za sve stavke Drvara.

Panel čita blok:

**Jedna radnja ima jedno dugme.** Kada `attack` (ili 3D animacija `fire`) pokreće jedini napad aktera, panel prikazuje njega, bez dodatnog „Pucaj pravo” za istu radnju. Kod više različitih napada posebna dugmad zamenjuju opštu komandu napada. Duplirani napad iz animacija i radnji takođe se skriva; samostalno nišanjenje automatskog oružja ostaje dostupno.

Ciljni prikaz svih aktera koristi [standardna stanja](ARHITEKTURA.md#standardna-stanja-aktera) `idle`, `move`, `attack`, `dead`, uz izbor konkretnog pokreta/napada i jasno nedostupne radnje koje ne pripadaju ulozi.

- `states`, `state` i `setState(name)` daju dugmad stanja;
- svako stanje mora moći da se uključi direktno, dugmetom, mimo toka igre: ono što mu treba postavlja samo pri ulasku (lovac pri ulasku u `extend` sam bira tačku ispred sebe), inače dugme ruši blok;
- letelica u katalogu leti u mestu, kao bombarderi: priča joj svakog kadra vraća položaj, a nevidljiva meta stoji ispred nje. Avioni imaju ista stanja `move`, `land` i `dead` kao ostali, uz svoja (vlasnik, 2026-11-26);
- `health` (`current`, `maximum`) i `takeHit(damage)` daju dugme „Pogođen”, koje bloku skida desetinu zdravlja, i traku zdravlja na dnu;
- posebno stanje „Komandir pogođen“ kod Panzera III prikazuje pogodak posade dok tenk nastavlja da vozi;
- stvarna masa, najveća brzina i naoružanje modela iz `physical` ([zajednički zapis](../core/gameplay/modelStatistics.js)), uz `health.maximum` i `performance.bombs`, ispisuju se na dnu panela, ispod trake zdravlja. Odnosi balansa (`speed`, `firepower`) se ne prikazuju, jer ne govore koliko je model brz ili jak. Panel čita samo telo; vrednost koje nema u izvorima se izostavlja;
- `shots` (tačka ispred bloka i iznad njega za svako pucanje), `forward` (1 desno, -1 levo) i `aimAt(point)` daju dugmad pucanja: dugme nanišani blok u tačku tog pucanja i stavi ga u `attack`; pucanje sa `automatic`, kao zadnji strelac Poteza, samo nanišani, jer to oružje puca samo, pa ostala oružja bloka ćute.

Blok koji ne može da se napravi samo sa opcijama pozornice još nije nezavisan; prvo se refaktoriše po [pravilima](ARHITEKTURA.md#gradivni-blokovi).

<a id="obavezne-faze-unistenja"></a>
### Obavezne faze uništenja

Svako uništivo vozilo i oruđe u 2D i 3D katalogu prikazuje sve sledeće faze:

| Prikaz | Šta igrač mora da vidi |
|---|---|
| Ispravno stanje | Osnovni crtež ili model sa izvornom bojom, kompletnim delovima i čitljivom siluetom. |
| **Pogođen** | Već prvi neubitačni pogodak ostavlja vidljivu promenu na crtežu ili modelu, na primer ogoljenu boju, udubljenje ili lokalnu garež. Trag ostaje kad prođu bljesak, trzaj i prašina. |
| **Uništen** (`dead`) | Kumulativna šteta završnog arta i jasno vidljiv aktivan efekat, na primer malo žarište ili dim primeren akteru. Prikaz ostaje prepoznatljiv kao aktivno uništenje i kad se prvi prasak i dim raziđu. Letelica odigra pad ako ga ima. |
| **Olupina** (`wreck`) | Direktan prikaz završnog oštećenog arta kao hladnog ostatka, bez vatre, dima, eksplozije ili ponavljanja pada. |

Pre predaje proveri direktan izbor `dead` i **Olupine**, dugme **Pogođen** i **Reset**. Uporedi sva četiri prikaza u istom kadru i pri istoj razmeri. Posebno proveri da trajni trag prvog pogotka ostaje ili je vidljivo pojačan na uništenom artu i da se aktivno i hladno stanje razlikuju posle kratkih efekata. Vizuelnu proveru radi prema [pravilima projekta](DOCS.md). [Likovna gradacija](ART.md#gradacija-unistenja).

## Provere

Scenografija je složena po vrsti predmeta, ne po igrama, da isti predmet služi u više igara. U 2D su [pali borci i krv](../core/sceneryArt.js) kojima igre pokrivaju bojište, crkva iz Do Trsta i zakloni iz Neretve ([priče](../catalog/stories/scenery.js)); nemaju stanja, pa se samo vide. Hladna olupina je stanje `wreck` u priči svog vozila ili oruđa. Paket [Crveni krst](../pages/catalog.html#scenografija-3d/sklop) daje sedam originalnih delova ambijenta, raspoređenih u **Zgrade**, **Ograde i kapije** i **Zakloni**, i jedan zajednički sklop u **Sklopovi**, sa probama kapije i reflektora. Isti paket koristi Escape Concentration Camp; kataloški sklop nije njegov raspored niti istorijski tlocrt. [Mere, poreklo i povezivanje](../assets/models/building/crveni-krst/README.md).

3D priče učitavaju FBX telo i lokalne klipove paralelno, uz čekanje svih animacija. [Pozornica](../catalog/Stage3D.js) posle pripreme izgleda grupiše neprozirne trouglove po materijalu preko [zajedničke optimizacije](../core3d/assets/optimizeGeometry.js). Pri promeni pešadijske varijante prvo se vraća sačuvana izvorna geometrija, zatim primenjuje oprema i tek onda optimizuje; sačuvati taj redosled. Detalji modela, kosti i providni redosled ostaju isti. 2D akteri koriste [manje kopije istih slika](ART.md#manje-slike-aktera-bez-promene-arta).

Postojeću pokrivenost aktera grafikom, pripremu i povezivanje dopuna vodi [ART](ART.md). Postojanje stanja ili priče samo po sebi ne dokazuje da telo ima poseban animirani klip.

Svaka dopuna arta mora postati dostupna u postojećoj ili novoj priči aktera. Priča i svi nivoi koriste isti objekat i zajedničko mapiranje arta; poseban HTML/GIF pregled nije zamena. Art zadatak se zatvara tek posle [obavezne integracije i provera](ART.md#obavezna-integracija).

[catalogStories.test.js](../tests/unit/catalogStories.test.js) pravi svaku priču, prolazi kroz sva njena stanja i proverava da svako navedeno pucanje ispali metak. [catalogCoverage.test.js](../tests/unit/catalogCoverage.test.js) traži priču za svakog aktera u navedenim folderima. [catalogStage2D.test.js](../tests/unit/catalogStage2D.test.js) proverava pozornicu, praćenje kamerom i da gašenje ne ostavlja rukovaoce na stranici. Izgled se proverava samo okom.

Provera pokrivenosti prati module koje koriste stavke i njihove varijante. [catalogNavigation.test.js](../tests/unit/catalogNavigation.test.js) dodatno proverava modele vozila, pešadijske identitete i opremu, stare adrese, pretragu i pamćenje grupa.

Sklopive sekcije koriste native `details`/`summary`; `summary` mora biti UI cilj u [inputContext](../core/io/inputContext.js), da tastatura igre ne presretne Space/Enter. Izvršene dokaze čuva [TESTING](TESTING.md), bez održavanja broja adresa u ovom vodiču.

## Granice i odluke

- Predmet se isprobava samo kroz svoja stanja, radnje i pucanje, uz tastere igre za upravljive aktere; katalog nema odeljak sa posebnim probnim komandama (vlasnik, 2026-11-26). Protivnik ili meta koju predmet treba da gađa je nevidljiva zamena koju priča postavlja.

- Morska mina je predmet/prepreka, pa nema zasebnu stavku u katalogu aktera.

- 3D lik se ne može napraviti u unit testu bez učitanog modela, pa 3D priče proverava browser. Top iz igre Battle for Jablanica ima priču bez fizike: posada puni top i trgne se pri opaljenju, a let granate i rušenje tvrđave ostaju u igri (odluka vlasnika, 2026-11-23).
- Katalog je za predmete i aktere, ne za prikaz scena (odluka vlasnika, 2026-11-25): pozornica prikazuje jednog aktera, a protivnika ili metu mu zamenjuje nevidljivi zamenik, kao lovcu Bf 109 zamenik bombardera. Više aktera koji deluju jedan na drugog uvodi se tek ako vlasnik to zatraži.
- [Nemac](../pages/catalog.html#vojnici/nemac-u-rovu) i [Četnik](../pages/catalog.html#vojnici/cetnik-u-rovu) imaju celu figuru koja hoda, nišani, puca i ostaje na zemlji posle pada. U Neretvi se Nemci zaklanjaju u rovovima, a četnici iza gomila kamenja. [Zakloni](../core/objects/Cover.js) su zasebna scenografija.
- Namerno nije preuzeto: biblioteka Storybook i React (traže build), kontrole iz unutrašnjih polja objekta (daju besmislena polja) i upravljanje vremenom igre, poput pauze ili usporavanja (vlasniku ne treba).
