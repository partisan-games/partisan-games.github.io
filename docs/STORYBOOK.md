# Storybook

[storybook.html](../storybook.html) je vlasnikov katalog aktera igre: igrača i neprijatelja koje može pojedinačno da pregleda i isproba na praznoj pozornici. Otvara se na istom serveru kao igre, npr. `/storybook.html`. Nije deo igre, pa ne troši novčiće i nije u meniju; njegove kontrole bira agent, a vlasnik ih pregleda ([pravilo](DOCS.md#odobravanje-ui-elemenata)). Pravila samih blokova su u [arhitekturi](ARHITEKTURA.md#gradivni-blokovi).

Za svaki izgled dostupan je [pregled proverenih radnji](../pregled-animacija.html) sa direktnim ulazom u priču.

## Stavke kataloga i varijante

**Dogovor vlasnika, 2026-11-22:** katalog razdvaja aktere prema tipu, modelu i ulozi u igri. Deljenje koda, nasleđivanje, zajednička klasa ponašanja ili zajednički 3D model ne određuju broj stavki kataloga.

- **Jedan tip i model vozila je jedna stavka.** Mali čamac, patrolni brod, desantna teglenica i različiti modeli tenkova imaju zasebne stavke, čak i kada koriste istu klasu. Različiti modeli vozila ne skrivaju se pod „Izgled”.
- **Skinovi ostaju unutar iste stavke.** Boje, oznake i druge vizuelne varijacije istog aktera biraju se kroz „Izgled”; okretanje na drugu stranu takođe ne pravi novu stavku.
- **Za vojnike su važni identitet i borbena uloga.** Italijanski strelac, nemački strelac i britanski strelac imaju zasebne stavke; strelac i mitraljezac takođe su odvojeni. Letnja i zimska uniforma istog vojnika mogu biti skinovi u njegovoj stavci.
- **Isto pravilo važi za 3D.** Jedan model čoveka može poslužiti različitim vojnicima u zasebnim stavkama; unutar pojedinačnog aktera dostupni su njegovi skinovi i varijacije. Drugi model vozila ili drugog aktera dobija zasebnu stavku.
- **Sekcije služe snalaženju.** Akteri koji dele kod mogu biti u istoj sekciji, ali to nije obavezno. Imena i raspored treba da pomognu vlasniku da pronađe aktera, nezavisno od organizacije klasa i datoteka.

Ovo je pravilo organizacije; preostalo usklađivanje kataloga i navigacije vodi [PLAN](PLAN.md#storybook).

## Upotreba

- Storybook prikazuje samo aktere, igrače i neprijatelje, uključujući bibliotečke klase za te uloge; pozadine, okolina, efekti, projektili i predmeti nemaju zasebne priče (odluka vlasnika). Saradnici poput metka ili eksplozije mogu se videti uz aktera tokom pucanja/pogotka, a svetlo, tlo i meta deo su pozornice. Obim određuje uloga, ne folder klase.
- Levo je sklopivo stablo **2D / 3D → vrsta → podvrsta**, npr. **3D → Vojnici → Italijanski**. Nadgrupe rade mišem i tastaturom i pamte stanje u lokalnom skladištu pregledača. Pretraga po nazivu, igri ili skinu otvara put do rezultata; brisanje pretrage vraća zapamćene grupe. Direktan link otvara sve grupe izabranog aktera, a Reset ih ne gradi ponovo.
- Priča ima adresu `#vrsta/priča`, skin `#vrsta/priča/izgled`. Različiti čamci, tenkovi, avioni i nacionalnosti/uloge pešadije imaju zasebne stavke. Stari linkovi ostaju aliasi; pregledač ih zamenjuje novom adresom bez ponovnog učitavanja. Primer: [mali nemački čamac](../storybook.html#brodovi/nemacki-mali-camac).
- Priča nema upravljanje ni ulogu: pozornica ne daje tastere blokovima, a blok se pokreće samo dugmadima svojih stanja i pucanja.
- Desno su izbor strane („Nalevo”, „Nadesno”), dugmad stanja bloka sa „Pogođen” ispred `dead` i „Reset” kao poslednjim u tom redu, zatim pucanja koja blok podržava („Pucaj gore”, „Pucaj pravo”), „Prati kamerom”, a na dnu traka trenutnog zdravlja bloka koji može biti pogođen. Panel nema podešavanja (odluka vlasnika, 2026-11-22).
- Svaka priča stavlja svoj blok na sredinu pozornice, bez obzira na to odakle on ulazi u igri (odluka vlasnika, 2026-11-22).
- Isti akter okrenut na drugu stranu nije posebna priča (odluka vlasnika, 2026-11-22): bočna priča navodi `way`, stranu na koju je akter okrenut u svojoj igri (1 desno, -1 levo), a njen `create(stage, way)` pravi telo okrenuto na izabranu stranu; prikaz sliku sam ogleda po pravcu tela. Izbor strane ostaje dok se priča pravi ponovo, a „Reset” i druga priča vraćaju njen `way`. Za skinove istog aktera, kao oznake Poteza, priča navodi `looks` (`id`, ime i vrednost koju `create(stage, way, look)` dobija), a panel ima dugmad „Izgled”. Svaki izgled ima svoju adresu, `#vrsta/priča/izgled`, pa se može otvoriti i iz testa. Zajednički kod nije osnov da se različiti akteri spoje kroz `looks`.
- „Reset” ponovo pravi priču; potreban je jer stanje ne vraća mrtav blok, a blok koji odleti ili odveze se ostaje van ekrana. Isto radi klik na priču u spisku.
- Kamera stoji; „Prati kamerom” drži blok u sredini ekrana. Avion igrača, koji leti brzinom leta, prati od početka.
- Dugme napada prvo nanišani top pravo, a Ju 87 prema tlu ispred aviona. Komanda „Obruši se” pokreće isti nalet iz trenutnog položaja. Za 3D ratni avion dostupni su pomeranje udesno, raketa i sletanje. Kuli se može postaviti meta koju njen top može da pogodi.

## Pozornica

[Stage2D](../storybook/Stage2D.js) je prazna 2D scena: nebo, tlo, kamera i nevidljivi zamenik igrača (`stage.target`), koga prate blokovi koji lete ili voze za igračem, kao lovac. Zamenik prima pogotke, ali ne strada; razmera dolazi iz priče. Uklanjanje preostalog starog načina prikaza prati migraciju aktera iz [PLAN-a](PLAN.md#arhitektura). Pozornica crta samo blok.

[Stage3D](../storybook/Stage3D.js) je prazna 3D scena: svetlo, pod i kamera koja se okreće oko sredine. Mišem se okreće prevlačenjem; na touchpadu pomeranje dva prsta u bilo kom smeru rotira pogled, a širenje ili sklapanje dva prsta zumira. Oba pokreta rade nad istim OrbitControls ciljem, pa promena izgleda i animacije ne resetuje ugao. Priča koja traži 3D pozornicu to kaže poljem `stage`; njen `create` je asinhron, jer prvo učitava modele. Za 3D lika panel pravi dugmad i od njegovih animacija (`anim.actions`), a lik igrača se vodi tastaturom igre.

## Dodavanje priče

Sklapaju se prva dva nivoa od korena: **2D/3D** i **vrsta aktera**, bez obzira na sadržaj grupe. Treći i dublji nivoi, npr. nacionalnosti vojnika, imaju stalno vidljiv naslov i spisak unutar otvorene nadgrupe. Pretraga skriva prazne grupe i otvara put do rezultata.

Priče su u [storybook/stories](../storybook/stories/), po jedna datoteka za igru, a [index.js](../storybook/stories/index.js) ih raspoređuje po vrstama. Priča je `{ id, name, game, block, create(stage) }`: `block` je modul bloka (`import Flak, * as flakModule from ...`), a `create` pravi blok, stavlja ga na pozornicu i vraća ga. Za čisto telo `create` stavlja na pozornicu telo i njegov prikaz, a vraća telo, kao u [pričama tenkova](../storybook/stories/tenkici.js).

`catalogGroup` je niz naziva grupa unutar dimenzije; njime se izričito određuje mesto aktera u stablu. `aliases` na priči ili skinu čuva stare putanje `priča[/izgled]` unutar vrste. [catalogEntries](../storybook/stories/catalogEntries.js) izdvaja modele sa zajedničkom fabrikom; `modelIds` daje njihove javne adrese. Dodavanje nove klase ne dodaje automatski stavku: autor dodaje svaki njen tip/model/ulogu i proverava katalog.

Panel čita blok:

**Jedna radnja ima jedno dugme.** Kada `attack` (ili postojeći `fire`) pokreće jedini napad aktera, panel prikazuje njega, bez dodatnog „Pucaj pravo” za istu radnju. Kod više različitih napada posebna dugmad zamenjuju opštu komandu napada. Duplirani napad iz animacija i radnji takođe se skriva; samostalno nišanjenje automatskog oružja ostaje dostupno.

Ciljni prikaz svih aktera koristi [standardna stanja](ARHITEKTURA.md#standardna-stanja-aktera) `idle`, `move`, `attack`, `dead`, uz izbor konkretnog pokreta/napada i jasno nedostupne radnje koje ne pripadaju ulozi. Sadašnji panel još čita stara imena iz blokova; usklađuje se zajedno sa njima, kad se telo menja ([preslikavanje](ARHITEKTURA.md#prelaz-na-standardna-imena)), bez tvrdnje da je standard već sproveden u kodu.

- `states`, `state` i `setState(name)` daju dugmad stanja;
- `health` (`current`, `maximum`) i `takeHit(damage)` daju dugme „Pogođen”, koje bloku skida desetinu zdravlja, pa se posle nekoliko klikova vidi oštećenje (dim, sporiji avion, pokvaren tenk), i traku zdravlja na dnu;
- `shots` (tačka ispred bloka i iznad njega za svako pucanje), `forward` (1 desno, -1 levo) i `aimAt(point)` daju dugmad pucanja: dugme nanišani blok u tačku tog pucanja i stavi ga u `attack`; pucanje sa `automatic`, kao zadnji strelac Poteza, samo nanišani, jer to oružje puca samo, pa ostala oružja bloka ćute.

Blok koji ne može da se napravi samo sa opcijama pozornice još nije nezavisan; prvo se refaktoriše po [pravilima](ARHITEKTURA.md#gradivni-blokovi).

## Provere

Postojeću pokrivenost aktera grafikom, pripremu i povezivanje dopuna vodi [ART](ART.md). Postojanje stanja ili priče samo po sebi ne dokazuje da telo ima poseban animirani klip.

Svaka dopuna arta mora postati dostupna u postojećoj ili novoj priči aktera. Priča i svi nivoi koriste isti objekat i zajedničko mapiranje arta; poseban HTML/GIF pregled nije zamena. Art zadatak se zatvara tek posle [obavezne integracije i provera](ART.md#obavezna-integracija).

[storybookCatalog.test.js](../tests/unit/storybookCatalog.test.js) pravi svaku priču, prolazi kroz sva njena stanja i proverava da svako navedeno pucanje ispali metak. [storybookCoverage.test.js](../tests/unit/storybookCoverage.test.js) traži priču za svakog aktera u navedenim folderima. [storybookStage2D.test.js](../tests/unit/storybookStage2D.test.js) proverava pozornicu, praćenje kamerom i da gašenje ne ostavlja rukovaoce na stranici. Izgled se proverava samo okom.

Provera pokrivenosti prati module klasa; [storybookNavigation.test.js](../tests/unit/storybookNavigation.test.js) dodatno proverava razdvojene modele, sve postojeće pešadijske varijante, stare adrese, pretragu i pamćenje grupa. Novi tipovi i uloge moraju dobiti stavku i odgovarajuću proveru: sam prolazak provere klasa ne dokazuje potpunost kataloga.

Sklopive sekcije koriste native `details`/`summary`; `summary` mora biti UI cilj u [inputContext](../core/io/inputContext.js), da tastatura igre ne presretne Space/Enter. Izvršene dokaze čuva [TESTING](TESTING.md), bez održavanja broja adresa u ovom vodiču.

## Granice i odluke

- Morska mina je predmet/prepreka, pa nema zasebnu stavku u katalogu aktera.

- 3D lik se ne može napraviti u unit testu bez učitanog modela, pa 3D priče proverava browser. Top iz igre Battle for Jablanica nema priču: puca kroz Ammo fiziku, koju 3D pozornica nema. Preostali posao vezan za Ammo pozornicu vodi [PLAN](PLAN.md#storybook).
- Pozornica prikazuje jednog aktera. Više aktera koji deluju jedan na drugog uvodi se tek ako vlasnik to zatraži.
- [Nemac](../storybook.html#vojnici/nemac-u-rovu) i [Četnik](../storybook.html#vojnici/cetnik-u-rovu) imaju celu figuru koja hoda, nišani, puca i ostaje na zemlji posle pada. Neretva koristi isti model ponašanja sa posebnim crtežom za položaj u [rovu](../core/objects/Trench.js).
- Namerno nije preuzeto: biblioteka Storybook i React (traže build), kontrole iz unutrašnjih polja objekta (daju besmislena polja) i upravljanje vremenom igre, poput pauze ili usporavanja (vlasniku ne treba).
