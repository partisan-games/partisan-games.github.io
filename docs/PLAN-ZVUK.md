# Globalni plan prostornog zvuka

Slušalac je uvek igrač; sve igre računaju udaljenost od njegovog tačnog položaja do izvora zvuka.

| # | Korak | Rezultat za proveru | Status |
|---|---|---|---|
| 1 | [ZV-01 · Popis izvora i ugovor zvuka](#zv-01) | Poznati svi audio potrošači, izvori bez zvuka i veza sa tačnim položajem igrača svake scene | 📋 TODO |
| 2 | [ZV-02 · Zajednička Web Audio osnova](#zv-02) | Jedan audio kontekst, deljeni snimci i resursi vezani za sesiju | 📋 TODO |
| 3 | [ZV-03 · Položaj, udaljenost i slušalac](#zv-03) | Tačan položaj igrača i izvora u 2D/3D; zajednički proračun i glatke promene zvuka | 📋 TODO |
| 4 | [ZV-04 · Pucnji, petlje i broj glasova](#zv-04) | Pucanj ostaje na mestu opaljenja; motor prati objekat; daleki izvori ne troše nepotrebne kanale | 📋 TODO |
| 5 | [ZV-05 · Profili i realističan miks](#zv-05) | Udaljeno je tiše i prigušenije; prolazak ima blag Doplerov efekat; važni događaji ostaju čujni | 📋 TODO |
| 6 | [ZV-06 · Priprema snimaka](#zv-06) | Postojeći zvuci imaju ujednačenu polaznu jačinu; nedostajući snimci pripremljeni za vlasnikov pregled | 📋 TODO |
| 7 | [ZV-07 · Zajednički 2D objekti i Ustanak](#zv-07) | Topovi, granate, puške, avioni i požari koriste prostorni zvuk; potvrđena pravila 1P i 2P | 📋 TODO |
| 8 | [ZV-08 · Ostali 2D potrošači](#zv-08) | Vis, Neretva, Ranjenik, Otpisani i ostali pronađeni potrošači prelaze na isti sistem | 📋 TODO |
| 9 | [ZV-09 · Zajednički 3D objekti](#zv-09) | Oružje, motori, vatra, govor i vremenski efekti koriste iste profile i pravila | 📋 TODO |
| 10 | [ZV-10 · Povezivanje igrača svake scene](#zv-10) | Svaka igra predaje tačan položaj svog igrača, razmeru sveta i ambijent | 📋 TODO |
| 11 | [ZV-11 · Integracija i preslušavanje](#zv-11) | Provereni dolazak, prolazak, odlazak, pauza, runde, izlazak i ponovno igranje | 📋 TODO |
| 12 | [ZV-12 · Uklanjanje stare putanje](#zv-12) | Jedan sistem reprodukcije, ažurna dokumentacija i pošten zapis izvršenih provera | 📋 TODO |

Tehnički predlozi ispod još nisu vlasnikove potvrđene odluke; nalog za izradu plana nije nalog za implementaciju.

| # | Odluka | Razlog | Status |
|---|---|---|---|
| 1 | D1 · Web Audio unutar postojećih vlasnika zvuka | Prostorni smer, filteri, glatke promene i nezavisni istovremeni pucnji | 📋 TODO |
| 2 | D2 · Jedna kriva slabljenja, različiti dometi po vrsti izvora | Isto značenje udaljenosti u svim igrama, uz glasniji top i tišu pušku | 📋 TODO |
| 3 | D3 · Zaglađivanje jačine i smera do 0,5 s pri smeni igrača u 2P | Položaj slušaoca odmah postaje tačan položaj aktivnog igrača; zaglađuje se izlazni zvuk | 📋 TODO |
| 4 | D4 · Blag Dopler samo od stvarnog kretanja | Avion menja ton pri prolasku; smena poteza, zum i teleport ga ne izazivaju | 📋 TODO |
| 5 | D5 · Prostorni izvori, prostorne oblasti i neprostorni zvuci | Puška ima tačku, požar oblast, a muzika i meniji ne zavise od položaja | 📋 TODO |
| 6 | D6 · Početni limit 32 aktivna glasa i najviše 8 neprekidnih izvora | Sprečava preopterećenje i gomilanje istih motora ili požara; konačan limit sledi merenje | 📋 TODO |

## Obim

Obuhvat je globalan: zajednički sistem u [core/io](../core/io/), životni ciklus scena, svi postojeći audio potrošači u [2D osnovi](../core/), [3D osnovi](../core3d/), [igrama](../scenes/) i [UI-ju](../ui/), uz pripadajuće snimke i testove. Obuhvatiti i objekte koji sada ćute, a imaju jasnu zvučnu radnju, ako se to potvrdi popisom u ZV-01; za njih pripremiti stvarne snimke, ne improvizovane zamene. Dekoracija ne dobija zvuk samo zato što je objekat.

Zajednički kod sme da se menja radi ovog ugovora; svaka migraciona grupa navodi pogođene igre i čuva njihova gameplay pravila. Planiranje ne odobrava preuzimanje novih zvukova u projekat pre vlasnikovog preslušavanja, pokretanje testova, objavu ili commit. Postojeće lokalne izmene ostaju sačuvane.

Van obima su promena fizike i poteza, novi UI i podešavanja po igri, mrežni multiplayer, više slušalaca istovremeno, simulacija akustike kroz stvarnu geometriju zidova, univerzalno kašnjenje svakog pucnja i prerada grafike. Prigušenje sa daljinom jeste u obimu; zaklon iza zida ne zaključuje se iz slike pozadine.

## Kako se čita

- Radi jedan agent, redom. Posle naloga za implementaciju završi jedan korak i čeka izričito „dalje“, osim ako vlasnik odobri samostalan nastavak kroz više koraka.
- Za `Done` završiti opisani posao i navesti stvarno izvršene provere. Test koji je samo napisan nije prošao; vlasnikovo izričito odlaganje provera beleži se odvojeno, bez izmišljanja rezultata.
- Vlasnik je ranije odbio pokretanje testova, ESLint-a i provere projekta. Taj izbor važi dok ga ne promeni; ovaj plan ih samo predviđa. Browser i slušni pregled zahtevaju zaseban dogovor o pokretanju.
- Novi snimci čekaju izričit izbor vlasnika pre unošenja u projekat. Tehničke brojke u predlozima su početne vrednosti za podešavanje, ne potvrđen miks.
- Procene su min / verovatno / max u poenima; 1 p je jedan idealan radni dan jednog izvršioca. Čekanje odobrenja, preslušavanja i nedostupnog uređaja nije uračunato.
- Putanje i brojevi redova opisuju proverenu radnu kopiju. Nove klase pomenute imenom su predlog; njihova konačna podela prati postojeće odgovornosti.

## Sažetak

Najpre izgraditi zajedničku osnovu i proverljiv proračun, zatim prebacivati grupe objekata, pa proveriti svaku scenu i ukloniti staru reprodukciju. Ustanak je prvi konkretan primer pravila slušaoca, ali nije granica ovog posla.

Ukupno **9 / 14,75 / 24,5 p**, odnosno približno isti broj radnih dana za jednog izvršioca, bez čekanja. Najveća neizvesnost su snimci koji nedostaju i broj posebnih načina na koje scene danas pokreću zvuk.

## Pretpostavke

- Jedna igra je aktivna u datom trenutku; ovo je postojeći ugovor [arhitekture](ARHITEKTURA.md), ne podrška za više istovremenih scena.
- Akustička razmera većine scena nije zadata. U ZV-01 je odrediti iz njihovih svetskih koordinata; ne pretpostavljati da piksel i 3D jedinica znače isti metar.
- Postojeći izbor snimaka Ustanka ostaje važeći. Potpunost za sve druge zvučne radnje tek se utvrđuje; broj novih snimaka nije poznat.
- Podrška browsera za izabrani graf i ponašanje pri zaključanom ekranu moraju se proveriti; sadašnji kod ne dokazuje ispravnost nove Web Audio putanje.

## Odluke i proverena osnova

Provereno 2026-11-17 u repozitorijumu `partisan-games.github.io`, HEAD `a8303af1fd3cf2185112d12bef06c5fe62c80974`, **uz nekomitovane izmene zvuka**. Reference ispod su redovi te radne kopije, ne tvrdnja da ih HEAD već sadrži. Testovi i browser u ovoj izradi plana nisu pokretani.

**Potvrđeno sa vlasnikom:** zvuk pripada klasi ili objektu globalno; slušalac je uvek igrač na svom tačnom položaju; udaljenost se računa od njega do tačnog položaja izvora u svetu. Kamera i centar ekrana ne zamenjuju igrača. U Ustanku protiv računara igrač je levi tim/top i ostaje slušalac i tokom računarevog poteza; u 2P slušalac postaje aktivni igrač. Blag prelaz zaglađuje zvuk, ne izmišlja položaj između igrača. Numerička podešavanja i tehnički način realizacije ostaju predlozi.

| Dokaz u kodu | Posledica za plan |
|---|---|
| [ManagedSound:7](../core/io/ManagedSound.js#L7), [SceneAudio:8](../core/io/SceneAudio.js#L8) | Postoje upravljanje jačinom i vlasništvom, ali nema položaja slušaoca, filtera ni nezavisnih glasova |
| [Scene:63](../core/Scene.js#L63), [Scene:170](../core/Scene.js#L170) | Osloniti se na postojeće vezivanje scene i dva poziva sinhronizacije, ne praviti paralelan životni ciklus |
| [Airplane:37](../core/objects/Airplane.js#L37), [GameObject2D:270](../core/actor/GameObject2D.js#L270) | Avion i vatra danas zavise od vidljivosti; to sprečava čujnost van kadra |
| [Recurring:22](../core/objects/Recurring.js#L22) | Vraćanje aviona u kadar uključuje skok položaja; ne računati ga kao veliku brzinu |
| [Ustanak:185](../scenes/ustanak/Main.js#L185), [Turns:14](../scenes/ustanak/Turns.js#L14) | Perspektivu menjati pri stvarnoj smeni poteza posle razrešenja hica, ne pri ispaljenju |
| [Ustanak:232](../scenes/ustanak/Main.js#L232) | Nova runda menja početnu stranu; slušalac mora biti postavljen pre njenog prvog zvuka |
| [Occupier:7](../core/actor/Occupier.js#L7), [Svabo:6](../scenes/neretva/Svabo.js#L6) | Deljeni audio element rafala ne može predstavljati dva nezavisna položaja |
| [Vis Bullet:11](../scenes/vis/Bullet.js#L11) | Pucanj je trenutno vlasništvo recikliranog metka; zvučni rep ne sme putovati s njim |
| [3D Actor:227](../core3d/actor/Actor.js#L227), [3D Tank:36](../core3d/physics/Tank.js#L36) | Postoje resetovanje istog zvuka napada i pokretanje motora na komandu kretanja; oba mesta moraju da se migriraju |
| [Rain:157](../core3d/Particles.js#L157), [lightningStrike:83](../core3d/light.js#L83) | Kiša je ambijent; grmljavina već ima svoj proračun daljine i odlaganje koje ne sme dobiti drugi put |
| [Patrola:30](../scenes/ranjenik/Patrola.js#L30), [Vis:57](../scenes/vis/Main.js#L57) | Asinhrono učitavanje govora i ručno gašenje motora ostaju regresioni slučajevi |

Stručna osnova: [FMOD — prostorni zvuk](https://www.fmod.com/docs/2.04/api/spatializing-sounds-in-the-core-api.html) za izvor, slušaoca i udaljenost; [FMOD — glasovi i resursi](https://www.fmod.com/docs/2.04/api/managing-resources-in-the-core-api.html) za prioritete i nečujne izvore; [Web Audio smernice](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) za izbor bafera/strimovanja i pokretanje iz korisničkog gesta; [PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode) za prostornu obradu; [AudioParam](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime) za glatke promene. Konkretne podele, dometi i rokovi u ovom planu naš su predlog, ne univerzalne brojke iz tih izvora.

## Zajednička pravila zvuka

### Slušalac i koordinatni sistem

Scena predaje audio sistemu referencu na igrača, njegov tačan svetski položaj i orijentaciju, razmeru sveta i oznaku smene igrača ili teleporta. Objekat predaje svoj tačan položaj izvora i vrstu zvuka; ne računa svoju posebnu krivu udaljenosti. Udaljenost je geometrijsko rastojanje igrača i izvora u istom koordinatnom sistemu. Isti profil pri istoj akustičkoj udaljenosti daje istu jačinu i prigušenje u svakoj igri.

2D adapter prevodi **svetske**, ne ekranske koordinate igrača i izvora u iste akustičke jedinice. Razmera je samo konverzija jedinica i ostaje nezavisna od zuma, rezolucije i pomeranja kamere; ne menja stvarno rastojanje niti dodaje izmišljenu dubinu. Za 2D koristi se geometrija sveta igre; rendererov `z` za redosled crtanja nije dubina zvuka. 3D adapter uzima svetski položaj igrača i izvora, ne lokalni položaj mesh-a pod roditeljem, i primenjuje istu deklarisanu razmeru na oba.

Za Ustanak u 1P igračev položaj prati levi top, uključujući njegovo spuštanje sa terenom, i ostaje slušalac tokom AI poteza. U 2P igrač za slušanje prati `turns.active`: dok granata leti i eksplozija se razrešava, to je igrač koji je pucao; pri stvarnoj smeni slušalac odmah postaje sledeći igrač na tačnom položaju njegovog topa. Predlog je zaglađivanje rezultujuće jačine i panorame do 0,5 s, bez interpolacije položaja slušaoca. Leva i desna strana ostaju strane sveta, bez ogledanja kada je na potezu desni top. Nova runda bira početnog igrača pre prvog zvuka; pauza zamrzava audio prelaz, a kraj meča zadržava poslednjeg igrača.

Za svaku drugu igru pronaći postojeći objekat igrača i njegov tačan položaj; u vožnji ili letu to je igračev položaj u vozilu kojim upravlja. Orijentacija slušaoca prati igračev pogled, a kamera je njen izvor samo ako zaista predstavlja taj pogled; njen odmak ne menja položaj slušaoca. Scena bez objekta ili definisanog položaja igrača nema prećutni prostorni fallback: najpre povezati njen model igrača, a do tada ne izmišljati slušaoca. Dekorativni prikaz bez igrača može imati neprostorni ambijent.

### Udaljenost i smer

Predlog D2: puna polazna jačina do `nearDistance`, zatim inverzno slabljenje `nearDistance / distance`, uz glatko gašenje između `fadeStart` i `maxDistance`. Nema deljenja nulom; `nearDistance > 0` i `nearDistance < fadeStart < maxDistance`. `maxDistance` je kod nas stvarna granica čujnosti, ne oslanjanje na značenje istoimenog Web Audio parametra kod inverzne krive.

Ukupna jačina je glavna jačina × grupa zvuka × trim snimka × jačina izvora × udaljenost × prelaz. Primenjuje se jednom: ne množiti ponovo i kroz HTML audio i kroz Web Audio, niti ponovo kroz ugrađeno slabljenje `PannerNode`-a. Zajednička funkcija računa slabljenje; panner određuje smer. Promene jačine, panorame i filtera zaglađuju se audio automatizacijom, bez skokova po frejmovima. Monofoni lokalni snimci služe za tačkaste izvore; stereo ostaje za široke ambijente i muziku.

Početni predlog profila u **akustičkim jedinicama**, za podešavanje u ZV-05; brojke nisu metri dok scena ne proglasi takvu razmeru:

| Izvor | Blizu / početak gašenja / kraj | Položaj i ponašanje |
|---|---|---|
| Puška i rafal | 1 / 18 / 25 | Tačka cevi u trenutku opaljenja; mali kontrolisani izbor varijante |
| Top i eksplozija | 2 / 50 / 70 | Tačka cevi ili udara; veći domet i očuvan duboki deo zvuka |
| Let granate | 0,75 / 18 / 25 | Prati granatu; prestaje pri udaru; ne dodavati zvižduk svakom običnom metku |
| Motor aviona ili vozila | 2 / 32 / 45 | Prati motor; stanje mirovanja/opterećenja i blag Dopler pri stvarnom prolasku |
| Požar | 4 / 28 / 40 | Oblast požara; jedna široka reprodukcija po oblasti, ne snimak za svaki plamen |
| Govor | 1 / 8 / 12 | Prati govornika, bez Doplera; razumljivost važnija od slučajne promene tona |
| Vetar, kiša, muzika, UI | Ne primenjuje se na opšti ambijent | Neprostorni sloj; lokalni nalet vetra ili obližnji izvor može imati poseban prostorni profil |

Kod oblasti se udaljenost meri do njene najbliže tačke; slušalac unutar oblasti ne čuje „daleki centar požara“. Selo može imati širi neprostorni sloj i nekoliko prostornih oblasti, ali ne istu vatru dvaput. Svaki sloj ima zasebnu svrhu i kontrolisan zbir jačina.

### Pucanj, motor i prolazak

Pucanj dobija kopiju položaja cevi pri opaljenju i nezavisan glas vezan za sesiju. Njegov rep ostaje tamo i kada vojnik ode ili metak bude recikliran. Eksplozija dobija tačku udara; motor, govor i zvižduk prate živ izvor. Uklanjanje objekta gasi njegove petlje; već emitovan pucanj može dovršiti rep, dok izlazak iz scene gasi sve njene glasove.

Avion je čujan pre ulaska u kadar i posle izlaska dok je unutar dometa od tačnog položaja igrača. Motor se ne resetuje svakim frejmom ili pritiskom komande. Zavisnost od stanja motora odvojiti od vidljivosti; skrivanje uništenog ili uklonjenog objekta i izlazak van kamere nisu ista stvar.

Udaljeni zvuk postaje tiši i gubi deo visokih frekvencija. Dopler je blaga promena tona od relativne brzine približavanja igrača i izvora: samo za predviđene pokretne izvore, sa početnim ograničenjem odnosa reprodukcije 0,9–1,1. Web Audio backend ga računa eksplicitno; ne pretpostavljati da ga `PannerNode` radi sam. Smena aktivnog igrača, teleport izvora ili igrača, vraćanje aviona na drugi kraj i pauza resetuju istoriju brzine i ne izazivaju promenu tona. Sama promena kamere ne menja položaj, udaljenost ni brzinu igrača; zaglađivanje zvuka ne ulazi u računicu kretanja.

Predložene grupe su efekti, motori, ambijent, govor, muzika i UI. Sve na kraju prolaze kroz `config.volume`; ne dodaje se korisnički UI za ove grupe. Ostaviti rezervu u miksu i ograničiti vrhove, bez podizanja svakog snimka do maksimuma; daljina se podešava tek pošto je ujednačena polazna glasnoća snimaka. Nasumične varijante koriste poseban generator, da ne promene postojeći redosled `Math.random` i izgled/gameplay.

## Rad i raspored

Jedan izvršilac poseduje sve izmene; vlasnik projekta bira nove snimke i komituje sam. Nema delegiranja, istovremenih izmena deljenih fajlova, commit-a niti automatske objave. Za svaku migracionu grupu pripremiti testove tada, a ne ostaviti pisanje svih testova za ZV-11.

[Raspored](plan-zvuk.json) je sekvencijalan; nema skrivenih paralelnih radnih dana i uslovnih koraka u zbiru. Broj novih snimaka i igre sa specifičnom politikom razrađuju se u ZV-01; ako nalaz izlazi iz procene, korigovati pre daljeg rada.

| Talas | Koraci | Min / verovatno / max radnih dana | Kontrolna tačka |
|---|---|---|---|
| W1 · Osnova | ZV-01, ZV-02 | 1,5 / 2,5 / 4 | Potpun popis i kompatibilan zajednički backend bez prekida starih potrošača |
| W2 · Prostorni ugovor | ZV-03, ZV-04, ZV-05 | 2,25 / 3,75 / 6 | Proračun, glasovi i profili mogu da se provere bez migriranih igara |
| W3 · Migracija | ZV-06, ZV-07, ZV-08, ZV-09, ZV-10 | 4 / 6,5 / 11 | Izvori imaju vlasnike i položaje; svaka igra direktnu vezu sa položajem igrača |
| W4 · Provera i završetak | ZV-11, ZV-12 | 1,25 / 2 / 3,5 | Zabeleženi stvarni nalazi; stara putanja uklonjena tek bez preostalih korisnika |
| Ukupno · jedan izvršilac | ZV-01 do ZV-12 | **9 / 14,75 / 24,5** | Čekanje vlasnika i uređaja dodaje se kalendaru |

Svaki korak predaje sledećem upotrebljiv kod, pisane testove i tačan zapis izvršenih ili odloženih provera. Nepokrenut test nije potvrda; ako se pokaže da korak nije proverljiv bez narednog, vratiti tu proveru u odgovarajući kasniji korak umesto kružne zavisnosti.

## Koraci

<a id="zv-01"></a>
### ZV-01 · Popis izvora i ugovor zvuka · 0.5 / 1 / 1.5 p · Agent

- **Šta:** pretražiti sve audio pozive i zvučne radnje zajedničkih objekata; u ovaj plan dodati popis po klasi i sceni: događaj, vlasnik, tačka/oblast/ambijent/UI, jednokratno/petlja, postojeći snimak ili nedostatak, razmera sveta, slušalac i poseban rizik. Obuhvatiti i scene koje sada nemaju audio pozive, da se ne zameni „svi postojeći zvuci“ sa „svi potrebni izvori“. Razrešiti D1–D6 pri nalogu za implementaciju, uz poštovanje vlasnikovih korekcija.
- **Referenca:** [sound helper:8](../core/io/sound.js#L8), [ManagedSound:5](../core/io/ManagedSound.js#L5), [3D Actor:82](../core3d/actor/Actor.js#L82) i tabela dokaza iz ovog plana; uzeti stvarne potrošače, ne samo Ustanak.
- **Gotovo kada:** svaki pronađeni audio poziv ima jednu migracionu grupu ZV-07/ZV-08/ZV-09 ili UI migraciju u ZV-10, a svaka scena ima pronađen izvor tačnog položaja igrača ili konkretno naveden nedostatak u modelu igrača; nepoznati podaci jasno su označeni. Dostupan je mali predlog scenarija za slušnu proveru, bez novog korisničkog UI-ja.
- **Zamke:** modul može držati deljeni audio element; grmljavina može koristiti udaljenost bez položaja; neki efekti žive van `children`. Popis obuhvata te slučajeve.
- **Spoljno:** igrača i njegov položaj pronaći u kodu prema potvrđenom pravilu. Ako neka igra to još ne modeluje, navesti konkretan nedostatak; ne tražiti ponovo odluku ko je slušalac.

<a id="zv-02"></a>
### ZV-02 · Zajednička Web Audio osnova · 1 / 1.5 / 2.5 p · Agent

- **Šta:** u [core/io](../core/io/) uvesti jednog aplikacionog vlasnika audio konteksta i keša dekodiranih snimaka. Zadržati odgovornosti [ManagedSound](../core/io/ManagedSound.js) i [SceneAudio](../core/io/SceneAudio.js); backend postepeno menjati iza njih, uz privremenu kompatibilnost starih potrošača. Kratke efekte dekodirati jednom po resursu; duge muzičke snimke strimovati kroz isti završni miks. Inicijalizacija i `resume` iz korisničkog gesta, bez zvuka pri importu. Dodati uski predloženi ulaz za položaj/razmeru, ali još ne povezivati igre.
- **Referenca:** [Scene:97](../core/Scene.js#L97) i [ResourceScope:19](../core/runtime/ResourceScope.js#L19): pokretanje i gašenje imaju vlasnika. Jedan kontekst ne zatvarati na kraju scene; ugasiti njene čvorove i zahteve, a zajednički kontekst tek pri gašenju aplikacije.
- **Gotovo kada:** napisane izolovane provere sa lažnim audio backendom pokazuju jedan kontekst, jedno dekodiranje po URL-u, pravilno oslobađanje vlasnika, oporavak nakon neuspešnog učitavanja i ignorisanje zakasnelog odgovora stare sesije. Stari potrošači mogu da rade do svoje migracije.
- **Zamke:** ne uvoditi još jednog vlasnika `config.volume`; ne birati ime koje se od postojećeg modula razlikuje samo velikim slovom; ne oslanjati se na autoplay. Ne praviti drugi Three.js audio kontekst.
- **Spoljno:** bez odobrenja izvršavanja postoje samo kod i pisani testovi; browser ponašanje proverava ZV-11 nakon dozvole.

<a id="zv-03"></a>
### ZV-03 · Položaj, udaljenost i slušalac · 0.75 / 1.25 / 2 p · Agent

- **Šta:** napraviti čistu zajedničku računicu položaja, razmere, udaljenosti i krive D2, bez zavisnosti od THREE/Canvas; 2D i 3D adapteri daju isti oblik podataka. Povezati horizontalni stereo smer i orijentaciju igrača. Položaj slušaoca uvek je tačan položaj igrača; zaglađivanje izlaznog zvuka držati odvojeno od položaja i fizičke brzine. Podržati tačku i oblast izvora. Svetske pozicije se čitaju iz instanci, ne čuvaju kao globalna promenljiva scene.
- **Referenca:** [Renderer2D:10](../core/Renderer2D.js#L10) i [Scene3D:28](../core/Scene3D.js#L28): postoje kamera i pomeranje prikaza; iz njih ne izvoditi svetsku udaljenost preko koordinata ekrana. Koristiti ugovor iz odeljka „Zajednička pravila zvuka“.
- **Gotovo kada:** pisani testovi porede iste akustičke pozicije kroz 2D i 3D adapter: ista jačina i filter; proveravaju nultu udaljenost, kraj dometa, granice oblasti, rotaciju slušaoca, resize i zum, tačno praćenje položaja igrača na 30/60/144 Hz, nezavisnost od odmaka kamere i zaglađivanje zvuka sa zamrzavanjem u pauzi. Ove provere koriste fiksne ulaze, bez migrirane scene.
- **Zamke:** rendererov sloj `z` nije dubina; `maxDistance` ugrađenog inverznog modela nije automatska tišina; ne primeniti slabljenje dvaput.
- **Spoljno:** numeričke profile i stvarno slušanje ne blokiraju računicu; tačan položaj igrača je potvrđeno pravilo; početne brojke D2/D3 ostaju tehnički predlozi.

<a id="zv-04"></a>
### ZV-04 · Pucnji, petlje i broj glasova · 0.75 / 1.25 / 2 p · Agent

- **Šta:** svaki jednokratni događaj dobija svoj glas i kopiju tačke nastanka; ponovno korišćenje objekta ne pomera ni prekida prethodni pucanj. Petlja ima vlasnika i prati njegov položaj. Razdvojiti gašenje emitera od završetka već emitovanog repa. Scena poseduje sve glasove, uključujući one čiji je izvor uklonjen. Dodati prioritete, ograničenje po profilu i globalni limit D6; pri prekoračenju prvo izbacivati najtiše nevažne glasove, uz kratak fade.
- **Referenca:** [Shell:33](../core/actor/projectiles/Shell.js#L33), [Vis Bullet:11](../scenes/vis/Bullet.js#L11), [SceneAudio:8](../core/io/SceneAudio.js#L8): odvojiti izvor događaja od njegovog trenutnog deteta i sadašnjeg stanja.
- **Gotovo kada:** pisane provere pokazuju dva preklopljena pucnja na različitim mestima, rep posle recikliranja metka, loop koji se ne restartuje pri svakom update-u, pauzu/nastavak sa istim pomakom, gašenje stare scene bez uticaja na novu i ograničen broj aktivnih čvorova.
- **Zamke:** kada izvor postane nečujan, loop može postati virtuelan: prestaje skupa obrada, ali se čuva logička faza. Ponovna čujnost nastavlja odgovarajući deo, uz različite pragove uključenja/isključenja da ne treperi. Ne čuvati red starih pucnjeva za kasnije: jednokratni događaj bez pravovremeno učitanog snimka propušta se posle kratkog deklarisanog roka, umesto rafala po odmrzavanju.
- **Spoljno:** konačan budžet sledi merenje u ZV-11; početni predlog 32/8 služi za ponovljive testove, ne obećanje performansi telefona.

<a id="zv-05"></a>
### ZV-05 · Profili i realističan miks · 0.75 / 1.25 / 2 p · Agent

- **Šta:** centralizovati profile iz tabele: dometi, trim, filter pri daljini, stereo širina, prioritet, dopuštena odstupanja i Dopler. Koristiti isti proračun u svakoj igri; dozvoliti eksplicitno drugi profil stvarno drugačijeg oružja/vozila, bez lokalnih kopija formula. Dopler računati iz relativne radijalne brzine izvora i fizičkog slušaoca u istoj razmeri; smena aktivnog igrača nosi zasebnu oznaku, a zaglađivanje izlaznog zvuka ne ulazi u položaj ni brzinu igrača. Uvesti grupe miksovanja i rezervu za istovremene vrhove.
- **Referenca:** [sound helper:5](../core/io/sound.js#L5) danas bira nasumičnu jačinu, [Wind:20](../scenes/ustanak/Wind.js#L20) menja svoj množilac; sačuvati takve umetničke namere kroz deklarisane profile i stanje izvora, bez narušavanja glavne jačine.
- **Gotovo kada:** pisani testovi proveravaju monotono slabljenje i prigušenje, ograničenje tona, neutralan Dopler na bočno kretanje bez približavanja, teleport i smenu poteza, kao i zbir grupne/glavne jačine bez duplog množenja. Pripremljen je kontrolisani primer blizu/srednje/daleko za svaki profil; ne tvrditi da je preslušan.
- **Zamke:** oružje nema isti domet kao govor; široki stereo požar nije tačkasta mono puška. Dopler menja i trajanje uzorka ako se menja brzina reprodukcije; ne primenjivati ga na govor, muziku ili UI. Nasumični izbor ne menja gameplay generator.
- **Spoljno:** konačna podešavanja prema vlasnikovom slušanju u ZV-11; pre toga vrednosti su jasno označene kao početne.

<a id="zv-06"></a>
### ZV-06 · Priprema snimaka · 0.5 / 1 / 2 p · Agent

- **Šta:** prema popisu ZV-01 proveriti stvarnu jačinu, prazne početke/krajeve, klikove petlji i format postojećih snimaka; odvojiti lokalne mono izvore od stereo ambijenta. Sačuvati izbor prihvaćenih zvukova Ustanka. Za radnje koje nemaju odgovarajući snimak pronaći licencirane kandidate, pripremiti ih u privremenom folderu i dati vlasniku da ih izabere; nove snimke i varijante ne unositi pre izbora. Izvore i obradu dopisati uz resurse, bez dupliranja fajlova po igrama.
- **Referenca:** [izvori snimaka](../assets/sounds/SOURCES.md) i [zvučni resursi](../assets/sounds/); preuzeti postojeću evidenciju autora, licence i obrade. [Opis Ustanka](IGRE.md#ustanak) čuva njegov prihvaćen izbor.
- **Gotovo kada:** obrađeni su postojeći snimci, a svaki nedostajući izvor iz popisa ima konkretne kandidate za vlasnikov pregled i proverenu licencu; postoje kontrolisani trimovi i pripremljene petlje. Ovaj korak završava pripremu, ne usvaja neodobrene nove snimke. Njihov izbor je spoljašnji ulaz odgovarajućeg migracionog koraka.
- **Zamke:** povišenje glavne jačine ne popravlja loš ili neodgovarajući snimak; kućni kamin nije veliki požar. Zvižduk granate ne sme opet sadržati opaljenje. Jačina snimka i slabljenje udaljenošću podešavaju se odvojeno.
- **Spoljno:** novi art/zvuk zahteva izbor vlasnika. Dok čeka, agent može pripremiti druge postojeće izvore; ne proglašava nedostajući izvor završenim i ne koristi placeholder kao konačan rezultat.

<a id="zv-07"></a>
### ZV-07 · Zajednički 2D objekti i Ustanak · 1 / 1.5 / 2.5 p · Agent

- **Šta:** povezati zajedničke granate, avione i zapaljive objekte sa profilima; u Ustanku top, posada, strelac, zastupljeni ambijenti i vetar koriste isti backend. Pucanj prijavljuje cev, eksplozija tačku udara, a ne položaj mete posle štete. Požar sela/grada opisati oblastima bez gomilanja jednakih petlji. Ukloniti uslov vidljivosti za čujnost; zadržati stanje života i audio domet. Tenkići dobijaju isto ponašanje svojih deljenih izvora.
- **Referenca:** [Top:130](../scenes/ustanak/Top.js#L130), [Shell:64](../core/actor/projectiles/Shell.js#L64), [Airplane:37](../core/objects/Airplane.js#L37), [Battlefield:39](../scenes/ustanak/Battlefield.js#L39), [Ustanak:185](../scenes/ustanak/Main.js#L185), [Turns:14](../scenes/ustanak/Turns.js#L14).
- **Gotovo kada:** pripremljeni integracioni testovi pokazuju da u 1P levi top ostaje blizak i tokom AI poteza, a u 2P tačan položaj slušaoca prelazi na aktivnog igrača tek posle razrešenja hica, uz odvojeno zaglađivanje zvuka; sledeća runda i pauza postavljaju/zamrzavaju perspektivu prema ugovoru. Avion van kadra može biti čujan, vraćanje na desnu stranu ne pravi skok tona, a krater pomera izvor zajedno sa telom. Preklopljene eksplozije ne dele položaj.
- **Zamke:** [Recurring](../core/objects/Recurring.js) teleportuje avion; [Shell](../core/actor/projectiles/Shell.js) koristi odloženu štetu; pozadina se renderuje i posle ishoda. Nijedno od toga nije dozvola za novi gameplay zvuk posle kraja.
- **Spoljno:** koristi postojeće prihvaćene snimke. Slušni pregled ostaje za ZV-11; bez test dozvole beleži se da su testovi samo pripremljeni.

<a id="zv-08"></a>
### ZV-08 · Ostali 2D potrošači · 0.75 / 1.25 / 2 p · Agent

- **Šta:** migrirati ostatak popisa ZV-01: okupatore, Neretvu, patrole i eksplozije Ranjenika, pucnjeve/eksplozije/motor Visa, muziku Otpisanih i druge pronađene 2D izvore. Svaki zvuk dobija vlasnika i kategoriju. Lični motor aviona u Visu ostaje uz igrača; zvuk pucnja polazi iz njegove cevi i ne putuje sa metkom. Muzika i izveštaj/meniji ostaju neprostorni. Deljeni rafal na nivou modula zamenjuje se deljenim snimkom i nezavisnim glasovima.
- **Referenca:** [Occupier:7](../core/actor/Occupier.js#L7), [Svabo:6](../scenes/neretva/Svabo.js#L6), [Patrola:30](../scenes/ranjenik/Patrola.js#L30), [Paljba:10](../scenes/ranjenik/Paljba.js#L10), [Vis Bullet:11](../scenes/vis/Bullet.js#L11), [Vis:57](../scenes/vis/Main.js#L57), [Otpisani:19](../scenes/otpisani/Main.js#L19).
- **Gotovo kada:** za svakog popisanog potrošača postoji pripremljena provera događaja, položaja, odsustva duplog zvuka i gašenja pri promeni igre; dva govornika/rafala imaju nezavisne položaje. Muzika i dalje nema prostorno slabljenje. Obnovljene su relevantne očekivane vrednosti postojećih [testova zvuka](../tests/unit/sound.test.js), uz očuvanje smislene provere glavne jačine.
- **Zamke:** kasni `canplaythrough` patrole ne sme oživeti zvuk ugašene scene; ručne `play/pause` metode Visa ne ostaju paralelno sa novim lifecycle-om. Rafal snimljen kao rafal ne pokreće se ponovo za svaki pojedinačni metak.
- **Spoljno:** za slušaoca povezati postojeći objekat igrača iz popisa; ako nedostaje, navesti šta treba dodati modelu te igre. Kamera i centar ekrana nisu zamena.

<a id="zv-09"></a>
### ZV-09 · Zajednički 3D objekti · 1 / 1.5 / 2.5 p · Agent

- **Šta:** migrirati zvučne napade 3D aktera, motore vozila/letelica iz popisa, vatru, govor i ostale prostorne događaje; koristiti svetske transformacije i iste profile kao 2D adapter. Motor ima stanje rada/opterećenja, ne `play()` na svaki pritisak napred. Kiša i drugi opšti ambijenti su neprostorni; lokalni izvori mogu dobiti oblast. Za grmljavinu ukloniti duplu ručnu krivu jačine: njen deklarisani udaljeni događaj koristi zajedničko slabljenje, a postojeće odlaganje zvuka ostaje samo jednom.
- **Referenca:** [3D Actor:227](../core3d/actor/Actor.js#L227), [3D Tank:36](../core3d/physics/Tank.js#L36), [Rain:157](../core3d/Particles.js#L157), [lightningStrike:83](../core3d/light.js#L83), [Coin:21](../core3d/objects/Coin.js#L21). Za coin odrediti da li je povratna informacija igraču ili događaj u svetu, pa primeniti isti izbor u svim potrošačima.
- **Gotovo kada:** pripremljeni testovi sa jednostavnim THREE objektima proveravaju svetske koordinate pod roditeljem, dva istovremena napada, pomeranje/rotaciju slušaoca i gašenje motora. Logika fizike se ne pokreće u unit okruženju koje nema Ammo; pripremiti browser scenario za fizički tenk. Postojeći zvuci kiše, grmljavine i novčića imaju odgovarajuće regresione provere.
- **Zamke:** nema drugog Three.js audio miksera ili nove distance formule u 3D klasi. Za prostornu grmljavinu potreban je tačan položaj događaja u svetu, pa se udaljenost računa do igrača. Ako događaj nema položaj u modelu, ne izmišljati udaljenost: prvo ga definisati u modelu događaja ili zadržati neprostorni ambijent bez tvrdnje da je prostorno obrađen.
- **Spoljno:** fizičke scene i slušni utisak proveravaju se u browseru u ZV-11 nakon dozvole; unit rezultat ih ne zamenjuje.

<a id="zv-10"></a>
### ZV-10 · Povezivanje igrača svake scene · 0.75 / 1.25 / 2 p · Agent

- **Šta:** proći sve scene, uključujući one bez ranijih audio poziva, i povezati objekat igrača iz popisa ZV-01: njegov tačan položaj, pogled, razmeru sveta, smenu aktivnog igrača i ambijente. Slušalac je igrač u svakoj novoj igri; objekti nemaju `if ustanak` i ne znaju broj igrača. UI/izveštaj/muzika prelaze na isti izlazni miks i vlasništvo uz očuvano neprostorno ponašanje. Sistemski klik nišana prijavljuje igračev izvor, ne položaj cilja pod mišem.
- **Referenca:** [Scene:63](../core/Scene.js#L63), [Scene3D:28](../core/Scene3D.js#L28), [mouse:15](../core/io/mouse.js#L15), [Report:86](../ui/Report.js#L86), [UI:34](../ui/UI.js#L34). Koristiti postojeće vlasništvo sesije; saradnike van sveta registrovati eksplicitno.
- **Gotovo kada:** svaka scena sa igračem iz popisa ima direktnu vezu sa njegovim tačnim položajem i pripremljen scenario; prelazak 2D → 3D → 2D ne nasleđuje položaj, ton, kameru, jačinu ni glasove prethodne igre. Na početnom ekranu nema gameplay zvuka; posle ishoda važi eksplicitna postojeća politika završnih zvukova, bez nove borbe. Ustanak 1P/2P čuva poseban potvrđen ugovor.
- **Zamke:** 3D kamera iza igrača nije slušalac: promena njenog odmaka ne menja udaljenost do izvora. Pravac može preuzeti samo ako predstavlja igračev pogled. Dekorativne scene bez igrača koriste samo neprostorni zvuk.
- **Spoljno:** nema otvorenog izbora slušaoca: to je igrač. Agent rešava povezivanje njegovih postojećih koordinata; samo stvarni nedostatak modela označava kao preostali posao te scene.

<a id="zv-11"></a>
### ZV-11 · Integracija i preslušavanje · 1 / 1.5 / 2.5 p · Agent

- **Šta:** po dozvoli izvršiti pripremljene ciljane unit testove zvuka, sesija i migriranih potrošača, lint izmenjenih fajlova i proveru projekta; zatim jedan Chrome, sekvencijalno. Pripremiti mali scenario za blizu/srednje/daleko i levi/desni prolazak, sa istim profilom i udaljenošću u 2D/3D. Za tehničku proveru koristiti lažni backend i, gde je podržano, offline render za nivoe i prelaze; slušanje raditi u pravom browseru. Šire skupove i smoke pokretati samo uz posebno odobren obim.
- **Referenca:** [testovi upravljanog zvuka](../tests/unit/managedSound.test.js), [testovi zvuka](../tests/unit/sound.test.js), [TESTING](TESTING.md) i [pravila pokretanja](DOCS.md). Unit očekivanja ne služe kao dokaz da zvuk prijatno zvuči.
- **Gotovo kada:** zabeleženi su tačni rezultati dozvoljenih provera i preslušavanja: 1P ostaje kod levog topa, 2P menja perspektivu tek na smenu, blizu/daleko se jasno razlikuju, avion ne seče zvuk na ivici kadra, nema klika pri prelazu, petlja nastavlja fazu, više pucnjeva se ne prekida, pauza/izlazak/replay nemaju ostatke. Proveriti slušalice i stereo zvučnike; proveriti da mono izlaz ne izgubi događaj. Za svaki zahtev koji nije proveren napisati konkretno šta nedostaje.
- **Zamke:** slušanje sa isključenim sistemskim zvukom ili autoplay blokadom nije dokaz tihog snimka. Proveriti predaju zvuka posle povratka taba, zaključanog audio konteksta i sporog dekodiranja. Izmeriti broj stvarnih/virtuelnih glasova i stabilnost nakon više smena scena; limit podesiti prema nalazu, ne nagađanju.
- **Spoljno:** dozvola za pokretanje i dostupnost vlasnika/uređaja. Ako ih vlasnik odloži, agent predaje pripremljene scenarije i pošteno označava da runtime i miks nisu potvrđeni; ne pokreće ih sam.

<a id="zv-12"></a>
### ZV-12 · Uklanjanje stare putanje · 0.25 / 0.5 / 1 p · Agent

- **Šta:** tek posle migracije svih popisanih potrošača ukloniti stare ručne putanje i privremene adaptere. Ažurirati [arhitekturu](ARHITEKTURA.md), [uputstvo za provere](TESTING.md), [izvore snimaka](../assets/sounds/SOURCES.md) i ishod ovog plana; [uputstvo za provere](TESTING.md#ustanak-verification-limits) čuva ograničenja završne provere Ustanka. Zvuk koji nema prostorni položaj i dalje koristi isti backend kao neprostorni profil.
- **Referenca:** [stari helper](../core/io/sound.js), [ManagedSound](../core/io/ManagedSound.js), [SceneAudio](../core/io/SceneAudio.js) i ažurirani popis ZV-01. Jedan modul po odgovornosti; ne ostavljati stari helper samo zbog istorije ako nema korisnike.
- **Gotovo kada:** tekstualna pretraga svih produkcionih direktorijuma nalazi jedan dozvoljeni backend za stvaranje audio izvora, bez direktne reprodukcije koja zaobilazi vlasništvo i glavnu jačinu; svi potrošači imaju objašnjen profil. Dokumentacija razlikuje implementirano, potvrđeno testovima i odloženo. Nema automatskog commita.
- **Zamke:** brisanje plana ne briše odluke: ako se ovaj plan kasnije uklanja, trajni ugovor i izvore najpre preneti u postojeću autoritativnu dokumentaciju. Ne menjati očekivanja testova samo da sakriju pogrešno novo ponašanje.
- **Spoljno:** nikakva nova dozvola za commit se ne traži; vlasnik ga radi sam. Preostala neizvršena provera ostaje izričito navedena u ishodu.

## Otvorene odluke

**Vlasnik:** potvrda ili korekcija tehničkih predloga D1–D6 pri nalogu za implementaciju; izbor novih snimaka koji nedostaju; dozvola i obim izvršnih provera. Pravilo da je slušalac uvek igrač na tačnom položaju globalno je potvrđeno i ne pita se ponovo.

**Agent u ZV-01:** tačan popis ćutljivih izvora i njihovih radnji, postojeće skale svetova i mesta sa deljenim audio elementima. Ove tehničke podatke proveriti u kodu, ne prebacivati istraživanje na vlasnika.

## Rizici

| Rizik | Posledica | Postupak |
|---|---|---|
| Neusklađene svetske razmere | Isti profil zvuči drugačije po igri | Eksplicitna konverzija po sceni i isti referentni audio razmaci u proveri |
| Dve distance krive ili dva množenja glavne jačine | Pretiho, preglasno ili nemonotono slabljenje | Jedan proračun, jedna završna glavna jačina, provera matematičkog proizvoda |
| Vidljivost i dalje upravlja čujnošću | Avion se naglo pojavljuje/nestaje u zvuku | Čujnost prema dometu i stanju izvora, odvojeno od renderera |
| Teleport ili smena poteza ulazi u brzinu | Neprirodan skok tona | Posebne oznake smene igrača i teleporta; zaglađivanje samo izlaznog zvuka |
| Mnogo sličnih izvora | Preopterećenje, zagušen miks | Deljeni baferi, virtualizacija, prioriteti i ograničenje glasova po profilu |
| Kasno učitavanje ili promena igre | Stari rafal/govor počinje u novoj sceni | Identitet sesije, vremenski rok događaja i prekid čvorova stare scene |
| Loš snimak i prazni rubovi petlje | Klikovi i neubedljiv efekat i uz dobru matematiku | Kontrolisana priprema resursa i stvarno slušanje; ne popravljati povećanjem svega |
| Provere ostanu odložene | Nema dokaza da browser i miks odgovaraju planu | Jasno naveden status, pripremljeni scenariji i zasebna vlasnikova dozvola |

## Svesno odloženo

Akustički odjeci prostorija, prolaz kroz materijale, geometrijsko zaklanjanje, binauralno praćenje glave i kašnjenje svih zvukova nisu potrebni za prvu globalnu verziju. Ne uvoditi ih pod nazivom „realizam“ bez podataka o prostoru i odvojenog obima; zajednički položaji, udaljenost, filteri, Dopler i životni ciklus moraju prvo biti stabilni.

## Provera ovog plana

Izvorni kod i postojeća dokumentacija čitani su bez izvršavanja igre. Zbirovi rasporeda izračunati su iz navedenih procena za jednog sekvencijalnog izvršioca. Plan-checker, testovi, lint i browser nisu pokretani zbog važećeg ograničenja izvršnih provera; raspored nije predstavljen kao mehanički validiran.
