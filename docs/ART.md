# ART

Pravila izrade i veze do izvora. Otvoreni poslovi su u [PLAN-u](PLAN.md#art), provere u [TESTING](TESTING.md#art-verification-record), a tema i prihvaćeni izbori igara u [KONTEKST](KONTEKST.md).

## Bf 109 — zajednički 3D prikaz

[Bf 109 K-4](../assets/models/aircraft/messerschmitt-bf-109/README.md) sa 1.886 trouglova je lovac u Ratweeku, Franji Kluzu i oba kataloška prikaza (2026-11-28). Koristi sopstveni odvojeni propeler; raspon je 9,92 m prema projektnim merama. Izdvajanje propelera mora sačuvati sve trouglove i UV koordinate, a svaka instanca rotira samo svoj primerak.

## Renault FT — 3D tekstura

[Renault FT](../assets/models/tank/renault-ft/README.md) koristi tamnozeleni albedo i nacrtane detalje ploča oklopa, sa tamnim hodnim delom i pokretnim gusenicama. Crtež zakovica, šarki, proreza i habanja poravnat je sa četiri pogleda na postojeću mrežu, jer se izvorne UV oblasti preklapaju. Katalog i igre koriste zajednički opis tenka. [Izvor i priprema](../assets/models/tank/renault-ft/plates.json).

Kod [Renaulta FT](../core3d/actor/derived/RenaultTracks.js) tekstura obe gusenice prati pređeni put i smer vožnje, a pri okretanju u mestu jedna ide napred, druga nazad. Isti prikaz se koristi u igri i katalogu. [Hummel](../assets/images/sources/vehicles/hummel/drive-generation.json) ima mirnu pozu i četiri kadra u kojima se menja samo hodni deo.

## Pravila pripreme i ponovne upotrebe

**Novi 3D modeli dolaze od vlasnika, ne od Codexa (vlasnik, 2026-11-27).** Codex dorađuje postojeće modele i teksture. Kad modela nema, igra koristi najbližu zgradu ili predmet iz projekta, koju Codex po potrebi dorađuje (vlasnik, 2026-11-28).

<a id="precrtavanje-uniformi"></a>
**Precrtavanje odeće i uniformi u 2D i 3D (vlasnik, 2026-11-27).** Kod partizana se odeća može menjati i kombinovati s istorijski primerenim zaplenjenim komadima različitih uniformi. Kod nemačke, italijanske i drugih regularnih vojski pri precrtavanju sačuvati propisanu osnovnu boju i šaru uniforme prema potvrđenom prikazu jedinice i perioda. Pixel art menja način crtanja, a propisana boja i šara ostaju iste.

**Jednobojna tkanina.** Držati jednu osnovnu boju i blage nijanse iste boje uz nabore i šavove. Široke fleke, pruge i jak kontrast na jednobojnoj odeći stvaraju utisak maskirne šare. U 3D prepustiti glavno senčenje svetlu scene. Pre predaje proveriti da se i pri uobičajenoj veličini prikaza svaki jednobojni komad čita kao jedna boja.

- Foldere resursa imenovati po sadržaju, bez sufiksa `-reserve`; status rezerve beležiti u opisu resursa (vlasnik, 2026-11-25).

- Koristiti postojeći odgovarajući resurs pre izrade duplikata. Istorijsko prihvatanje izvora ne znači da je crtež konačan: `game-ready`, novi atlas, povezivanje i prolaz testova nisu ocena kvaliteta.
- Izvorne sličice iz zbirke ideja ne unositi direktno u igru ni katalog: obraditi ih, precrtati u usvojenom stilu, animirati, pa povezati isti završni art svuda (ispravka vlasnika, 2026-11-25, vojnici i tenk iz The Germans Advance). Pakovanje originala u atlas, pomeranje isečaka i animiranje gusenica nisu precrtavanje. Pre povezivanja proveriti poreklo osnovnog crteža i sastavljenog aktera, uključujući posadu; proceduralni pokret je dozvoljen tek na odgovarajućem precrtanom artu.
- Za The Germans Advance precrtavanje mora zadržati stil, paletu i proporcije originalnih sličica; zamena drugim, realističnijim ilustrativnim stilom nije prihvaćena (ispravka vlasnika, 2026-11-25). Očuvanje stila ne znači očuvanje male rezolucije: precrtani i animirani likovi moraju imati dovoljno stvarno nacrtanih detalja za najveći planirani prikaz, uključujući krupne kadrove. Ne tražiti namerno grube, uvećane piksele niti svoditi nove crteže na malu rezoluciju originala pa ih ponovo uvećavati; izglađivanje ne nadoknađuje izgubljene detalje. Isti završni art koristi se u katalogu i sceni.
- Sadašnji crtački stil The Germans Advance vlasnik je izričito prihvatio kao sjajan (2026-11-25). Dalje precrtavanje poboljšava samo kvalitet i razlučivost unutar tog istog stila; ne menja izgled, paletu, proporcije ni karakter crteža. Odobrena dorada je tačno dvostruka rezolucija, uz vidljive piksele i stepenaste konture; četvorostruka razrada i glatke konture nalik SVG ilustraciji nisu tražene. Mere aktera u svetu i njihova prirodna veličina u katalogu ostaju iste.
- Merilo German Advance promo animacije je prirodno napredovanje manjih grupa različitih pešadinaca uz tenkove, sa smislenim kadriranjem i očuvanim kvalitetom crteža izbliza; mnoštvo jednakih kopija nije zamena za raznovrsnost (potvrda vlasnika, 2026-11-25). Prolaz tehničkih testova ne potvrđuje vizuelni kvalitet niti vlasnikovo prihvatanje.
- Crtati za stvarnu veličinu u igri: čitljiva silueta, uverljive proporcije, usklađena paleta i senčenje. Uvećana ilustracija koja se ne čita kao mali sprite nije upotrebljiva predaja. Proceduralni pokret je dovoljan kada jasno prikazuje radnju.
- Svaki precrtani tenk treba da ima vožnju sa vidljivim kretanjem gusenica. U katalogu omogućiti mirovanje i vožnju preko istog prikaza koji koristi igra. Proveriti da gusenice miruju kad tenk stoji, da prate smer vožnje i da se animacija ponavlja bez vidljivog skoka.
- Posadu proveriti na sastavljenom vozilu: odnos glave prema telu, čoveka prema vozilu i položaj iza oklopa moraju biti prirodni u svim kadrovima. Vlasnik je na [Sd.Kfz. 251](../assets/images/game-ready/vozila/sdkfz251-sprites.webp) ukazao na nesrazmernu glavu i vojnika; čitljivost nije opravdanje za karikaturalno uvećanje.
- Poboljšanje crteža ne podrazumeva promenu prihvaćenog stila. Odvojeni deo uporediti sa starim crtežom i u sklopu celog aktera; ne razvlačiti ga nezavisno po širini i visini samo da popuni zadati pravougaonik. Somuina cev pokazala je gubitak metalnog izgleda i promenu proporcija pri takvoj zameni.
- Pre izmene utvrditi identitet, pogled, smer, razmeru, sidrište, oslonac i dozvoljene promene. Prazne margine atlasa ne menjaju mere tela i sudara. Isti tip vozila u različitom pogledu nije automatski zamenljiv resurs.
- Sačuvati prihvaćene delove. Za ograničene pokrete proveriti piksele izvan dozvoljene maske; različit hash ne dokazuje dobru animaciju. Nova poza ne sme promeniti razmeru prethodnih kadrova. Razlomljene ćelije postojećeg atlasa nisu same po sebi greška.
- Pregledati stanja redom i proveriti šta igrač zaključuje iz završne poze. Na kući-bunkeru rupe od metaka ostaju vidljive u kasnijim fazama dok je isti zid još na mestu. Pogođeni komandir treba da padne preko kupole i ostane vidljiv van tenka, da se njegov pogodak jasno razlikuje od ulaska u kupolu.
- Kadrove novih i prepakovanih 2D atlasa ne pakovati neposredno jedan uz drugi: obavezno ostaviti najmanje četiri potpuno providna piksela oko svake ćelije, odnosno najmanje osam između crteža susednih kadrova (nalog vlasnika, 2026-11-25). Razmak opisati kroz `gutter` u mapiranju i uskladiti svako isecanje, uključujući kupole, pucanje i ugrađene olupine; dimenzije samog kadra, sidrišta i mere aktera ostaju iste. Proveriti providnost razmaka, očuvanost svih piksela kadra i prikaz pri uvećavanju: susedni rub može se pokazati kao neželjena crta, kao kod 2D tenkova. Detalji provere su u [TESTING](TESTING.md).
- Pregledati alfu i providne rubove na neprozirnoj podlozi. Slab generisani veo može pokvariti granice figure; ukloniti ga na izvoru, obnoviti reference i porediti vidljivu visinu i oslonac pre i tokom pogotka, umesto ispravljanja razmere u rendereru. Poze jednog klipa dele razmeru i registraciju, bez pojedinačnog sabijanja tela.
- Razdvojiti telo, pokretne delove i efekte. Metak/plamen izlazi iz stvarne cevi; bomba ostaje u šaci do otpuštanja. Ogledanje prati ceo sklop i njegove tačke događaja. Rov i teren nisu deo figure; krupan kadar nije celo telo.
- Stvarni propeler menja projekciju oko osovine, ne okreće se kao ploča u ravni slike. Generisano preokrenuta olupina ne sme ponovo dobiti istu rotaciju u igri. Završni kadar pada ostaje prema ugovoru aktera.
- Delovi koje sprite crta uz telo, poput mitraljesca u prozoru kuće-bunkera, dobijaju veličinu u metrima preko projekcije, ne u pikselima crteža. Katalog crta 40 px/m, a igra može manje, pa deo zadat u pikselima ispada pogrešne veličine i na pogrešnom mestu (2026-11-26).
- Konačni vojni art čuvati po vrsti opreme u [game-ready](../assets/images/game-ready/). Izvor, stvarni prompt, poreklo, hashovi i ponovljiva priprema ostaju uz resurs; tok pokušaja i duplirani opisi rada ne pripadaju ovoj dokumentaciji.

<a id="stil-aerodromske-posade"></a>
**Stil:** ceo projekat koristi jedan stil, realističan piksel art; nivo ne dobija zaseban stil (vlasnik, 2026-11-23). Za pešadiju to znači ozbiljna odrasla lica i uverljive proporcije. Korekcija karikaturalnosti nije nalog za fotorealizam.

<a id="razmera"></a>
**Razmera (vlasnik, 2026-11-23):** telo u metrima je stvarne veličine, a crtež ima izvornu razmeru svoje grupe igara: 40 px po metru za bočne igre i igre odozgo, 100 px po metru za igre spreda (Otpisani, Neretva). Osnova grupe je najveći prikaz u bilo kojoj njenoj igri, pa slika nikad nije manja od veličine u kojoj je igra crta; slika se ne umanjuje ispod toga, a sitnija slika se precrtava, ne uvećava. Katalog prikazuje predmete u toj prirodnoj razmeri ([scales.js](../catalog/scales.js)); samo igra sme da ih umanji. To je jedini dopušten tok.

### Uklapanje cele scene — pouke pokušaja Bunkera

- Pre nove grafike istražiti datum, teren, rastinje i objekte; potvrđeno odvojiti od procene. Za Bunker koristiti [istraživanje Krupnja](ISTORIJA.md#krupanj-1941--polazište-za-igru-bunker).
- Prvo složiti jedan zajednički kadar u stvarnoj veličini igre: lik, mina, zgrada i teren. Utvrditi jedinstven ugao gledanja, razmeru prema čoveku, ravan tla, stil detalja i osvetljenje; tek potom dorađivati zasebne resurse. Dobra pojedinačna slika ne dokazuje dobru scenu.
- Bočni lik, mina odozgo, frontalna zgrada i kosa pozadina ne postaju usklađeni samom paletom i senkama. Proveriti veličinu mine prema stopalu, vrata i spratova prema čoveku, dodir sa tlom i zaklanjanje; pozadina ne sme nadjačati aktere.
- Promena arta nije razlog za usputno menjanje sudara, broja prepreka ili rasporeda igre. Sačuvana bolnica je studija za buduće uklapanje, nije prihvaćena kao konačan art i nije povezana sa igrom; odbačeni teren i mine ne čuvaju se kao alternative.

### 2D scenografija i pali borci

- Vojnici u stanju `dead` mogu se koristiti kao scenografija mrtvih tela, odnosno palih boraca (vlasnik, 2026-11-28): njihov završni kadar pada već je nacrtan i usklađen sa živim vojnikom, pa nije potreban poseban crtež.
- Isto važi za vozila: njihovo stanje olupine može se koristiti kao scenografija uništenih vozila (vlasnik, 2026-11-28).
- Pali borac ima opuštenu vilicu i šake. Pad treba da se vidi po osloncu tela i asimetričnom položaju udova, a blato i prigušeni tragovi krvi na odeći daju kontekst bojišta. Izbegavati pozu sna i prenaglašen grč lica.
- Pre izvoza proveriti gde su lice, grudi i leđa i ispratiti svaki vidljivi ud od ramena do šake ili od kuka do čizme. Ako je ud iza tela, nacrtati samo deo koji se zaista vidi. Pregledati uvećan crtež zbog anatomije i isti kadar u veličini igre zbog čitljivosti. Zadržati mali izbor poza jasnih silueta. [Pali borci u katalogu](../pages/catalog.html#scenografija/partisan-fallen-prone).
- Kada igra koristi odvojene slike, uskladiti im pogled, paletu i svetlo pri zajedničkom prikazu. Na Visu se providne ivice ostrva i baze proveravaju preko istog mora. Pre zamene resursa proveriti šta igra računa iz dimenzija slike i oslonca. U Franji Kluzu širina zgrade određuje početak piste, a na Visu osa nacrtane piste mora pratiti putanju sletanja. [Pista u Franji Kluzu](../scenes/franjo-kluz/Airfield.js) i [sletanje na Vis](../scenes/vis/Baza.js).

### Završna dorada 3D scene — primer Drvara

Postupak je vlasnik projekta prihvatio na početnom kadru iz crkvenog dvorišta u Drvaru (2026-11-26). Za druge 3D scene primeniti isti princip kompozicije, a paletu prilagoditi mestu i dobu dana.

- Kadar složiti sa stvarne početne pozicije i visine pogleda igrača. U Drvaru je početna pozicija povučena malo od istočnog zida, pa su mitraljezac i zid u prvom planu, porušena kuća sa prepoznatljivim zabatom je orijentir u srednjem planu, a iznad nje ostaje otvoreno nebo na kome se čitaju padobranci. Jablanica je referenca za raspored planova i jasan arhitektonski orijentir. [Početni pogled i raspored ruševina](../scenes/drvar/scenery.js).
- Razdvojiti planove svetlom i bojom u samoj sceni. U Drvaru toplo usmereno jutarnje svetlo i senke izdvajaju obližnje zidove, a hladnija izmaglica i postepen prelaz boje neba daju dubinu brdima. Globalna sepija je uklonjena jer je davala isti ton svim planovima i interfejsu. [Osvetljenje i nebo](../scenes/drvar/Main.js).
- Povezati odvojene modele istom razmerom materijala u metrima. Na dvorišnom zidu i ruševini Drvara kamen se ponavlja na 2,5 m, a ista tekstura se nastavlja preko pročelja, prozorskih parapeta i zabata. Nagoreli delovi dobijaju tamniji ton kamena. [Priprema modela kuće](../scripts/build-drvar-props.py).
- Posle završne dorade proveriti kadar sa najviše vidljivog terena i ponovljenih objekata tokom igre. Na Ratweeku su smanjena tekstura i grupisano drveće rasteretili prikaz, a čitljivost njiva i puteva proverena je iz ugla kamere u letu. Statičan kadar služi za poređenje izgleda, a učinak na brzinu potvrđuje merenje u igri.
- Crveni krst i Kraljevo koriste tanje i blaže konture radi čitljivosti figura i vozila. Ratweek se oslanja na svetlo, paletu i izmaglicu za odvajanje prvog plana od daljine. Za poređenje istog kadra parametar `outline` u adresi prima `on`, `soft` ili `off`.

## Drvar — crkva

[3D Ju 52](../assets/models/aircraft/ju52/README.md) koristi isti prikaz u Drvaru i katalogu: mirovanje, let i obaranje, sa tri rotirajuća propelera i dimom pri oštećenju. Optimizacija spaja jednake materijale i neprozirne nepokretne delove: 66 → 5 materijala i 66 → 12 primitiva, uz očuvanih 9.061 trougao, ugrađene teksture i odvojene propelere. Poreklo i nepotvrđena prava ponovne upotrebe čuvaju se uz izvorni model.

[Crkva](../assets/models/building/drvar-church/README.md) je oblikovana prema fotografiji koju je vlasnik zadao: kamena fasada, dvovodni krov, četvrtast zvonik sa piramidalnim četvorovodnim krovom, lučni prozori i ulaz. Visina od 11 m je procena, ne istorijska mera. Isti model je u sredini dvorišta Drvara i u katalogu pod Ambijent / Drvar; izvor, ponovljiva izrada i offline prikaz čuvaju se uz model.

[Padobranac](../assets/images/game-ready/vojnici/drvar-padobranac.webp) je prihvaćen 26. 11. 2026. Isti kadar koriste Drvar i katalog aktera. Figura pod kupolom meri 180 px pri razmeri 100 px/m, odnosno 1,8 m u igri. [Izvor i priprema](../assets/images/sources/nemci/padobranci/generation.json).

<a id="crveni-krst-priprema-3d-ambijenta"></a>
## Crveni krst — priprema 3D ambijenta

[Ilija](../pages/catalog.html#drugi-svetski-rat-3d/logoras-ilija), [Petar](../pages/catalog.html#drugi-svetski-rat-3d/logoras-petar) i [Jovan](../pages/catalog.html#drugi-svetski-rat-3d/logoras-jovan) imaju zasebna lica i civilnu odeću na zajedničkom FBX-u. Ilija je niži i širi, u smeđoj vuni, prosede brade. Petar je visok i uži, u tamnoplavoj bluzi, sa tankim brkovima. Jovan nosi svetliju košulju i kapu, sa kestenjastom kosom i obrijanim licem. Razlike u širini i visini koristi ceo akter, uz isti kostur i pokrete. [UV izvori, promptovi i priprema](../assets/images/sources/prisoners-pixel-art/source.json).

[Preuzeti džakovi sa peskom](../assets/models/props/sandbags/README.md) čuvaju dostavljenu teksturu i 2.324 trougla; zid je visok procenjenih 1,1 m. Isti prikaz je u katalogu pod Scenografija → Zakloni , kao dva puna zaklona uz bočne strane dvorišta Crvenog krsta i kao zid preko ulaza u crkveno dvorište u Drvaru. Sredina dvorišta i izlaz ostaju prohodni; raspored nije istorijska rekonstrukcija.

Osnova su [istorijsko istraživanje](ISTORIJA.md#crveni-krst-12-februar-1942), [tri pregledane reference](references/ww2-yu/crveni-krst/README.md) i [dogovor da lavirint ostane kroz smislene prolaze i dvorišta](KONTEKST.md#escape-concentration-camp). Prvi [originalni paket](../assets/models/building/crveni-krst/README.md) ima sedam GLB modela i deljeni atlas, dostupne [u katalogu](../pages/catalog.html#scenografija-3d/sklop) i povezane [u nivou](../index.html#crveni-krst). Sačuvani su generisana studija i dva mala offline prikaza stvarne geometrije, uključujući visinu očiju; prikazi nisu screenshot nivoa niti potvrđen tlocrt. Žica i puni zaklon jasno se razlikuju, jer imaju različita pravila za pogled i metke; arhitektura i paleta ostaju zasnovane na ovom logoru.

| Predmet pripreme | Specifikacija za narednu izradu |
|---|---|
| Glavni objekat | Originalan jednostavan model dugog zidanog magacina, prema referentnoj silueti; fasada sa ponovljivim prozorima i vratima, krov, dimnjaci. Meriti prema postojećem čoveku od 1,78 m; predložene metre beležiti kao procenu, ne istorijsku meru. Ne praviti niz generičkih drvenih baraka. |
| Ograda i kapija | Pravi i ugaoni modularni segment, završni stub i dvokrilna kapija. Prvi paket koristi jeftinu geometriju niti i bodlji umesto planiranih alpha ravni: praznine ostaju stvarne i za raycast. Proveriti čitljivost i treperenje sa nekoliko metara u stvarnom rendereru; tačke spajanja su dokumentovane uz modele. |
| Kula i reflektor | Originalan model prema drvenoj silueti reference; svetiljka odvojena radi usmeravanja. Broj i istorijske granice pratiti iz istraživanja; obilazak svetlosnim snopom je predlog efekta, ne potvrđena radnja straže. |
| Materijali | Zajednička paleta prigušenog maltera, starog drveta, metala i krova. [Atlas](../assets/models/building/crveni-krst/materials.png) je nastao ugrađenim `image_gen`; izvorna slika 1254² zadržana je bez vizuelnih izmena, umesto početnog predloga 1024². Žica deli postojeće materijale. |
| Teren i svetlo | [Izvorni postupak](../scenes/crveni-krst/campTerrain.js) slika gaženi sneg prema otvorenim prolazima svakog rasporeda. Podnožja magacina i kula i trag oko izlaza izdvajaju postojeće orijentire. Udaljeni krovovi i nizak obod su naslikani u panorami sa bojom usklađenom s maglom. Osvetljenje reflektora prati postojeći sistem opažanja straže. |

Pre izvoza proveriti perspektivu, visinu vrata prema čoveku, zajedničku gustinu detalja, dodir sa tlom i čitljivost žice na snegu. Modeli u metrima, oslonac na Y=0, položaji priključaka dokumentovani; geometrija i materijali se dele među segmentima. Za statične sklopove koristiti GLB bez nepotrebnih kostiju i skrivenih delova. Nove teksture i modele praviti originalno, sa promptom/postupkom, licencom, dimenzijama i hashovima; arhivske slike nisu runtime teksture.

Postojeća [kula](../core3d/actor/buildings/buildingModels.js) nije izabrana za ovaj nivo: izgled još nije upoređen, a [priložena licenca](../assets/models/building/tower/ww2/License.txt) navodi samo ličnu/studentsku upotrebu bez plaćenog članstva. Postojeće kućice nisu dokaz istorijske sličnosti. Priprema ne menja prihvaćene aktere ili zajednički generator lavirinta.

## Uslovi završetka zadataka

<a id="obavezna-integracija"></a>
### Obavezan korak svake dopune: kod, katalog i svi nivoi

1. Pretragom resursa, klase i konfiguracija pronaći sve potrošače.
2. Povezati novi art u zajedničkom prikazu ili mapiranju aktera, uz očuvanje mera, oslonaca i tačaka pucnja. Nivoi i katalog koriste isti resurs.
3. Omogućiti relevantne radnje u [katalogu aktera](KATALOG.md#stavke-kataloga-i-varijante); poseban HTML/GIF nije zamena za priču i upotrebu u igri.
4. Novo vozilo ili avion dobija stvarne podatke i svoje vrednosti igre (vlasnik, 2026-11-26). Masa, najveća brzina i naoružanje idu u [STATISTIKE](STATISTIKE.md) i [modelStatistics](../core/gameplay/modelStatistics.js), a katalog ih ispisuje. Brzina, izdržljivost, vatrena moć i bombe, izvedeni iz tih podataka, idu u [modelPerformance](../core/gameplay/modelPerformance.js). Tako se modeli razlikuju i u igri, kao avioni u Visu i bombarderi u Ratweek-u, a ne samo izgledom.
5. Proveriti učitavanje, prelaze, pokret, završetak, oba smera, pauzu i reset u katalogu i pogođenim nivoima. Skrolovanje ne pokreće animaciju vožnje mirnog vozila. Izvršne provere prate važeću dozvolu.
6. Sačuvati izvor i metapodatke, obnoviti indeks i zabeležiti stvarne dokaze u TESTING. Stavku zatvoriti kada je dogovorena celina gotova; vlasnikov pregled i izričito odložene provere navode se odvojeno.

## Resursi i zajednički potrošači

Kadar, trajanje, sidrište, tačke događaja i putanje završnih slika čitaju se iz metapodataka ispod. Trenutna stanja i upotreba pripadaju kodu i [katalogu](../pages/catalog.html); ovde se ne prepisuju opisi gotovih animacija.

### Pešadija i posade

| Resurs | Metapodaci / izvor |
|---|---|
| Italijanski strelac za Ustanak | [Atlas](../assets/images/game-ready/vojnici/italijanski-strelac-sprites.webp), [poreklo i priprema](../assets/images/sources/talijani/ustanak-strelac/generation.json), [radnje u katalogu](../pages/catalog.html#vojnici/italijanski-strelac). Prikaz 88 × 80 pri 40 px/m, kao kod partizanskog strelca. |
| Frontalna pešadija u Otpisanima | [Strelac sa puškom](../pages/catalog.html#vojnici/otpisani-strelac) i [stražar u šinjelu](../pages/catalog.html#vojnici/otpisani-strazar) dele isti pixel art stil. Njihovi atlasi ([strelac](../assets/images/game-ready/vojnici/otpisani-rifleman-pixel-sprites.webp) i [stražar](../assets/images/game-ready/vojnici/otpisani-sentry-pixel-sprites.webp)) imaju isti raspored redova za mirovanje, hod u oba smera, pucanje, pogodak i pad. |
| Punjenje nemačkog strelca | klip prati spremnik nacrtanog oružja i nije zamena za punjenje drugih pušaka |
| The Germans Advance | [Zajednički prikaz](../core/actor/AdvanceSprite.js) za strelca, mitraljesca, strelca sa rancem, podoficira, Panzer III i vojnika na kupoli. Strelac ima čučeći hod, a podoficir znak rukom; klečanje, pucanje i davanje znaka zaustavljaju pomeranje. Položaj cevi je izmeren u kadrovima pucanja. Promo traje 24 s, sa 18 s scene i završnim [logom](../scenes/bitka/PromoLogo.js) u piksel fontu sajta, uz zvezdu; [vremenski tok](../scenes/bitka/PromoTimeline.js) pripada sceni. |

<a id="cetnici-bocni-spriteovi"></a>
Bočni četnici koriste [metapodatke atlasa](../core/actor/soldiers/cetnikArt.js) od 144 px po stojećoj figuri, prikazanoj kao 1,8 m pri 40 px/m. [Strelac](../pages/catalog.html#vojnici/cetnik-strelac), [jurišnik](../pages/catalog.html#vojnici/cetnik-jurisnik) i [mitraljezac](../pages/catalog.html#vojnici/cetnik-mitraljezac) su u katalogu. [Poreklo, promptovi i hashovi](../assets/images/sources/cetnici/generation.json) povezuju originalne uzore, precrtane izvore i završne atlase. [Priprema](../scripts/prepare-cetnik-art.py) meri oslonac i kraj cevi, pa pakuje kadrove sa providnim marginama. Referentne slike određuju izgled ove tri figure.

U 3D katalogu i u Opsadi Kraljeva su četnik strelac sa šajkačom, puškom i animacijama postojećeg partizana i četnik sa crnom šubarom izveden iz Nikoletine. Na šubari je nacrtana kokarda, a kosa i brada na teksturi lica i potiljka. [Četnik strelac](../pages/catalog.html#drugi-svetski-rat-3d/cetnik-strelac-3d) · [Četnik sa šubarom](../pages/catalog.html#drugi-svetski-rat-3d/cetnik-subara-3d)

[Četnik strelac · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/cetnik-strelac-3d/pixel-art) je probna varijacija sa starijim licem, prosedom bradom i jednobojnom odećom u paleti izvornog modela. Šajkača i kokarda koriste izvorne materijale. Četiri mape od 256 × 256 i mapa usana od jednog piksela zauzimaju oko 9,5 kB i oko 1,33 MiB sa mip nivoima. Model u Three.js ima 6.206 trouglova i deset grupa za crtanje nakon grupisanja po materijalu. [Izvor i priprema](../assets/images/sources/cetnici/cetnik-strelac-3d-pixel-art/generation.json).

Na [četniku sa šubarom](../pages/catalog.html#drugi-svetski-rat-3d/cetnik-subara-3d) je ručno precrtana kokarda M/72 na providnoj teksturi od 64 × 64. Orao, kruna, venac i monogram su u nijansama srebra, a između njih se vidi crna šubara. [Priprema i poreklo](../assets/images/sources/cetnici/kokarda-m72/source.json). [Muzejski predmet](https://www.pokmuz-ce.si/sl/zbirke/kokarda-s-kape-castnika-vojske-kraljevine-jugoslavije/).

Probna Pixel art varijacija četnika sa šubarom ima novo lice, kosu i gušću tamnu bradu na teksturi od 1024 × 1024. Obe varijacije koriste isti model, animacije i srebrnu kokardu, a osnovna ostaje prvi prikaz u katalogu. [Probna varijacija](../pages/catalog.html#drugi-svetski-rat-3d/cetnik-subara-3d/pixel-art) · [Poreklo i priprema](../assets/images/sources/cetnici/cetnik-subara-pixel-art/generation.json).

Šinjel je isključivo zimska uniforma; [metapodaci kandidata](../core/gameplay/frontEnemyKinds.js) ograničavaju stražara na zimu.

Partizan otpozadi ima pogled iz zadnje tri četvrtine i bočnu izvornu razmeru 40 px/m u [katalogu](../catalog/stories/partisans.js); nije frontalni neprijatelj od 100 px/m. Neretva ga prikazuje pri 38 px/m. Njegovo telo ostaje visoko 1,8 m; pogrešnu grupu prikaza ne ispravljati smanjivanjem tela ili samo pojedinačne slike.

Neretva i Otpisani imaju istu perspektivu spreda i dele pešadiju spreda (odluka vlasnika, 2026-11-23): frontalni kandidati, Okupator i Nemac i Četnik spreda crtaju se i biraju za obe igre, a godišnje doba i dalje ograničava izbor po nivou. Hod spreda prati pređeni put, pa dužina koraka nacrtanog lika ide uz njegove metapodatke.

### Vozila i oruđa

| Resurs | Metapodaci / izvor |
|---|---|
| Sd.Kfz. 251 i Sd.Kfz. 222 | olupina drži jedan kadar |
| Sedam vozila za Do Trsta | Zündapp K600, BMW R12, Sd.Kfz. 231, Pz.Kpfw. 612, Horch 830 BL, Marder II i Elefant dele telo i prikaz u katalogu i nivou. Motori i automobil nemaju montirano oružje. |
| Odvojene cevi glavnih tenkova | [partizanska](../assets/images/game-ready/tenkovi/partizanski-tenk-cev-pixel.webp), [nemačka](../assets/images/game-ready/tenkovi/nemacki-tenk-cev-pixel.webp), [Somua](../assets/images/game-ready/tenkovi/somua-s35-barrel.webp) |
| Delovi oruđa | [poljski top: cev](../assets/images/game-ready/artiljerija/field-gun-barrel-pixel.webp) i [lafet](../assets/images/game-ready/artiljerija/field-gun-carriage-pixel.webp); [Flak: postolje](../assets/images/game-ready/artiljerija/flak38-postolje.webp) i [cev](../assets/images/game-ready/artiljerija/flak38-cev.webp); [PaK: postolje](../assets/images/game-ready/artiljerija/pak38-postolje.webp) i [cev](../assets/images/game-ready/artiljerija/pak38-cev.webp) |
| Utvrđeni položaji | [kuća-bunker](../assets/images/game-ready/artiljerija/house-bunker-pixel.webp), [betonski bunker](../assets/images/game-ready/artiljerija/betonski-bunker.webp), [oštećenje](../assets/images/game-ready/artiljerija/betonski-bunker-damaged.webp) i [ruševina](../assets/images/game-ready/wrecks/betonski-bunker.webp), [obalni položaj](../assets/images/game-ready/polozaji/mitraljesko-gnezdo-odozgo.webp), [mitraljez](../assets/images/game-ready/polozaji/shore-mg-gun.webp), [posada](../assets/images/game-ready/polozaji/shore-mg-crew.webp) |
| Bunker: sačuvana studija bolnice, nije povezana sa igrom | [slika](../assets/images/buildings/bunker-house.png) |
| Osnovni brodovi | [partizanski čamac](../assets/images/game-ready/brodovi/partizanski-camac.webp), [oštećenje](../assets/images/game-ready/brodovi/partizanski-camac-damaged.webp), [olupina](../assets/images/game-ready/wrecks/partizanski-camac.webp), [S-30: trup](../assets/images/game-ready/brodovi/schnellboot-s30.webp), [palubno oruđe](../assets/images/game-ready/brodovi/s30-deck-gun.webp) |

Poljski top Ustanka je zajednički prihvaćen crtež za obe posade. Sličnost sa [Schneiderom 155 L iz 1918.](https://en.wikipedia.org/wiki/Canon_de_155_L_mod%C3%A8le_1918_Schneider) je procena vlasnika i agenta, bez potvrde tipa ili istorijske upotrebe u tom nivou; pri novom artu ne predstavljati ga kao potvrđen laki top od 75 mm.



### Avioni

[B-17 Flying Fortress](../assets/models/aircraft/boeing-b-17-flying-fortress/README.md) u Ratweeku i katalogu koristi lakšu geometriju i izvorne teksture. Paneli, oznake i razlika između stakla i oplate već se jasno čitaju na postojećem prikazu, pa je zadržan izvorni izgled.

[B-25 Mitchell · Pixel art](../pages/catalog.html#letelice-3d/bombarder-b-25-3d/pixel-art) je podrazumevani izgled u katalogu. Staklo nosa, kabine i kupola je prigušeno, a lim nosi pikselizovane spojeve i tragove habanja uz očuvane oznake. Osam lossless WebP mapa upola je manje po strani od izvornih i ukupno zauzima oko 40 kB, odnosno oko 1,25 MiB dekodirano sa mip nivoima. Ista mreža ima 17.489 trouglova i 36 primitiva u GLB-u. U igri se koristi osnovni izgled. [Poreklo i priprema](../assets/models/aircraft/north-american-b-25-mitchell/art-source/generation.json).

[Avro Lancaster · Pixel art](../pages/catalog.html#letelice-3d/bombarder-3d/pixel-art) je podrazumevani izgled u katalogu. Svih 17 mapa nacrtano je od praznog platna, uz postojeći UV raspored. Novi crteži pokrivaju kamuflažu, donje površine, motore, staklo, zakovice i RAF oznake. Lossless WebP mape imaju iste dimenzije i ukupno oko 7 kB. GLB ima 9.057 trouglova i 51 primitivu pre zamene diskova elisama. [Poreklo i priprema](../assets/models/aircraft/bomber-lancaster/art-source/generation.json).

[B-24 Liberator · Pixel art](../pages/catalog.html#letelice-3d/bombarder-b-24-3d/pixel-art) je probni izgled u katalogu. Maslinasti lim iznad, sivoplav ispod, paneli i američke oznake su nacrtani od praznog platna. Projekcija gornje, donje i bočne mape prati postojeću mrežu i pokriva površine bez upotrebljivog UV rasporeda. Tri lossless WebP mape zauzimaju oko 5 kB, odnosno oko 2 MiB dekodirano sa mip nivoima. Model zadržava 25.971 trougao i 20 primitiva. [Poreklo i priprema](../assets/models/aircraft/consolidated-b-24-liberator/art-source/source.json).


| Resurs | Metapodaci / izvor |
|---|---|
| Bočni avioni | [Bf 109: trup](../assets/images/game-ready/avioni/bf109-telo.webp), [oštećenje](../assets/images/game-ready/avioni/bf109-damaged.webp), [propeler](../assets/images/game-ready/avioni/bf109-propeler.webp); [Ju 87: trup](../assets/images/game-ready/avioni/ju87.webp), [oštećenje](../assets/images/game-ready/avioni/ju87-damaged.webp) |
| Avioni Visa i Il-2 iz kataloga | [mere modela](../core/actor/aircraft/fighterBomberPlanes.js); varijanta žutog nosa koristi veliki Bf 109 sa lokalnom promenom palete. Il-2 ostaje samo u katalogu. |

Pripremljeni Sd.Kfz. 251, He 111, Storch, M15/42, StuG III, Hotchkiss i plovila imaju osnovu od 40 px/m; cele figure Nemca i Četnika spreda imaju vidljivu visinu 180 px pri 100 px/m. Veći dostupni izvori ponovo se pripremaju bez uvećavanja sitnog rastera. Prikaz patrolnog plovila čita `pixelsPerMetre` iz njegovih metapodataka; fiksnih 25 px/m posle promene izvora pogrešno bi uvećalo brod. Pri promeni atlasa obnoviti i geometriju priključaka, izlazne slike i manje kopije za učitavanje.

<a id="3d-avioni"></a>
**3D avioni (2026-11-26).** Preuzeti modeli su u [aircraft](../assets/models/aircraft), po jedan folder po avionu, sa README-om i pregledom; posle dodavanja ili premeštanja obnoviti [art katalog](KATALOG.md#art-katalog). Redosled uvoza vodi [veština za uvoz asseta](../.agents/skills/game-asset-import/SKILL.md).
- Trouglovi se ne smanjuju, jer automatsko smanjenje u Blenderu lomi modele u igri, iako ih Blender iscrta dobro. Smanjuju se samo ugrađene slike, na najviše 512 px, [pripremom](../scripts/shrink-glb-textures.py). Pretežak model zamenjuje vlasnik lakšim.
- Smer nosa i veličinu meriti u three.js, kao što ih igra učitava: Blender je visinu B-25 izmerio bez velikog diska elise, pa je avion ispao za petinu manji. Bombarderi imaju raspon krila 0,585 stvarnog, kao Lancaster; lovci su stvarne veličine.
- Elise se okreću oko svoje ose najbliže liniji leta ([prikaz aviona](../core3d/actor/aircraft/WarplaneModel.js)). Elisi čije je ishodište van osovine prikaz sam postavlja osovinu u sredinu lopatica. Providne diskove umesto lopatica (B-17, B-25, Lancaster) prikaz sakriva i preko njih vrti [elisu B-24](../assets/models/aircraft/consolidated-b-24-liberator/propeller.glb), trokraku Hamilton Standard, koju su ti avioni nosili.

<a id="dopune-iz-plana-ideja--predaja-arta"></a>
### Zajedničke dopune aktera

Komandir Panzera III ima pogodak i pad u [istom atlasu](../assets/images/game-ready/vojnici/advance-commander.webp). Posle pogotka klone preko ivice kupole i ostaje da visi spolja dok tenk vozi. Ćelija ima dodatni prostor ispod istog sidrišta za ruke koje vise. Katalog nudi stanje „Komandir pogođen“, a Otpisani koriste isti prikaz. [Poreklo i priprema](../assets/images/sources/nemci/panzer-commander/source.json).

[Panzer III](../assets/images/game-ready/tenkovi/panzer-iii-damage.webp) i [T-34-85](../assets/images/game-ready/tenkovi/t34-85-damage.webp) imaju nacrtane proboje oklopa preko živih kadrova i zasebne olupine sa oštećenim gusenicama i cevima. Oštećenje se vidi od prvog pogotka, a uništeni tenk zadržava crtež olupine na istom osloncu. Panzer deli prikaz sa Otpisanima. [Poreklo i priprema](../assets/images/sources/tenkovi/advance-tank-damage/generation.json).

Partizanski tenk, Tigar I, M15/42, StuG III, Hotchkiss 2D i Somua S35 imaju nacrtane tragove pogotka kao providan sloj preko animiranog trupa i [bljesak na ustima cevi](../assets/images/game-ready/efekti/plamen-pucnja-sprites.webp) pri paljbi. Panzer III koristi isti bljesak u stanju `fire`. [Poreklo i priprema](../assets/images/sources/tenkovi/standard-tank-condition/generation.json).

Renault FT i Hotchkiss H35 3D koriste zasebne [maske oštećenja](../assets/models/tank/condition/armor-hits.webp) i [olupine](../assets/models/tank/condition/armor-wreck.webp) na postojećim mrežama. Uništeni tenkovi miruju ravno na gusenicama, sa oštećenjem vidljivim na oklopu. U 2D i 3D katalogu kopnena vozila imaju stanje `dead` za prikaz bitke i **Olupina** za scenografiju, sa završnim oštećenjima bez vatre i dima. Obe maske 3D tenkova su 256 × 160 i dele se između modela, uz oko 0,42 MiB za dekodirani RGBA i mip nivoe. [Prikaz oštećenja](../core3d/actor/derived/tankCondition.js).

<a id="gradacija-unistenja"></a>
Oštećenja vozila i oruđa čine obaveznu gradaciju u katalogu. Prvi pogodak ostavlja lokalne tragove na prepoznatljivoj izvornoj boji. Uništenje zadržava te tragove i dodaje širu garež, više ogoljenog materijala i oštećenja siluete gde postoje. Uporediti trajni art ispravnog, pogođenog i uništenog aktera bez čestica, iz istih uglova i pod istim svetlom, pa proveriti razliku između aktivnog uništenja i hladne olupine u prikazu kataloga. Kod poljskog topa obe teksture polaze od istih centara udara i useka na izvornim koordinatama. [Faze u katalogu](KATALOG.md#obavezne-faze-unistenja) · [Priprema pogotka](../scripts/paint-field-gun-hit.py) · [Priprema olupine](../scripts/build-field-gun-wreck.py)

Opel Blitz i nemački vojni kamion u 3D katalogu voze napred, a točkovi se okreću oko svojih osovina prema pređenom putu. U stanju uništenja kamioni staju, uz nagoreli lim, razbijene daske, plamen i dim kod motora. Svaki model ima svoju masku od 256 × 160 na postojećoj mreži. Nemački vojni kamion ima zatamnjeno providno staklo, koje nestaje u stanju uništenja. [Maska za Opel Blitz](../assets/models/vehicle/truck/opel-blitz/wreck.webp), [maska za nemački vojni kamion](../assets/models/vehicle/truck/army-truck/wreck.webp), [izvor i priprema](../assets/images/sources/vehicles/3d-truck-wrecks/generation.json).

[Hotchkiss H35](../assets/models/tank/hotchkiss-h35.glb) ima dva zasebna prstena od po 208 trouglova. Na svakom je U srazmeran pređenoj dužini prstena i prelazi od 0 do 109, a V opisuje širinu i bočne ivice. Gusenice u katalogu i Opsadi Kraljeva koriste [isti proračun](../core3d/actor/derived/HotchkissTracks.js) pređenog puta za svaku stranu. [Skripta](../scripts/prepare-kraljevo-models.py) iz izvornog GLB-a sa SHA-256 `7469f3e17424366ba746b3d61f6108c0d25767f69c654ffa781f41680c36cec2` gradi prstenove i ugrađuje ponovljivi crtež jednog članka.

Na istom modelu cev i maska su zasebno dete kupole (`turret → gun → muzzle`). Lokalna X osa prolazi kroz masku na `[-0.155, 0.367, 0.55]` u koordinatama kupole. Usta cevi u mirovanju ostaju na `[-0.155, 0.367, 1.3664]`, a pozitivan ugao spušta cev. Dva trougla iza maske pokrivaju otvor pri spuštanju od 6°. [Priprema modela](../scripts/prepare-kraljevo-models.py) · [Provera u katalogu](../tests/unit/catalogResources.test.js).

Nedostajuće resurse i ograničenja vodi [plan](PLAN.md#art).

Dodatna plovila imaju zasebne opise. Generički nacrtan brod ili projektna mera nisu potvrda istorijske klase i njenog prisustva u konkretnoj bici.

### 3D

**Fasade Kraljeva.** Tri prednje fasade, ruševina i zajednička zadnja strana imaju jednostavniji krečni malter, kamene sokle, drvenu stolariju i gvozdene ograde. Mape imaju izvorne dimenzije, a kuće koriste postojeću geometriju od 12 trouglova i šest materijala. Pet WebP mapa zajedno ima 555 kB prema 434 kB za izvorne slike, uz isti broj piksela za dekodiranje. [Katalog](../pages/catalog.html#scenografija-3d/kuca-sa-fasadom) i [izvori](../assets/images/sources/buildings/kraljevo-fasade/generation.json).

<a id="3d-pixel-art"></a>
**Pixel art za 3D aktere (vlasnik, 2026-11-26).** Odobreni uzor i podrazumevani kataloški prikaz je [Koča · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/partizan-3d/pixel-art). Za ostale 3D aktere crtati nove teksture u paleti postojećeg 2D arta, sa oštrim pikselima i jasnim oblicima. Koristiti postojeće UV koordinate, geometriju, kostur i pokrete, pa proveriti teksturu na modelu izbliza i u pokretu. Postupak, optimizaciju modela i redosled varijacija vodi [veština za 3D pixel art](../.agents/skills/game-actor-art-3d/SKILL.md).

Na odobrenom borcu maskirna šara pripada jakni i rukavima, a jednobojne braon pantalone dobijaju senke od svetla u sceni. Lice ima sopstveni identitet, sa kratkom crnom kosom, brkovima i očima boje lešnika. Crvena petokraka stoji niže na kapi i ima oštar obris. [Izvori i priprema tekstura](../assets/images/sources/partizani/sutjeska-pixel-art/generation.json).

<a id="nemacki-strelac-pixel-art"></a>
[Nemački strelac · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/nemacki-vojnik-3d/pixel-art) je probna varijacija na postojećem modelu iz Drvara, Kraljeva, Aerodroma i Crvenog krsta. Sivomaslinasta uniforma, kožni kaiševi i lice su precrtani na istoj UV mapi. Telo ima 7.436 trouglova i jedan materijal, odnosno jedan poziv za crtanje tela po prolazu. Drvar spušta po devet padobranaca u jednom naletu. Nova mapa od 512 × 512 ima 251 kB, a ugrađeni JPEG od 2048 × 2048 ima 716 kB. Sa mip nivoima nova mapa zauzima oko 1,33 MiB prema oko 21,33 MiB za RGBA original. [Izvor i priprema](../assets/images/sources/nemci/german-soldier-pixel-art/generation.json).

[Nemački vojnik s teškom opremom · Mitraljez · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/nemacki-mitraljezac-3d/pixel-art) je probni prikaz za model iz 3D Tank, Aerodroma i Crvenog krsta. Precrtani su lice, oko, pantalone i torba, a tkanina na tunici i školjka šlema dorađene su uz očuvane oznake. Šest novih WebP mapa ima ukupno oko 177 kB. Smanjene mape lica i oka daju oko 1,19 MiB za šest zamenjenih tekstura sa mip nivoima, prema približno 1,50 MiB za iste ugrađene teksture. Isti model u Three.js ima 10.281 trougao i 23 grupe za crtanje; varijacija čuva skelet i mitraljez. [Izvor i priprema](../assets/images/sources/nemci/german-heavy-pixel-art/generation.json).

[Mitraljez · Pixel art · Drugo lice](../pages/catalog.html#drugi-svetski-rat-3d/nemacki-mitraljezac-3d/pixel-art-drugo-lice) je podrazumevani kataloški prikaz sa svetlijom kosom, obrijanim licem i sivoplavim očima. Koristi istu uniformu, šlem, oznake i opremu kao prvi Pixel art prikaz, uz samo dve dodatne mape od 128 × 128 i 64 × 64. [Izvor i priprema](../assets/images/sources/nemci/german-heavy-pixel-art/generation.json).

<a id="drug-crni-pixel-art"></a>
[Drug Crni · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/radnik-3d/pixel-art) je probni izgled na postojećem modelu sa puškom. Potamnjena kapa, izbledela plavosiva košulja, maslinaste pantalone, lice i potiljak koriste postojeće UV mape. Telo ima 9.921 trougao i 18 mreža sa po jednim materijalom. Isti model nosi igrača u Liberated City i koristi se za saborce u Drvaru i Kraljevu. Četiri mape od 256 × 256 i potiljak od 32 × 32 zajedno imaju 257 kB. Pri istom RGBA formatu i mip nivoima, pet izmenjenih mapa zauzima oko 1,34 MiB prema 4,33 MiB za izvornike. [Izvor i priprema](../assets/images/sources/partizani/crni-pixel-art/generation.json).

<a id="brka-pixel-art"></a>
[Brka · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/borac-pokreta-otpora-3d-s-brkovima/pixel-art) zadržava brkove i pušku Berthier varijacije sa sivom kapom. Precrtani su lice, kapa, jednobojna svetla košulja i sive pantalone sa blagim senkama uz šavove. Isti model kao kod [Druga Crnog](#drug-crni-pixel-art) ima 9.921 trougao i 18 mreža sa po jednim materijalom. Četiri mape od 256 × 256 imaju ukupno 230 kB i oko 1,33 MiB dekodirano sa mip nivoima. Mapa potiljka deli se sa Drugom Crnim. [Izvor i priprema](../assets/images/sources/partizani/brka-pixel-art/generation.json). Na ramenu je pomerena ivica novog crteža izložila praznu pozadinu atlasa. Pri precrtavanju proveriti šavove na samom modelu i produžiti boju tkanine preko ruba UV ostrva da prazni pikseli ne uđu u šav.

<a id="brka"></a>
[Sava · Osnovna](../pages/catalog.html#drugi-svetski-rat-3d/partizan-jednostavan-model-3d/original) ima šire lice, punije brkove i zulufe, tamnu kosu do kragne i tamne mat pantalone. Vlasnik je prihvatio izgled 25. 11. 2026. prema [portretu Save Kovačevića](https://commons.wikimedia.org/wiki/File:Savo_Kova%C4%8Devi%C4%87.jpg) i [fotografiji sa Crkvica](https://commons.wikimedia.org/wiki/File:Narodni_heroj_Sava_Kova%C4%8Devi%C4%87.jpg). Katalog i igre koriste isti [FBX](../assets/models/character/soldier/partisan-lowpoly.fbx), sa postojećim skeletom i animacijama.

<a id="savo-pixel-art"></a>
[Sava · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/partizan-jednostavan-model-3d/pixel-art) je podrazumevani prikaz u 3D katalogu. Precrtani su lice sa obrvama, kosa i brkovi, maslinasta kapa i jednobojna bluza, te tamnosive pantalone. Četiri odvojene mape od 256 × 256 rešavaju preklapanje UV ostrva različitih materijala. Zauzimaju oko 10 kB na disku i oko 1,33 MiB sa mip nivoima. Isti FBX ima 5.964 trougla u dve mreže i deset grupa za iscrtavanje posle grupisanja po materijalu. U Drvaru se za kolonu od 33 borca već koristi instanciranje. [Izvor i priprema](../assets/images/sources/partizani/savo-pixel-art/generation.json).

U 3D Pixel art prikazu uklonjena su 44 trougla kapuljače. Leđa su popunjena sa 16 trouglova vezanih za postojeći kostur, pa probna bluza ukupno ima 5.936 trouglova. Osnovna varijacija otvara izvorni FBX. [Geometrija bluze](../core3d/actor/derived/ww2/savoBlouse.js).

[Sava · Braon · Berthier · Pixel art](../pages/catalog.html#drugi-svetski-rat-3d/partizan-jednostavan-model-3d/smedji-pixel-art) u katalogu koristi istu bluzu s niskom kragnom, pušku varijacije `smedji` i novu mapu braon vune od 256 × 256 (1,9 kB). Mape lica, kose i pantalona deli sa podrazumevanim Pixel art prikazom. [Izvor i priprema](../assets/images/sources/partizani/savo-pixel-art/generation.json).

<a id="savo-2d"></a>
[Partizanski zastavnik](../pages/catalog.html#vojnici/zastavnik/partizanski) u Ustanku i katalogu koristi precrtane atlase [mirovanja](../assets/images/game-ready/vojnici/partizanski-zastavnik-sprites-redraw.webp), [hoda i pada](../assets/images/game-ready/vojnici/partisan-bearer-actions-redraw.webp) i [pogotka](../assets/images/game-ready/vojnici/partisan-bearer-hit-sprites-redraw.webp). Precrtavanje prati svih 16 starih poza, sa istim granicama kadrova, bojama i obeležjima. Zastava se crta odvojeno. [Izvor i priprema](../assets/images/sources/partizani/partisan-bearer-redraw/generation.json).

<a id="zastave-za-ustanak-i-jablanicu"></a>
Posle poređenja vlasnik je izabrao da Ustanak, katalog i Jablanica zadrže originalne zastave. Kao rezerva su sačuvani pixel art crteži [partizanske zastave](../assets/images/game-ready/zastave/partizanska-zastava.webp) i [italijanske trobojke sa štitom Savoja](../assets/images/game-ready/zastave/zastava-kraljevine-italije.webp). [Poreklo i priprema](../assets/images/sources/zastave/ustanak-jablanica/source.json).

<a id="sutjeska-drug-marko"></a>
**Uzor za Kočin lik (vlasnik, 27. 11. 2026).** [Portret Koče Popovića iz Drvara, 1943.](../assets/images/sources/partizani/sutjeska-pixel-art/koca-popovic-drvar-1943.jpg) glavni je uzor za lice i kosu. [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ko%C4%8Da_Popovi%C4%87.jpg) navodi poreklo, autora isečka i licencu.

[Portret 1943](../pages/catalog.html#drugi-svetski-rat-3d/partizan-3d/portret-1943) je probna varijacija za poređenje sa [Pixel artom](../pages/catalog.html#drugi-svetski-rat-3d/partizan-3d/pixel-art). Prelaz preko obraza i vilice je omekšan na mapi lica od 192 × 192, a poseban crtež oka od 64 × 64 poravnat je prema otvorima oba kapka. Isti model ima 9.704 trougla i tri materijala grupisana za prikaz. Varijacije dele teksturu odeće. [Izvor i priprema](../assets/images/sources/partizani/sutjeska-pixel-art/generation.json).

Vlasnik je 25. 11. 2026. prihvatio [Sutjesku](../pages/catalog.html#drugi-svetski-rat-3d/partizan-3d/sutjeska) kao izgled lika „Koča” za 3D scene. [Zajednički izgled](../core3d/actor/derived/ww2/sutjeskaLook.js) koriste katalog, Liberated City, Spomenici i prikazi istog partizana u Jablanici i 3D Tank. Mlađe lice, kestenjasta kosa, smeđe oči, veća crvena petokraka i braon pantalone primenjuju se na kopiji postojećeg modela sa istim skeletom. [Maskirna](../pages/catalog.html#drugi-svetski-rat-3d/partizan-3d/original) i [Osnovna](../pages/catalog.html#drugi-svetski-rat-3d/partizan-3d/strelac) i dalje su dostupne u katalogu. [Fotografija sa Sutjeske](https://commons.wikimedia.org/wiki/File:Druga_proleterska_divizija_na_Sutjesci.jpg) je polazište za izgled.

<a id="preuzeto-drvece"></a>
Preuzeto drveće (2026-11-26) sklapa se u Blenderu iz izvornog OBJ ili `.blend` fajla i izvozi kao GLB sa WebP teksturama. Lišću se pri tom popravljaju tri stvari:
- prozirnost je oštar izrez (`alphaMode: MASK`), a ne mešanje, da nema grešaka u redosledu crtanja i da senke prate list;
- senčenje lista je usmereno naviše u svetu, pa je krošnja osvetljena i u scenama samo sa svetlom neba (Kraljevo);
- svaki list ima i zadnju stranu kao posebnu površinu, jer three.js dvostranoj površini otpozadi okreće senčenje naniže, pa je list bio crn.

Stablo zadržava normale okrenute spolja. Duplikati u drugim kolekcijama `.blend` fajla (lipa je imala dva preklopljena stabla) se uklanjaju. Modeli u metrima nisu: visinu daje `size` sa `fitVisible`.

Modele, skinove i klipove pregledati u [katalogu](../pages/catalog.html). Poreklo i licence ostaju uz modele; organizacija kataloga prati [pravila kataloga](KATALOG.md#stavke-kataloga-i-varijante).

Poljski top u [katalogu](../pages/catalog.html#artiljerija-3d/poljski-top-3d) ima [poseban prikaz oštećenja](../core3d/actor/artillery/FieldGunDamage.js): na 75% zdravlja boja je potamnela i nagorela, na 50% se razlabavljuje točak, na 25% spušta lafet, a `dead` ostavlja razdvojene točkove, spuštenu cev i rasklopljene krakove lafeta. Delovi su izvedeni iz trouglova izvornog GLB-a, uz očuvanje njegovih normala i boja; izvorni model i materijali se ne menjaju. Svaki otkinuti sklop zasebno naleže na tlo. U katalogu zdravlje pripada topu; „Pogođena posada” obara zasebnog člana, a Reset vraća zdrav top i živu posadu. Ovaj prikaz nije uključen u Jablanicu, gde smrt posade ostavlja top uspravno.

Pogoci topa u katalogu koriste [slojeviti efekat](../core3d/actor/artillery/GunImpactCloud.js): varnice traju oko desetinke sekunde, uz kratak oblačić prašine i sitne metalne opiljke. Ispod polovine zdravlja dodaje se malo dima, a na četvrtini i niže nekoliko krupnijih komada. Efekti završavaju sami, delovi padaju do tla, a ponovljeni pogoci koriste isti ograničeni skup objekata. Katalog izričito uključuje ovu dopunu; postojeći efekat u Jablanici ostaje zaseban.

<a id="minobacac-81-3d"></a>
Minobacač za Jablanicu je originalna vizuelna interpretacija italijanskog tipa 81/14 Mod. 35: [GLB](../assets/models/weapon/mortar-81-mod35/model.glb), [odvojena mina](../assets/models/weapon/mortar-81-mod35/round.glb) i [MIT licenca](../assets/models/weapon/mortar-81-mod35/LICENSE.txt). Cev ima tačku `Muzzle`; ovo nije precizna muzejska rekonstrukcija.

[Proba u katalogu](../pages/catalog.html#artiljerija-3d/minobacac-81-3d) koristi [posadu i radnju](../core3d/actor/artillery/MortarCrew.js): dva postojeća italijanska lika bez pušaka, `idle`, `load` (držanje mine iznad otvora), `attack` (ubacivanje, blesak/dim i povratak), `dead`, pojedinačni pogoci i Reset. Šake prate minu i komande minobacača; gubitak jednog člana zaustavlja rad. Po poslednjoj odluci vlasnika minobacač ostaje samo u katalogu; uklonjen je iz Jablanice zajedno sa zaklonom i borbenom logikom.

<a id="cannon-kanjon-neretve"></a>
<a id="battle-for-jablanica-kanjon-neretve"></a>
Za Battle for Jablanica važe [kontekst i izbor scene](KONTEKST.md#battle-for-jablanica); [model topa](../assets/models/weapon/cannon/field-gun-75.glb) i podaci scene određuju postojeći prikaz.

Jablanica koristi [WebP uniforme bez gubitka](../assets/models/character/soldier/partisan-wool-uniform.webp), izveden iz [prihvaćenog PNG-a](../assets/models/character/soldier/partisan-wool-uniform.png) pomoću [pripreme](../scripts/prepare-jablanica-texture.py). Skripta proverava jednakost dekodiranih RGBA piksela; dimenzije ostaju 1254×1254. [Lokalna optimizacija figura](../scenes/cannon/optimizeFigure.js) grupiše neprozirne trouglove po materijalu, bez promene položaja, normala, UV koordinata, boja, kostiju i težina; providni materijali zadržavaju redosled. Izvorni modeli se ne menjaju, a instance u nivou dele pripremljenu geometriju.

## UI ikonice

[UI atlas](../assets/images/ui/pixel-icons.webp) sadrži 19 ikonica u providnim ćelijama od 64 × 64 px. Svaka je nacrtana u punoj rezoluciji, sa glatkim ivicama, podebljanom konturom i jednostavnom siluetom. Prasak označava pucanje svim vrstama oružja, a čučanj koristi obrnuti znak za skok. [Izvor i koordinate](../assets/images/sources/ui-icons/source.json) čuvaju i uzore iz igara o Drugom svetskom ratu, a [crtež](../assets/images/sources/ui-icons/draw.py) ponovljivu pripremu. Zvanični [žeton](../assets/images/ui/coin.gif) koristi se kao zasebna slika. Igre ikonice uzimaju samo preko [icons.js](../core/io/icons.js), koji ih pravi iz koordinata atlasa; atlas sadrži samo ikonice koje neka igra prikazuje (vlasnik, 2026-11-28). Svaka se crta u punoj rezoluciji: uvećan stari crtež vlasnik smatra fušerajem i ne prihvata ga. Posle izmene crteža `draw.py` se pokreće ponovo, a novi atlas dobija novu adresu, pa ga pregledač ne uzima iz keša.

## Slike aktera kao lossless WebP

Slike u [game-ready](../assets/images/game-ready) čuvaju se samo kao lossless WebP: svaki RGBA piksel, i ispod providnih, isti je kao u ranijem PNG-u, a fajlovi su oko trećinu manji. Igra i katalog ih učitavaju direktno, bez kopija i mape zamene. Codex isporučuje novi art aktera kao lossless WebP, sa sačuvanom bojom ispod providnih piksela (`exact`).

## Pravila pripreme i predaje pozadina

- Čitljivi oblici, manje sitnih elemenata i miran prostor iza jedinica. Koristiti istorijski primerenu arhitekturu, sezonu i opremu; [izvori](ISTORIJA.md) određuju granice rekonstrukcije.
- Paletu, osvetljenje i gustinu piksela uskladiti sa prihvaćenim uzorom igre. Loše uklapanje ne prikrivati nasumičnim rotacijama, sečenjem silueta ili globalnim zamućenjem; ponavljanje izdvojenih slika nije zamena za celovit ambijent.
- Novu kompoziciju pozadine pripremiti kao zaseban fajl i uporediti je sa prihvaćenom verzijom u istom kadru igre. Samostalna studija kanjona Neretve sačuvana je kao rezerva nakon što je vlasnik izabrao staru pozadinu za nivo.
- Osnovna slika nema zamrznute žive ljude, zastave, životinje, vozila, oblake, dim ili plamen. Potrebni živi elementi su odvojeni i prate vreme scene i pauzu prema [pravilima animacije](ANIMACIJA-POZADINE.md). Naslikan znak na zidu može ostati statičan. Voda zasad ostaje mirna po odluci vlasnika; odbačeni efekat svetlih tragova ne vraćati.
- Metapodaci čuvaju dimenzije, liniju tla i žarišta u izvornim pikselima. Linija tla nije horizont ni sidrište čizama. Pri promeni razmere slike jednako prevesti tlo, efekte i projektile.
- Predaja sadrži izvor, stvarni prompt, poreklo, hashove, ponovljivu pripremu i pregled sa jedinicama u 1280×720 i 1024×768. Pozadine imaju pregled u sceni. Nove i precrtane zgrade i rekviziti dobijaju zasebne stavke prema [pravilima kataloga](KATALOG.md#upotreba).
- Prihvaćena pozadina ostaje PNG, a igre učitavaju WebP iste slike, oko sedam puta manji, koji pravi [skripta](../scripts/webp-backgrounds.py) za svaku pozadinu koju kod igre navodi. Posle izmene PNG-a pokrenuti je ponovo.

<a id="šest-ambijenata-sadašnjih-nivoa"></a>
<a id="batina-izabrana-animirana-pozadina"></a>
### Izvori pozadina

| Grupa | Podaci i pregled |
|---|---|
| Batina | [slojevi](../assets/images/background/batina-1944/layout.json) |
| Do Trsta | [Slojeviti pejzaž](../scenes/to-trieste/Route.js), prema [izboru vlasnika](KONTEKST.md#to-trieste); ranije slikane panorame nisu uključene u igru. |

Za Batinu je izabrana slojevita osnova sa pokretnim oblacima; ljudi, civili i platnena zastava ostaju isključeni. Obrisane alternative ne vraćati. Ostale prihvaćene izbore vodi [kontekst igara](KONTEKST.md#potvrđena-grupa-pozadina-za-ustanak-i-tenkiće).

## Ratweek — teren iz vazduha

[Tekstura doline](../assets/images/textures/terrain/ratweek-dolina.webp) prikazuje parcele, redove useva, međe, zemljane puteve i šumarake na padinama. Poprečne ulice prate prolaze koje raspored kuća već ostavlja u oba naselja. Oko reke ostaje priobalje, a preko polja prati se postojeća pruga. [Izvor i postupak izrade](../assets/images/sources/ratweek-dolina/source.json).

Cela deonica deli jednu sliku od 384 × 2048 i postojeći materijal tla. Susedni segmenti koriste iste koordinatne linije. Lossless WebP ima oko 418 kB, odnosno oko 4 MiB dekodirano sa mip nivoima. Pri izvozu se susedni pikseli usrednjavaju da uski putevi ostanu vidljivi. Teren pri umanjivanju uzorkuje jedan mip nivo. Jele dele geometriju i crtaju se u četiri grupe po deonici. [Prikaz terena](../scenes/ratweek/landscape.js).

## Zasebni rekviziti bojišta

Olupine, poginuli i krv su opcioni odvojeni resursi, bez sudara i borbene logike. Poginuli namerno ostaju nepomični; krv se crta ispod tela, a zaklanjanje prati položaj u prizoru. Uniforma, pogled i oprema moraju odgovarati bojištu.

Agent bira i ugrađuje raspored prema sceni, uz očuvanje čitljivosti borbe; alat za postavljanje nije obaveza vlasnika.

## Održavanje

[Indeks arta](../assets/images/sprite-index.json) obnavlja [skripta](../scripts/index-sprite-art.py) iz direktno povezanih resursa i opisa `sprites.json` u ovom dokumentu. Indeks meri datoteke i kadrove; hash, različiti kadrovi i broj slika ne dokazuju kvalitet, prirodan pokret ili prihvatanje.

Stvarne mere i ponašanje održavaju se u metapodacima i kodu, potvrđene odluke u kontekstu, otvoreni poslovi u planu, a izvršene provere u TESTING. Ne čuvati dnevnik dorada, opise već ugrađenih vizuelnih scena ni kopije tih podataka u ovom dokumentu.
