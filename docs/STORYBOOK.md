# Storybook

[storybook.html](../storybook.html) prikazuje igrače i neprijatelje samostalno na praznoj pozornici, da se isproba kako rade. Otvara se na istom serveru kao igre, npr. `/storybook.html`. Nije deo igre, pa ne troši novčiće i nije u meniju; njegove kontrole bira agent, a vlasnik ih pregleda ([pravilo](DOCS.md#odobravanje-ui-elemenata)). Pravila samih blokova su u [arhitekturi](ARHITEKTURA.md#gradivni-blokovi).

Za svaki izgled dostupan je [pregled proverenih radnji](../pregled-animacija.html) sa direktnim ulazom u priču.

## Upotreba

- Storybook prikazuje samo aktere, igrače i neprijatelje, uključujući bibliotečke klase za te uloge; pozadine, okolina, efekti, projektili i predmeti nemaju zasebne priče (odluka vlasnika). Saradnici poput metka ili eksplozije mogu se videti uz aktera tokom pucanja/pogotka, a svetlo, tlo i meta deo su pozornice. Obim određuje uloga, ne folder klase.
- Levo su dve nezavisno sklopive sekcije, **2D** i **3D**, sa postojećim vrstama i njihovim pričama; otvaraju se klikom ili tastaturom. Priča je jedan blok u jednom početnom podešavanju; adresa joj je `#vrsta/priča`, pa se otvara linkom i ostaje posle reload-a. Direktan izbor priče otvara njenu sekciju; promena priče, izgleda ili Reset čuvaju sklopljenost ostalih sekcija.
- Priča nema upravljanje ni ulogu: pozornica ne daje tastere blokovima, a blok se pokreće samo dugmadima svojih stanja i pucanja.
- Desno su izbor strane („Nalevo”, „Nadesno”), dugmad stanja bloka sa „Pogođen” ispred `dead` i „Reset” kao poslednjim u tom redu, zatim pucanja koja blok podržava („Pucaj gore”, „Pucaj pravo”), „Prati kamerom”, a na dnu traka trenutnog zdravlja bloka koji može biti pogođen. Panel nema podešavanja (odluka vlasnika, 2026-11-22).
- Svaka priča stavlja svoj blok na sredinu pozornice, bez obzira na to odakle on ulazi u igri (odluka vlasnika, 2026-11-22).
- Isti predmet okrenut na drugu stranu nije posebna priča (odluka vlasnika, 2026-11-22): bočna priča navodi `way`, stranu na koju je predmet okrenut u svojoj igri (1 desno, -1 levo), a njen `create(stage, way)` pravi telo okrenuto na izabranu stranu; prikaz sliku sam ogleda po pravcu tela. Izbor strane ostaje dok se priča pravi ponovo, a „Reset” i druga priča vraćaju njen `way`. Isti blok drugačije nacrtan, kao oznake Poteza ili partizanski i italijanski zastavnik, takođe nije posebna priča: priča navodi `looks` (`id`, ime i vrednost koju `create(stage, way, look)` dobija), a panel ima dugmad „Izgled”. Svaki izgled ima svoju adresu, `#vrsta/priča/izgled`, pa se može otvoriti i iz testa.
- „Reset” ponovo pravi priču; potreban je jer stanje ne vraća mrtav blok, a blok koji odleti ili odveze se ostaje van ekrana. Isto radi klik na priču u spisku.
- Kamera stoji; „Prati kamerom” drži blok u sredini ekrana. Avion igrača, koji leti brzinom leta, prati od početka.
- Dugme napada prvo nanišani top pravo, a Ju 87 prema tlu ispred aviona. Komanda „Obruši se” pokreće isti nalet iz trenutnog položaja. Za 3D ratni avion dostupni su pomeranje udesno, raketa i sletanje. Kuli se može postaviti meta koju njen top može da pogodi.

## Pozornica

[Stage2D](../storybook/Stage2D.js) je prazna 2D scena: nebo, tlo, kamera i nevidljivi zamenik igrača (`stage.target`), koga prate blokovi koji lete ili voze za igračem, kao lovac. Zamenik prima pogotke, ali ne strada. Za čisto telo u metrima pozornica daje bočnu projekciju (`stage.projection`, 22 px po metru) i zamenika bez uloge (`stage.dummy`); stari pikselski zamenik ostaje dok svi blokovi ne pređu na tela. Pozornica crta samo blok.

[Stage3D](../storybook/Stage3D.js) je prazna 3D scena: svetlo, pod i kamera koja se okreće oko sredine. Mišem se okreće prevlačenjem; na touchpadu pomeranje dva prsta u bilo kom smeru rotira pogled, a širenje ili sklapanje dva prsta zumira. Oba pokreta rade nad istim OrbitControls ciljem, pa promena izgleda i animacije ne resetuje ugao. Priča koja traži 3D pozornicu to kaže poljem `stage`; njen `create` je asinhron, jer prvo učitava modele. Za 3D lika panel pravi dugmad i od njegovih animacija (`anim.actions`), a lik igrača se vodi tastaturom igre.

## Dodavanje priče

Priče su u [storybook/stories](../storybook/stories/), po jedna datoteka za igru, a [index.js](../storybook/stories/index.js) ih raspoređuje po vrstama. Priča je `{ id, name, game, block, create(stage) }`: `block` je modul bloka (`import Flak, * as flakModule from ...`), a `create` pravi blok, stavlja ga na pozornicu i vraća ga. Za čisto telo `create` stavlja na pozornicu telo i njegov prikaz, a vraća telo, kao u [pričama tenkova](../storybook/stories/tenkici.js).

Panel čita blok:

Ciljni prikaz svih aktera koristi [standardna stanja](ARHITEKTURA.md#standardna-stanja-aktera) `idle`, `move`, `attack`, `dead`, uz izbor konkretnog pokreta/napada i jasno nedostupne radnje koje ne pripadaju ulozi. Sadašnji panel još čita stara imena iz blokova; usklađuje se zajedno sa njima, kad se telo menja ([preslikavanje](ARHITEKTURA.md#prelaz-na-standardna-imena)), bez tvrdnje da je standard već sproveden u kodu.

- `states`, `state` i `setState(name)` daju dugmad stanja;
- `health` (`current`, `maximum`) i `takeHit(damage)` daju dugme „Pogođen”, koje bloku skida desetinu zdravlja, pa se posle nekoliko klikova vidi oštećenje (dim, sporiji avion, pokvaren tenk), i traku zdravlja na dnu;
- `shots` (tačka ispred bloka i iznad njega za svako pucanje), `forward` (1 desno, -1 levo) i `aimAt(point)` daju dugmad pucanja: dugme nanišani blok u tačku tog pucanja i stavi ga u `attack`; pucanje sa `automatic`, kao zadnji strelac Poteza, samo nanišani, jer to oružje puca samo, pa ostala oružja bloka ćute.

Blok koji ne može da se napravi samo sa opcijama pozornice još nije nezavisan; prvo se refaktoriše po [pravilima](ARHITEKTURA.md#gradivni-blokovi).

## Provere

Postojeću pokrivenost aktera grafikom, pripremu i povezivanje dopuna vodi [ART](ART.md). Postojanje stanja ili priče samo po sebi ne dokazuje da telo ima poseban animirani klip.

Svaka dopuna arta mora postati dostupna u postojećoj ili novoj priči aktera. Priča i svi nivoi koriste isti objekat i zajedničko mapiranje arta; poseban HTML/GIF pregled nije zamena. Art zadatak se zatvara tek posle [obavezne integracije i provera](ART.md#obavezna-integracija).

[storybookCatalog.test.js](../tests/unit/storybookCatalog.test.js) pravi svaku priču, prolazi kroz sva njena stanja i proverava da svako navedeno pucanje ispali metak. [storybookCoverage.test.js](../tests/unit/storybookCoverage.test.js) traži priču za svakog aktera u navedenim folderima. [storybookStage2D.test.js](../tests/unit/storybookStage2D.test.js) proverava pozornicu, praćenje kamerom i da gašenje ne ostavlja rukovaoce na stranici. Izgled se proverava samo okom.

Sklopive sekcije koriste izvorne `details`/`summary` kontrole; `summary` mora biti UI cilj u [inputContext](../core/io/inputContext.js), inače tastatura igre presretne Space/Enter. [Input izolacija](../tests/unit/inputIsolation.test.js) proverava propuštanje tih tastera i čišćenje zadržanog ulaza; Chromium provera je potvrdila stvarno otvaranje/zatvaranje, očuvanje svih 79 adresa bez duplikata, Reset, direktan 3D link i sklopljen prikaz na 390 px širine (2026-11-22).

## Granice i odluke

- 3D lik se ne može napraviti u unit testu bez učitanog modela, pa 3D priče proverava browser. Top iz igre Battle for Jablanica nema priču: puca kroz Ammo fiziku, koju 3D pozornica nema. Oba čekaju sređivanje nivoa koji ih koriste (odluka vlasnika).
- Pozornica prikazuje jednog aktera. Više aktera koji deluju jedan na drugog uvodi se tek ako vlasnik to zatraži.
- [Nemac](../storybook.html#vojnici/nemac-u-rovu) i [Četnik](../storybook.html#vojnici/cetnik-u-rovu) imaju celu figuru koja hoda, nišani, puca i ostaje na zemlji posle pada. Neretva koristi isti model ponašanja sa posebnim crtežom za položaj u [rovu](../core/objects/Trench.js).
- Namerno nije preuzeto: biblioteka Storybook i React (traže build), kontrole iz unutrašnjih polja objekta (daju besmislena polja) i upravljanje vremenom igre, poput pauze ili usporavanja (vlasniku ne treba).
