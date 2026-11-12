# Arhitektura: znanje za migraciju

Praktični nalazi iz projekta i primarnih izvora za [plan arhitekture](PLAN-ARHITEKTURA.md). Opis postojećeg sistema ostaje u [DOCS](DOCS.md), a načini pokretanja provera u [TESTING](TESTING.md).

Provereno čitanjem 12. 11. 2026, na reviziji `86f6c575b6af077ce4cc733913009471c36492eb`. Lokalni Three.js je **r160**, prema [deklaraciji verzije](../libs/three/build/three.module.js#L6). Verzija izvornog Bullet-a iz kog je napravljen lokalni Ammo nije potvrđena. Pri promeni ovih delova prvo ponovo proveriti navedene izvore i relevantne ugovore plana.

Tokom prikupljanja nalaza druga traka je počela da dodaje sesiju u [Scena](../core/Scena.js). Opis starih satova i mixina zato je osnova za proveru kompatibilnosti, a ne tvrdnja o konačnom stanju novog runtime-a. Reference sa brojem reda su navigacija kroz aktuelnu radnu kopiju i mogu se pomerati; revizija iznad određuje početni ugovor.

Ova beleška ne usvaja projektne odluke, ne menja plan i ne označava njegove korake kao završene. **Potvrđeno** znači provereno u navedenom lokalnom kodu; **preporuka** označava primenu istraženog obrasca na projekat; **neprovereno** zahteva merenje ili potvrdu lokalne biblioteke. Preventivne provere ispod su predlozi za implementacione korake, a ne izveštaj o izvršenim testovima.

## Gde se znanje primenjuje

| Tema | Koraci plana | Šta otkriva pre izmene |
|---|---|---|
| [Kompozicija i accessori](#kompozicija-i-accessori) | A1-02, A1-03, A1-04, A2-03 | Kopiranje metoda ne definiše ugovor, a getter nije obična vrednost |
| [Zdravlje i šteta](#zdravlje-i-steta) | A1-03, A1-04, A3-02, A3-04 | Više značenja energije i odložena obrada pogotka |
| [Vreme i ishod](#vreme-i-ishod) | A2-01, A2-02, A4-01, A4-02 | Zaustavljen rezultat vremena nije zaustavljena simulacija |
| [Kolekcije i ulaz](#kolekcije-i-ulaz) | A2-04, A3-03, A4-02 | Dupli update, preskočen objekat ili više akcija na jedan pritisak |
| [Kloniranje i vlasništvo](#kloniranje-i-vlasnistvo) | A3-01, A3-02, A3-08, A4-05 | Deljeni materijali i serijalizacija userData |
| [Async učitavanje](#async-ucitavanje) | A2-02, A3-01 | Abort, odbacivanje rezultata i retry su različiti problemi |
| [Ammo koraci](#ammo-koraci) | A4-01, A4-02, A4-04 | Mogućnost dvostrukog upravljanja vremenom i interpolacijom |
| [Ammo memorija](#ammo-memorija) | A4-01, A4-04 | JS objekat, native objekat i sirovi heap imaju različit životni ciklus |
| [Zvuk i pool](#zvuk-i-pool) | A2-03, A2-04, A4-03 | Pool slot nije isto što i jedan život projektila |
| [Dokazi regresije](#dokazi-regresije) | Sve faze, posebno A5-02 | Šta postojeće provere dokazuju, a šta ne mere |

<a id="kompozicija-i-accessori"></a>
## Kompozicija i accessori

**Potvrđeno:** [praviPucanje](../core/actor/prosirenja/pucanje.js#L4) vraća metode koje koriste `this.predmeti`, `this.polozaj`, `this.razmakDo()` i druge članove vlasnika. Kopiranje preko `Object.assign` ne izražava te zavisnosti. [praviEnergiju](../core/actor/prosirenja/energija.js#L1) ima gettere/settere, a [Tenk](../scenes/tenkici/Tenk.js#L39) ih zato prenosi preko `Object.getOwnPropertyDescriptors` i `Object.defineProperties`.

`Object.assign` čita vrednost izvornog gettera i upisuje vrednost na cilj; ne prenosi njegov descriptor. Može aktivirati i setter cilja. Zato zamena descriptor kopiranja sa assign/spread nije bezazleno skraćivanje koda. [MDN: Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#copying_accessors)

**Preporuka:** sastavljač eksplicitno povezuje zdravlje, oružje i kretanje. Ponašanju proslediti uske saradnike, npr. `spawnProjectile`, umesto kompletnog scene objekta. Ne treba svakom ponašanju `update()` niti svakom predmetu isti skup komponenti. Component obrazac odvaja domene, ali povećava broj objekata i cenu njihovog povezivanja; primenjivati ga na stvarnu potrebu za razdvajanjem. [Robert Nystrom: Component, autorski izvor](https://github.com/munificent/game-programming-patterns/blob/master/book/component.markdown)

**Preventivna provera:** promena energije mora odmah promeniti legacy `alive` i `zapaljen`; dve instance oružja ne smeju deliti metke ili punjenje. Testirati javni rezultat, bez oslanjanja na način kopiranja metoda.

<a id="zdravlje-i-steta"></a>
## Zdravlje i šteta

**Potvrđeno — različiti ugovori:**

- [2D energija](../core/actor/prosirenja/energija.js#L1) počinje sa 100; `alive = true` vraća 100, `false` postavlja 0; plamen zavisi od praga 20 i zapaljivosti.
- [3D GameObject](../core3d/objects/GameObject.js#L53) čuva energiju u `mesh.userData.energy`, sa maksimumom konkretnog objekta. `damageAmount` je odložena šteta: [applyDamage](../core3d/objects/GameObject.js#L121) je oduzima i vraća na nulu.
- [Actor.hit](../core3d/actor/Actor.js#L185) **dodeljuje** `damageAmount`, ne sabira. Dva upisa pre potrošnje mogu ostaviti samo poslednju vrednost. Prelazak na trenutno oduzimanje ili sabiranje menja rezultat borbe; ovde nije odlučeno da li taj stari rezultat treba zadržati.
- Polje energije označava i preostalu zalihu lečenja: [FirstAid](../core3d/objects/FirstAid.js#L6) je GameObject, a [Player.checkHealths](../core3d/actor/Player.js#L78) oduzima njegovu energiju i povećava igračevu. To nije isto što i primanje štete ili smrt neprijatelja.
- [3D Bullet](../core3d/objects/Bullet.js#L34), [Missile](../core3d/aircraft/Missile.js#L46) i [3d-tank](../scenes/3d-tank/Main.js#L104) takođe pišu štetu. Migracija samo Actor-a ne zatvara sve ulaze.
- [2D Metak.povredi](../core/actor/projektili/Metak.js#L35) poziva reakciju ili smrt mete, vraća metak u pool, pa poziva callback. Callback sam po sebi nije dokaz da je meta upravo umrla.

**Preporuka:** Health definiše brojčano stanje i prelaz živo→mrtvo, dok respawn, životi, neranjivost, pad aviona i bodovi ostaju pravilima konkretnog objekta/igre. Adapter mora prevesti postojeća imena i redosled događaja. Odluku o tome kada se šteta primenjuje doneti pre migracije napadača i mete; ne zameniti odloženi upis direktnim `damage()` pozivom bez provere.

**Preventivna provera:** stari napadač→nova meta i novi napadač→stara meta; dva pogotka pre update-a; ponovljen pogodak mrtve mete; prazna prva pomoć; respawn na početni maksimum; bodovi samo za stvarni prelaz u smrt. Ova provera razdvaja kompatibilnost adaptera od novih pravila koja tek treba usvojiti.

<a id="vreme-i-ishod"></a>
## Vreme i ishod

**Potvrđeno za početni ugovor:** u [GameLoop.tick](../core/GameLoop.js#L59), `timeStopped` sprečava samo povećanje `time`; `sceneLoop(dt, t)` se i dalje poziva sa novim `dt`. [Scena.loop](../core/Scena.js#L153) zatim pomera globalne tajmere i ažurira objekte. [finish](../core/Scena.js#L163) ne prekida te pozive. Zato pobeda zamrzava `t`, ali ne mora zaustaviti odloženi spawn, cooldown ili update neprijatelja. Novi sesijski put treba proveriti odvojeno; dodavanje sesijskog sata samo po sebi ne dokazuje da su svi korisnici globalnih tajmera migrirani.

**Potvrđeno za sesijski put (A2-01, A2-02):** [GameSession](../core/runtime/GameSession.js) pomera gameplay sat samo u stanju `running`, a `finish()` gasi ceo gameplay opseg, pa njegovi zadaci posle ishoda ne rade; presentation sat radi i u `finished`, a staje u pauzi. Pravila koja scena proverava u `update` (talasi, bodovi) ipak moraju sama da pitaju stanje sesije, jer petlja i dalje zove `update`; vis to radi u [Main](../scenes/vis/Main.js). Dokaz: [session testovi](../tests/unit/session.test.js) i test „after the result“ u [vis testovima](../tests/unit/vis.test.js).

Pauza preskače tick, a [unpause](../core/GameLoop.js#L40) resetuje prethodni timestamp. Nasuprot tome, [Vreme](../core/Vreme.js#L8) čita `Date.now()`, pa njegovi intervali teku i u pauzi. Ne postoje samo „dve funkcije za tajmer“, nego dve različite semantike vremena.

**Preporuka:** gameplay vreme i presentation vreme imaju zaseban ugovor. Gameplay zadaci ne rade tokom pauze ili posle ishoda; dozvoljena završna eksplozija pripada prikazu i ima vlasnika koji je otkazuje pri promeni igre. Odluka iz plana o punjenju u pauzi je promena ponašanja, ne samo promena klase.

Fiksni korak ograničava veličinu simulacionog pomeraja, ali zahteva limit nadoknade. Pod velikim zastojem treba eksplicitno izabrati usporavanje ili odbacivanje zaostatka. Interpolacija prikaza ne sme menjati autoritativno stanje simulacije. [Glenn Fiedler: Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)

**Preventivna provera:** zakazati gameplay zadatak neposredno pre pauze i pre pobede; posle pauze ostaje isto preostalo vreme, a posle pobede nema novog gameplay efekta. Posebno proveriti nastavak završne animacije i njeno gašenje pri izlasku. Kod fixed režima testirati povratak iz pauze i frejm sa velikim zastojem, ne samo konstantnih 60 Hz.

<a id="kolekcije-i-ulaz"></a>
## Kolekcije, vlasništvo ažuriranja i ulaz

**Potvrđeno:** [Scena.update](../core/Scena.js#L136) rekurzivno posećuje `predmeti`, dok [handleInput](../core/Scena.js#L126) prolazi samo direktne žive predmete, a [end](../core/Scena.js#L99) gasi direktne predmete i igrača, uz Set deduplikaciju. To su tri različita obilaska; nije tačno da svi prolaze isto stablo.

Neki 3D likovi se ažuriraju ručno: [avatar](../scenes/avatar/Main.js#L139) poziva igrača odvojeno od `super.update()`. Pre registracije tog igrača u novi runtime treba ukloniti ručni poziv ili ga izuzeti iz registra. Postojanje grafičkog roditelja ne dokazuje da je taj roditelj vlasnik simulacije ili gašenja.

**Preporuka:** definisati odvojene operacije priključivanja prikazu, uključivanja u simulaciju, deaktiviranja, vraćanja u pool i uništavanja. Odložene strukturne izmene daju jasnu granicu za nov predmet i uklonjenu metu. Redosled je pravilo igre: spawn koji radi odmah može delovati u frejmu u kom je nastao. [Robert Nystrom: Update Method, autorski izvor](https://github.com/munificent/game-programming-patterns/blob/master/book/update-method.markdown)

Za fiksni korak, stanje „dugme je držano“ važi kroz više koraka, ali događaj „upravo pritisnuto“ troši se jednom. Preporuka je red kratkih akcija koji preživi frejm bez simulacionog koraka; ponovno čitanje iste ivice u svakom podkoraku proizvodi više bombi/skokova.

**Preventivna provera:** dodavanje/uklanjanje tokom sudara, vlasnik i dete registrovani zajedno, frejm sa nula koraka, frejm sa tri koraka i jedan pritisak bombe. Izbrojati update/cleanup konkretnih instanci, ne broj poziva čitave petlje.

<a id="kloniranje-i-vlasnistvo"></a>
## Kloniranje, identitet i vlasništvo 3D resursa

**Potvrđeno u r160:** [Mesh.copy](../libs/three/build/three.module.js#L11623) preuzima istu geometriju i isti materijal. Kod niza materijala klonira niz, ali elementi ostaju isti. [SkeletonUtils.clone](../libs/three/examples/jsm/utils/SkeletonUtils.js#L328) pravi kopiju stabla, klonira skelet i prevezuje kosti; time ne pravi nezavisne geometrije i materijale.

[GameObject](../core3d/objects/GameObject.js#L15) koristi te puteve kloniranja, a zatim može menjati boju materijala. **Izveden rizik:** promena deljenog materijala jedne instance može uticati na ostale; potvrđeno je deljenje reference, ali nije odigrana reprodukcija promene boje u svakoj konkretnoj igri.

Još jedna važna granica: [Object3D.copy](../libs/three/build/three.module.js#L8133) kopira `userData` kroz JSON serijalizaciju. **Preporuka:** Health, sesiju, funkcije za cleanup i reference na runtime vlasnika ne upisivati u `userData` prototipa modela. Kloniranje ne čuva njihove instance i može pasti na cikličnim vezama. Vezivanje mesh→vlasnik uraditi posle instanciranja, npr. spoljnim WeakMap-om ili prostim ID-jem sa sesijskim lookup-om; pri raycast-u mora raditi i za dete modela.

**Potvrđeno:** [Scena3D.disposeScene](../core/Scena3D.js#L107) trenutno oslobađa resurse dostupne kroz stablo scene; renderer ostaje zajednički. Novi keš ne sme postati drugi nezavisan vlasnik istog oslobađanja.

Materijal i tekstura imaju odvojeno oslobađanje; uklanjanje mesha iz scene nije oslobađanje njegove geometrije/materijala. Skelet može biti deljen, pa se oslobađa tek kad nema korisnike. [Three.js: How to dispose of Objects](https://threejs.org/manual/pages/how-to-dispose-of-objects.html)

**Preventivna provera:** dve instance istog modela istovremeno: nezavisne animacije i boja kada je to zahtev, deljena geometrija dok se koristi, uklanjanje jedne bez kvara druge. Ponoviti pri promeni igre i async otkazivanju. Testirati kloniranje prototipa nakon vezivanja identiteta da runtime reference ne završe u serijalizaciji.

<a id="async-ucitavanje"></a>
## Async učitavanje, otkazivanje i retry

**Potvrđeno:** [SceneManager.start](../scenes/SceneManager.js#L45) već ima generacijski broj `startId` i odbacuje zastarele rezultate. [Partisan](../core3d/actor/derived/ww2/Partisan.js#L19) učitava modele na vrhu modula. Ponovni start iste scene ne znači i novu evaluaciju uvezenog modula.

ES moduli keširaju evaluaciju; ako top-level evaluacija padne, ponovni import iste adrese vraća taj neuspeh. Ne treba mešati to sa svim mrežnim greškama: pravila njihovog retry-a zavise od faze učitavanja i host-a. Za modele koje želimo ponovo učitati, eksplicitna async fabrika omogućava kontrolu pokušaja nezavisno od evaluacije modula. [MDN: import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)

`AbortController` otkazuje operaciju koja podržava signal, kao fetch; sam po sebi ne otkazuje proizvoljan Promise, završen callback ili Three loader. [MDN: AbortController.abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)

**Preporuka:** razdvojiti otkazivanje transporta, proveru vlasnika završenog rezultata i oslobađanje preuzetog resursa. Kod zajedničkog pending zahteva, izlazak jednog korisnika ne sme otkazati resurs koji i dalje čeka druga sesija. Ključ keša treba da pokrije pripremu koja menja rezultat: teksturu, skalu, orijentaciju ili naknadno dodate animacije, ili te promene primenjivati na instancu.

**Preventivna provera:** spora scena A, brza B, kasni završetak A; A i B čekaju isti asset pa A odustaje; prvi factory load pada a drugi uspeva; otkazivanje posle jednog uspešno učitanog resursa iz grupe. Za svaki tok proveriti UI, reference keša i cleanup. Ne pretpostaviti da `Promise.all` automatski čisti druge uspešne rezultate kada jedan padne.

<a id="ammo-koraci"></a>
## Ammo: ko poseduje korak simulacije

**Potvrđeno lokalno:** [PhysicsWorld.update](../core3d/physics/PhysicsWorld.js#L27) poziva `stepSimulation(dt, maxSteps)`; podrazumevani `maxSteps` u wrapper-u je 10. [Lokalni Ammo binding](../libs/ammo.js#L934) izlaže varijante sa jednim, dva i tri argumenta. Podrazumevani treći argument native dela nije vidljiv iz samog ovog JS wrapper-a.

**Upstream, nije dokaz lokalne verzije:** trenutno pregledani [Bullet header](https://github.com/bulletphysics/bullet3/blob/master/src/BulletDynamics/Dynamics/btDiscreteDynamicsWorld.h) navodi podrazumevani fixedTimeStep 1/60 s. [Implementacija](https://github.com/bulletphysics/bullet3/blob/master/src/BulletDynamics/Dynamics/btDiscreteDynamicsWorld.cpp) akumulira vreme pri uključenim podkoracima, ograničava broj izvršenih koraka i vraća izračunati broj potrebnih koraka, koji može biti veći od stvarno izvršenog. `maxSubSteps = 0` bira promenljiv korak u tom upstream kodu.

**Preporuka za A4-01:** izabrati jednog vlasnika akumulatora. Ako runtime daje fiksne korake, uskladiti Ammo režim sa tim, a ne samo dodati spoljašnju catch-up petlju oko postojećeg poziva. Proveriti i ko poseduje interpolaciju: Bullet motion state i render interpolacija ne smeju nezavisno dvaput izglađivati isto stanje.

**Naknadno potvrđeno u A4-01:** [lokalna proba i odluka](DOCS.md#a4-01-ammo) pokazuju ekvivalenciju podrazumevanog koraka sa eksplicitnim 1/60 na isprobanom nizu, native limit koraka i razliku body/motion-state transformacija. Posle koraka od .5 s `maxSteps=10` izvrši 10 koraka, a vrati 29; sledeći `1/60` izvrši još jedan, bez nadoknade preostalog celog duga. Postojeći native akumulator ostaje podrazumevani put; spoljašnji akumulator je proveren samo kao izdvojen kandidat. Autoritativne brojke, tolerancije i ograničenja nalaze se u DOCS i [mernom artefaktu](a4-01-merenje.json), bez njihovog prepisivanja ovde. Verzija native izvora i osećaj složenih vozila još nisu potvrđeni.

**Preventivna provera:** uporediti jedno isto trajanje na 30/60/120 Hz, zatim zastoj duži od limita; razlikovati tražene i stvarno izvršene korake. Kinematičke mete, sile i input postaviti na dogovorenoj granici koraka. Tolerancije i osećaj vožnje zabeležiti pre promene.

<a id="ammo-memorija"></a>
## Ammo: native memorija i granice vlasništva

**Potvrđeno čitanjem:**

- [createPhysicsWorld](../core3d/physics/index.js#L9) stvara konfiguraciju, dispatcher, broadphase, solver i svet; vraća samo svet. Budući vlasnik mora sačuvati potrebne native zavisnosti za kontrolisano oslobađanje.
- [createRigidBody](../core3d/physics/index.js#L81) stvara transform, motion state, inertia, construction info i body. Njihovo vlasništvo ne određuje činjenica da se lokalna JS promenljiva više ne koristi.
- [createTerrainShape](../core3d/physics/index.js#L104) rezerviše heightfield podatke preko `_malloc`, ali vraća samo shape. Budući vlasnik mora dobiti pointer i podržan način oslobađanja. A4-01 je potvrdio da lokalni build **nema javni `_free`**; ne predstavljati njegovo pozivanje kao već dostupno rešenje.
- [updateMesh](../core3d/physics/index.js#L168) stvara `new Ammo.btTransform()` pri ažuriranju tela, bez `destroy` u toj funkciji. [Vehicle.end](../core3d/physics/Vehicle.js#L207) gasi ulaz i kameru, a ne prikazuje potpun native cleanup.
- [Ammo.destroy](../libs/ammo.js#L550) je eksplicitna funkcija lokalnog binding-a. Postojanje te funkcije ne dokazuje da sme da uništi svaki wrapper dobijen iz gettera.

Ovo su mesta alokacije i nedostajućeg eksplicitnog ownership ugovora, **ne runtime merenje količine curenja**. JS garbage collector i WebGL brojači ne dokazuju oslobađanje C++ objekata. WebIDL binding traži eksplicitan poziv destruktora za objekte kojima je cleanup potreban. [Emscripten: WebIDL Binder](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/WebIDL-Binder.html#using-the-bound-code)

**Preporuka:** pri alokaciji zapisati vlasnika i podržanu završnu operaciju: `Ammo.destroy` ili tuđi životni ciklus. `_free` za raw heightfield buffer traži poseban javni API koji ovaj build trenutno ne izvozi; ograničenje i granica buduće promene zapisani su u [A4-01](DOCS.md#a4-01-ammo). Ne uništavati pozajmljene native reference iz `getOrigin()`, `getRotation()` ili drugih gettera dok nije potvrđeno ko ih poseduje. Pomoćni transform po svetu može se ponovo koristiti, uz eksplicitno gašenje.

Redosled cleanup-a proveriti prema stvarnim vezama: zaustaviti update, ukloniti vozila/actions i constraints iz sveta, ukloniti tela, zatim osloboditi njihove resurse i zavisnosti sveta. Deljeni shape ne oslobađa se po svakom telu. Heightfield buffer mora živeti dok ga shape koristi; nije običan privremeni argument.

**Preventivna provera:** broj sopstvenih native alokacija/releases po vrsti, ponovljeno stvaranje i gašenje sveta, uklanjanje tela usred igre, deljeni shape i ponovljeni dispose. Veličina WASM/asm.js heap-a sama nije dovoljan kriterijum: allocator može zadržati već rezervisani prostor i posle oslobađanja objekata.

<a id="zvuk-i-pool"></a>
## Zvuk, pool i životni ciklus projektila

**Potvrđeno:** [vis Bullet](../scenes/vis/Bullet.js#L11) pušta zvuk pri `pali()`, uključujući ponovo upotrebljen metak. Trenutni [ugovor plana](PLAN-ARHITEKTURA.md) zato izričito čuva zvuk svakog metka; oružje ne treba da doda drugi zvuk istom ispaljenju. [Metak.reset](../core/actor/projektili/Metak.js#L13) skriva i zaustavlja metak; ne uništava pool slot. Od A2-03 pool je zaseban saradnik [ProjectilePool](../core/actor/ProjectilePool.js) (tenkici, vis): ponovo koristi skriven projektil i proverava pogotke, a [Weapon](../core/gameplay/Weapon.js) ne pušta zvuk.

**Otvoreno:** [Granata](../core/actor/projektili/Granata.js) odlaže štetu preko globalnog `after`, ne preko sesije, pa njena odložena šteta i dalje ide posle ishoda i ne pripada generaciji aktiviranja; rešava se pri prevođenju preostalih 2D igara ili uklanjanju globalnih tajmera (A2-05, A5-01).

**Preporuka:** trajanje pool slota i trajanje jednog aktivnog projektila su dve različite stvari. Reset mora očistiti stanje konkretnog hica, a konačno gašenje slota resurse koje poseduje. Ako pogodak/efekat koristi odloženu radnju, ta radnja mora pripadati generaciji aktiviranja, da stari callback ne promeni već ponovo korišćen metak.

**Preventivna provera:** ispali→pogodak→reset→ponovo ispali isti slot; proveriti brzinu, cilj, štetu, vidljivost, zvuk i odložene efekte. Posebno proveriti da odbijen hitac ne pušta zvuk, da svaki prihvaćen projektil ima svoj ugovoreni zvuk i da napuštanje sesije gasi trajni motor/loop audio.

<a id="dokazi-regresije"></a>
## Šta postojeće provere dokazuju

**Potvrđeno:** [frameRate testovi](../tests/unit/frameRate.test.js#L15) porede konkretne 2D ishode na 30 i 60 Hz, uz toleranciju `abs(at60) * 0.15 + 0.5`. Nisu dokaz fizičke determinističnosti, 120 Hz ili otpornosti na zastoj. Tu toleranciju ne širiti da bi refaktor prošao; novu toleranciju obrazložiti prema jedinici i očekivanom rezultatu.

[leaks smoke](../tests/smoke/leaks.spec.js#L9) prati listeners, elemente, WebGL kontekste i broj GPU tekstura/bafera/programa kroz promene scena. Ne instrumentira Ammo native alokacije, sve mrežne operacije, svaki audio objekat ili svaki gameplay tajmer. Prolaz tog testa ne potvrđuje sve vrste vlasništva nad resursima.

**Preporuka:** dokaz birati prema promenjenom ugovoru:

| Promena | Najbliži dokaz |
|---|---|
| Čisti Health/Weapon | Node test bez DOM-a, uz granice i više nezavisnih instanci |
| Legacy adapter | Integracija starog napadača i nove mete, pa obrnut smer |
| Sat i ishod | Kontrolisani frame koraci kroz pause/finished/dispose |
| Učitavanje | Ručno razrešivi Promise-i za razne redoslede završetka |
| Three ownership | Dve žive instance i GPU/scene cleanup kroz više sesija |
| Ammo ownership | Brojanje sopstvenih native alokacija i oslobađanja |
| Osećaj upravljanja | Korisnikovo igranje na stvarnom uređaju uz konkretno poređenje |

Browser smoke i verify se, po aktuelnom planu, pokreću samo uz korisnikovo odobrenje i sa jednim worker-om. Tokom ovog istraživanja nisu pokretani. Nisu menjani kod, implementacioni statusi, raspored ili prihvaćene odluke.

<a id="health-a1-03"></a>
## Predaja A1-03: implementirani Health

[Health](../core/gameplay/Health.js) je implementiran kao čist ES modul bez importova, DOM-a, Three.js ili sata. Postojeći potrošači nisu menjani; za A1-04 koristi se podrazumevani izvoz `Health` i konstruktor `new Health({ maximum: 100 })`.

- `current`, `maximum` i `alive` su samo za čitanje; stanje se menja kroz `damage`, `heal` i `reset`.
- `damage(amount)` vraća boolean: `true` samo za pogodak koji je upravo promenio živo stanje u mrtvo. Ne vraća količinu štete niti ponavlja smrt pri sledećem pogotku.
- `heal(amount)` sme da vrati zdravlje iz nule, uz ograničenje maksimumom; dozvolu za respawn/oporavak određuje igra. `reset()` vraća početni maksimum.
- Podrazumevani maksimum je 100; dozvoljen je i 0, koji ostaje mrtvo stanje. Maksimum i iznosi moraju biti konačni nenegativni brojevi; nevalidan unos baca `RangeError` pre promene stanja.

Provere 12. 11. 2026 za A1-03: `node --test tests/unit/Health.test.js` prolazi 10/10 **bez DOM setup-a**; `npm test` prolazi 231/231 u tadašnjoj radnoj kopiji; završni `npm run lint` prolazi bez upozorenja. [Testovi](../tests/unit/Health.test.js) pokrivaju granice, jednu smrt po živom periodu, lečenje, reset, nulti maksimum, nevalidne unose, frakcione/velike vrednosti i nezavisnost instanci. Health sada koriste migrirani tenkići i GameObject; browser provere ostaju za kraj plana.

<a id="gameobject-a3-02"></a>
## Predaja A3-02: zdravlje i identitet 3D objekta

[GameObject](../core3d/objects/GameObject.js) sada poseduje privatni Health i jedno polje odložene štete. `health` i `maxEnergy` su čitanje tog stanja; legacy `energy` setter zadržava ograničavanje na 0..maximum. `mesh.userData.energy` i `damageAmount` su privremeni accessori ka istim podacima, pa stari napadači i paketi lečenja rade bez druge kopije zdravlja.

`GameObject.ownerOf(mesh)` vraća najbližeg registrovanog vlasnika dok se penje kroz roditelje, ili null. Time raycast pogodak u child/skinned mesh ili naknadno dodato oružje dobija svoj objekat, a ugnježdeni samostalni GameObject zadržava sopstveni identitet. Registracija je u WeakMap-u, ne u serijalizovanom userData. Kloniranjem mesha dobijaju se obične numeričke legacy vrednosti; novi vlasnik se vezuje tek konstruktorom novog GameObject-a.

Dok traje kompatibilni prelaz, napad postavlja `damageAmount`, a cilj obrađuje štetu kroz `checkHit/update`; **ne menjati napad u direktan `health.damage()` poziv** bez migracije reakcije pain/death u A3-04. Direktna numerička promena Health-a osvežava legacy čitanja/HUD, ali sama ne pokreće Actor state callback. Više upisa odložene štete i dalje zadržava poslednju vrednost, kao pre migracije.

[Novi testovi GameObject-a](../tests/unit/GameObject.test.js) dokazuju zajedničko stanje, stare mesh napade na nove/stare mete, odloženu i prepisanu štetu, stvarni raycast na klonirani skinned mesh, različite vlasnike, bezbedno kloniranje i nepromenjen pickup/HUD. Postojeći actor/combat testovi dokazuju jednu smrt i nastavak borbenog toka. Provere 12. 11. 2026: ciljani skup 15/15, ceo unit skup 253/253; browser provere su odložene za A5-02. Materijali, učitavanje i izvedene klase nisu menjani u ovom koraku; GameObject je predat Claude-u za nastavak A3-01.

<a id="migration2d-a2-05"></a>
## A2-05: preostale 2D igre i predaja sata granate

Preostali 2D potrošači energetskog i pucajućeg mixina prebačeni su na Health, Weapon, Cooldown i ProjectilePool. Izbor najbliže žive mete je posebna [funkcija](../core/actor/targeting.js). U aktivnim 2D akterima/scenama više nema Vreme/Date.now gameplay intervala; istekanje hodanja, nišanjenja, paljbe, patroliranja i prikaza strelice dobija vreme kroz update ili sesijski sat. Stare definicije mixina ostaju za A5-01, ali više nemaju 2D potrošače.

Važna migraciona zamka je jedinica AI punjenja: migrirani tenk očekuje **sekunde**, pa [ustanak](../scenes/ustanak/Main.js) sada prosleđuje 3 umesto starih 3000 milisekundi i obavezno prosleđuje sesijski clock. Isto važi za tenk u 2d-tank. Granata prihvata opcioni clock i tada njena odložena šteta staje u pauzi/posle ishoda; reset otkazuje pending pogodak pre ponovne upotrebe. Globalni put ostaje samo za kompatibilnost starih poziva/testova do završnog čišćenja.

**Predaja zatvorena:** Claude je povezao factory u [Tenku](../scenes/tenkici/Tenk.js) preko `new Granata({ gravitacija, clock })`. [Integracioni test tenkića](../tests/unit/tenkici.test.js) potvrđuje odloženu štetu stvarno ispaljene granate tek kada napreduje sat igre; test migracije posebno potvrđuje pauzu, reset pre ponovne upotrebe i zaustavljanje zadatka posle ishoda. A2-05 je zatvoren, a `core/actor/` je vraćen Claude-u za završno čišćenje A5-01. Globalna kompatibilna grana Granate još postoji i ostaje predmet tog čišćenja.

Završna provera posle predaje 12. 11. 2026: ceo unit skup 324/324, lint bez upozorenja, `npm run check` potvrđuje 301 fajl/39 scena. Browser nije pokretan; zajednička browser i ručna provera ostaju za A5-02.

[Testovi migracije](../tests/unit/migration2d.test.js) pokrivaju 1.5 s punjenja raketa i pauzu, rafal od pet metaka pa pauzu od 3 s, sesijsku eksploziju i reset, patrolu/strelicu bez zidnog sata, nišanjenje i zdravlje u Neretvi i inicijalizaciju/ponavljanje svih osam scena. Na proveri 12. 11. 2026 ciljani skup prolazi 14/14, ceo unit skup 278/278 i lint je bez upozorenja. Postojeći frameRate testovi zadržavaju svoje tolerancije; browser i ručne kontrole svih 2D scena ostaju za A5-02.

Namerne razlike: vremenski intervali više ne prolaze dok je igra pauzirana; Neretva ne prihvata nove pogotke posle ishoda; Otpisani preskače pucanj na UI dugme i odmah zaustavlja muziku pri izlasku umesto odloženog browser tajmera. Ovo ne menja broj tastera ili režime 1P/2P. Patrola ne pokreće zakašnjeli audio po gašenju.

<a id="movement-a3-03"></a>
## Predaja A3-03: opt-in kontroleri, kretanje i prikaz

[Actor](../core3d/actor/Actor.js), [Player](../core3d/actor/Player.js) i [AI](../core3d/actor/AI.js) prihvataju `useComposedMovement: true`. Bez te opcije zadržavaju postojeći put. Za A3-05/A3-08 novi put uključuje sastavljač konkretnog lika; nije podrazumevano uključen svim scenama.

- [PlayerController](../core3d/actor/behaviors/PlayerController.js) preuzima postojeći Input kao izvor, a izlaže stabilan `intent` koji osvežava pre FSM update-a. Čuva analogni `screen.forward` i `pressed` za postojeće specijalne akcije; `end()` gasi izvor.
- [AIController](../core3d/actor/behaviors/AIController.js) izlaže isti osnovni oblik namere, koji postojeća AI stanja menjaju direktno. Ne pravi Keyboard niti DOM pretplate. Odluke o poteri i napadu ostaju FSM-u.
- [KinematicMovement](../core3d/actor/behaviors/KinematicMovement.js) dobija mesh, zajednički velocity i eksplicitne upite za teren/prepreke i reakcije. Obrađuje postojeće kretanje, okretanje, strafe, vertikalnu brzinu i praćenje terena. Ne pokreće sopstvenu petlju i ne menja orijentaciju modela pri instanciranju. Actor-ove postojeće metode delegiraju komponenti, pa FSM i specijalizovane klase zadržavaju javni API.
- [PlayerView](../core3d/actor/behaviors/PlayerView.js) poseduje health bar i ChaseCamera, čita Health i ne menja simulaciju. Player zadržava reference `healthBar`/`chaseCamera` zbog postojećih korisnika. Novi put ne ažurira istu kameru i bar još jednom legacy putem.

[Testovi](../tests/unit/movement3d.test.js) dokazuju isti movement za nameru igrača/AI, odsustvo AI DOM pretplata, stvarne tastaturne događaje kroz FSM/animacije, hodanje/trčanje/okretanje/strafe/skok na 30 i 60 Hz i očuvanje položaja pri ažuriranju prikaza. Opt-in i legacy položaji/rotacija porede se na svakom koraku sa apsolutnom tolerancijom 1e-7; to potvrđuje ekvivalenciju na istoj frekvenciji, ne tvrdi potpuno determinističan ishod između različitih frekvencija. Ciljani skup 15/15 i ceo unit skup 296/296 prolaze, završni lint je bez upozorenja. Browser/ručno poređenje ostaje za A5-02.

Vlasništvo nad Actor/Player/AI i behaviors predato je Claude-u za A3-04. Wall-clock intervali legacy AI/FSM-a nisu preimenovani u game time u ovom koraku; to ostaje delu migracije koji obrađuje njihove akcije i sesiju.

<a id="presentation-a4-05"></a>
## A4-05: scene prikaza, animacije i kasni resursi

[CityMorph](../scenes/dark-city/CityMorph.js) poseduje sopstveni TWEEN.Group i čita sesijski presentation clock; Dark City ne koristi više globalni TWEEN update niti zidni sat. Pauza zamrzava animaciju, a scope gasi grupu i pointer listener. Uvodna poruka koristi sesijski zadatak.

[City Colorful](../scenes/city-colorful/Main.js) i [Drvar](../scenes/drvar/Main.js) čekaju OrbitControls kroz `session.keep`, sa dispose-om zakasnelih kontrola. Drvar texture callback proverava da li sesija još postoji: kasna tekstura se oslobađa i ne dodaje novi sprite ugašenoj sceni. Filter tela stranice ima jedan scope cleanup sa prethodnom vrednošću, pa ponovljen zakasneli end ne briše stil nove scene.

[Locomotive](../scenes/locomotive/Main.js) i [pozadina menija](../scenes/lookat-cursor/Main.js) traže modele tokom init-a kroz postojeći keš, kloniraju instance i proveravaju pripadnost sesiji posle čekanja. Factory se dinamički uvozi u init-u, ne pri uvozu scene. Miksere i pointermove gasi scope. Klip za pogled ka kursoru se **klonira pre izmene tracks**: menjanje klipa iz keša bi menjalo sledećeg korisnika istog resursa. Uklonjeno je učitavanje castle modela u Locomotive koji nikad nije bio dodat sceni.

[Flying Through Space](../scenes/flying-through-space/Main.js) ostaje jednostavna scena sa Stars objektom: postojeći Scena3D životni ciklus već poseduje njegovo ažuriranje i GPU resurse; nije dodat prazan sloj komponenti. Šest scena ne uključuje novi fizički fixed-step režim, jer ovde nema fizičkog sveta.

**Potvrđena animaciona greška:** [Drvar Sprite](../scenes/drvar/Sprite.js) je ranije napredovao najviše jedan kadar po update-u, bez obzira koliko vremena prođe. Sada troši sve dospele kadrove. Test jedne sekunde na 30/60 Hz prvo je otkrio i graničnu grešku float sabiranja (tri umesto četiri kadra); poređenje uz relativnu toleranciju 1e-12 dužine kadra i odsecanje negativnog ostatka čuvaju tačnu granicu bez širenja očekivanja testa. Prevencija je poređenje 30/60 Hz i jednog dugog update-a.

[Ciljani testovi](../tests/unit/presentationScenes.test.js) prolaze 4/4: izolacija morph grupa i pauza/gašenje, kasna tekstura, FPS nezavisna animacija i uvoz svih šest scene modula bez model fetch-a. Lint je čist; `npm run check` potvrđuje 298 fajlova i 39 scena. Završni zajednički unit prolaz potvrđuje 310/310, nakon što su završene paralelne izmene borbenog koraka; browser/ručna provera ostaju za A5-02.

<a id="avatars-a3-08"></a>
## Predaja A3-08: profili i specijalne akcije

[Avatar](../core3d/actor/Avatar.js) sada podrazumevano koristi opt-in kretanje i kontroler iz A3-03; to pokriva avatar, avatar-planets i led-city. `avatarAbilities` je izvor jumpStyle/lava otpornosti za STONE/LAVA/DISCO, a vizuelna poza je zaseban objekat po instanci. Globalni THREE.Clock je uklonjen: udovi i lava shader dobijaju dt svog avatara. Normalizacija udova zadržava ponašanje na 60 Hz preko stepena .9^(dt*FPS).

[Avatar scena](../scenes/avatar/Main.js) prihvata samo tri definisana izbora, blokira drugi klik dok uvoz traje i čeka modul kroz session.keep. Zadržan je jedan ručni update igrača u toj sceni (mesh se dodaje kroz addMesh, ne još jednom u predmeti), kako bi se sačuvalo ponašanje pri smrti; bazni end već eksplicitno gasi i player. Planets i led-city imaju registrovanog igrača i ne dodaju drugi ručni update.

[Capoeira model](../scenes/capoeira-girl/Character.js) je opis/fabrika lokalna igri: učitavanje se čeka u init-u, uz zajednički keš i novo kretanje. Stari bibliotečki CapoeiraGirl modul više nije potrošač ove scene i ostaje Claude-u za čišćenje u A5-01. Posebni DOM i stilovi pripadaju scope-u.

[SpecialActions](../scenes/capoeira-girl/SpecialActions.js) dobija loader klipa kao saradnika, spaja ponovljene zahteve i primenjuje samo poslednji izbor stanja. Zakašnjeli rezultat ne dodaje akciju ugašenom igraču; klip se klonira pre povezivanja sa mixer-om. Opis pojedinačnog FBX klipa prosleđuje i `name`, zato što postojeći loadFbx pripisuje baš tu vrednost imenu klipa.

[Provere](../tests/unit/avatars.test.js): 6/6 ciljanih testova, ceo skup 318/318, lint čist i check 300 fajlova/39 scena. Pokriveni su svi profili, odvojena vizuelna faza, dva izbora u istom trenutku, kraj sesije tokom uvoza, konkurentne specijalne akcije, UI cleanup, 6 energije/s u lavi i jedan poen po prikupljenom novčiću. Browser i ručna provera animacija/izbora ostaju za A5-02.

<a id="horror-a3-09"></a>
## Predaja A3-09: horror i gradske igre

Šest korišćenih horror likova, [Worker](../core3d/actor/derived/ww2/Worker.js) i [DeadTree](../core3d/objects/DeadTree.js) sada izlažu opise modela umesto učitavanja pri uvozu modula. [Graveyard Survival](../scenes/graveyard-survival/Main.js), [Graffiti City](../scenes/graffiti-city/Main.js) i [Graffiti City Maze](../scenes/graffiti-city-maze/Main.js) čekaju svoje modele kroz `session.keep(requestModels(...))` u init-u pre stvaranja objekata. Likovi koriste sastavljeno kretanje iz A3-03. Zadržani su opisi animacija, brzine, položaji i slogani; Graveyard više ne koristi adapter Sorceress.js, pa taj adapter nema ovog potrošača i može u proveru uklanjanja A5-01.

[ZombieWaves](../scenes/graveyard-survival/ZombieWaves.js) je mali vlasnik intervala pojavljivanja: čita sesijski sat, staje u pauzi i posle ishoda, a posle dugog zastoja dodaje samo jednog zombija kao ranije. Interval ostaje 10 sekundi, pobeda u zoru 300 sekundi. Namerna razlika je da pauza više ne troši interval pojavljivanja. Ostala pravila borbe i jutarnje ponašanje nisu proširivani ovim korakom.

**Granična greška sata:** test drugog intervala nakon vremena 10.01 otkrio je da `now - last < interval` može ostati tačno zbog zaokruživanja (razlika 9.999999999...). Poređenje sa rokom `now < last + interval` rešava taj slučaj bez promene očekivanja testa. To nije tvrdnja da je float vreme univerzalno precizno; za nove intervale koristiti eksplicitan rok i testirati granični trenutak.

[Ciljani testovi](../tests/unit/horrorScenes.test.js) prolaze 4/4: uvoz modela i sve tri scene bez fetch-a, intervali sa pauzom/ishodom i zastojem, jedna smrt duha bez death animacije, i pobeda u zoru bez novih zombija iza rezultata. Zajednička provera 12. 11. 2026: 322/322 unit testa, čist lint i check 301 fajl/39 scena. Importi koriste imenovane grupe modela (`models as workerModels` i slično), koje postojeća projektna provera povezuje sa requestModels pozivom. Browser i ručno poređenje animacija/kontrola ostaju za A5-02.

## Održavanje ove beleške

Kad korak promeni opisani ugovor, ažurirati postojeći tematski odeljak i referencu, umesto dodavanja dnevnika po datumima. Novi nalaz mora navesti dokaz, značenje za migraciju i način da se regresija uhvati. Kada lokalna proba potvrdi ili opovrgne pretpostavku o Ammo build-u, ovde zameniti oznaku neprovereno konkretnim rezultatom i linkom na test/merenje.

Glavni [DOCS](DOCS.md#a4-01-ammo) povezuje ovu belešku kroz odeljak A4-01. Izmerene Ammo ugovore održavati tamo, a ovde ostaviti njihovu primenu i granice; tako preporuka i lokalni dokaz ne postaju dve različite verzije iste odluke.
