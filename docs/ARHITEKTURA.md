# Arhitektura

Zajednički engine za 2D i 3D igre. Ovde čuvamo odgovornosti, razloge i bitna ograničenja; implementaciju opisuje kod. Otvorene izmene pripadaju [planu](TODO.md), a sadržaj [istorijskoj vernosti](ISTORIJA.md).

## Odgovornosti

| Deo | Odgovornost |
|---|---|
| [Gameplay](../core/gameplay/) | Čista pravila zdravlja, oružja i punjenja, nezavisna od DOM-a i prikaza. |
| [Runtime](../core/runtime/) | Sesija, satovi, opseg resursa i raspoređivanje simulacije. |
| [2D osnova](../core/actor/) | Položaj, kretanje, sprite objekti i sudari na platnu. |
| [3D osnova](../core3d/) | Modeli, animacija, kretanje, prikaz i fizički adapteri. |
| [Scene](../scenes/) | Sastavljaju igru; poseduju nivo, protivnike, bodovanje i uslove ishoda. |
| [UI](../ui/) | Meniji, komande i prikaz stanja igre. |

Zajednička pravila sastavljaju se kroz male saradnike, poput zdravlja i oružja. Sprite i mesh imaju različite adaptere; ne zahtevaju dve kopije iste borbene logike. Čista logika i runtime ne zavise od konkretne scene ili prikaza; tu granicu štiti [lint](../eslint.config.mjs).

## Stanje, vreme i život objekta

Kod efekta vezanog za pokretni objekat razlikovati kretanje izvora od sopstvenog kretanja čestica. Pomeraj izvora preneti na postojeće čestice pre stvaranja novih; ne ispravljati kosi trag sabijanjem njihovih položaja ili ukidanjem brzina, jer to menja izgled efekta. Regresiona provera poredi efekat sa izvornim pri mirovanju, pa iste relativne putanje pri pomeranju izvora.

Ponovna upotreba čestica mora resetovati ceo njihov život i sačuvati redosled preživelih pri uklanjanju isteklih iz istog niza. Optimizacija memorije ne sme usput menjati broj, putanje, trajanje ili crtanje čestica; proveravati jednakost sa izvornim efektom i posle ponovne upotrebe.

Uništenje ne poništava brzinu objekta: odvojiti borbenu smrt od pada, dodira tla i uklanjanja olupine. Pri klizanju trenje smanjuje brzinu u odnosu na teren, ne u odnosu na ekran koji se pomera; proveriti kontinuitet brzine pri pogotku i dodiru tla.

Jedno stanje ima jednog vlasnika. Stara imena mogu biti pristupnici istom stanju, a ne dodatna kopija. Bodovanje pripada igri; smrt, respawn i vraćanje u pool nisu ista operacija. Odloženi efekat mora pripadati životu objekta koji ga je pokrenuo, da reciklirani objekat ne primi stari pogodak.

Smrt borbene mete ne uklanja automatski njenu fizičku prepreku. Kod tonjenja posebno odrediti kada olupina prestaje da blokira plovidbu, a preostali podvodni prikaz staviti iza plovila; brzi sudar proveravati duž pomeranja, ne samo preklapanjem na kraju frejma. Provere obuhvataju rotirane trupove, izlazak iz početnog preklapanja, pauzu i brisanje stanja tonjenja pri ponovnoj upotrebi.

[Sesija](../core/runtime/GameSession.js) razdvaja gameplay vreme i vreme prikaza: posle ishoda mogu trajati završni efekti, ali ne nova borba. Petlja sama ne zaustavlja sva pravila igre; njihovi vlasnici moraju poštovati stanje sesije. Odložene akcije i ostali resursi vezuju se za vlasnikov životni ciklus.

[Scena](../core/Scena.js) ima rekurzivni i zaseban opt-in fiksni put ažuriranja. Isti objekat ne uključivati u oba puta niti ga ručno ažurirati ako je već registrovan. Grafički roditelj, vlasnik simulacije i vlasnik gašenja nisu automatski ista stvar. Jednokratna komanda igrača ne sme se ponoviti kroz više simulacionih podkoraka.

Akumulator vremena i interpolacija položaja imaju po jednog vlasnika. [Ammo wrapper](../core3d/physics/PhysicsWorld.js) prepušta podkorake fizičkom svetu; ne dodavati spoljašnju catch-up petlju bez promene tog ugovora. Interpolirani položaj za prikaz ne vraćati u autoritativno fizičko telo. Numeričke probe i njihov obim čuva [merni artefakt](../tests/unit/fixtures/ammo-measurement.json), bez prepisivanja rezultata ovde.

## Učitavanje i resursi

Kod sprite tabli proveriti svako polje zasebno na providnoj i kontrastnoj pozadini: ravnomerna mreža nije dokaz da crtež ne prelazi granicu polja. U Neretvi su delovi susednih poza ostali kao odvojene crte iznad likova; ukloniti takve ostatke bez sečenja tela i opreme. Frejmove koji se rotiraju ili pomeraju pripremiti jednom, izdvojene sa providnim rubom, da uzorkovanje ne zahvata susednu pozu; deliti pripremljene frejmove među istim likovima. Posle obrade proveriti i boje i alfa kanal, ne samo siluetu.

Preuzeta ili dekodirana slika nije dokaz da je prvo crtanje jeftino: Canvas može naknadno dekodirati i skalirati za traženu veličinu. U svakom nivou za male prikaze koristiti odgovarajući radni raster i proveravati prvo pojavljivanje u kadru, ne samo mrežu i JavaScript; velika izvorna ilustracija može ostati odvojeno sačuvana. Ako nivo zastaje pri ulasku vozila ili efekta, uporediti isti početak sa manjim rasterom pre menjanja fizike ili proširivanja preloada: mala cena JS koda ne isključuje zastoj u prikazu.

[Keš modela](../core3d/assets/models.js) razdvaja opis resursa od njegovog učitavanja, spaja zahteve i omogućava ponovni pokušaj posle greške. Učitavanje, odbacivanje zastarelog rezultata i oslobađanje resursa su različite odgovornosti. Otkazivanje jednog korisnika ne sme poništiti resurs koji još koristi drugi; AbortController ne zaustavlja proizvoljan Promise.

Svaki slušalac, tajmer, zvuk i GPU/native resurs ima vlasnika i završnu operaciju. Uklanjanje iz prikaza nije oslobađanje resursa, a gašenje roditelja nije dokaz da su ugašeni svi njegovi saradnici. Zakasneli rezultat ugašene scene ne sme izmeniti novu scenu.

Klon modela može deliti materijale, geometriju i klipove sa drugim instancama. Resurs koji će se menjati izolovati pre izmene; deljeni resurs ne oslobađati dok ga drugi koriste. Runtime vlasnike i objekte sa ponašanjem ne smeštati u podatke prototipa koji se kopiraju JSON serijalizacijom. Identitet pogođenog dela modela rešava [GameObject](../core3d/objects/GameObject.js).

JS garbage collector ne dokazuje oslobađanje Ammo memorije. Native vlasnik oslobađa svoje alokacije, ne pozajmljene reference iz gettera, i prethodno ih odvaja od sveta. [Heightfield podaci](../core3d/physics/index.js) ostaju poznato ograničenje lokalnog build-a: oslobađanje shape-a ne oslobađa njegov zaseban heap buffer. Rešenje tog ograničenja prati plan.

## Obrasci pri nadogradnji

Kod sveta većeg od ekrana razdvojiti položaj u svetu, kameru i položaj na ekranu. Vidljivost i ograničenja ne smeju odbacivati objekat samo zato što mu je svetski položaj van dimenzija platna. Ako scene dele renderer, lokalno podešavanje kamere vratiti posle crtanja, uključujući prekid greškom; povratak u drugi nivo ne sme naslediti tuđu kameru. Proceduralni teren vezati za svetsku koordinatu, da pri povratku ostane isti bez neograničene istorije pređenog puta.

Redosled crtanja definisati za sve delove jedinice i efekte: grafičko roditeljstvo ne prenosi automatski sloj. U 2D tenku pejzaž i civilna dekoracija ostaju iza tela i cevi, zatim dolaze projektili, pa plamen i eksplozije. Izdvojeni plamen crta se samo jednom i poštuje vidljivost vlasnika; provera treba da prati stvarni redosled crtanja, ne samo vrednosti slojeva.

Najpre pronaći postojeću odgovornost i njene korisnike, pa odrediti najmanju potpunu promenu. Pravilo jedne igre ostaje uz nju; zajednički deo izdvojiti kada je zajednički ugovor stvarno poznat. Izmena engine-a mora razjasniti posledice po sve pogođene korisnike, bez skrivenih promena podrazumevanog ponašanja.

Zavisnosti prosleđivati usko, npr. sat ili funkciju stvaranja projektila. Parametar balansa ima jedno mesto; nije istorijski podatak. Dimenzije nivoa pripadaju instanci scene, a ponašanje pri promeni prozora usred partije mora biti izričito određeno.

Pri kopiranju ponašanja getter nije obična vrednost: Object.assign ne prenosi njegov descriptor. Prednost dati eksplicitnim saradnicima. Vremenske rokove i animacije proveravati i na granici intervala, pri različitim frekvencijama i posle zastoja; poređenje ishoda je važnije od broja poziva metode. Kod brzih projektila proveravati i prostor između uzastopnih položaja i birati prvi pogodak: sam presek na kraju frejma može preskočiti celu metu ili zaklon.

Dokaz birati prema promenjenom ugovoru. Smoke test ne dokazuje oslobađanje native memorije, unit test ne dokazuje osećaj upravljanja, a raniji prolazak ne dokazuje današnju radnu kopiju. Način provera je u [TESTING](TESTING.md); pravila dokumentacije i statusa u [DOCS](DOCS.md).
