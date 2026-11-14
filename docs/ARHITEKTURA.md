# Arhitektura

Zajednički engine za 2D i 3D igre. Ovde čuvamo odgovornosti, razloge i bitna ograničenja; implementaciju opisuje kod. Otvorene izmene pripadaju [planu](PLAN-ARHITEKTURA.md), a sadržaj [istorijskoj vernosti](ISTORIJA.md).

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

Jedno stanje ima jednog vlasnika. Stara imena mogu biti pristupnici istom stanju, a ne dodatna kopija. Bodovanje pripada igri; smrt, respawn i vraćanje u pool nisu ista operacija. Odloženi efekat mora pripadati životu objekta koji ga je pokrenuo, da reciklirani objekat ne primi stari pogodak.

[Sesija](../core/runtime/GameSession.js) razdvaja gameplay vreme i vreme prikaza: posle ishoda mogu trajati završni efekti, ali ne nova borba. Petlja sama ne zaustavlja sva pravila igre; njihovi vlasnici moraju poštovati stanje sesije. Odložene akcije i ostali resursi vezuju se za vlasnikov životni ciklus.

[Scena](../core/Scena.js) ima rekurzivni i zaseban opt-in fiksni put ažuriranja. Isti objekat ne uključivati u oba puta niti ga ručno ažurirati ako je već registrovan. Grafički roditelj, vlasnik simulacije i vlasnik gašenja nisu automatski ista stvar. Jednokratna komanda igrača ne sme se ponoviti kroz više simulacionih podkoraka.

Akumulator vremena i interpolacija položaja imaju po jednog vlasnika. [Ammo wrapper](../core3d/physics/PhysicsWorld.js) prepušta podkorake fizičkom svetu; ne dodavati spoljašnju catch-up petlju bez promene tog ugovora. Interpolirani položaj za prikaz ne vraćati u autoritativno fizičko telo. Numeričke probe i njihov obim čuva [merni artefakt](../tests/unit/fixtures/ammo-measurement.json), bez prepisivanja rezultata ovde.

## Učitavanje i resursi

[Keš modela](../core3d/assets/models.js) razdvaja opis resursa od njegovog učitavanja, spaja zahteve i omogućava ponovni pokušaj posle greške. Učitavanje, odbacivanje zastarelog rezultata i oslobađanje resursa su različite odgovornosti. Otkazivanje jednog korisnika ne sme poništiti resurs koji još koristi drugi; AbortController ne zaustavlja proizvoljan Promise.

Svaki slušalac, tajmer, zvuk i GPU/native resurs ima vlasnika i završnu operaciju. Uklanjanje iz prikaza nije oslobađanje resursa, a gašenje roditelja nije dokaz da su ugašeni svi njegovi saradnici. Zakasneli rezultat ugašene scene ne sme izmeniti novu scenu.

Klon modela može deliti materijale, geometriju i klipove sa drugim instancama. Resurs koji će se menjati izolovati pre izmene; deljeni resurs ne oslobađati dok ga drugi koriste. Runtime vlasnike i objekte sa ponašanjem ne smeštati u podatke prototipa koji se kopiraju JSON serijalizacijom. Identitet pogođenog dela modela rešava [GameObject](../core3d/objects/GameObject.js).

JS garbage collector ne dokazuje oslobađanje Ammo memorije. Native vlasnik oslobađa svoje alokacije, ne pozajmljene reference iz gettera, i prethodno ih odvaja od sveta. [Heightfield podaci](../core3d/physics/index.js) ostaju poznato ograničenje lokalnog build-a: oslobađanje shape-a ne oslobađa njegov zaseban heap buffer. Rešenje tog ograničenja prati plan.

## Obrasci pri nadogradnji

Najpre pronaći postojeću odgovornost i njene korisnike, pa odrediti najmanju potpunu promenu. Pravilo jedne igre ostaje uz nju; zajednički deo izdvojiti kada je zajednički ugovor stvarno poznat. Izmena engine-a mora razjasniti posledice po sve pogođene korisnike, bez skrivenih promena podrazumevanog ponašanja.

Zavisnosti prosleđivati usko, npr. sat ili funkciju stvaranja projektila. Parametar balansa ima jedno mesto; nije istorijski podatak. Dimenzije nivoa pripadaju instanci scene, a ponašanje pri promeni prozora usred partije mora biti izričito određeno.

Pri kopiranju ponašanja getter nije obična vrednost: Object.assign ne prenosi njegov descriptor. Prednost dati eksplicitnim saradnicima. Vremenske rokove i animacije proveravati i na granici intervala, pri različitim frekvencijama i posle zastoja; poređenje ishoda je važnije od broja poziva metode.

Dokaz birati prema promenjenom ugovoru. Smoke test ne dokazuje oslobađanje native memorije, unit test ne dokazuje osećaj upravljanja, a raniji prolazak ne dokazuje današnju radnu kopiju. Način provera je u [TESTING](TESTING.md); pravila dokumentacije i statusa u [DOCS](DOCS.md).
