# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Art](#art)** | | | |
| 1 | [AR-P16](#ar-p16) | Precrtati art koji 2D igre još koriste neprecrtan | Codex | 🔄 In progress |
| 2 | [AR-P17](#ar-p17) | Precrtati 3D aktere u pixel art | Codex | 🔄 In progress |
| | **[Igre i ideje](#igre)** | | | |
| 3 | [IG-18](#ig-18) | Otpisani kao arkadna pucačina kroz četiri beogradske ulice | Codex: panorame; Claude: igra | 📋 TODO |
| 5 | [IG-29](#ig-29) | Dovršiti logor Crveni krst u Escape Concentration Camp | Codex, Claude | 🔄 In progress |
| 6 | [CK-01](#ck-01) | Crveni krst: uskladiti vidljivog lika, telo i stopala | Claude | 🔄 In progress |
| 7 | [CK-02](#ck-02) | Crveni krst: prave animacije, držanje cevi i prelazi | Claude | 🔄 In progress |
| 8 | [CK-03](#ck-03) | Crveni krst: prepoznatljivi logoraši i katalog | Codex | 📋 TODO |
| 9 | [CK-06](#ck-06) | Crveni krst: tlo, pozadina i zvuci po snegu | Codex: teren i pozadina; zvuci nedostaju | 📋 TODO |
| 10 | [CK-07](#ck-07) | Crveni krst: pregled celog proboja i regresije | Claude | 📋 TODO |
| 11 | [IG-31](#ig-31) | Dodati pruge i mostove u Warplane | Codex: modeli; Claude: igra | 📋 TODO |
| 12 | [IG-34](#ig-34) | Napraviti vernu scenu i igru opsade Kraljeva po dogovorenom scenariju | Vlasnik, Claude, Codex | 🔄 In progress |
| 13 | [IG-35](#ig-35-igre-na-telefonu) | Otkriti igre na telefonu posle merenja i optimizacije, kad su nivoi gotovi | Claude, vlasnik | 📋 TODO |
| 14 | [IG-36](#ig-36) | Ustanak: probati dvoboj minobacača umesto topova | Claude | 📋 TODO |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Odložene ideje, bez reda u tabeli, stoje u [Idejama za kasnije](#ideje-za-kasnije). Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze; sekcija koja ostane bez stavki briše se sa poslednjom, a veze ka njoj se preusmeravaju.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Plan je za agente: u njemu nema vlasnikovih pregleda, jer vlasnik gleda tek na kraju; stavka se zatvara kad je agentov deo urađen i proveren (vlasnik, 2026-11-26). Ranije završene provere ne ponavljati zbog reorganizacije plana.

## Art

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

<a id="ar-p16"></a>
### AR-P16 · Neprecrtan art u 2D igrama

Stare crteže koje 2D igre još koriste precrtati u istom stilu i meri, kao lossless WebP u [game-ready](../assets/images/game-ready). Akteri i vozila dele art između igre i kataloga. Nove slike povezati u igri, a stare ukloniti kada više nemaju potrošače.

**Precrtano i povezano.** [Partizanski čamac](../catalog.html#brodovi/partizanski-camac) ima precrtan trup, oštećenje i olupinu. [Betonski bunker](../catalog.html#artiljerija/bunker-do-trsta) koristi novi osnovni crtež, oštećenje i ruševinu u Do Trsta. [Kuća-bunker](../catalog.html#artiljerija/kuca-bunker) ima tri stepena oštećenja i [novog mitraljesca](../assets/images/game-ready/vojnici/mitraljezac-pixel-sprites.webp). [Fiat CR.42](../catalog.html#avioni/fiat-cr42) i [IMAM Ro.57](../catalog.html#avioni/imam-ro57) koriste nove crteže u Ustanku. U Neretvi Nemci koriste [precrtani rov](../assets/images/game-ready/polozaji/neretva/rov-prazan.webp), a četnici [gomilu kamenja](../assets/images/game-ready/polozaji/neretva/gomila-kamenja.webp). Do Trsta koristi [precrtanu crkvu](../assets/images/game-ready/scenery/crkva-do-trsta.webp). Nova [eksplozija](../assets/images/game-ready/efekti/eksplozija.webp) koristi se u Bunkeru, Čamcu, Franji Kluzu, Neretvi, Do Trsta i Visu. Precrtana [granata](../assets/images/game-ready/projektili/granata.webp) koristi se za zajednički prikaz projektila u letu i za ikonu municije u Franji Kluzu. Vis koristi precrtano [ostrvo](../assets/images/game-ready/scenery/vis/ostrvo.webp) tokom leta i [bazu](../assets/images/game-ready/scenery/vis/baza.webp) pri sletanju. Franjo Kluz koristi precrtanu [zgradu aerodroma](../assets/images/game-ready/scenery/franjo-kluz/aerodrom.webp).

| Slika | Igre |
|---|---|
| [Raketa](../assets/images/items/raketa.png) | Čamac |
| [Nagazna mina](../assets/images/items/nagazna.png) | Bunker |
| [Krv](../assets/images/sprites/efekti/krv-mala.png) | Bunker |
| [Plamen](../assets/images/plamen.gif) | Prikaz udara topovske granate, npr. Tenkići, Do Trsta i Ustanak |
| [Bomba](../assets/images/items/bomba.png) | Franjo Kluz, Neretva, Do Trsta, Vis |
| [Partizanska zastava](../assets/images/sprites/zastava.png) i [italijanska zastava](../assets/images/armies/talijani/vojnici/strelci/zastava.svg) | Ustanak, italijanska zastava i u Jablanici |
| [Ruševina](../assets/images/buildings/ruina.png), [šumarak](../assets/images/nature/shumarak.png), [žbun](../assets/images/nature/zbun.png) i [oblak](../assets/images/nature/oblak.gif) | Franjo Kluz; šumarak i u Do Trsta, oblak i u Visu |
| [Kuće](../assets/images/buildings/kuca-04.png) ([druga](../assets/images/buildings/kuca-07.png)) | Do Trsta |
| [Municija](../assets/images/items/municija.png) i [zdravlje](../assets/images/items/zdravlje.png) | Vis |
| [Plamen pucnja](../assets/images/pucanje.png) | Otpisani |

Van popisa su pozadine, korisnički interfejs i teksture 3D igara; zapisi olupina i propelera samo prepoznaju slike, pa nisu upotreba.

<a id="ar-p17"></a>
### AR-P17 · Precrtati 3D aktere u pixel art

Precrtati teksture svih 3D aktera, uključujući likove, vozila i opremu, da 2D i 3D art dele isti likovni stil. Borac sa Sutjeske je [odobreni uzor](ART.md#3d-pixel-art). Za svaki model primeniti [projektnu veštinu za 3D pixel art](../.agents/skills/game-actor-art-3d/SKILL.md).

Nemački strelac ima [probni Pixel art izgled](../catalog.html#drugi-svetski-rat-3d/nemacki-vojnik-3d/pixel-art) u katalogu. [Tekstura i procena troška](ART.md#nemacki-strelac-pixel-art).

<a id="igre"></a>
## Igre i ideje

<a id="ig-18"></a>
### IG-18 · Otpisani kao arkadna pucačina

Odluke vlasnika (2026-11-26): Otpisani postaju arkadna pucačina po uzoru na Operation Wolf, a Neretva ostaje nepokretna, jer je njena suština držanje položaja. Prizor sam klizi kroz ulicu, igrač ga ne pomera; Nemci iskaču iz prozora, kapija i iza ruševina. Etapa traje dok igrač ne obori zadati broj Nemaca. Od te igre se uzima mehanika, ne izgled.

Etape idu pravcem borbi za Beograd u oktobru 1944:

1. Bulevar kralja Aleksandra (kasnije Bulevar revolucije);
2. Terazije sa Palatom Albanijom;
3. Kalemegdan;
4. Savski most, završnica.

Neprijatelji su i tenkovi i oklopna vozila, koji bočno prelaze ulicu; koriste se bočni crteži nemačkih vozila iz projekta, a crta se samo ono što nedostaje. Igrač ima i ograničen broj ručnih bombi (desni klik ili posebno dugme na dodir): bomba obara grupu pešaka, a tenk traži dve ili tri. Bombe i municija dopunjuju se gađanjem sanduka. Bombe su izabrane jer su verodostojne za beogradske ulice i služe i protiv pešaka; vlasniku je svejedno, samo da se tenk može uništiti (2026-11-26).

- [ ] Codex: četiri crno-bele panorame u stilu [sadašnje pozadine](../assets/images/background/beograd-1944-crno-belo.webp), svaka široka tri do četiri ekrana (oko 5000 × 1024 px), sa zaklonima, prozorima i kapijama iz kojih Nemci iskaču.
- [ ] Codex: nacrtati neprijatelje koji nedostaju za nove etape u stilu [precrtanog strelca i stražara](ART.md#pešadija-i-posade).
- [ ] Claude: klizanje prizora, iskakanje Nemaca i etape, kad panorame stignu.

<a id="ig-29"></a>
### IG-29 · Logor Crveni krst u Escape Concentration Camp

Radnja (vlasnik, 2026-11-24): proboj iz nemačkog logora Crveni krst u Nišu, 12. februara 1942; tekst misije i naslov kartice su upisani. Okvir je u [KONTEKST](KONTEKST.md#escape-concentration-camp).

Proboj je dogovoren i logoraši su spremni. Po odluci vlasnika od 2026-11-25, [3D logoraš](../scenes/crveni-krst/PrisonerAvatar.js) počinje sa već otetom puškom. Uvod objašnjava da je pre početka nivoa savladao stražara. Tasterom F preuzima [oružje ostalih savladanih stražara](../scenes/crveni-krst/CampWeapons.js). Izlazak iz lavirinta dovoljan je za pobedu. [Test nivoa](../tests/unit/fpsCamp.test.js) pokriva početnu pušku, preuzimanje oružja i pobedu dok su svi stražari na mapi živi.

Stražar prvi put uzvikne „Halt!“ kad primeti logoraša. Trenutak uzvika pokriva [test nivoa](../tests/unit/fpsCamp.test.js).

Držanje tastera C uključuje šunjanje uz Mixamo klip `Crouched Walking` koji je preuzeo vlasnik. Lik se spušta i korača sporije i tiše. Puni zakloni zaklanjaju pogled, kretanje izvan čučnja može privući pogled stražara, a snop reflektora vraća domet opažanja čučnutog lika. [Test nivoa](../tests/unit/fpsCamp.test.js) pokriva položaj kamere, ponašanje stražara i proveru snopa.

Preostali rad je razložen na [CK-01](#ck-01)–[CK-07](#ck-07), prema pregledu ispod. Pomeranje šake i nasumične poze nisu potvrda da je ceo pokret prirodan.

Prerada menja betonski ambijent u logor; sneg, noć i straže ostaju. Početni predlog baraka i kula u uglovima korigovati prema [istraženom stanju](ISTORIJA.md#crveni-krst-12-februar-1942), a ne predstaviti kao potvrđen tlocrt. Teksture i modele izrađuje Codex, bez privremenog crteža u nivou.

Priprema je urađena: [reference sa poreklom](references/ww2-yu/crveni-krst/README.md) i [smernice za modele i teksture](ART.md#crveni-krst-priprema-3d-ambijenta). Preradu voditi prema [dogovorenom rasporedu i pravilima prepreka](KONTEKST.md#escape-concentration-camp): lavirint ostaje, a prolazi dobijaju prostornu namenu.

Prvi [paket arta](../assets/models/building/crveni-krst/README.md) povezan je u [katalogu](../catalog.html#scenografija-3d/sklop) i [igri](../index.html#crveni-krst). [Lokalni raspored](../scenes/crveni-krst/campLayout.js) čuva grananje i slepe prolaze oko ograđene zidane zgrade, sa jednim otvorenim dvorištem. [Sklop](../scenes/crveni-krst/CampEnvironment.js) povezuje žicu, pune zaklone, dvostruki obod, otvorenu izlaznu kapiju i dve kule sa reflektorima. Uslov pobede ostaje izlazak iz lavirinta, bez dodatnih obaveznih ciljeva.

Tehničke granice: zajednički `Maze` nije menjan. Mreža ima 8×8 polja razmaka 10 m, od kojih je osam rezervisano za objekat sa dvorištem; 56 prohodnih polja ostaje povezano. Početak (−35, −35), izlaz (35, 40) i prag pobede manji od 5 m su očuvani, kao i deset protivnika, dve prve pomoći i deset rekvizita. Žica blokira hod, a propušta pogled i metke za obe strane; zgrada, puni zakloni i rekviziti blokiraju i pogled i pogotke. Nitima i stubovima se dele instancirani sklopovi, dok puni zakloni ostaju obični mesh-evi zbog tragova pogodaka. [Ciljane provere](TESTING.md#crveni-krst--priprema-i-art) obuhvataju prohodnost, sudare, ponovni ulazak, pobedu bez ubijanja i oslobađanje novih resursa.

#### Kritički pregled umetnosti, animacije i prirodnosti

Pregledano 25. 11. 2026: radno stablo nad `efce37abab2afc3efba1365817a417b70abc795a`, sa lokalnim izmenama. Pregledani su kod, stvarni FBX pokreti i dva postojeća offline prikaza scenografije. **To nisu snimci nivoa**; slika kartice još prikazuje stari betonski lavirint. Browser nije pokretan: konačan kadar, deformacije u pokretu, čitljivost žice, osvetljenje i FPS ostaju za proveru u igri. [Dokazi i granice provere](TESTING.md#crveni-krst--priprema-i-art).

**Ocena:** zidana zgrada, žica i prigušena paleta daju smislenu osnovu, ali nivo još ima pokrete i ponašanje prototipa. Najpre rešiti položaj modela prema njegovom fizičkom telu, zatim radnje i odluke likova, pa završni izgled. Novi idle sam neće popraviti skretanje, preklapanje i izbor zaklona.

P1 je kvar položaja lika/igre; P2 potvrđen problem prirodnosti ili neispunjen likovni zahtev. „Proveriti” označava rizik ili predlog koji nije viđen u konačnom kadru.

| Nalaz | Dokaz i posledica | Korak |
|---|---|---|
| Proveriti · Stopala i kontakti pri prelazima | [Čučeći hod sada ostaje u mestu](../scenes/crveni-krst/CompanionModel.js#L15), uz zajedničku osnovu sa pravim `Crouching Idle`. Preostaje provera deformisanih stopala i odnosa tela/modela uz prepreke i pri promeni stava; samo stabilan koren ne dokazuje oslonac. | CK-01 |
| P2 · Borba nema proverenu vezu pokreta i pogotka | Cev koristi [kombinaciju mačem](../core3d/actor/derived/ww2/WorkerPipe.js#L4); pogodak na polovini radnje (0,87 s) poklapa se sa udarcem u snimku (0,91 s od 1,74 s). Nema povezane reakcije saborca na preživljen pogodak; smrt je `Dying` i iz čučnja. Tačan kontakt cevi i eventualno podizanje pri smrti treba pogledati u igri. | CK-02 |
| P2 · Odeća još nije identitet čoveka | [Trojica](../scenes/crveni-krst/CompanionModel.js#L9) imaju isti model i osnovno lice, različite visine/odeću, brkove kod jednog i nijansu kože. Potrebna je trajna prepoznatljivost i pri istoj pozi; ne praviti novog čoveka promenom oružja. | CK-03 |
| P2 · Podloga i efekti ne ostvaruju art ugovor | [Tlo](../scenes/crveni-krst/Main.js#L56) je jedna ponovljena snežna ravan, bez gaženih pravaca i podnožja iz [ART-a](ART.md#crveni-krst-priprema-3d-ambijenta). Nasumični dim i plamen na rekvizitima su uklonjeni; ostaje vatra na izlazu kao oznaka cilja. | CK-06 |
| Proveriti · Dubina, pozadina i reflektori | [Nebo je jedna boja sa maglom](../scenes/crveni-krst/Main.js#L50); mesečevo svetlo ne baca senke, a [reflektori](../scenes/crveni-krst/CampEnvironment.js) ih bacaju, pa snop staje na zidu kao i za stražu. Proveriti cenu dve mape senki i kontakt sa tlom i da li osvetljenost odgovara stvarnom opažanju straže. | CK-06 |
| P2 · Zvuk ne odgovara radnji i tlu | [Prikaz saboraca](../core3d/actor/characters/CharacterModel.js#L48) koristi korake po šljunku prema pređenom putu, u čučnju tiše kao kod igrača. Za korake po snegu i zamah cevi nema zvuka u projektu. Novi FBX sam ovo ne rešava. | CK-06 |
| Proveriti · Borba i čitljivost cilja | [Straža je nasumičan sastav koji luta](../scenes/crveni-krst/Main.js#L95). Smireno osmatranje, uzbuna, težina sa početnom puškom i više rasporeda nisu provereni kao celina. Završna poruka naglašava ubijene, a cilj je bekstvo. Predlog promene teksta podleže postojećem UI pravilu. | CK-07 |

#### Zahtevi za animacije

**Mixamo model:** postojeći radnik/logoraš `resistance-fighter`, sa istim skeletom kao u [Worker-u](../core3d/actor/derived/ww2/Worker.js#L9). Slede **engleski pojmovi za pretragu i opis radnje**, ne potvrđeni tačni naslovi u Mixamo biblioteci. Cev dodaje igra: birati desnu šaku pogodnu za jednoručni predmet, bez držanja nevidljivog pištolja i obavezne podrške drugom rukom.

| Red potrebe | Šta tražimo | Uslov izbora |
|---|---|---|
| Povezano u nivou; čeka vizuelnu proveru | [Crouching Idle](../assets/models/character/soldier/Crouching%20Idle.fbx) i [Crouch Idle](../assets/models/character/soldier/Crouch%20Idle.fbx) | Dva različita čučeća mirovanja, različiti početni izbori/faze/tempo i nezavisno menjanje tokom čekanja. Proveriti stopala, hvat cevi i spoj petlje; katalog još nema te radnje. |
| Povezano u nivou; čeka vizuelnu proveru | [Crouch Look Around Corner](../assets/models/character/soldier/Crouch%20Look%20Around%20Corner.fbx) | Osmatranje dok saborac miruje u zaklonu tokom zatišja, ne kao mirovanje na otvorenom. Nova vatra prekida osmatranje; fizičku blizinu ivice i položaj prema zaklonu još proveriti. |
| Povezano u nivou; čeka vizuelnu proveru | [Crouch To Stand](../assets/models/character/soldier/Crouch%20To%20Stand.fbx), unazad za spuštanje | Koristi se aktivni deo snimka, frejmovi 24–71 pri 30 fps; početno/završno čekanje je izostavljeno, horizontalni koren usklađen. Saborac zastane tokom prelaza i tek uspravan trči/udara; povratni prelaz koristi isti snimak unazad. Visina tela prati napredak; vizuelnu prirodnost obrnutog snimka proveriti pre nove nabavke. |
| Povezano u nivou | [One Hand Sword Combo](../core3d/actor/derived/ww2/WorkerPipe.js), uglađen na početku i kraju | Udarac cevi desnom rukom sa oporavkom. |
| Dopuna po potrebi | **Turn Left / Right In Place**, **Crouch Turn Left / Right** | Za velike okrete u mestu, ako ograničena brzina okreta i postojeće animacije ne budu dovoljne. |
| Dopuna po potrebi | **Crouching Hit Reaction**, **Crouch Flinch / Cower / Cover Head** | Prvo probati postojeće reakcije; nova animacija samo za nepokriven pogodak/zaštitu od neposredne vatre. |

**Već imamo — prvo isprobati:** `Running`, `Walk`, `Crouched Walking`, `Crouched Run`, `Standing Idle`, `Warrior Idle`, `Hit Reaction`, `Reaction`, `Crouch Death`, `Death Crouching Headshot Front`, `Dying` i `Standing React Death Backward`. Osnovni trk i čučeći hod već se koriste; horizontalno pomeranje korena hoda je uklonjeno, preostaje provera stopala i hvata cevi. `Crouched Run` je kandidat, nije automatski dobar za jednoručni predmet. Smrti proveriti prema stvarnom stavu i korenu, a headshot ne koristiti za svaku pogibiju. Za smirenu stražu prvo proveriti postojeći `Rifle Idle`.

**Predaja/prijem:** isti Mixamo skelet, dodatni FBX **Without Skin**, 30 fps; **In Place** gde postoji taj izbor. Sačuvati izvor, naziv i trim/postavke i proveriti pravo korišćenja. Mirovanja moraju imati prirodan spoj petlje; udarci/prelazi sačuvan zamah i završetak, bez prekratkog trimovanja. Prvo isprobati ceo model sa pričvršćenom cevi iz više uglova u katalogu: stopala, hvat prstiju, putanja cevi, koren, početak/kraj i trenutak dodira. Naziv klipa i kompatibilne kosti sami nisu potvrda da pokret odgovara nivou.

#### Obim i način rada

Plan vodi poboljšanje IG-29; povezivanje dostavljenog idle-a je započeti deo, ostale faze ostaju otvorene. Ostaju lavirint i istorijske granice, početna puška sa prihvaćenim 2D crtežom, tri saborca sa cevima i čučnjem kao osnovom, mogućnost njihove pogibije i pobeda izlaskom igrača. Ne uvoditi obavezno spasavanje grupe, novu grafičku tehniku ili obavezno šunjanje. Ne praviti commit. Rad držati u nivou; potreban zahvat u zajednički prikaz prvo obrazložiti i proveriti ostale potrošače.

Codex sprovodi korake; vlasnik bira/preuzima Mixamo klipove kao do sada. Tehnički završetak znači provere navedene uz korak; izgled zahteva snimak/prolaz stvarne igre. Procene su početni grubi okvir celih koraka **min / verovatno / max**, u poenima jednog izvođača (**1 p ≈ idealan radni dan**), bez čekanja resursa i pregleda; nisu ažurna procena preostalog rada ni obećani rok. Pravi idle-i i prelazi su već povezani, pa novu procenu zasnovati na stvarno preostalim proverama i dopunama.

<a id="ck-01"></a>
#### CK-01 · Položaj i stopala · 0.5 / 1 / 1.5 p · Claude

**Izmereno (2026-11-26):** u mirovanjima i osvrtanju stopala se pomeraju najviše 0,7 cm. Ustajanje iz čučnja ima snimljen korak napred od oko 37 cm; telo saborca sada pravi taj korak sa snimkom ([CompanionModel](../scenes/crveni-krst/CompanionModel.js), osim kroz zid), pa stopalo koje nosi težinu ostaje na mestu. **Preostaje:** spuštanje u čučanj (obrnut snimak ustajanja) i dalje vuče stopala oko 44 cm, jer bi korak unazad pomerao saborca sa njegovog mesta u grupi pri svakom zaustavljanju; rešenje je zaseban snimak spuštanja u mestu ili mesto u grupi koje računa sa tim korakom.

<a id="ck-02"></a>
#### CK-02 · Animacije i prelazi · 1 / 2 / 3 p · Claude

**Osnova je povezana:** dva stvarna čučeća mirovanja sa različitim fazama/tempom, osmatranje iz zaklona i prelaz ustajanja/spuštanja za svu trojicu. **Preostaje:** paket radnji prikazati u katalogu, vizuelno proveriti celu sekvencu sa cevi i proveriti da li postojeće reakcije pokrivaju pogodak; nove klipove vlasnik daje samo ako ne pokrivaju. Slučajan izbor sme birati samo stvarno dostupne radnje; opasnost i borba imaju prednost. **Gotovo kada:** 30 s čekanja i deset ponavljanja svakog prelaza sa cevi, iz više uglova, bez skoka položaja, pogrešnog hvata i identičnog grupnog ritma; pogodak/smrt mogu prekinuti čekanje i prelaz. **Zavisnost:** CK-01.

<a id="ck-03"></a>
#### CK-03 · Identitet i katalog · 0.5 / 1 / 2 p · Codex

**Rad:** razviti [Iliju, Petra i Jovana](../scenes/crveni-krst/CompanionModel.js#L9) kroz prepoznatljiva lica, odeću i siluetu; proveriti zimski izgled prema mogućnostima modela. Jedna kataloška stavka po čoveku, oprema i radnje su njegov izbor. **Gotovo kada:** trojica se razlikuju i u istoj pozi pod istim svetlom na 3–8 m; šaka obuhvata cev i predmet ne prolazi kroz telo tokom postojećeg trka/zamaha. Novi art ima poreklo. **Zavisnost:** postojeći model/teksture; ako geometrija ne dozvoljava traženu razliku, prvo utvrditi potreban zahvat umesto zamene celog stila.

<a id="ck-06"></a>
#### CK-06 · Ambijent i zvuk · 1 / 2 / 3 p · Codex: teren i pozadina; zvuci nedostaju

**Rad:** dovršiti [teren i svetlo](ART.md#crveni-krst-priprema-3d-ambijenta): gaženi pravci, podnožja, diskretna udaljena silueta ravničarskog/gradskog oboda i zgrada/kule/dvorište kao orijentiri. Reflektori bacaju senke i nasumični požari su uklonjeni (Claude, 2026-11-26); preostaje gustina detalja. Koraci po snegu i zvuci napora/udarca prate radnju, bez neprekidnog ponavljanja glasova. **Gotovo kada:** početak, prolazi, dvorište i izlaz čitljivi su stojeći/u čučnju, bez lebdenja, prejakog pozadinskog kontrasta i svetla koje pogrešno predstavlja opasnost. Uporediti cenu promena u istom kadru pre/posle. **Zavisnost:** postojeći paket i originalne dopune sa poreklom; Mixamo se ne čeka. Izgled potvrđuje stvarna igra, ne offline render; prihvaćen renderer i 2D puška ostaju.

<a id="ck-07"></a>
#### CK-07 · Proboj kao celina · 0.5 / 1 / 2 p · Claude

**Rad:** posle obaveznih faza pregledati jedan ceo proboj i objediniti nalaze pre nove runde doterivanja. Na nekoliko ponovljivih rasporeda proveriti čekanje, hod, sprint, usko grlo, udaljenu vatru, cev izbliza, ranjavanje/smrt, pauzu/nastavak i novi ulazak. **Gotovo kada:** jedan isti prolaz potvrđuje model/telo, sve radnje, grupu, čitljiv ambijent i prihvaćenu pušku; ciljani testovi i ESLint prolaze, FPS se meri u stvarnom rendereru. Pobeda je moguća bez ubijanja straže i bez svih saboraca. Nalaze vraćati u postojeće korake, ne u niz pojedinačnih ad hoc zahvata. **Zavisnost:** CK-01–06.

#### Redosled i zavisnosti

Jedan izvođač, tri prolaza: **osnova, identitet i animacije** (CK-01, CK-03, CK-02), **ambijent** (CK-06), pa **pregled celine** (CK-07). Dok se čeka preostali klip, nezavisna logika i ambijent mogu napredovati. Početna procena celog obima je **4,5 / 10 / 16,5 p**, plus nepoznato čekanje resursa/provere; ovo nije procena preostalog rada posle već izvršenih dopuna. Najveći rizici su hvat cevi, različiti početni položaji pokreta i cena senki: prvo jedan lik i probni kadar, zatim cela grupa.

Raspored je ugrađen u postojeći plan da se poštuje pravilo jednog dokumenta:

```json
{"waves":[{"name":"Osnova, identitet i animacije","sequential":["CK-01","CK-03","CK-02"]},{"name":"Ponasanje i ambijent","sequential":["CK-06"]},{"name":"Pregled celine","sequential":["CK-07"]}],"handoffs":[["CK-01","CK-02"],["CK-02","CK-07"],["CK-06","CK-07"]]}
```

**Otvoreno:** povezana mirovanja, osmatranje i prelazi čekaju vizuelni prijem sa cevi i prikaz u katalogu; vlasnik još treba da izabere pojedinačni udarac. Zasebno spuštanje u čučanj tražiti samo ako obrnuti snimak ustajanja ne izgleda prirodno. Dostupnost ostalih traženih radnji nije proverena u Mixamo biblioteci. Codex pre nove nabavke proverava postojeće reakcije, smrti i trčanja. Istorijske i već prihvaćene grafičke odluke ne otvarati ponovo radi ovog doterivanja.

<a id="ig-31"></a>
### IG-31 · Pruge i mostovi u Warplane

Warplane je operacija Ratweek 1944 ([okvir](KONTEKST.md#warplane)) i nivo o bombardovanju: igrač bira samo bombarder (vlasnik, 2026-11-26). Igrač bombarduje sve nemačko, a sada su u igri samo fabrike. Dodati pruge i mostove, koje je Ratweek najviše gađao i koje navodi izveštaj nivoa; modele crta Codex. Inspiracija za art tla iz vazduha: [gusti grad sa starog plana](../assets/images/background/grad.png), ulice i blokovi kuća viđeni odozgo. Kontekst iz rata: [saveznička bombardovanja Kraljeva i Beograda 1944](references/ww2-yu/bombardovanje-1944/README.md).

<a id="ig-34"></a>
### IG-34 · Scenario opsade Kraljeva

Dovršiti [Siege of Kraljevo](../scenes/3d-tank/Main.js) prema dogovorenom scenariju proboja do centra grada. Prvi raspored i uslovi pobede/poraza već su povezani; preostaju pregled i doterivanje scene, odgovarajući modeli i ponašanje prema opisu ispod.

Oslonci iz [okvira](KONTEKST.md#demolish-barricades): opsada je trajala od 9. do 31. oktobra 1941, a grad su zajedno opsedali partizani i četnici. Nemački garnizon branio se u gradu, a Nemci su od 15. do 20. oktobra u odmazdi streljali oko 2.000 stanovnika. U završnom napadu 31. oktobra dejstvovala su dva zaplenjena tenka, što se slavi kao Dan oklopnih jedinica. Igrač vozi [Hotchkiss H35](../core3d/actor/derived/Hotchkiss.js).

Odluka vlasnika (2026-11-25): igrač može da pobedi, a jedini uslov pobede je proboj nemačke odbrane. Odbrana je utvrđena i proboj je težak. Prvo se pravi verna scena, pa tek onda igra. Tok: drum od Čačka, prvi pojas je utvrđena Ratarska škola (rovovi, žica, mitraljezi), drugi pojas ulica sa barikadama, a pobeda je kad tenk stigne do centra grada. Tenk ruši mitraljeska gnezda, nemački top i barikade koji kose pešadiju; bombaške grupe idu uz njega, i ako svi pešaci izginu, proboj je propao (31. oktobra tenkovi su se povukli baš zato što su ostali bez pešadije). Igrač vozi jedini tenk. Prate ga tri partizana i dva četnika.

Teren i objekti po izvorima ([Opsada Kraljeva](https://sr.wikipedia.org/sr-el/Opsada_Kraljeva), [znaci.org](https://znaci.org/odrednica.php?slug=opsada-kraljeva-1941)):

- **Teren:** ravna dolina na ušću Ibra u Zapadnu Moravu. Ustanička artiljerija stajala je na Ružića brdu i u Sirči.
- **Pravac napada:** napadi su išli drumovima Čačak–Kraljevo i Raška–Kraljevo, a 31. oktobra istim pravcem, noću.
- **Nemačka uporišta:** Ratarska (poljoprivredna) škola na ulazu bila je jako uporište; tu je poginuo Bojović. Uporišta su bila i železnička radionica (Fabrika vagona) sa lokomotivskom halom, stanica i aerodrom.
- **Centar:** sud i Spomenik srpskim ratnicima na trgu, dokle su 31. oktobra stigli tenkovi i Uzelčeva Četa smrti.
- **Garnizon:** oko 3.000 Nemaca, sa tenkovima, teškom artiljerijom i avijacijom.
- **Ishod 31. oktobra:** tenkovi, praćeni bombaškim grupama, probili su se do centra, ali su se bez pešadije povukli.
- **Nema u izvorima:** bunkeri, rovovi, žica, mitraljeska gnezda i tačne ulice. Za njih proveriti izveštaje 717. divizije na znaci.org.

Prva scena (2026-11-25, [raspored](../scenes/3d-tank/kraljevo.js)): drum od Čačka, žica preko druma, rov od džakova sa dva mitraljeska gnezda, bunker i top. Uz drum je škola, zatim ulica sa dve barikade i kuća koja gori, pa kružni trg sa spomenikom Milutinu. Nemci drže položaje okrenuti ka drumu. Uz drum od Čačka do žice stoji drvored [lipa](../core3d/actor/nature/Tree.js) (2026-11-26). Kuće imaju postojeće fasade gradskih zgrada; Ratarska škola je „Gradska zgrada“ iz [kuća grada](../core3d/actor/buildings/TownHouse.js), a na trgu je [Spomenik srpskim ratnicima](../assets/models/building/monument/milutin.glb). Pobeda je kad tenk stigne do centra grada (trga), a poraz kad izginu svi saborci; vreme se ne meri, jer bitka može trajati i satima. Logika igre (vlasnik, 2026-11-25): tenk mora prvo da pripremi teren. Ukopani Nemci dobacuju dalje od saboraca (mitraljez 55 m, puška 45 m, saborci 40 m), a tenkovski top dalje od svih; ako tenk samo projuri, saborci uđu u vatru i uglavnom izginu, a ako prvo izdaleka gađa položaje, otvara im put ([vrednosti](../scenes/3d-tank/kraljevo.js)).


Gusenice Hotchkissa stoje dok tenk vozi (vlasnik, 2026-11-25). Predlog: tekstura gusenice klizi duž nje brzinom svoje strane, različito pri skretanju i unazad u suprotnom smeru. Provereno (2026-11-25): gusenice su zasebni delovi `track-left` i `track-right` sa svojim materijalom, ali je tekstura atlas, pa svaki članak uzima drugi deo slike i klizanje teksture ne radi. Zato Codex [modelu](../assets/models/tank/hotchkiss-h35.glb) zamenjuje gusenice jednostavnim prstenom sa teksturom članaka razvučenom duž prstena, pod istim imenima; agent zatim pomera teksturu. Točkovi hodnog dela su jedan komad sa trupom; mogu se izdvojiti kao kod lokomotive, ali se iza gusenica jedva vide.

### IG-35 · Igre na telefonu

Radi se na kraju, kad su nivoi gotovi (vlasnik, 2026-11-26). Na početnoj strani su sakrivene na telefonu (`hide-on-mobile` u [index.html](../index.html)): Ustanak, Crveni krst, Aerodrom, Tenkići i Do Trsta. FPS igre od 2026-11-26 imaju komande za dodir (prevlačenje za pogled, strelice, pucanje, a u Crvenom krstu još šunjanje i uzimanje oružja), pa ih koči još samo brzina. Pre svakog otključavanja izmeriti kadrove i broj poziva za crtanje u igri na usporenom procesoru (Chrome, 4× sporije).

- **Crveni krst i Aerodrom:** izmeriti; ako drže kadrove, otkriti ih na telefonu.
- **Tenkići:** i dvojica igraju na jednom telefonu, naizmenično istim komandama na dodir (vlasnik, 2026-11-26); proveriti da dugmad vode igrača koji je na potezu, pa otkriti oba načina.
- **Ustanak:** igra za dvojicu traži tastaturu; proveriti da li igra protiv računara ima sve komande na dodir, pa otkriti samo nju.
- **Do Trsta:** utvrditi zašto je sakrivena, pa rešiti uzrok.
- **Sve 3D igre:** na telefonu ograničiti gustinu piksela platna (na primer najviše 1.5), jer ekran od 3× crta devet puta više piksela.

<a id="ig-36"></a>
### IG-36 · Ustanak

Ideja za probu (vlasnik, 2026-11-26): u Ustanku dvoboj [italijanskih minobacača](../assets/images/armies/talijani/artiljerija/bacac-posada-01.png) umesto topova, jer bi mina letela duže, visokim lukom.

## Ideje za kasnije

- **Čamac:** dodatni desanti na Brač, Mljet i Korčulu ([kontekst](KONTEKST.md#čamac)), uz istorijsku proveru.
- **Battle for Jablanica:** kampanja kroz Prozor, Ramu i Jablanicu, možda i zasedu kod Drežnice, sa kolonom kamiona koja se probija putem uz reku; svaka etapa sa svojim događajem ([istorijske granice](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica)).
