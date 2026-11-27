# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Vlasnik](#vlasnik)** | | | |
| 1 | [VL-01](#vl-01) | Pronaći modele koje igre čekaju | Vlasnik | 📋 TODO |
| | **[Art](#art)** | | | |
| 2 | [AR-P16](#ar-p16) | Precrtati art koji 2D igre još koriste neprecrtan | Codex | 🔄 In progress |
| 3 | [AR-P17](#ar-p17) | Precrtati 3D aktere u pixel art | Codex | 🔄 In progress |
| 4 | [AR-P18](#ar-p18) | Jedan komplet pixel art UI ikonica i jedan žeton | Codex, Claude | 📋 TODO |
| | **[Igre i ideje](#igre)** | | | |
| 5 | [IG-18](#ig-18) | Otpisani kao arkadna pucačina kroz četiri beogradske ulice | Claude | 🔄 In progress |
| 6 | [IG-29](#ig-29) | Dovršiti logor Crveni krst u Escape Concentration Camp | Codex, Claude | 🔄 In progress |
| 7 | [CK-01](#ck-01) | Crveni krst: uskladiti vidljivog lika, telo i stopala | Claude | 🔄 In progress |
| 8 | [CK-02](#ck-02) | Crveni krst: prave animacije i prelazi | Claude | 🔄 In progress |
| 9 | [CK-03](#ck-03) | Crveni krst: prepoznatljivi logoraši i katalog | Codex | 📋 TODO |
| 10 | [CK-06](#ck-06) | Crveni krst: tlo, pozadina i zvuci po snegu | Codex: teren i pozadina; Claude: zvuci | 📋 TODO |
| 11 | [CK-07](#ck-07) | Crveni krst: pregled celog proboja i regresije | Claude | 📋 TODO |
| 12 | [IG-31](#ig-31) | Dodati pruge i mostove u Warplane | Claude | 📋 TODO |
| 13 | [IG-34](#ig-34) | Napraviti vernu scenu i igru opsade Kraljeva po dogovorenom scenariju | Vlasnik, Claude, Codex | 🔄 In progress |
| 14 | [IG-35](#ig-35) | Otkriti igre na telefonu posle merenja i optimizacije, kad su nivoi gotovi | Claude, vlasnik | 📋 TODO |
| 15 | [IG-37](#ig-37) | Ustanak: italijanski strelac naspram partizanskog | Codex, Claude | 📋 TODO |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Odložene ideje, bez reda u tabeli, stoje u [Idejama za kasnije](#ideje-za-kasnije). Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze; sekcija koja ostane bez stavki briše se sa poslednjom, a veze ka njoj se preusmeravaju.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Plan je za agente: u njemu nema vlasnikovih pregleda, jer vlasnik gleda tek na kraju; stavka se zatvara kad je agentov deo urađen i proveren (vlasnik, 2026-11-26). Ranije završene provere ne ponavljati zbog reorganizacije plana.

- [x] Prošli ciljani testovi kataloga, nemačkog mitraljesca i pogodaka barjaktara i posada.

<a id="vlasnik"></a>
## Vlasnik

<a id="vl-01"></a>
### VL-01 · Šta vlasnik traži

Ovo je jedini spisak onoga što vlasnik nalazi i preuzima; stavke za koje služi samo vode ovamo. Novi 3D modeli dolaze od vlasnika, ne od Codexa (vlasnik, 2026-11-27).

- [ ] 3D modeli pravoslavne crkve i zgrade suda iz međuratne Srbije, za trg u Kraljevu. Za [IG-34](#ig-34).
- [ ] 3D model vrbe, za obale Morave u Kraljevu. Za [IG-34](#ig-34).

## Art

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

<a id="ar-p16"></a>
### AR-P16 · Neprecrtan art u 2D igrama

Stare crteže koje 2D igre još koriste precrtati u istom stilu i meri, kao lossless WebP u [game-ready](../assets/images/game-ready). Akteri i vozila dele art između igre i kataloga. Nove slike povezati u igri, a stare ukloniti kada više nemaju potrošače.

Redosled precrtavanja (vlasnik, 2026-11-27): prvo akteri, neprijatelji, vozila i ono što nose, zatim zgrade i velika scenografija, a sitni predmeti i efekti na kraju.

| Prioritet | Slika | Igre |
|---|---|---|
| Visok | [Partizanska zastava](../assets/images/sprites/zastava.png) i [italijanska zastava](../assets/images/armies/talijani/vojnici/strelci/zastava.svg), koje nose zastavnici | Ustanak, italijanska zastava i u Jablanici |
| Srednji | [Žbun](../assets/images/nature/zbun.png) i [oblak](../assets/images/nature/oblak.gif) | Franjo Kluz; oblak i u Visu |
| Srednji | [More](../assets/images/textures/okean.gif) koje klizi ispod aviona | Vis |
| Srednji | [Asfalt piste](../assets/images/textures/terrain/asphalt.jpg) partizanskog aerodroma | Franjo Kluz |
| Srednji | [Betonski pod](../assets/images/textures/terrain/beton.gif) | Bunker |
| Srednji | [Trava](../assets/images/textures/terrain/grass.jpg) bojišta | The Germans Advance |
| Nizak | [Nagazna mina](../assets/images/items/nagazna.png) | Bunker |
| Nizak | [Bomba](../assets/images/items/bomba.png) | Franjo Kluz, Neretva, Do Trsta, Vis |
| Nizak | [Raketa](../assets/images/items/raketa.png) | Čamac |
| Nizak | [Municija](../assets/images/items/municija.png) i [zdravlje](../assets/images/items/zdravlje.png) | Vis |
| Nizak | [Plamen](../assets/images/plamen.gif) | Prikaz udara topovske granate, npr. Tenkići, Do Trsta i Ustanak |
| Nizak | [Plamen pucnja](../assets/images/pucanje.png) | Otpisani |
| Nizak | [Krv](../assets/images/sprites/efekti/krv-mala.png) | Bunker |

Popis je proveren po svim 2D nivoima, praćenjem uvoza od svake scene (2026-11-27). Van popisa su pozadine, korisnički interfejs i teksture 3D igara; zapisi olupina i propelera samo prepoznaju slike, pa nisu upotreba.

<a id="ar-p17"></a>
### AR-P17 · Precrtati 3D aktere u pixel art

Precrtati teksture svih 3D aktera, uključujući likove, vozila i opremu, da 2D i 3D art dele isti likovni stil. Koča je [odobreni uzor](ART.md#3d-pixel-art). Za svaki model primeniti [projektnu veštinu za 3D pixel art](../.agents/skills/game-actor-art-3d/SKILL.md).

Redosled precrtavanja (vlasnik, 2026-11-27): prvo partizani, pa ostali akteri i vozila, zatim zgrade i velika scenografija, a sitni rekviziti na kraju.

| Prioritet | Šta |
|---|---|
| Visok | Partizani: [Sava · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/partizan-jednostavan-model-3d/pixel-art) je podrazumevani prikaz u 3D katalogu. Ostaju druge varijacije i borci pokreta otpora. |
| Visok | Nemci: SS vojnik, oficir, vojnik s teškom opremom, bacač plamena i nacistički agent |
| Visok | Četnici (strelac i sa šubarom) i [logoraši](../pages/catalog.html#drugi-svetski-rat-3d/logoras-ilija) |
| Visok | Vozila i oruđa: Hotchkiss H35, Renault FT, poljski top i minobacač sa posadom |
| Visok | Avioni Warplane-a: ratni avion, B-17, B-24, B-25, Bf 109 i Spitfire |
| Srednji | Zgrade i velika scenografija: kuće grada (Drvar, škola u Kraljevu), crkva u Drvaru, logor Crveni krst, betonski bunker i spomenik Milutinu |
| Nizak | Rekviziti: džakovi, bure, sanduci, kamioni i olupine, ruševine u Drvaru |

<a id="ar-p18"></a>
### AR-P18 · Jedan komplet UI ikonica

Ikonice su danas mešavina emodžija, koje sistem crta u boji i drugačije na svakom uređaju, i jednobojnih znakova iz rezervnog fonta, koji nisu centrirani. Ista ikonica stoji za različite radnje (🔥 za start i nastavak, 💥 za pucanj i specijalni napad), neke ne pripadaju igri (mač za napad i u igrama sa puškama, svemirska raketa), a novčanik na naslovnoj i naplativa dugmad imaju dva različita novčića (vlasnik, 2026-11-27).

- [ ] Codex: jedan atlas pixel art ikonica iste veličine, svaka radnja sa svojom: start i nastavak ▶, pauza, meni, podešavanja, nazad, ponovo, pobeda, poraz; na dodir strelice, skok, pucanj (nišan), napad iz blizine (kundak), specijalni napad, bomba, ratna raketa, luping, šunjanje i uzimanje; i brojači u HUD-u (život, gorivo).
- [ ] Claude: povezati atlas preko [icons.js](../core/io/icons.js), koji ostaje jedini izvor značenja, u prozorima, na dugmadi na dodir i u brojačima HUD-a; ukloniti emodžije i prikazati komplet na [UI stranici](../pages/ui.html).

<a id="igre"></a>
## Igre i ideje

<a id="ig-18"></a>
### IG-18 · Otpisani kao arkadna pucačina

Odluke vlasnika i pravila igre su u [KONTEKST](KONTEKST.md#otpisani).

- [ ] Claude: natpis etape pri prelasku u novu ulicu; tekst čeka vlasnikovo odobrenje.
- [ ] Claude: pogledati u igri [T-34 Crvene armije](../scenes/otpisani/ReliefTank.js) (pucanje, eksplozije na Nemcima, prolaz) i doterati vreme dolaska.
- [ ] Claude: pogledati u igri pogodak [komandira u kupoli Panzera](../scenes/otpisani/CrossingTank.js) i završnu pozu preko ivice kupole dok tenk nastavlja da vozi.

<a id="ig-29"></a>
### IG-29 · Logor Crveni krst u Escape Concentration Camp

Radnja (vlasnik, 2026-11-24): proboj iz nemačkog logora Crveni krst u Nišu, 12. februara 1942; tekst misije i naslov kartice su upisani. Okvir je u [KONTEKST](KONTEKST.md#escape-concentration-camp).

Proboj je dogovoren i logoraši su spremni. Po odluci vlasnika od 2026-11-25, [3D logoraš](../scenes/crveni-krst/PrisonerAvatar.js) počinje sa već otetom puškom. Uvod objašnjava da je pre početka nivoa savladao stražara. Tasterom F preuzima [oružje ostalih savladanih stražara](../scenes/crveni-krst/CampWeapons.js). Izlazak iz lavirinta dovoljan je za pobedu. [Test nivoa](../tests/unit/fpsCamp.test.js) pokriva početnu pušku, preuzimanje oružja i pobedu dok su svi stražari na mapi živi.

Stražar prvi put uzvikne „Halt!“ kad primeti logoraša. Trenutak uzvika pokriva [test nivoa](../tests/unit/fpsCamp.test.js).

Držanje tastera C uključuje šunjanje uz Mixamo klip `Crouched Walking` koji je preuzeo vlasnik. Lik se spušta i korača sporije i tiše. Puni zakloni zaklanjaju pogled, kretanje izvan čučnja može privući pogled stražara, a snop reflektora vraća domet opažanja čučnutog lika. [Test nivoa](../tests/unit/fpsCamp.test.js) pokriva položaj kamere, ponašanje stražara i proveru snopa.

Preostali rad je razložen na [CK-01](#ck-01)–[CK-07](#ck-07), prema pregledu ispod. Pomeranje šake i nasumične poze nisu potvrda da je ceo pokret prirodan.

Prerada menja betonski ambijent u logor; sneg, noć i straže ostaju. Početni predlog baraka i kula u uglovima korigovati prema [istraženom stanju](ISTORIJA.md#crveni-krst-12-februar-1942), a ne predstaviti kao potvrđen tlocrt. Teksture i modele izrađuje Codex, bez privremenog crteža u nivou.

Priprema je urađena: [reference sa poreklom](references/ww2-yu/crveni-krst/README.md) i [smernice za modele i teksture](ART.md#crveni-krst-priprema-3d-ambijenta). Preradu voditi prema [dogovorenom rasporedu i pravilima prepreka](KONTEKST.md#escape-concentration-camp): lavirint ostaje, a prolazi dobijaju prostornu namenu.

Prvi [paket arta](../assets/models/building/crveni-krst/README.md) povezan je u [katalogu](../pages/catalog.html#scenografija-3d/sklop) i [igri](../index.html#crveni-krst). [Lokalni raspored](../scenes/crveni-krst/campLayout.js) čuva grananje i slepe prolaze oko ograđene zidane zgrade, sa jednim otvorenim dvorištem. [Sklop](../scenes/crveni-krst/CampEnvironment.js) povezuje žicu, pune zaklone, dvostruki obod, otvorenu izlaznu kapiju i dve kule sa reflektorima. Uslov pobede ostaje izlazak iz lavirinta, bez dodatnih obaveznih ciljeva.

Tehničke granice: zajednički `Maze` nije menjan. Mreža ima 8×8 polja razmaka 10 m, od kojih je osam rezervisano za objekat sa dvorištem; 56 prohodnih polja ostaje povezano. Početak (−35, −35), izlaz (35, 40) i prag pobede manji od 5 m su očuvani, kao i deset protivnika, dve prve pomoći i deset rekvizita. Žica blokira hod, a propušta pogled i metke za obe strane; zgrada, puni zakloni i rekviziti blokiraju i pogled i pogotke. Nitima i stubovima se dele instancirani sklopovi, dok puni zakloni ostaju obični mesh-evi zbog tragova pogodaka. [Ciljane provere](TESTING.md#crveni-krst--priprema-i-art) obuhvataju prohodnost, sudare, ponovni ulazak, pobedu bez ubijanja i oslobađanje novih resursa.

#### Kritički pregled umetnosti, animacije i prirodnosti

Pregledano 25. 11. 2026: radno stablo nad `efce37abab2afc3efba1365817a417b70abc795a`, sa lokalnim izmenama. Pregledani su kod, stvarni FBX pokreti i dva postojeća offline prikaza scenografije. **To nisu snimci nivoa**; slika kartice još prikazuje stari betonski lavirint. Browser nije pokretan: konačan kadar, deformacije u pokretu, čitljivost žice, osvetljenje i FPS ostaju za proveru u igri. [Dokazi i granice provere](TESTING.md#crveni-krst--priprema-i-art).

**Ocena:** zidana zgrada, žica i prigušena paleta daju smislenu osnovu, ali nivo još ima pokrete i ponašanje prototipa. Najpre rešiti položaj modela prema njegovom fizičkom telu, zatim radnje i odluke likova, pa završni izgled. Novi idle sam neće popraviti skretanje, preklapanje i izbor zaklona.

P1 je kvar položaja lika/igre; P2 potvrđen problem prirodnosti ili neispunjen likovni zahtev. „Proveriti” označava rizik ili predlog koji nije viđen u konačnom kadru.

| Nalaz | Dokaz i posledica | Korak |
|---|---|---|
| Proveriti · Stopala i kontakti pri prelazima | [Čučeći hod sada ostaje u mestu](../core3d/actor/derived/ww2/Prisoner.js), uz zajedničku osnovu sa pravim `Crouching Idle`. Preostaje provera deformisanih stopala i odnosa tela/modela uz prepreke i pri promeni stava; samo stabilan koren ne dokazuje oslonac. | CK-01 |
| P2 · Pogodak bez reakcije | Saborac spao ispod pola zdravlja stoji kao ranjen (`Injured Idle`), ali trenutne reakcije na preživljen pogodak nema; smrt je `Dying` i iz čučnja. Eventualno podizanje pri smrti treba pogledati u igri. | CK-02 |
| P2 · Odeća još nije identitet čoveka | [Trojica](../core3d/actor/derived/ww2/Prisoner.js) imaju isti model i osnovno lice, različite visine/odeću, brkove kod jednog i nijansu kože. Potrebna je trajna prepoznatljivost i pri istoj pozi; ne praviti novog čoveka promenom oružja. | CK-03 |
| P2 · Podloga i efekti ne ostvaruju art ugovor | [Tlo](../scenes/crveni-krst/Main.js#L56) je jedna ponovljena snežna ravan, bez gaženih pravaca i podnožja iz [ART-a](ART.md#crveni-krst-priprema-3d-ambijenta). Nasumični dim i plamen na rekvizitima su uklonjeni; ostaje vatra na izlazu kao oznaka cilja. | CK-06 |
| Proveriti · Dubina, pozadina i reflektori | [Nebo je jedna boja sa maglom](../scenes/crveni-krst/Main.js#L50); mesečevo svetlo ne baca senke, a [reflektori](../scenes/crveni-krst/CampEnvironment.js) ih bacaju, pa snop staje na zidu kao i za stražu. Proveriti cenu dve mape senki i kontakt sa tlom i da li osvetljenost odgovara stvarnom opažanju straže. | CK-06 |
| P2 · Zvuk ne odgovara radnji | Igrač, saborci i straža koračaju po snegu, u čučnju tiše. Zvuka napora nema. | CK-06 |
| Proveriti · Borba i čitljivost cilja | [Straža je nasumičan sastav koji luta](../scenes/crveni-krst/Main.js#L95). Smireno osmatranje, uzbuna, težina sa početnom puškom i više rasporeda nisu provereni kao celina. Završna poruka naglašava ubijene, a cilj je bekstvo. Predlog promene teksta podleže postojećem UI pravilu. | CK-07 |

#### Zahtevi za animacije

**Mixamo model:** postojeći radnik/logoraš `resistance-fighter`, sa istim skeletom kao u [Worker-u](../core3d/actor/derived/ww2/Worker.js#L9). Slede **engleski pojmovi za pretragu i opis radnje**, ne potvrđeni tačni naslovi u Mixamo biblioteci.

| Red potrebe | Šta tražimo | Uslov izbora |
|---|---|---|
| Povezano u nivou; čeka vizuelnu proveru | [Crouching Idle](../assets/models/character/soldier/Crouching%20Idle.fbx) i [Crouch Idle](../assets/models/character/soldier/Crouch%20Idle.fbx) | Dva različita čučeća mirovanja, različiti početni izbori/faze/tempo i nezavisno menjanje tokom čekanja. Proveriti stopala i spoj petlje. |
| Povezano u nivou; čeka vizuelnu proveru | [Crouch Look Around Corner](../assets/models/character/soldier/Crouch%20Look%20Around%20Corner.fbx) | Osmatranje dok saborac miruje u zaklonu tokom zatišja, ne kao mirovanje na otvorenom. Nova vatra prekida osmatranje; fizičku blizinu ivice i položaj prema zaklonu još proveriti. |
| Povezano u nivou; čeka vizuelnu proveru | [Crouch To Stand](../assets/models/character/soldier/Crouch%20To%20Stand.fbx) i [Standing To Crouched](../assets/models/character/soldier/Standing%20To%20Crouched.fbx) | Ustajanje koristi aktivni deo snimka, frejmovi 24–71 pri 30 fps, a spuštanje ceo snimak od 0,63 s, koji počinje iz stava [Idle](../assets/models/character/soldier/Idle.fbx) i završava se u `Crouching Idle`. Saborac zastane tokom prelaza i tek uspravan trči. Visina tela prati napredak. |
| Dopuna po potrebi | **Turn Left / Right In Place**, **Crouch Turn Left / Right** | Za velike okrete u mestu, ako ograničena brzina okreta i postojeće animacije ne budu dovoljne. |
| Dopuna po potrebi | **Crouching Hit Reaction**, **Crouch Flinch / Cower / Cover Head** | Prvo probati postojeće reakcije; nova animacija samo za nepokriven pogodak/zaštitu od neposredne vatre. |

**Već imamo — prvo isprobati:** `Running`, `Walk`, `Crouched Walking`, `Crouched Run`, `Standing Idle`, `Warrior Idle`, `Hit Reaction`, `Reaction`, `Crouch Death`, `Death Crouching Headshot Front`, `Dying` i `Standing React Death Backward`. Osnovni trk i čučeći hod već se koriste; horizontalno pomeranje korena hoda je uklonjeno, preostaje provera stopala. `Crouched Run` je kandidat. Smrti proveriti prema stvarnom stavu i korenu, a headshot ne koristiti za svaku pogibiju. Za smirenu stražu prvo proveriti postojeći `Rifle Idle`.

**Predaja/prijem:** isti Mixamo skelet, dodatni FBX **Without Skin**, 30 fps; **In Place** gde postoji taj izbor. Sačuvati izvor, naziv i trim/postavke i proveriti pravo korišćenja. Mirovanja moraju imati prirodan spoj petlje; prelazi sačuvan pokret i završetak, bez prekratkog trimovanja. Prvo isprobati ceo model iz više uglova u katalogu: stopala, koren, početak i kraj. Naziv klipa i kompatibilne kosti sami nisu potvrda da pokret odgovara nivou.

#### Obim i način rada

Plan vodi poboljšanje IG-29; povezivanje dostavljenog idle-a je započeti deo, ostale faze ostaju otvorene. Ostaju lavirint i istorijske granice, početna puška sa prihvaćenim 2D crtežom, tri saborca sa čučnjem kao osnovom, mogućnost njihove pogibije i pobeda izlaskom igrača. Ne uvoditi obavezno spasavanje grupe, novu grafičku tehniku ili obavezno šunjanje. Ne praviti commit. Rad držati u nivou; potreban zahvat u zajednički prikaz prvo obrazložiti i proveriti ostale potrošače.

Codex sprovodi korake; vlasnik bira/preuzima Mixamo klipove kao do sada. Tehnički završetak znači provere navedene uz korak; izgled zahteva snimak/prolaz stvarne igre. Procene su početni grubi okvir celih koraka **min / verovatno / max**, u poenima jednog izvođača (**1 p ≈ idealan radni dan**), bez čekanja resursa i pregleda; nisu ažurna procena preostalog rada ni obećani rok. Pravi idle-i i prelazi su već povezani, pa novu procenu zasnovati na stvarno preostalim proverama i dopunama.

<a id="ck-01"></a>
#### CK-01 · Položaj i stopala · 0.5 / 1 / 1.5 p · Claude

**Izmereno (2026-11-27):** u mirovanjima i osvrtanju stopala se pomeraju najviše 0,7 cm. Ustajanje iz čučnja ima snimljen korak napred od 25 cm, a spuštanje korak nazad od 20 cm; telo saborca pravi oba koraka sa snimkom ([prikaz logoraša](../core3d/actor/derived/ww2/Prisoner.js), osim kroz zid), pa stopalo koje nosi težinu ostaje na mestu, a saborac posle ustajanja i spuštanja ostaje na svom mestu u grupi.

- [ ] Claude: u igri pogledati stopala pri prelazima i uz prepreke.

<a id="ck-02"></a>
#### CK-02 · Animacije i prelazi · 1 / 2 / 3 p · Claude

**Osnova je povezana:** dva stvarna čučeća mirovanja sa različitim fazama/tempom, osmatranje iz zaklona i prelaz ustajanja/spuštanja za svu trojicu. Radnje su u katalogu, po stavka za [Iliju](../pages/catalog.html#drugi-svetski-rat-3d/logoras-ilija), Petra i Jovana: čučanj i ustajanje kroz snimljeni prelaz, odmor i osmatranje. **Preostaje:** vizuelno proveriti celu sekvencu i proveriti da li postojeće reakcije pokrivaju pogodak; nove klipove vlasnik daje samo ako ne pokrivaju. Slučajan izbor sme birati samo stvarno dostupne radnje; opasnost i borba imaju prednost. **Gotovo kada:** 30 s čekanja i deset ponavljanja svakog prelaza, iz više uglova, bez skoka položaja i identičnog grupnog ritma; pogodak/smrt mogu prekinuti čekanje i prelaz. **Zavisnost:** CK-01.

<a id="ck-03"></a>
#### CK-03 · Identitet i katalog · 0.5 / 1 / 2 p · Codex

**Rad:** razviti [Iliju, Petra i Jovana](../core3d/actor/derived/ww2/Prisoner.js) kroz prepoznatljiva lica, odeću i siluetu; proveriti zimski izgled prema mogućnostima modela. Jedna kataloška stavka po čoveku, oprema i radnje su njegov izbor. **Gotovo kada:** trojica se razlikuju i u istoj pozi pod istim svetlom na 3–8 m. Novi art ima poreklo. **Zavisnost:** postojeći model/teksture; ako geometrija ne dozvoljava traženu razliku, prvo utvrditi potreban zahvat umesto zamene celog stila.

<a id="ck-06"></a>
#### CK-06 · Ambijent i zvuk · 1 / 2 / 3 p · Codex: teren i pozadina; Claude: zvuci

**Rad:** dovršiti [teren i svetlo](ART.md#crveni-krst-priprema-3d-ambijenta): gaženi pravci, podnožja, diskretna udaljena silueta ravničarskog/gradskog oboda i zgrada/kule/dvorište kao orijentiri. Reflektori bacaju senke i nasumični požari su uklonjeni (Claude, 2026-11-26); preostaje gustina detalja. Koraci po snegu i zvuci napora prate radnju, bez neprekidnog ponavljanja glasova. **Gotovo kada:** početak, prolazi, dvorište i izlaz čitljivi su stojeći/u čučnju, bez lebdenja, prejakog pozadinskog kontrasta i svetla koje pogrešno predstavlja opasnost. Uporediti cenu promena u istom kadru pre/posle. **Zavisnost:** postojeći paket i originalne dopune sa poreklom; Mixamo se ne čeka. Izgled potvrđuje stvarna igra, ne offline render; prihvaćen renderer i 2D puška ostaju.


<a id="ck-07"></a>
#### CK-07 · Proboj kao celina · 0.5 / 1 / 2 p · Claude

**Rad:** posle obaveznih faza pregledati jedan ceo proboj i objediniti nalaze pre nove runde doterivanja. Na nekoliko ponovljivih rasporeda proveriti čekanje, hod, sprint, usko grlo, udaljenu vatru, ranjavanje/smrt, pauzu/nastavak i novi ulazak. **Gotovo kada:** jedan isti prolaz potvrđuje model/telo, sve radnje, grupu, čitljiv ambijent i prihvaćenu pušku; ciljani testovi i ESLint prolaze, FPS se meri u stvarnom rendereru. Pobeda je moguća bez ubijanja straže i bez svih saboraca. Nalaze vraćati u postojeće korake, ne u niz pojedinačnih ad hoc zahvata. **Zavisnost:** CK-01–06.

#### Redosled i zavisnosti

Jedan izvođač, tri prolaza: **osnova, identitet i animacije** (CK-01, CK-03, CK-02), **ambijent** (CK-06), pa **pregled celine** (CK-07). Dok se čeka preostali klip, nezavisna logika i ambijent mogu napredovati. Početna procena celog obima je **4,5 / 10 / 16,5 p**, plus nepoznato čekanje resursa/provere; ovo nije procena preostalog rada posle već izvršenih dopuna. Najveći rizici su različiti početni položaji pokreta i cena senki: prvo jedan lik i probni kadar, zatim cela grupa.

Raspored je ugrađen u postojeći plan da se poštuje pravilo jednog dokumenta:

```json
{"waves":[{"name":"Osnova, identitet i animacije","sequential":["CK-01","CK-03","CK-02"]},{"name":"Ponasanje i ambijent","sequential":["CK-06"]},{"name":"Pregled celine","sequential":["CK-07"]}],"handoffs":[["CK-01","CK-02"],["CK-02","CK-07"],["CK-06","CK-07"]]}
```

**Otvoreno:** povezana mirovanja, osmatranje i prelazi čekaju vizuelni prijem i prikaz u katalogu. Dostupnost ostalih traženih radnji nije proverena u Mixamo biblioteci. Codex pre nove nabavke proverava postojeće reakcije, smrti i trčanja. Istorijske i već prihvaćene grafičke odluke ne otvarati ponovo radi ovog doterivanja.

<a id="ig-31"></a>
### IG-31 · Pruge i mostovi u Warplane

Warplane je operacija Ratweek 1944 ([okvir](KONTEKST.md#warplane)) i nivo o bombardovanju: igrač bira samo bombarder (vlasnik, 2026-11-26). Igrač bombarduje sve nemačko, a sada su u igri samo fabrike. Dodati pruge i mostove, koje je Ratweek najviše gađao i koje navodi izveštaj nivoa; modeli su [pruga](../assets/models/railway/track/README.md) i [most](../assets/models/railway/bridge/README.md). Inspiracija za art tla iz vazduha: [gusti grad sa starog plana](../assets/images/background/grad.png), ulice i blokovi kuća viđeni odozgo. Kontekst iz rata: [saveznička bombardovanja Kraljeva i Beograda 1944](references/ww2-yu/bombardovanje-1944/README.md).

- [ ] Claude: rasporediti pruge i mostove na tlu Warplane-a kao mete, uz fabrike.

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

Prva scena (2026-11-25, [raspored](../scenes/3d-tank/kraljevo.js)): drum od Čačka, žica preko druma, rov od džakova sa dva mitraljeska gnezda, bunker i top. Uz drum je škola, zatim ulica sa dve barikade i kuća koja gori, pa kružni trg sa spomenikom Milutinu. Nemci drže položaje okrenuti ka drumu. Uz drum od Čačka do žice stoji drvored [lipa](../core3d/actor/nature/Tree.js) (2026-11-26). Kuće u ulici i oko trga imaju [precrtane fasade](#ar-p17); Ratarska škola je „Gradska zgrada“ iz [kuća grada](../core3d/actor/buildings/TownHouse.js), a na trgu je [Spomenik srpskim ratnicima](../assets/models/building/monument/milutin.glb). Pobeda je kad tenk stigne do centra grada (trga), a poraz kad izginu svi saborci; vreme se ne meri, jer bitka može trajati i satima. Logika igre (vlasnik, 2026-11-25): tenk mora prvo da pripremi teren. Ukopani Nemci dobacuju dalje od saboraca (mitraljez 55 m, puška 45 m, saborci 40 m), a tenkovski top dalje od svih; ako tenk samo projuri, saborci uđu u vatru i uglavnom izginu, a ako prvo izdaleka gađa položaje, otvara im put ([vrednosti](../scenes/3d-tank/kraljevo.js)).


Animacija gusenica Hotchkissa koristi isti [proračun](../core3d/actor/derived/HotchkissTracks.js) u katalogu i u Kraljevu. U Kraljevu svaki korak koristi položaj tenka posle simulacije, pa svaka strana prati svoj put i smer.

- [x] Codex: gusenice [Hotchkissa](../assets/models/tank/hotchkiss-h35.glb) kao prstenovi sa teksturom članaka, pod istim imenima.
- [x] Codex: pokrenuti teksturu svake gusenice brzinom njene strane i u igri.
- [x] Codex: tekstura džakova za [barikadu](../assets/models/props/barricade-sandbags/README.md) po postojećim UV koordinatama.
- [ ] Claude: postaviti teksturiranu barikadu u ulicu.
Scena treba više da liči na Kraljevo (vlasnik, 2026-11-27), prema [istraživanju](ISTORIJA.md#kraljevo-oktobar-1941--polazište-za-izgled-opsade-kraljeva): grad je u dolini na ušću Ibra u Zapadnu Moravu, a tenkovi su išli putem od Čačka do centra.

- [ ] Claude: [dolina](../scenes/3d-tank/valley.js) je napravljena (brda u prstenu oko grada, Ružića brdo iza tenka, Morava uz drum i Ibar iza trga, mirna voda sa obalama koje tenk ne prelazi); pogledati je u igri i doterati boje i visine.
- [ ] Vrbe uz Moravu čekaju model vrbe ([VL-01](#vl-01)).
- [ ] Claude: crkva i zgrada suda na trgu, uz spomenik, kad modeli stignu ([VL-01](#vl-01)).

<a id="ig-35"></a>
### IG-35 · Igre na telefonu

Radi se na kraju, kad su nivoi gotovi (vlasnik, 2026-11-26). Na početnoj strani su sakrivene na telefonu (`hide-on-mobile` u [index.html](../index.html)): Ustanak, Crveni krst, Aerodrom, Tenkići i Do Trsta. FPS igre od 2026-11-26 imaju komande za dodir (prevlačenje za pogled, strelice, pucanje, a u Crvenom krstu još šunjanje i uzimanje oružja), pa ih koči još samo brzina. Pre svakog otključavanja izmeriti kadrove i broj poziva za crtanje u igri na usporenom procesoru (Chrome, 4× sporije).

- **Crveni krst i Aerodrom:** izmeriti; ako drže kadrove, otkriti ih na telefonu.
- **Tenkići:** i dvojica igraju na jednom telefonu, naizmenično istim komandama na dodir (vlasnik, 2026-11-26); proveriti da dugmad vode igrača koji je na potezu, pa otkriti oba načina.
- **Ustanak:** igra za dvojicu traži tastaturu; proveriti da li igra protiv računara ima sve komande na dodir, pa otkriti samo nju.
- **Do Trsta:** utvrditi zašto je sakrivena, pa rešiti uzrok.
- **Sve 3D igre:** na telefonu ograničiti gustinu piksela platna (na primer najviše 1.5), jer ekran od 3× crta devet puta više piksela.

<a id="ig-37"></a>
### IG-37 · Ustanak: italijanski strelac

Obe strane treba da imaju isti broj vojnika (vlasnik, 2026-11-27): partizani imaju strelca ispred minobacača. Na njegovom mestu kod Italijana privremeno kleči stara izvorna slika [italijanskog pešaka koji kleči i nišani](../assets/images/armies/talijani/vojnici/vojnik-05.png), koja je i uzor za pozu; uniforma i šlem su kao kod [italijanske posluge](../assets/images/game-ready/artiljerija/italijanska-posada-sprites.webp), a ostale izvorne slike su u [armies/talijani](../assets/images/armies/talijani/).

- [ ] Codex: italijanski strelac iz 1941. u stilu, razmeri i rasporedu atlasa [partizanskog strelca](../assets/images/game-ready/vojnici/partizanski-strelac-sprites.webp) (mirovanje i pucanj, isti broj kadrova), uz pogodak i pad kao kod ostalih boraca Ustanka; u katalog kao radnje strelca.
- [ ] Claude, posle Codexovog koraka: zameniti njime privremenu izvornu sliku u [Ustanku](../scenes/ustanak/Main.js).

## Ideje za kasnije

- **Čamac:** dodatni desanti na Brač, Mljet i Korčulu ([kontekst](KONTEKST.md#čamac)), uz istorijsku proveru.
- **Battle for Jablanica:** kampanja kroz Prozor, Ramu i Jablanicu, možda i zasedu kod Drežnice, sa kolonom kamiona koja se probija putem uz reku; svaka etapa sa svojim događajem ([istorijske granice](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica)).
