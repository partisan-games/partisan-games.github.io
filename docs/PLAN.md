# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Art](#art)** | | | |
| 1 | [AR-P16](#ar-p16) | Precrtati art koji 2D igre još koriste neprecrtan | Codex; vlasnik odobrava | 📋 TODO |
| 2 | [AR-P17](#ar-p17) | Probno precrtati jedan 3D model partizana u stilu postojećeg 2D pixel arta | Codex; vlasnik odobrava | 📋 TODO |
| | **[Igre i ideje](#igre)** | | | |
| 3 | [IG-14](#ig-14) | Izabrati sledeće aktere od postojećeg arta | Vlasnik, Claude, Codex | 📋 TODO<br>Waiting: izbor kandidata [1](#note-1) |
| 4 | [IG-18](#ig-18) | Otpisani kao arkadna pucačina kroz četiri beogradske ulice | Codex: panorame; Claude: igra | 📋 TODO |
| 5 | [IG-21](#ig-21) | Razmotriti kampanju Jablanice i kolonu kamiona | Vlasnik | 📋 TODO |
| 6 | [IG-22](#ig-22) | Razraditi dodatne etape Neretve | Vlasnik | 📋 TODO |
| 7 | [IG-24](#ig-24) | Odlučiti o anahronim parolama u Liberated City | Vlasnik | 📋 TODO |
| 8 | [IG-29](#ig-29) | Dovršiti logor Crveni krst u Escape Concentration Camp | Codex, Claude | 🔄 In progress |
| 9 | [CK-01](#ck-01) | Crveni krst: uskladiti vidljivog lika, telo i stopala | Codex | 🔄 In progress |
| 10 | [CK-02](#ck-02) | Crveni krst: prave animacije, držanje cevi i prelazi | Vlasnik: klipovi; Codex: povezivanje | 🔄 In progress |
| 11 | [CK-03](#ck-03) | Crveni krst: prepoznatljivi logoraši i katalog | Codex | 📋 TODO |
| 12 | [CK-04](#ck-04) | Crveni krst: praćenje, skretanje i razmicanje grupe | Codex | 🔄 In progress |
| 13 | [CK-05](#ck-05) | Crveni krst: zakloni, borba, ranjavanje i straže | Codex | 🔄 In progress |
| 14 | [CK-06](#ck-06) | Crveni krst: tlo, svetlo, pozadina i zvuk | Codex | 📋 TODO |
| 15 | [CK-07](#ck-07) | Crveni krst: pregled celog proboja i regresije | Codex | 📋 TODO |
| 16 | [IG-31](#ig-31) | Dodati pruge, mostove i izbor savezničkih aviona u Warplane | Vlasnik, Codex, Claude | 🔄 In progress |
| 17 | [IG-32](#ig-32) | Dovršiti Raid on Drvar: modeli, izgled grada i težina | Claude, Codex | 🔄 In progress |
| 18 | [IG-33](#ig-33) | Pregledati art German Advance u duploj rezoluciji i završni promo | Vlasnik | 📋 TODO |
| 19 | [IG-34](#ig-34) | Napraviti vernu scenu i igru opsade Kraljeva po dogovorenom scenariju | Vlasnik, Claude, Codex | 🔄 In progress |
| 20 | [IG-35](#ig-35-igre-na-telefonu) | Otkriti igre na telefonu posle merenja i optimizacije, kad su nivoi gotovi | Claude, vlasnik | 📋 TODO |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze; sekcija koja ostane bez stavki briše se sa poslednjom, a veze ka njoj se preusmeravaju.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Vlasnikovi pregledi su odvojeni od završenog povezivanja; ne uvode novu blokadu bez njegovog izričitog uslova. Ranije završene provere ne ponavljati zbog reorganizacije plana.

## Art

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Dodatni desanti na Brač, Mljet i Korčulu ostaju ideje za igru uz istorijsku proveru, a ne zadaci izrade arta. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

<a id="ar-p17"></a>
### AR-P17 · 3D partizan u stilu 2D pixel arta

Proba (vlasnik, 2026-11-25): jedan postojeći 3D model partizana precrtati tako da izgleda kao postojeći 2D pixel art igre, sa istom paletom, oštrim pikselima i istim licem, kapom i odećom kao [precrtani 2D partizani](../assets/images/game-ready). Model ostaje isti kostur i isti pokreti; menja se izgled tekstura. Ishod se pokazuje u katalogu, a vlasnik odlučuje da li se ovaj stil širi na ostale 3D likove.

<a id="ar-p16"></a>
### AR-P16 · Neprecrtan art u 2D igrama

Igre poput Bunkera još prikazuju stare slike iz zbirke, koje nisu precrtane u stilu projekta kao akteri u [game-ready](../assets/images/game-ready) (vlasnik, 2026-11-25). Codex ih precrtava u istom stilu i meri, kao lossless WebP u game-ready, sa pričom u katalogu. Vlasnik odobrava svaki novi crtež u katalogu; tek tada igre prelaze na novu sliku, a stara se briše ako je više niko ne koristi. Popis je napravljen iz koda, praćenjem importa svake igre:

| Slika | Igre |
|---|---|
| [Kuća-bunker](../assets/images/buildings/kuca-bunker.png) | Bunker, Ustanak, Do Trsta |
| [Bunker](../assets/images/buildings/bunker-02.png) | Do Trsta |
| [Nagazna mina](../assets/images/items/nagazna.png) | Bunker |
| [Eksplozija](../assets/images/sprites/efekti/eksplozija-01.png) | Bunker, Čamac, Franjo Kluz, Neretva, Do Trsta, Vis |
| [Krv](../assets/images/sprites/efekti/krv-mala.png) | Bunker |
| [Granata](../assets/images/items/granata.gif) i [plamen](../assets/images/plamen.gif) | Bunker, Čamac, Franjo Kluz, Neretva, Tenkići, Do Trsta, Vis, Ustanak |
| [Bomba](../assets/images/items/bomba.png) | Franjo Kluz, Neretva, Do Trsta, Vis |
| [Raketa](../assets/images/items/raketa.png) i [partizanski čamac](../assets/images/armies/camac.png) | Čamac |
| [Rov](../assets/images/armies/rov-prazan.gif) | Neretva |
| [Fiat CR.42](../assets/images/armies/talijani/avioni/fiat-cr42.png), [IMAM Ro.57](../assets/images/armies/talijani/avioni/imam-ro57.png), [partizanska](../assets/images/sprites/zastava.png) i [italijanska zastava](../assets/images/armies/talijani/vojnici/strelci/zastava.svg) | Ustanak; italijanska zastava i u Jablanici |
| [Aerodrom](../assets/images/buildings/aerodrom.png), [ruševina](../assets/images/buildings/ruina.png), [šumarak](../assets/images/nature/shumarak.png), [žbun](../assets/images/nature/zbun.png) i [oblak](../assets/images/nature/oblak.gif) | Franjo Kluz; šumarak i u Do Trsta, oblak i u Visu |
| [Kuće](../assets/images/buildings/kuca-04.png) ([druga](../assets/images/buildings/kuca-07.png)) i [crkva](../assets/images/buildings/crkva-01.png) | Do Trsta |
| [Ostrvo](../assets/images/nature/ostrvo.gif), [baza](../assets/images/vis.png), [municija](../assets/images/items/municija.png) i [zdravlje](../assets/images/items/zdravlje.png) | Vis |
| [Plamen pucnja](../assets/images/pucanje.png) | Otpisani |

Van popisa su pozadine, korisnički interfejs i teksture 3D igara; zapisi olupina i propelera samo prepoznaju slike, pa nisu upotreba.

<a id="igre"></a>
## Igre i ideje

<a id="ig-14"></a>
### IG-14 · Kandidati za vlasnikov izbor

Kandidati nisu nalog za izradu. Posle izbora dopuniti art, telo, zajednički prikaz i priču u katalogu, povezati aktera sa igrom i odigrati nivo.

- **Frontalni neprijatelji:** [strelac](../catalog.html#vojnici/otpisani-strelac) i [stražar](../catalog.html#vojnici/otpisani-strazar) čekaju vlasnikov izbor za nivo. Stražar u šinjelu dozvoljen je samo zimi.

- **Vis:** partizanski [Hurricane, Spitfire i Il-2](../assets/images/armies/partizani/avioni/) odozgo.
- **Ustanak:** [italijanski top 47 mm sa posadom i minobacači](../assets/images/armies/talijani/artiljerija/); zahteva novu odluku o proširenju dvoboja.
- **Pešadija:** italijanski, britanski, ruski, četnički i SS vojnici; potrebni su atlasi pokreta.
- **Otpisani:** nemački motociklista sa mitraljezom.

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
- [ ] Codex: precrtati u pixel art [nemačkog strelca](../assets/images/game-ready/vojnici/otpisani-rifleman-sprites.webp) i [stražara u šinjelu](../assets/images/game-ready/vojnici/otpisani-sentry-sprites.webp) Otpisanih, sa istim pozama i rasporedom kadrova; sada su glatki, sa debelim obrisom, kao vektorski crtež, i odskaču od ostalih 2D igara (vlasnik, 2026-11-26). Uzor su Nemci iz rova u Neretvi. U istom stilu i novi neprijatelji etapa.
- [ ] Claude: klizanje prizora, iskakanje Nemaca i etape, kad panorame stignu.

<a id="ig-21"></a>
### IG-21 · Kampanja Jablanice

Moguće etape su Prozor, Rama i Jablanica, sa zasedom kod Drežnice kao kandidatom. Kolona kamiona pokušava proboj putem uz reku. To su ideje, ne nalog za izradu; mesta imaju različite događaje i ne treba ponavljati isti bunker. Istorijske granice su u [ISTORIJA](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica).

<a id="ig-22"></a>
### IG-22 · Dodatne etape Neretve

Italijanske i ustaške etape ostaju kandidati uz postojeće Nemce i četnike. Izabrati mesta, datume, jedinice i borbene uloge, trajanje i prelaze, pa tek onda art i tok igre. Postojeći rov nije istorijski dokaz budućeg sastava.

Saborci u rovu (predlog, 2026-11-26): jedan ili dva partizana u donjim uglovima ekrana, krupni i okrenuti leđima, kao da su odmah pored igrača u rovu; ne zaklanjaju Nemce. Pravi 3D modeli ne pristaju ravnoj pixel art slici, pa se crtež pravi od postojećeg 3D partizana snimljenog otpozadi i prevodi u pixel art, istim postupkom kao [AR-P17](#ar-p17). Prethodni red saboraca uklonjen je 2026-11-26 jer je loše izgledao.

<a id="ig-24"></a>
### IG-24 · Parole Bihaća

Liberated City je Bihać krajem 1942. Natpisi o dolasku Crvene armije i plakat RED_ARMY_IS_HERE pripadaju drugom okviru; vlasnik bira zamenu ili uklanjanje pre izmene sadržaja.

<a id="ig-29"></a>
### IG-29 · Logor Crveni krst u Escape Concentration Camp

Radnja (vlasnik, 2026-11-24): proboj iz nemačkog logora Crveni krst u Nišu, 12. februara 1942; tekst misije i naslov kartice su upisani. Okvir je u [KONTEKST](KONTEKST.md#escape-concentration-camp).

Proboj je dogovoren i logoraši su spremni. Po odluci vlasnika od 2026-11-25, [3D logoraš](../scenes/fps-base/PrisonerAvatar.js) počinje sa već otetom puškom. Uvod objašnjava da je pre početka nivoa savladao stražara. Tasterom F preuzima [oružje ostalih savladanih stražara](../scenes/fps-base/CampWeapons.js). Izlazak iz lavirinta dovoljan je za pobedu. [Test nivoa](../tests/unit/fpsCamp.test.js) pokriva početnu pušku, preuzimanje oružja i pobedu dok su svi stražari na mapi živi.

Stražar prvi put uzvikne „Halt!“ kad primeti logoraša. Trenutak uzvika pokriva [test nivoa](../tests/unit/fpsCamp.test.js).

Držanje tastera C uključuje šunjanje uz Mixamo klip `Crouched Walking` koji je preuzeo vlasnik. Lik se spušta i korača sporije i tiše. Puni zakloni zaklanjaju pogled, kretanje izvan čučnja može privući pogled stražara, a snop reflektora vraća domet opažanja čučnutog lika. [Test nivoa](../tests/unit/fpsCamp.test.js) pokriva položaj kamere, ponašanje stražara i proveru snopa.

Preostali rad je razložen na [CK-01](#ck-01)–[CK-07](#ck-07), prema pregledu ispod. Pomeranje šake i nasumične poze nisu potvrda da je ceo pokret prirodan.

Prerada menja betonski ambijent u logor; sneg, noć i straže ostaju. Početni predlog baraka i kula u uglovima korigovati prema [istraženom stanju](ISTORIJA.md#crveni-krst-12-februar-1942), a ne predstaviti kao potvrđen tlocrt. Teksture i modele izrađuje Codex, bez privremenog crteža u nivou.

Priprema je urađena: [reference sa poreklom](references/ww2-yu/crveni-krst/README.md) i [smernice za modele i teksture](ART.md#crveni-krst-priprema-3d-ambijenta). Preradu voditi prema [dogovorenom rasporedu i pravilima prepreka](KONTEKST.md#escape-concentration-camp): lavirint ostaje, a prolazi dobijaju prostornu namenu.

Prvi [paket arta](../assets/models/building/crveni-krst/README.md) povezan je u [katalogu](../catalog.html#scenografija-3d/sklop) i [igri](../index.html#fps-base). [Lokalni raspored](../scenes/fps-base/campLayout.js) čuva grananje i slepe prolaze oko ograđene zidane zgrade, sa jednim otvorenim dvorištem. [Sklop](../scenes/fps-base/CampEnvironment.js) povezuje žicu, pune zaklone, dvostruki obod, otvorenu izlaznu kapiju i dve kule sa reflektorima. Uslov pobede ostaje izlazak iz lavirinta, bez dodatnih obaveznih ciljeva.

Tehničke granice: zajednički `Maze` nije menjan. Mreža ima 8×8 polja razmaka 10 m, od kojih je osam rezervisano za objekat sa dvorištem; 56 prohodnih polja ostaje povezano. Početak (−35, −35), izlaz (35, 40) i prag pobede manji od 5 m su očuvani, kao i deset protivnika, dve prve pomoći i deset rekvizita. Žica blokira hod, a propušta pogled i metke za obe strane; zgrada, puni zakloni i rekviziti blokiraju i pogled i pogotke. Nitima i stubovima se dele instancirani sklopovi, dok puni zakloni ostaju obični mesh-evi zbog tragova pogodaka. [Ciljane provere](TESTING.md#crveni-krst--priprema-i-art) obuhvataju prohodnost, sudare, ponovni ulazak, pobedu bez ubijanja i oslobađanje novih resursa.

#### Kritički pregled umetnosti, animacije i prirodnosti

Pregledano 25. 11. 2026: radno stablo nad `efce37abab2afc3efba1365817a417b70abc795a`, sa lokalnim izmenama. Pregledani su kod, stvarni FBX pokreti i dva postojeća offline prikaza scenografije. **To nisu snimci nivoa**; slika kartice još prikazuje stari betonski lavirint. Browser nije pokretan: konačan kadar, deformacije u pokretu, čitljivost žice, osvetljenje i FPS ostaju za proveru u igri. [Dokazi i granice provere](TESTING.md#crveni-krst--priprema-i-art).

**Ocena:** zidana zgrada, žica i prigušena paleta daju smislenu osnovu, ali nivo još ima pokrete i ponašanje prototipa. Najpre rešiti položaj modela prema njegovom fizičkom telu, zatim radnje i odluke likova, pa završni izgled. Novi idle sam neće popraviti skretanje, preklapanje i izbor zaklona.

P1 je kvar položaja lika/igre; P2 potvrđen problem prirodnosti ili neispunjen likovni zahtev. „Proveriti” označava rizik ili predlog koji nije viđen u konačnom kadru.

| Nalaz | Dokaz i posledica | Korak |
|---|---|---|
| Proveriti · Stopala i kontakti pri prelazima | [Čučeći hod sada ostaje u mestu](../scenes/fps-base/CompanionModel.js#L15), uz zajedničku osnovu sa pravim `Crouching Idle`. Preostaje provera deformisanih stopala i odnosa tela/modela uz prepreke i pri promeni stava; samo stabilan koren ne dokazuje oslonac. | CK-01 |
| P2 · Prilaz zaklonu i povlačenje bez zaklona | Procena pretnje sada obuhvata i plamenobacač prema stvarnom dometu i aktivnom napadu. Bez zaklona [trče ka vođi](../scenes/fps-base/EscapingPrisoners.js) i kada je izložen. Put do zaklona proverava prepreke, ali ne izloženost vatri. | CK-05 |
| P2 · Borba nema proverenu vezu pokreta i pogotka | Cev koristi [kombinaciju mačem](../core3d/actor/derived/ww2/WorkerPipe.js#L4), a telo zadaje jedan pogodak na polovini ukupne radnje. Nema povezane reakcije saborca na preživljen pogodak; smrt je `Dying` i iz čučnja. Tačan kontakt cevi i eventualno podizanje pri smrti treba pogledati u igri. | CK-02/05 |
| P2 · Odeća još nije identitet čoveka | [Trojica](../scenes/fps-base/CompanionModel.js#L9) imaju isti model i osnovno lice, različite visine/odeću, brkove kod jednog i nijansu kože. Potrebna je trajna prepoznatljivost i pri istoj pozi; ne praviti novog čoveka promenom oružja. | CK-03 |
| P2 · Podloga i efekti ne ostvaruju art ugovor | [Tlo](../scenes/fps-base/Main.js#L56) je jedna ponovljena snežna ravan, bez gaženih pravaca i podnožja iz [ART-a](ART.md#crveni-krst-priprema-3d-ambijenta). Četiri nasumična rekvizita dobijaju dim/plamen, a izlaz vatreni efekat; ART traži da nasumični požari ne budu glavni motiv. | CK-06 |
| Proveriti · Dubina, pozadina i reflektori | [Nebo je jedna boja sa maglom](../scenes/fps-base/Main.js#L50); mesečevo svetlo i [reflektori](../core3d/actor/buildings/CampProp.js#L26) ne bacaju senke. Logika zaklanja reflektor iza zida, GPU svetlo nema tu senku. Proveriti kontakt sa tlom i da li osvetljenost odgovara stvarnom opažanju straže. | CK-06 |
| P2 · Zvuk ne odgovara radnji i tlu | [Prikaz saboraca](../core3d/actor/characters/CharacterModel.js#L48) koristi korake po šljunku, punom jačinom i prema pređenom putu; tiši čučanj je povezan samo kod igrača. Nije povezan zvuk zamaha cevi. Novi FBX sam ovo ne rešava. | CK-05/06 |
| Proveriti · Borba i čitljivost cilja | [Straža je nasumičan sastav koji luta](../scenes/fps-base/Main.js#L95). Smireno osmatranje, uzbuna, težina sa početnom puškom i više rasporeda nisu provereni kao celina. Završna poruka naglašava ubijene, a cilj je bekstvo. Predlog promene teksta podleže postojećem UI pravilu. | CK-05/07 |

#### Zahtevi za animacije

**Mixamo model:** postojeći radnik/logoraš `resistance-fighter`, sa istim skeletom kao u [Worker-u](../core3d/actor/derived/ww2/Worker.js#L9). Slede **engleski pojmovi za pretragu i opis radnje**, ne potvrđeni tačni naslovi u Mixamo biblioteci. Cev dodaje igra: birati desnu šaku pogodnu za jednoručni predmet, bez držanja nevidljivog pištolja i obavezne podrške drugom rukom.

| Red potrebe | Šta tražimo | Uslov izbora |
|---|---|---|
| Povezano u nivou; čeka vizuelnu proveru | [Crouching Idle](../assets/models/character/soldier/Crouching%20Idle.fbx) i [Crouch Idle](../assets/models/character/soldier/Crouch%20Idle.fbx) | Dva različita čučeća mirovanja, različiti početni izbori/faze/tempo i nezavisno menjanje tokom čekanja. Proveriti stopala, hvat cevi i spoj petlje; katalog još nema te radnje. |
| Povezano u nivou; čeka vizuelnu proveru | [Crouch Look Around Corner](../assets/models/character/soldier/Crouch%20Look%20Around%20Corner.fbx) | Osmatranje dok saborac miruje u zaklonu tokom zatišja, ne kao mirovanje na otvorenom. Nova vatra prekida osmatranje; fizičku blizinu ivice i položaj prema zaklonu još proveriti. |
| Povezano u nivou; čeka vizuelnu proveru | [Crouch To Stand](../assets/models/character/soldier/Crouch%20To%20Stand.fbx), unazad za spuštanje | Koristi se aktivni deo snimka, frejmovi 24–71 pri 30 fps; početno/završno čekanje je izostavljeno, horizontalni koren usklađen. Saborac zastane tokom prelaza i tek uspravan trči/udara; povratni prelaz koristi isti snimak unazad. Visina tela prati napredak; vizuelnu prirodnost obrnutog snimka proveriti pre nove nabavke. |
| Jedan udarac | **One Handed Melee Attack / Baton Strike / Club Swing** | Odlučan udarac desnom rukom sa oporavkom. Može odgovarajući pojedinačni zamah mačem; bez višestrukog komboa i akrobatike. |
| Dopuna po potrebi | **Turn Left / Right In Place**, **Crouch Turn Left / Right** | Za velike okrete u mestu, ako ograničena brzina okreta i postojeće animacije ne budu dovoljne. |
| Dopuna po potrebi | **Crouching Hit Reaction**, **Crouch Flinch / Cower / Cover Head** | Prvo probati postojeće reakcije; nova animacija samo za nepokriven pogodak/zaštitu od neposredne vatre. |

**Već imamo — prvo isprobati:** `Running`, `Walk`, `Crouched Walking`, `Crouched Run`, `Standing Idle`, `Warrior Idle`, `Hit Reaction`, `Reaction`, `Crouch Death`, `Death Crouching Headshot Front`, `Dying` i `Standing React Death Backward`. Osnovni trk i čučeći hod već se koriste; horizontalno pomeranje korena hoda je uklonjeno, preostaje provera stopala i hvata cevi. `Crouched Run` je kandidat, nije automatski dobar za jednoručni predmet. Smrti proveriti prema stvarnom stavu i korenu, a headshot ne koristiti za svaku pogibiju. Za smirenu stražu prvo proveriti postojeći `Rifle Idle`.

**Predaja/prijem:** isti Mixamo skelet, dodatni FBX **Without Skin**, 30 fps; **In Place** gde postoji taj izbor. Sačuvati izvor, naziv i trim/postavke i proveriti pravo korišćenja. Mirovanja moraju imati prirodan spoj petlje; udarci/prelazi sačuvan zamah i završetak, bez prekratkog trimovanja. Prvo isprobati ceo model sa pričvršćenom cevi iz više uglova u katalogu: stopala, hvat prstiju, putanja cevi, koren, početak/kraj i trenutak dodira. Naziv klipa i kompatibilne kosti sami nisu potvrda da pokret odgovara nivou.

#### Obim i način rada

Plan vodi poboljšanje IG-29; povezivanje dostavljenog idle-a je započeti deo, ostale faze ostaju otvorene. Ostaju lavirint i istorijske granice, početna puška sa prihvaćenim 2D crtežom, tri saborca sa cevima i čučnjem kao osnovom, mogućnost njihove pogibije i pobeda izlaskom igrača. Ne uvoditi obavezno spasavanje grupe, novu grafičku tehniku ili obavezno šunjanje. Ne praviti commit. Rad držati u nivou; potreban zahvat u zajednički prikaz prvo obrazložiti i proveriti ostale potrošače.

Codex sprovodi korake; vlasnik bira/preuzima Mixamo klipove kao do sada. Tehnički završetak znači provere navedene uz korak; izgled zahteva snimak/prolaz stvarne igre. Browser pokreće isključivo vlasnik, prema [DOCS-u](DOCS.md). Procene su početni grubi okvir celih koraka **min / verovatno / max**, u poenima jednog izvođača (**1 p ≈ idealan radni dan**), bez čekanja resursa i pregleda; nisu ažurna procena preostalog rada ni obećani rok. Pravi idle-i i prelazi su već povezani, pa novu procenu zasnovati na stvarno preostalim proverama i dopunama.

<a id="ck-01"></a>
#### CK-01 · Položaj i stopala · 0.5 / 1 / 1.5 p · Codex

**Osnova je povezana:** [hod je lokalno pripremljen](../scenes/fps-base/CompanionModel.js#L15) bez horizontalnog napredovanja, sa početkom novog pravog idle-a i očuvanim Y pokretom. **Preostaje:** potvrditi oslonac stopala i kontakte uz prepreke. **Gotovo kada:** horizontalni koren odstupa najviše 1 cm od dogovorenog oslonca kroz sve uzorke 20 petlji mirovanja/hoda i prelaze idle–hod–idle; nije dovoljna jednakost početka/kraja petlje. Uzastopni uzorci deformisanih stopala potvrđuju stabilan kontakt stopala koje nosi težinu (predložena tolerancija 1 cm), bez zaključavanja noge koja korača. Vidljiv model i telo ostaju sa iste strane zida. **Zavisnost:** postojeći resursi; novi idle je dostavljen, izvedene poze su uklonjene.

<a id="ck-02"></a>
#### CK-02 · Animacije i prelazi · 1 / 2 / 3 p · Codex

**Osnova je povezana:** dva stvarna čučeća mirovanja sa različitim fazama/tempom, osmatranje iz zaklona i prelaz ustajanja/spuštanja za svu trojicu. **Preostaje:** paket radnji prikazati u katalogu, vizuelno proveriti celu sekvencu sa cevi i dopuniti udarac i reakcije. Slučajan izbor sme birati samo stvarno dostupne radnje; opasnost i borba imaju prednost. **Gotovo kada:** 30 s čekanja i deset ponavljanja svakog prelaza sa cevi, iz više uglova, bez skoka položaja, pogrešnog hvata i identičnog grupnog ritma; pogodak/smrt mogu prekinuti čekanje i prelaz. **Zavisnost:** CK-01 i preostali klipovi; čekanje ne sprečava nezavisan rad.

<a id="ck-03"></a>
#### CK-03 · Identitet i katalog · 0.5 / 1 / 2 p · Codex

**Rad:** razviti [Iliju, Petra i Jovana](../scenes/fps-base/CompanionModel.js#L9) kroz prepoznatljiva lica, odeću i siluetu; proveriti zimski izgled prema mogućnostima modela. Jedna kataloška stavka po čoveku, oprema i radnje su njegov izbor. **Gotovo kada:** trojica se razlikuju i u istoj pozi pod istim svetlom na 3–8 m; šaka obuhvata cev i predmet ne prolazi kroz telo tokom postojećeg trka/zamaha. Novi art ima poreklo. **Zavisnost:** postojeći model/teksture; ako geometrija ne dozvoljava traženu razliku, prvo utvrditi potreban zahvat umesto zamene celog stila.

<a id="ck-04"></a>
#### CK-04 · Kretanje grupe · 0.5 / 1.5 / 2.5 p · Codex

**Tehnički deo je povezan i testiran; preostaje pregled grupe u igri.** Saborci sustižu igrača koji sprinta 4 m/s, najviše do 4,6 m/s, zatim usklađuju tempo sa svojim mestom u grupi. Dok igrač sprinta ostaju uspravni; kad stane, usporavaju, vraćaju se na mesto i čučnu. Tempo postojećeg `Running` klipa prati stvarnu brzinu u granicama 0,85–1,15; nema teleportovanja i zajedničke brzine drugih igara nisu menjane. Povezani su odvojena mesta iza vođe prema pravcu njegovog kretanja, prohodne alternative uz zid, obilazak i mirujućih ljudi sa razmakom oko 0,8 m i čekanje kad za obilazak nema mesta. Samo pomeranje pogleda ne premešta grupu. Okretanje je ograničeno na 270°/s najkraćim putem; uglovi i udarci sačekaju pravac. **Završna provera:** vlasnik prati grupu tokom hodanja, sprinta, stajanja i vraćanja kroz uglove/uske prolaze; proverava prirodnost novog tempa i izostanak preklapanja/zastoja. Testove i njihove granice čuva [TESTING](TESTING.md). **Zavisnost:** CK-01 i CK-02 za završnu proveru prikaza.

<a id="ck-05"></a>
#### CK-05 · Opasnost i borba · 0.5 / 1.5 / 2.5 p · Codex

**Rad:** [Procena pretnje](../scenes/fps-base/EscapingPrisoners.js) sada koristi stvarni domet i aktivni napad i za plamenobacač; ciljani testovi pokrivaju početak i trajanje napada, prestanak opasnosti, zaklon, smer i domet. Preostaje provera zaklona prema visini čučnja, bezbednom prilazu i zauzetosti, razuman smer povlačenja kad zaklona nema. Osloboditi rezervaciju pri prekidu/smrti. Pripremiti trenutak kontakta cevi umesto univerzalne polovine radnje. Straža razlikuje smireno osmatranje, uzbunu i napad koristeći postojeće radnje gde odgovaraju. **Gotovo kada:** provereni puška, mitraljez, plamen, dva smera vatre, nedostupan/zauzet zaklon, nestanak mete, bliski napad i smrt saborca. Niko se ne vraća izloženom vođi samo zato što nema zaklona; jedan zamah daje jedan pogodak u označenom trenutku. **Zavisnost:** CK-01; logičke provere ne čekaju klipove, konačan prikaz čeka CK-02.

<a id="ck-06"></a>
#### CK-06 · Ambijent i zvuk · 1 / 2 / 3 p · Codex

**Rad:** dovršiti [teren i svetlo](ART.md#crveni-krst-priprema-3d-ambijenta): gaženi pravci, podnožja, diskretna udaljena silueta ravničarskog/gradskog oboda i zgrada/kule/dvorište kao orijentiri. Uskladiti reflektore sa stvarnim zaklonom, senke i gustinu detalja. Nasumične požare zameniti smislenim izvorima svetla. Koraci po snegu i zvuci napora/udarca prate radnju, bez neprekidnog ponavljanja glasova. **Gotovo kada:** početak, prolazi, dvorište i izlaz čitljivi su stojeći/u čučnju, bez lebdenja, prejakog pozadinskog kontrasta i svetla koje pogrešno predstavlja opasnost. Uporediti cenu promena u istom kadru pre/posle. **Zavisnost:** postojeći paket i originalne dopune sa poreklom; Mixamo se ne čeka. Izgled potvrđuje stvarna igra, ne offline render; prihvaćen renderer i 2D puška ostaju.

<a id="ck-07"></a>
#### CK-07 · Proboj kao celina · 0.5 / 1 / 2 p · Codex

**Rad:** posle obaveznih faza pregledati jedan ceo proboj i objediniti nalaze pre nove runde doterivanja. Na nekoliko ponovljivih rasporeda proveriti čekanje, hod, sprint, usko grlo, udaljenu vatru, cev izbliza, ranjavanje/smrt, pauzu/nastavak i novi ulazak. **Gotovo kada:** jedan isti prolaz potvrđuje model/telo, sve radnje, grupu, čitljiv ambijent i prihvaćenu pušku; ciljani testovi i ESLint prolaze, FPS se meri u stvarnom rendereru. Pobeda je moguća bez ubijanja straže i bez svih saboraca. Nalaze vraćati u postojeće korake, ne u niz pojedinačnih ad hoc zahvata. **Zavisnost:** CK-01–06 i snimak/prolaz vlasnika u browseru. Node testovi nisu vizuelno prihvatanje.

#### Redosled i zavisnosti

Jedan izvođač, tri prolaza: **osnova, identitet i animacije** (CK-01, CK-03, CK-02), **ponašanje i ambijent** (CK-04, CK-05, CK-06), pa **pregled celine** (CK-07). CK-02 prethodi završnim proverama CK-04/05 koje zavise od njegovih pokreta. Dok se čeka preostali klip, nezavisna logika i ambijent mogu napredovati. Početna procena celog obima je **4,5 / 10 / 16,5 p**, plus nepoznato čekanje resursa/provere; ovo nije procena preostalog rada posle već izvršenih dopuna. Najveći rizici su hvat cevi, različiti početni položaji pokreta i cena senki: prvo jedan lik i probni kadar, zatim cela grupa.

Raspored je ugrađen u postojeći plan da se poštuje pravilo jednog dokumenta:

```json
{"waves":[{"name":"Osnova, identitet i animacije","sequential":["CK-01","CK-03","CK-02"]},{"name":"Ponasanje i ambijent","sequential":["CK-04","CK-05","CK-06"]},{"name":"Pregled celine","sequential":["CK-07"]}],"handoffs":[["CK-01","CK-02"],["CK-02","CK-04"],["CK-02","CK-05"],["CK-04","CK-07"],["CK-05","CK-07"],["CK-06","CK-07"]]}
```

**Otvoreno:** povezana mirovanja, osmatranje i prelazi čekaju vizuelni prijem sa cevi i prikaz u katalogu; vlasnik još treba da izabere pojedinačni udarac. Zasebno spuštanje u čučanj tražiti samo ako obrnuti snimak ustajanja ne izgleda prirodno. Dostupnost ostalih traženih radnji nije proverena u Mixamo biblioteci. Codex pre nove nabavke proverava postojeće reakcije, smrti i trčanja. Istorijske i već prihvaćene grafičke odluke ne otvarati ponovo radi ovog doterivanja.

<a id="ig-31"></a>
### IG-31 · Avioni za Ratweek

Warplane je operacija Ratweek 1944 ([okvir](KONTEKST.md#warplane)). Igrač leti samo bombarderom ([izbor](../scenes/warplane/Main.js)); dvokrilac je ostao samo u katalogu. Bombarder sa četiri motora i duplim repom odgovara, jer su američki teški bombarderi B-17 i B-24 dejstvovali na Balkanu 1944, i u Ratweeku; po obliku može da prođe kao B-24.

Urađeno (2026-11-25): Bf 109 ([lovac](../core/gameplay/bodies/aircraft/Interceptor.js)) dolazi iz izmaglice i pravi prelet za preletom na bombarder, pucajući kad ga ima na nišanu. [Mitraljezi bombardera](../core/gameplay/bodies/aircraft/GunTurrets.js) sami prate lovca nišanom, sa predujmom, a pucaju dok igrač drži drugi taster za napad (C); Space ispaljuje rakete na zemlju. Oboren lovac donosi poen, a sledeći dolazi posle predaha. Priča je u [katalogu](../catalog.html#letelice-3d/lovac-bf-109-3d).

Preostaje:

1. Igrač bombarduje sve nemačko; sada su u igri samo fabrike. Dodati pruge i mostove, koje je Ratweek najviše gađao i koje navodi izveštaj nivoa; modele crta Codex. Inspiracija za art tla iz vazduha: [gusti grad sa starog plana](../assets/images/background/grad.png), ulice i blokovi kuća viđeni odozgo. Kontekst iz rata: [saveznička bombardovanja Kraljeva i Beograda 1944](references/ww2-yu/bombardovanje-1944/README.md).
2. Izbor aviona za igrača: vlasnik traži 3D modele aviona koji su leteli u Ratweeku ili uz njega 1944 (vlasnik, 2026-11-25). Kandidati, po ulozi u igri:
   - teški bombarderi američke 15. vazduhoplovne armije iz Fođe: **B-24 Liberator** i **B-17 Flying Fortress**; sadašnji četvoromotorac sa duplim repom može da prođe kao B-24;
   - lovci-bombarderi, koji su rušili mostove i pruge u niskom letu: **P-51 Mustang** i **P-38 Lightning**;
   - Balkansko vazduhoplovstvo RAF-a, u kom su letele i dve jugoslovenske eskadrile: **Hurricane IV** sa raketama (351. eskadrila) i **Spitfire IX** (352. eskadrila), za partizanskog pilota; učešće baš u Ratweeku proveriti u izvoru pre izbora;
   - **Beaufighter** sa raketama, kojim je Balkansko vazduhoplovstvo napadalo vozove i obalski saobraćaj.

   Svaki izabrani avion dobija model, telo i priču u katalogu pre ulaska u igru.

   Sada je u igri i u [katalogu](../catalog.html#letelice-3d/bombarder-3d) Avro Lancaster, koji nije leteo u Ratweeku; elise su mu providni diskovi bez lopatica, pa nema okretanja. Vlasnik traži izbor bombardera, sa elisama koje se okreću (2026-11-25). Besplatni modeli koje je agent našao, za preuzimanje (traže prijavu): [B-24 Liberator](https://cgtrader.com/free-3d-models/aircraft/historic/consolidated-b-24-liberator) (.blend), [B-17 Flying Fortress](https://cgtrader.com/free-3d-models/aircraft/historic-aircraft/boeing-b-17-flying-fortress-129ed1c57ac1e18d1fa3521aaf0c5a2d) i [B-25 Mitchell](https://cgtrader.com/free-3d-models/aircraft/historic/north-american-b-25-mitchell) (.blend). Agent ih svodi na malo trouglova, kao Hotchkiss, i odvaja elise da se okreću.
3. Ideja za probu (vlasnik, 2026-11-25): pogled pravo odozgo, kao na [planu grada](../assets/images/background/grad.png) i u igri Vis, umesto kamere iza aviona. Prednost: jasno se vidi šta je ispod aviona, pa se pruge, mostovi i fabrike lakše gađaju. Mana: gubi se utisak dubine i leta kroz prostor, a 3D modeli se vide samo odozgo, pa bi i 2D slike bile dovoljne. Pogled pravo odozgo previše liči na Vis (vlasnik, 2026-11-25). Po uzoru na druge igre probaju se dva rešenja, redom: prvo, kao u arkadnom War Thunderu, kamera ostaje iza aviona, a narandžast krug na tlu pokazuje gde bi udarila raketa ispaljena u tom trenutku ([nišan](../core/gameplay/bodies/aircraft/Warplane.js)); drugo, kao u Desert Strike, kosi pogled iza i iznad aviona pod 45°, do kog vodi dugme za kameru.
   - Nišan na tlu ostaje (vlasnik, 2026-11-26).
   - [ ] Vlasnik: probati kosi pogled (dugme za kameru) i reći da li ostaje.
4. [ ] Vlasnik u pregledaču testira lovca: da li se preleti vide i prate, da li mitraljezi na C obaraju lovca i da li je težina dobra (lovac počinje posle 12 s, sledeći dolazi 18 s posle obaranja).

<a id="ig-32"></a>
### IG-32 · Igra Raid on Drvar

[Raid on Drvar](../scenes/drvar/Main.js) je igra odbrane iz prvog lica (vlasnik, 2026-11-24): igrač puca u nemačke padobrance koji se spuštaju na Drvar 25. maja 1944. Kartica je u War Games, posle Visa. Istorijski okvir desanta je u [ISTORIJA](ISTORIJA.md).

**Referenca za 3D Drvar.** Vlasnik je izabrao [Battle for Jablanica](KONTEKST.md#battle-for-jablanica) kao uzor za raspored prizora. Prvi prolaz uređuje pogled sa zapadne kapije, sa saborcima i kamenim zaklonom u prvom planu, putem kroz prepoznatljive ruševine i Šobića glavicom u daljini. Tim putem pristižu Ličani. Isti princip vodi obale Unca i teren oko grada.

Uz zapadni put su postavljene tri izdvojene [ruševine](../assets/models/building/ruins/readme.txt). U dvorištu su lisnati hrastovi od 10 m, a oko njega nagoreli hrastovi od 7 m. [Raspored](../scenes/drvar/scenery.js) ostavlja put otvoren za Ličane. Teren sada daje uzvišenje Šobića glavice, korito i obale Unca, drveni prelaz, stenoviti prilaz pećini i četiri kratera. U gradu su i porušena kamena kuća sa zabatom, namenski spaljeni kamioni i dim koji se razređuje do drugog talasa. Vlasnik sve vizuelne i borbene izmene pregleda zajedno.

Atmosfera: šačica partizana iza improvizovanih zaklona gleda kako elitne nemačke padobranske trupe niotkuda padaju s neba, u ogromnom broju. Scena rekreira fotografije desanta ([drugi talas](https://commons.wikimedia.org/wiki/File:Drugi_talas_padobranaca_spustio_se_izme%C4%91u_groblja_na_Sobi%C4%87a_glavici_i_Grahovske_ceste.jpg), [prašina i dim](https://commons.wikimedia.org/wiki/File:Drvar_je_bio_u_pra%C5%A1ini_i_dimu_od_bombi,_kada_su_se_nad_njim_pojavili_mnogobrojni_padobrani.jpg), [desant](https://commons.wikimedia.org/wiki/File:Desant_nema%C4%8Dkih_padobranaca_na_Drvar.jpg), [pogled iz rova](https://commons.wikimedia.org/wiki/File:Nema%C4%8Dki_vazdu%C5%A1ni_desant_na_Drvar,_25._maja_1944.jpg), [podne](https://commons.wikimedia.org/wiki/File:Oko_12_sati_padobranci_su_ponovo_prekrili_nebo,_Drvar_25._maj_1944.jpg)): nisko prelaze formacije Ju 52, a nebo je posuto padobranima. Na fotografiji iz rova su ranjeni Nemci, ne partizani.

Mesto radnje: uporište „Moskva” kod pravoslavne crkve, gde su se branili opkoljeni partizani. Jedini izvor je potpis fotografije na [sh.wikipedia](https://sh.wikipedia.org/wiki/Desant_na_Drvar): „Napadi esesovaca na »Moskvu«, uporište opkoljenih partizana kod pravoslavne crkve.” Ko je branio, kada i kakav je bio teren, izvori ne kažu; groblje na Šobića glavici bilo je nemačko uporište. Uporište je crkveno dvorište 24 × 20 m, ograđeno starim zidanim kamenim zidom od 1,1 m ([zid](../core3d/geometry/stoneWall.js)), sa ulazom na zapadu, na ravnom terenu grada; okolo su ruševine od bombardovanja ([kamene gomile](../core3d/geometry/rocks.js), improvizovane po vlasnikovom nalogu).

Pravila: igrač počinje uz istočni zid i hoda po dvorištu (WASD, mišem nišani), da bi branio zid na koji Nemci navale; dvorište ne napušta, jer je uporište opkoljeno, a crkva, zidovi i saborci ga zaustavljaju. Miš nišani, levi klik puca; puška ([oružje](../core/gameplay/Firearm.js)) ispaljuje metak pa repetira, a puškomitraljez puca dok se drži klik i posle okvira od 20 metaka puni. Četiri saborca uz zidove, različito obučena kao u Jablanici, sami pucaju i ginu ([upravljač](../core/gameplay/controllers/Defender.js)); igrač preuzima puškomitraljez prvog samo ako on padne, u bilo kom talasu. Dva talasa formacija Ju 52 ([avion](../core/gameplay/bodies/aircraft/Transport.js)) prelaze ispred igrača; [padobranci](../core/gameplay/bodies/characters/Parachutist.js) se pogađaju u vazduhu, a posle sletanja postaju [vojnici iz Neretve](../core/gameplay/bodies/soldiers/CoverSoldier.js), koji trče do najbliže ruševine bliže uporištu i iza nje se povremeno dižu, nišane i pucaju ([upravljač](../core/gameplay/controllers/CoverFighter.js)); bez zaklona u blizini pucaju stojeći. Dva talasa i dolazak pojačanja teku po vremenu igre. U prvom talasu padobranci se rasipaju preko grada uz dim i prelet DFS 230, a u drugom sleću u zgusnutim grupama kod Šobića glavice. Najviše četiri protivnika odjednom nišane ili pucaju u prvom talasu, odnosno šest u drugom. Pobeda nastupa kada prvi saborci iz 3. brigade 6. ličke divizije priđu dvorištu sa zapada, a poraz kad igrač padne. Padobranci u vazduhu su ravne slike; posle doskoka su [3D nemački vojnici](../core3d/actor/soldiers/CoverSoldierModel.js) koji čuče iza zaklona i dižu se da pucaju, a saborci i ambijent su 3D. Igrač čuči dok drži C ili dugme za čučanj na ekranu. Saborci vire da pucaju, a između naleta i pri punjenju ponovo čučnu. Zid zaustavlja rafal čim zakloni metu. Iz prvog lica vidi se kratak deo cevi pri dnu ekrana, usmeren ka nišanu. Pored municije piše naziv trenutnog oružja. Saborci su odmaknuti od zida da im telo i oružje pri animaciji ostanu u dvorištu.

Preostaje:

1. 📋 **Najvažnije (vlasnik, 2026-11-25):** scena je sada pustoš, a treba da bude grad Drvar. Tlo je jednolično, a kuća nema; ruševine grada, kuće i drveće izrađuje Codex kao prave modele, bez crtanja u kodu. Izgled grada: [reference](references/ww2-yu/drvar/README.md). Prvi grad je postavljen (2026-11-25): 13 preuzetih modela kuća i ruševina ([blok](../core3d/actor/buildings/TownHouse.js), u katalogu pod Scenografija → Kuće grada) stoji u ulicama oko dvorišta ([raspored](../scenes/drvar/town.js)), sa otvorenim prostorom pred svakim zidom; padobranac koji sleti na krov izađe pored kuće. Kuće i crkva zaustavljaju metke obe strane; Nemac puca samo na onog koga vidi, bira zaklon iz kog se vidi uporište i do njega ide ulicama oko kuća ([ulice](../scenes/drvar/Streets.js)), a ako ga nema, odlazi do naše ograde. [ ] Vlasnik u igri ocenjuje izgled grada, obala i reljefa.
2. [ ] Planski raspored grada (vlasnik, 2026-11-25), urađen po [taktičkoj karti 25. maja](references/ww2-yu/drvar/drvar-25-maj-1944-mapa.jpg): Unac teče istočno od dvorišta, glavna ulica prolazi zapadnom obalom sever–jug, na severu vodi preko reke ka pećini, a na jugu u srce grada sa još tri ulice; put kroz zapadnu kapiju vodi ka Šobića glavici ([raspored](../scenes/drvar/town.js)). U krugu od 70 m su uglavnom ruševine, a dalje uglavnom čitave kuće; ulice su zemljane, a preko usečenog korita vodi drveni most. Karta nema razmeru, pa su daljine procena. Vlasnik u igri proverava raspored; ruševine pred istočnim zidom se ponavljaju, jer postoje samo dva modela ruševine (vidi sledeću stavku).
3. 📋 Tragovi rata na terenu oko crkve (vlasnik, 2026-11-25): krateri od bombi, golo i polomljeno drveće, slomljene stvari, prevrnuta i spaljena vozila i razaranja. Prvi sloj od postojećeg arta je postavljen ([raspored](../scenes/drvar/warTraces.js), u katalogu pod Scenografija → Tragovi rata): gareži od bombi na tlu, napušteni kamioni Opel Blitz i Kübelwageni, koji zaustavljaju ljude i metke, i razbacana bureta i sanduci municije. Krateri su usečeni u teren, a model spaljenog kamiona već predstavlja prevrnutu olupinu.
4. 📋 Codex (vlasnik, 2026-11-25): obraditi zgrade grada tako da se na njima vide tragovi rata i bombardovanja tog jutra: čađ i garež oko prozora, rupe od gelera, oboreni delovi krova i oštećeni zidovi, kao na [fotografiji](references/ww2-yu/drvar/drvar-porusen.jpg); izmene ostaju u modelima i teksturama, ne prefarbavaju se u igri.
5. [ ] Vlasnik u igri proverava raspored hrastova u dvorištu. Džakovi sa peskom zatvaraju ulaz kao improvizovani bunker ([prikaz](../core3d/actor/buildings/Sandbags.js)); crkva ([model](../assets/models/building/drvar-church/README.md)) i 3D Ju 52 ([prikaz](../core3d/actor/aircraft/Ju52.js)) su u igri.
6. 📋 Igranje nivoa i podešavanje broja padobranaca i težine. Od 2026-11-25 Nemci na zemlji ranjavaju punom snagom do 20 m, a dalje sve slabije, do četvrtine na 120 m ([vrednosti](../core/gameplay/bodies/soldiers/CoverSoldier.js)); padobranaca je manje i dolaze ređe (po tri iz aviona, preleti prvog talasa na 0, 10 i 20 s, a drugog na 0, 4, 16 i 21 s od njegovog početka); vlasnik proverava da li je sada lakše taman koliko treba. Otvoreno je i da li se igra nastavlja kad igrač padne, a saborci su živi.
7. 📋 Snimak kartice na naslovnoj je još iz stare 2D verzije. Novi kadar snimiti tek posle scenografije i precrtanih padobranaca; probni kadri iz pregledača (2026-11-25) bili su prazno nebo i jednolično tlo.
8. [ ] Vlasnik u igri proverava (2026-11-25): Nemac više ne trči nazad do zaklona; uzima najbližu ruševinu ili spoljnu stranu naše ograde koja je bliža uporištu, a bez nje odmah napada sa mesta ([izbor mesta za borbu](../scenes/drvar/fightingPlace.js)). Onaj koji čuči uz našu ogradu može se pogoditi, jer ga branioci vide preko zida. Nemci pucaju samo sa 50 m ili bliže (2026-11-25); onaj koji sleti dalje prvo pritrči do zaklona u dometu ili do 45 m po otvorenom.

- [ ] Vlasnik (2026-11-25): puška repetira za 0,7 s umesto 1,2 s; traka ispod nišana se puni dok puška repetira ili se puni, a gore levo piše „Ammo 3/5“, odnosno „Reloading“. Da li je pucanje sada dovoljno brzo?
- [ ] Vlasnik (2026-11-25): crveni luk oko nišana pokazuje odakle te je pogodak stigao i bledi za 1,5 s (važi u svim igrama iz prvog lica); Nemac pri svakom metku ima bljesak na vrhu puške. Da li sada vidiš ko te gađa?
- [ ] Vlasnik (2026-11-25): hodanje po dvorištu na WASD, uz zaustavljanje na zidovima, crkvi i saborcima; da li prelazak na drugi zid pomaže odbrani.
- [ ] Vlasnik (proba od 2026-11-25): da li 3D vojnici posle doskoka izgledaju dobro, da li prelaz iz slike u model u trenutku doskoka smeta i da li igra ostaje glatka u drugom talasu. Agent je izmerio najgori slučaj, 61 vojnika na zemlji odjednom: kod i priprema crtanja traju oko 7 ms po kadru, ispod 16,7 ms za 60 kadrova; brzinu na pravoj grafičkoj kartici headless pregledač ne meri. Iza ograde od 1,1 m čučeći Nemac pokazuje samo vrh kape, a zaklon niži od 1,05 m ga ne skriva i tada se može pogoditi.

<a id="ig-33"></a>
### IG-33 · German Advance kao promo animacija sajta

Animacija [German Advance](../scenes/bitka/Main.js) produžena je na 24 s: scena traje 18 s, zatim prelazi na logo **Partisan Games**, drži ga 4 s i zatamnjuje pre ponavljanja. Logo koristi piksel font i zvezdu sajta. Ostaje na postojećoj kartici u meniju; [provere](TESTING.md#art-verification-record) su izvršene bez pregledača.

Kolona ima tri grupe sa po tri pešadinca i jednim tenkom, sa razmaknutim koracima, pucanjem i znacima za napredovanje. Strelac sa rancem i podoficir imaju nove crteže u izvornom stilu i zajedničke animacije u katalogu i sceni. Preostaje vlasnikov pregled pokreta, putanje kamere i čitljivosti loga u pregledaču. Promo tok pripada sceni.

Po nalogu vlasnika (2026-11-25) svi novi akteri dorađeni su u tačno duploj rezoluciji, sa vidljivim pikselima, bez glatkih vektorskih kontura i četvorostruke razrade. Ranije prihvaćeni stil ostaje merilo iz [pravila arta](ART.md#pravila-pripreme-i-ponovne-upotrebe); preostaje vlasnikov pregled nove dorade u sceni i katalogu.

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

- [ ] Vlasnik u pregledaču proverava raspored i izgled scene, praćenje tenka bez zaglavljivanja, pucanje obe strane i koliko saboraca preživi kad tenk projuri ili prvo očisti položaje.
- [ ] Vlasnik u pregledaču proverava da se pri puštanju Space granata rasprsne na prvom što pogodi, ubija Nemce u krugu od 4 m, odbacuje sanduke i ostavlja trag na zidu ili tlu. Proveriti i punjenje od 1,5 s i kočenje strelicom nazad. [Top tenka](../core3d/physics/TankGun.js)

Gusenice Hotchkissa stoje dok tenk vozi (vlasnik, 2026-11-25). Predlog: tekstura gusenice klizi duž nje brzinom svoje strane, različito pri skretanju i unazad u suprotnom smeru. Provereno (2026-11-25): gusenice su zasebni delovi `track-left` i `track-right` sa svojim materijalom, ali je tekstura atlas, pa svaki članak uzima drugi deo slike i klizanje teksture ne radi. Zato Codex [modelu](../assets/models/tank/hotchkiss-h35.glb) zamenjuje gusenice jednostavnim prstenom sa teksturom članaka razvučenom duž prstena, pod istim imenima; agent zatim pomera teksturu. Točkovi hodnog dela su jedan komad sa trupom; mogu se izdvojiti kao kod lokomotive, ali se iza gusenica jedva vide.

### IG-35 · Igre na telefonu

Radi se na kraju, kad su nivoi gotovi (vlasnik, 2026-11-26). Na početnoj strani su sakrivene na telefonu (`hide-on-mobile` u [index.html](../index.html)): Ustanak, Crveni krst, Aerodrom, Drvar, Tenkići i Do Trsta. FPS igre od 2026-11-26 imaju komande za dodir (prevlačenje za pogled, strelice, pucanje, a u Crvenom krstu još šunjanje i uzimanje oružja), pa ih koči još samo brzina. Pre svakog otključavanja izmeriti kadrove i broj poziva za crtanje u igri na usporenom procesoru (Chrome, 4× sporije), pa je vlasnik proba na telefonu.

- **Drvar:** stotinak kuća grada su klonovi istih 13 modela; crtati ih kao jedan instancirani crtež po vrsti, senke samo blizu crkve, daleke kuće bez senki.
- **Crveni krst i Aerodrom:** izmeriti; ako drže kadrove, otkriti ih na telefonu.
- **Tenkići:** i dvojica igraju na jednom telefonu, naizmenično istim komandama na dodir (vlasnik, 2026-11-26); proveriti da dugmad vode igrača koji je na potezu, pa otkriti oba načina.
- **Ustanak:** igra za dvojicu traži tastaturu; proveriti da li igra protiv računara ima sve komande na dodir, pa otkriti samo nju.
- **Do Trsta:** utvrditi zašto je sakrivena, pa rešiti uzrok.
- **Sve 3D igre:** na telefonu ograničiti gustinu piksela platna (na primer najviše 1.5), jer ekran od 3× crta devet puta više piksela.

## Notes

Waiting: čeka navedeni zavisni posao.

1. <a id="note-1"></a>**IG-14:** dosadašnji izbori su povezani; [art](ART.md#dopune-iz-plana-ideja--predaja-arta) i [provere](TESTING.md#predaja-arta-iz-plana-ideja). Čeka se izbor novih kandidata.
