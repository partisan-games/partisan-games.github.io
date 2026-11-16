# Arhitektura

Zajednički engine za 2D i 3D igre. Ovde čuvamo odgovornosti, razloge i bitna ograničenja; implementaciju opisuje kod. Otvorene izmene pripadaju [planu](TODO.md), a sadržaj [istorijskoj vernosti](ISTORIJA.md).

## Odgovornosti

| Deo | Odgovornost |
|---|---|
| [Gameplay](../core/gameplay/) | Čista pravila zdravlja, oružja i punjenja, nezavisna od DOM-a i prikaza. |
| [Runtime](../core/runtime/) | Sesija, satovi, opseg resursa i raspoređivanje simulacije. |
| [2D osnova](../core/actor/) | Položaj, kretanje, sprite objekti i sudari na platnu. |
| [Sudari](../core/collision/) | Čista 2D geometrija: oblici, preklapanje i prvi dodir na putanji projektila. |
| [3D osnova](../core3d/) | Modeli, animacija, kretanje, prikaz i fizički adapteri. |
| [Scene](../scenes/) | Sastavljaju igru; poseduju nivo, protivnike, bodovanje i uslove ishoda. |
| [UI](../ui/) | Meniji, komande i prikaz stanja igre. |

Zajednička pravila sastavljaju se kroz male saradnike, poput zdravlja i oružja. Sprite i mesh imaju različite adaptere; ne zahtevaju dve kopije iste borbene logike. Slojevi, od nižeg ka višem, su `core/runtime`, `core/gameplay` i `core/collision`, `core/io`, `ui`, `core`, `core3d` i `scenes`; modul uvozi samo iz nižih slojeva, a tu granicu štiti [lint](../eslint.config.mjs). Zato čista logika i runtime ne zavise od scene ili prikaza, a 2D osnova ne zavisi od 3D koda. Engine radi samo na stranici sa elementima iz `index.html` (`#ui`, `#modal`, `#platno`, `#platno-3d`), jedna igra u isto vreme; prenosivost na drugu stranicu nije cilj, jer se engine uvek koristi sa istim HTML-om.

Uporedni primeri nasleđivanja, mixina i kompozicije su u [vodiču](COMPOSITION.md).

## Stanje, vreme i život objekta

Kod efekta vezanog za pokretni objekat razlikovati kretanje izvora od sopstvenog kretanja čestica. Pomeraj izvora preneti na postojeće čestice pre stvaranja novih; ne ispravljati kosi trag sabijanjem njihovih položaja ili ukidanjem brzina, jer to menja izgled efekta. Regresiona provera poredi efekat sa izvornim pri mirovanju, pa iste relativne putanje pri pomeranju izvora.

Ponovna upotreba čestica mora resetovati ceo njihov život i sačuvati redosled preživelih pri uklanjanju isteklih iz istog niza. Optimizacija memorije ne sme usput menjati broj, putanje, trajanje ili crtanje čestica; proveravati jednakost sa izvornim efektom i posle ponovne upotrebe.

Uništenje ne poništava brzinu objekta: odvojiti borbenu smrt od pada, dodira tla i uklanjanja olupine. Pri klizanju trenje smanjuje brzinu u odnosu na teren, ne u odnosu na ekran koji se pomera; proveriti kontinuitet brzine pri pogotku i dodiru tla.

Jedno stanje ima jednog vlasnika. Stara imena mogu biti pristupnici istom stanju, a ne dodatna kopija. Bodovanje pripada igri; smrt, respawn i vraćanje u pool nisu ista operacija. Odloženi efekat mora pripadati životu objekta koji ga je pokrenuo, da reciklirani objekat ne primi stari pogodak.

Smrt borbene mete ne uklanja automatski njenu fizičku prepreku. Kod tonjenja posebno odrediti kada olupina prestaje da blokira plovidbu, a preostali podvodni prikaz staviti iza plovila; brzi sudar proveravati duž pomeranja, ne samo preklapanjem na kraju frejma. Provere obuhvataju rotirane trupove, izlazak iz početnog preklapanja, pauzu i brisanje stanja tonjenja pri ponovnoj upotrebi.

[Sesija](../core/runtime/GameSession.js) razdvaja gameplay vreme i vreme prikaza: posle ishoda mogu trajati završni efekti, ali ne nova borba. Petlja sama ne zaustavlja sva pravila igre; njihovi vlasnici moraju poštovati stanje sesije. Odložene akcije i ostali resursi vezuju se za vlasnikov životni ciklus.

Za ponašanje pre AI refaktora referenca je lokalna grana `backup/pre-ai-changes` (`69281020`). Animacije posle ishoda čuvati tamo gde su ranije radile. U bunkeru i ustanku provera ishoda pre ažuriranja objekata zamrzla je vatru i zastavu; provera sada preskače pravila scene tek posle ažuriranja objekata. [Regresioni test](../tests/smoke/victory.spec.js) proverava i nastavak animacija i očuvanu pobedu.

Spremnost oružja nije dozvola za akciju: zaustavljen sat ne poništava već završeno punjenje. Pozivalac proverava stanje partije. Pri migraciji borbe sačuvati i reakcije na pogodak: direktna promena zdravlja ne zamenjuje tok bola/smrti niti automatski čuva redosled odložene štete. U 3D napadač upisuje `pendingDamage` vlasniku pogođenog dela modela (`GameObject.ownerOf`), a meta ga obrađuje u svom `update`-u, sa bolom ili smrću; od više pogodaka pre tog `update`-a važi poslednji. Model bez vlasnika ne prima štetu.

Objekte scene drži [svet](../core/World.js): ažurira ih sa njihovim delovima, daje ulaz živim 2D objektima i gasi ih. 3D objekti ulaz čitaju u svom `update`-u. Scena sa `fixedStep` ažurira isti svet u jednakim koracima, umesto jednom po iscrtanom kadru. Objekat koji je već u svetu ne ažurirati još i ručno. Grafički roditelj, vlasnik simulacije i vlasnik gašenja nisu automatski ista stvar. Jednokratna komanda igrača ne sme se ponoviti kroz više simulacionih podkoraka.

Akumulator vremena i interpolacija položaja imaju po jednog vlasnika. [Ammo wrapper](../core3d/physics/PhysicsWorld.js) prepušta podkorake fizičkom svetu; ne dodavati spoljašnju catch-up petlju bez promene tog ugovora. Interpolirani položaj za prikaz ne vraćati u autoritativno fizičko telo. Numeričke probe i njihov obim čuva [merni artefakt](../tests/unit/fixtures/ammo-measurement.json), bez prepisivanja rezultata ovde.

## Učitavanje i resursi

Kod sprite tabli proveriti svako polje zasebno na providnoj i kontrastnoj pozadini: ravnomerna mreža nije dokaz da crtež ne prelazi granicu polja. U Neretvi su delovi susednih poza ostali kao odvojene crte iznad likova; ukloniti takve ostatke bez sečenja tela i opreme. Frejmove koji se rotiraju ili pomeraju pripremiti jednom, izdvojene sa providnim rubom, da uzorkovanje ne zahvata susednu pozu; deliti pripremljene frejmove među istim likovima. Posle obrade proveriti i boje i alfa kanal, ne samo siluetu.

Početni meni, uključujući izbor igrača, prikazati tek iza potpuno pripremljene i nacrtane scene. Zajednički upravljač čeka završetak učitavanja, dekodiranja i inicijalizacije slika, zatim ponovo crta pozadinu i stalne objekte pre menija. Obuhvatiti delove objekata, zasebnog igrača, pozadinu i dodatne resurse koje prijavi scena. Greška slike prekida učitavanje umesto beskrajnog čekanja; zakasnela scena ne sme crtati posle promene igre. [Browser provera](../tests/smoke/loading.spec.js) namerno zadržava sliku i proverava redosled.

Preuzeta ili dekodirana slika nije dokaz da je prvo crtanje jeftino: Canvas može naknadno dekodirati i skalirati za traženu veličinu. U svakom nivou za male prikaze koristiti odgovarajući radni raster i proveravati prvo pojavljivanje u kadru, ne samo mrežu i JavaScript; velika izvorna ilustracija može ostati odvojeno sačuvana. Ako nivo zastaje pri ulasku vozila ili efekta, uporediti isti početak sa manjim rasterom pre menjanja fizike ili proširivanja preloada: mala cena JS koda ne isključuje zastoj u prikazu.

[Keš modela](../core3d/assets/models.js) razdvaja opis resursa od njegovog učitavanja, spaja zahteve i omogućava ponovni pokušaj posle greške. Učitavanje, odbacivanje zastarelog rezultata i oslobađanje resursa su različite odgovornosti. Otkazivanje jednog korisnika ne sme poništiti resurs koji još koristi drugi; AbortController ne zaustavlja proizvoljan Promise.

Svaki slušalac, tajmer, zvuk i GPU/native resurs ima vlasnika i završnu operaciju. Uklanjanje iz prikaza nije oslobađanje resursa, a gašenje roditelja nije dokaz da su ugašeni svi njegovi saradnici. Zakasneli rezultat ugašene scene ne sme izmeniti novu scenu.

Klon modela može deliti materijale, geometriju i klipove sa drugim instancama. Resurs koji će se menjati izolovati pre izmene; deljeni resurs ne oslobađati dok ga drugi koriste. Runtime vlasnike i objekte sa ponašanjem ne smeštati u podatke prototipa koji se kopiraju JSON serijalizacijom. Identitet pogođenog dela modela rešava [GameObject](../core3d/objects/GameObject.js).

JS garbage collector ne dokazuje oslobađanje Ammo memorije. Native vlasnik oslobađa svoje alokacije, ne pozajmljene reference iz gettera, i prethodno ih odvaja od sveta. [Heightfield podaci](../core3d/physics/index.js) ostaju poznato ograničenje lokalnog build-a: oslobađanje shape-a ne oslobađa njegov zaseban heap buffer. Rešenje tog ograničenja prati plan.

Lokalni Ammo nema podržan destruktor za `btVehicleTuning`; pokušaj njegovog oslobađanja rušio je izlazak i ponovno igranje. [NativeAllocations](../core3d/physics/NativeAllocations.js) zato odbija vlasništvo nad objektima bez destruktora.

## Obrasci pri nadogradnji

Kod sveta većeg od ekrana razdvojiti položaj u svetu, kameru i položaj na ekranu. Vidljivost i ograničenja ne smeju odbacivati objekat samo zato što mu je svetski položaj van dimenzija platna. Ako scene dele renderer, lokalno podešavanje kamere vratiti posle crtanja, uključujući prekid greškom; povratak u drugi nivo ne sme naslediti tuđu kameru. Proceduralni teren vezati za svetsku koordinatu, da pri povratku ostane isti bez neograničene istorije pređenog puta.

Redosled crtanja definisati za sve delove jedinice i efekte: grafičko roditeljstvo ne prenosi automatski sloj. U 2D tenku pejzaž i civilna dekoracija ostaju iza tela i cevi, zatim dolaze projektili, pa plamen i eksplozije. Izdvojeni plamen crta se samo jednom i poštuje vidljivost vlasnika; provera treba da prati stvarni redosled crtanja, ne samo vrednosti slojeva.

Kod engine-a se piše da ga čovek brzo pročita: jedan naziv po pojmu, na engleskom, i jedan put po ponašanju. Stari put se briše čim ga niko ne koristi, umesto da ostane iza prekidača. Funkcija ima jedan posao i ime koje ga kaže, a komentar kaže samo razlog koji kod ne može da izrazi. Pri deljenju generatora (grad, lavirint, čestice) zadržati redosled poziva `Math.random`, jer drugi redosled menja izgled nivoa. Komentar `/* html */` ispred template stringa nije šum: uključuje isticanje HTML-a u editoru.

Najpre pronaći postojeću odgovornost i njene korisnike, pa odrediti najmanju potpunu promenu. Pravilo jedne igre ostaje uz nju; zajednički deo izdvojiti kada je zajednički ugovor stvarno poznat. Izmena engine-a mora razjasniti posledice po sve pogođene korisnike, bez skrivenih promena podrazumevanog ponašanja.

Zavisnosti prosleđivati usko, npr. sat ili funkciju stvaranja projektila. Parametar balansa ima jedno mesto; nije istorijski podatak. Dimenzije nivoa pripadaju instanci scene, a ponašanje pri promeni prozora usred partije mora biti izričito određeno.

Preciznost artiljerijskog AI-ja proveravati stvarnim putanjama i sudarima: mali šum i dalje može stalno pogađati široku metu, a velika greška snage daje nesrazmerno veliki promašaj jer domet raste približno sa kvadratom brzine. Početni promašaj treba da bude blizu mete, uz postepenu korekciju; [regresioni test](../tests/unit/ustanak.test.js) proverava oba uslova.

Zajednička scena pri pokretanju i nastavku iz pauze prenosi fokus na svoje platno, bez skrolovanja; dekorativne scene sa isključenim događajima ne preuzimaju fokus. Provera komandi mora koristiti prave tastere bez dodatnog klika; direktan poziv pucanja ne otkriva probleme sa fokusom.

Informativne poruke, uključujući početno uputstvo i najavu poteza, ne blokiraju komande niti odlažu početak poteza; njihov tajmer samo uklanja tekst. Fokus se postavlja pri početku igre i nastavku, ne pri isteku poruke. Pratiti otpuštanje tastera nezavisno od poruke i sprečiti prenos neprekinuto držanog tastera iz prethodnog poteza. Provera: punjenje i pucanje rade dok je početno uputstvo još vidljivo.

Ako dizajn propisuje broj pogodaka do obaranja, kao u Visu, koristiti brojač pogodaka: nasumična šteta metka inače menja taj broj. Nagradu za formaciju vezati za obaranje svih članova, ne za njihovo nestajanje sa ekrana.

Preimenovanje radi parser nad identifikatorima, ne pretraga teksta, i ime se menja svuda, bez aliasa. Ime metode menja se samo u pristupu članu i definiciji, ne u ključu objekta: opcija `tlo` (visina tla) i metoda `tlo()` 2D objekta dele reč, a zajednička zamena je pokvarila postavljanje vozila na tlo. Posle zamene treba pretražiti i stringove sa starim imenima, jer ih parser ne menja: testovi navode metode po imenu (`mock.method`), a kod čita polja dinamički (`obj[size]`). Rečnik 2D osnove je u kodu: `GameObject2D`, `width`/`height`, `children`. Novo polje ili metoda u zajedničkoj osnovnoj klasi (`Scene`, `GameObject2D`, `GameObject`) mogu da pregaze istoimeno polje igre: polje sveta scene `world` u početku je pregazilo fizički svet u 3d-tank, cannon i physics-vehicle, pa se nisu učitavale. Pre dodavanja pretražiti `this.<ime>` u `scenes/` i `core3d/`; igre sa fizikom proverava samo smoke, jer se Ammo ne učitava u Node-u.

Pri kopiranju ponašanja getter nije obična vrednost: Object.assign ne prenosi njegov descriptor. Prednost dati eksplicitnim saradnicima. Vremenske rokove i animacije proveravati i na granici intervala, pri različitim frekvencijama i posle zastoja; poređenje ishoda je važnije od broja poziva metode. Kod brzih projektila proveravati i prostor između uzastopnih položaja i birati prvi pogodak: sam presek na kraju frejma može preskočiti celu metu ili zaklon.

2D objekat bez `collider`-a sudara se kao neokrenut pravougaonik svoje veličine, a dodir ivica nije pogodak; tako ostaje za sve postojeće igre. Precizan objekat dobija [Collider](../core/collision/Collider.js) od krugova i okrenutih pravougaonika, izmerenih na slici u pikselima, a svaki deo prati telo sa kojim se crta (cev, postolje). Oblik prati renderer: položaj, ugao, pa `ctx.scale(flipY, flipX)`; `flipY` ogleda levo-desno, `flipX` gore-dole. Projektil pamti put poslednjeg koraka (`path`), a [firstContact](../core/collision/sweep.js) daje najraniji dodir na tom putu, sa poluprečnikom granate i zaobljenim uglovima pravougaonika; pri istom vremenu pobeđuje ranija meta. Upit ne nanosi štetu niti bira žive mete. Kraj leta odlučuje se posle pomeranja svih objekata, u istom koraku, između mete, tla i ivice ekrana: provera roditelja pre dece gleda prošli položaj granate. Meta koja se pomera tokom koraka zove `collider.beginStep()` pre pomeranja; brzo okretanje tela unutar jednog koraka se ne prati, jer ga nijedna igra nema. Trst i Čamac zadržavaju svoje pravougaone metke, u kojima dodir ivice jeste pogodak, nad istim proračunom puta (`segmentBoxEntry`). Tlo za projektile je linija na kojoj jedinice stoje na crtežu, ne daleka ivica polja: u Ustanku točkovi i posade stoje oko 35 px ispod nje, pa je đule eksplodiralo u vazduhu ispred točka, a veliki pravougaonik postolja je to krio. [Top](../scenes/ustanak/Top.js) zato računa tlo iz dna svog točka. Prazan prostor koji je ranije bio u pravougaoniku sada je promašaj: u Ustanku AI-ju ponekad treba hitac više, jer granata prođe ispod podignute cevi. [Testovi](../tests/unit/collision.test.js) i [pogoci topa](../tests/unit/ustanakHits.test.js) čuvaju ugovor.

AnimationMixer javlja kraj i za akciju koja se gasi: rukovalac mora proveriti kojoj akciji događaj pripada. Početnu pozu primeniti pre prvog crtanja; inače početni ekran može prikazati T-pozu. [Testovi animacija](../tests/unit/actor.test.js) čuvaju te ugovore.

Dokaz birati prema promenjenom ugovoru. Smoke test ne dokazuje oslobađanje native memorije, unit test ne dokazuje osećaj upravljanja, a raniji prolazak ne dokazuje današnju radnu kopiju. Način provera je u [TESTING](TESTING.md); pravila dokumentacije i statusa u [DOCS](DOCS.md).

## Katalog za isprobavanje

Sadržaj u `core/` i `core3d/` (likovi, letelice, vozila, objekti, šejderi) je zajednička biblioteka za buduće scene i igre. Ne seli se u folder igre ni kada ga danas koristi samo jedna igra; u igru ide samo ono što pripada isključivo njenim pravilima.

Neki moduli ostaju i kada ih nijedna igra ne koristi, da budu pri ruci za isprobavanje u bilo kojoj igri:

- [šejderi](../core3d/shaders/), koje [test šejdera](../tests/unit/shaders.test.js) proverava fajl po fajl;
- [kule i spiralne stepenice](../core3d/geometry/towers.js) od kocki;
- [minobacač kao Ammo vozilo](../core3d/physics/Cannon.js), sa klizačem za jačinu hica; igra cannon koristi [drugi top](../core3d/actor/derived/Cannon.js).
