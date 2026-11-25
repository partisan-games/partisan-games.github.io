# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Art](#art)** | | | |
| 1 | [AR-P09](#ar-p09) | Zadržati samo WebP kao jedini original arta za igre | Claude, Codex | 📋 TODO |
| 2 | [AR-P10](#ar-p10) | Napraviti spriteove četnika i dodati ih u katalog | Codex | 📋 TODO |
| 3 | [AR-P11](#ar-p11) | Približiti 3D model partizana liku sa fotografije sa Sutjeske | Codex | 📋 TODO |
| | **[Igre i ideje](#igre)** | | | |
| 4 | [IG-14](#ig-14) | Izabrati sledeće aktere od postojećeg arta | Vlasnik, Claude, Codex | 📋 TODO<br>Waiting: izbor kandidata [1](#note-1) |
| 5 | [IG-18](#ig-18) | Razmotriti pomeranje prizora i iskakanje protivnika u Otpisanima ili Neretvi | Vlasnik | 📋 TODO |
| 6 | [IG-21](#ig-21) | Razmotriti kampanju Jablanice i kolonu kamiona | Vlasnik | 📋 TODO |
| 7 | [IG-22](#ig-22) | Razraditi dodatne etape Neretve | Vlasnik | 📋 TODO |
| 8 | [IG-24](#ig-24) | Odlučiti o anahronim parolama u Liberated City | Vlasnik | 📋 TODO |
| 9 | [IG-29](#ig-29) | Dovršiti logor Crveni krst u Escape Enemy Base | Codex, Claude | 🔄 In progress |
| 10 | [IG-30](#ig-30) | Dodati partizane i četnike kao saborce u opsadi Kraljeva | Codex, Claude | 📋 TODO |
| 11 | [IG-31](#ig-31) | Dodati pruge, mostove i saveznički lovac-bombarder u Warplane | Codex, Claude | 🔄 In progress |
| 12 | [IG-32](#ig-32) | Dovršiti Raid on Drvar: modeli, izgled grada i težina | Claude, Codex | 🔄 In progress |
| 13 | [IG-33](#ig-33) | Poboljšati kvalitet arta German Advance bez promene prihvaćenog stila i pregledati promo | Codex, Vlasnik | 📋 TODO |
| | **[Katalog](#katalog)** | | | |
| 14 | [KT-01](#kt-01) | Organizovati katalog oko samostalnih, ponovo upotrebljivih objekata | Codex | 📋 TODO |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze; sekcija koja ostane bez stavki briše se sa poslednjom, a veze ka njoj se preusmeravaju.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Vlasnikovi pregledi su odvojeni od završenog povezivanja; ne uvode novu blokadu bez njegovog izričitog uslova. Ranije završene provere ne ponavljati zbog reorganizacije plana.

## Art

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Dodatni desanti na Brač, Mljet i Korčulu ostaju ideje za igru uz istorijsku proveru, a ne zadaci izrade arta. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

<a id="ar-p09"></a>
### AR-P09 · WebP kao jedini original

Svaka slika u [game-ready](../assets/images/game-ready) postoji dvaput: PNG original i njegova lossless WebP kopija u [optimized](../assets/images/optimized/game-ready), koju igra preuzima preko [mape zamene](../core/actor/optimizedImages.js). Pošto lossless WebP čuva svaki piksel, zadržati samo WebP: obrisati 190 PNG originala (49 MB), prepraviti putanje u kodu, alatima i podacima (oko 118 fajlova), ukinuti mapu zamene i [skriptu za kopije](../scripts/prepare-catalog-images.py), a Python alate za pripremu arta prilagoditi da čitaju i pišu WebP. Codex od tada isporučuje art kao lossless WebP.

<a id="ar-p10"></a>
### AR-P10 · Spriteovi četnika

Codex pravi animirane spriteove četnika na osnovu tri postojeće slike: [strelac](../assets/images/armies/cetnici/cetnik-03.png), [juriš](../assets/images/armies/cetnici/juris-01.png) i [mitraljezac](../assets/images/armies/cetnici/mitraljezac-07.png). Sačuvati lice, kapu, odeću i proporcije originala, u razmeri ljudi od 1,8 m, prema [pripremi arta](ART.md). Svaki lik dobija animacije za [standardna stanja](ARHITEKTURA.md#standardna-stanja-aktera) `idle`, `move`, `attack` i `dead` i svoju priču sa tim stanjima u [katalogu](KATALOG.md), u grupi **Vojnici → Četnici**, pored postojećeg [četnika u rovu](../catalog.html#vojnici/cetnik-u-rovu).

<a id="ar-p11"></a>
### AR-P11 · Partizan sa Sutjeske

Uzor je [fotografija Druge proleterske divizije na Sutjesci](https://upload.wikimedia.org/wikipedia/commons/b/be/Druga_proleterska_divizija_na_Sutjesci.jpg) (vlasnik, 2026-11-25). Codex dorađuje [3D model partizana](../assets/models/character/soldier/partisan.fbx), u [katalogu](../catalog.html#drugi-svetski-rat-3d/partizan-3d/original) varijacija „Maskirna”, da više liči na borca u centru fotografije: lice, kapa, odeća, oprema i proporcije. Skelet, animacije i [opis lika](../core3d/actor/derived/ww2/Partisan.js) ostaju isti, da model i dalje radi u Liberated City, Spomenicima i Jablanici.

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
### IG-18 · Arkadni prizor iz prvog lica

Ideja iz README-a: Otpisani ili Neretva mogu dobiti pomeranje prizora i protivnike koji iskaču. Konkretna igra, tok i obim još nisu izabrani.

<a id="ig-21"></a>
### IG-21 · Kampanja Jablanice

Moguće etape su Prozor, Rama i Jablanica, sa zasedom kod Drežnice kao kandidatom. Kolona kamiona pokušava proboj putem uz reku. To su ideje, ne nalog za izradu; mesta imaju različite događaje i ne treba ponavljati isti bunker. Istorijske granice su u [ISTORIJA](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica).

<a id="ig-22"></a>
### IG-22 · Dodatne etape Neretve

Italijanske i ustaške etape ostaju kandidati uz postojeće Nemce i četnike. Izabrati mesta, datume, jedinice i borbene uloge, trajanje i prelaze, pa tek onda art i tok igre. Postojeći rov nije istorijski dokaz budućeg sastava.

<a id="ig-24"></a>
### IG-24 · Parole Bihaća

Liberated City je Bihać krajem 1942. Natpisi o dolasku Crvene armije i plakat RED_ARMY_IS_HERE pripadaju drugom okviru; vlasnik bira zamenu ili uklanjanje pre izmene sadržaja.

<a id="ig-29"></a>
### IG-29 · Logor Crveni krst u Escape Enemy Base

Radnja (vlasnik, 2026-11-24): proboj iz nemačkog logora Crveni krst u Nišu, 12. februara 1942; tekst misije i naslov kartice su upisani. Okvir je u [KONTEKST](KONTEKST.md#escape-enemy-base).

Proboj je dogovoren i logoraši su spremni (vlasnik, 2026-11-24). Istorijski opis govori o golorukim logorašima. U igri [3D logoraš](../scenes/fps-base/PrisonerAvatar.js) kreće s običnom metalnom cevi u ruci i može tasterom F da preuzme [oružje savladanog stražara](../scenes/fps-base/CampWeapons.js). Izlazak iz lavirinta dovoljan je za pobedu. [Test nivoa](../tests/unit/fpsCamp.test.js) pokriva preuzimanje oružja i pobedu dok su svi stražari živi.

Zamah u prvom licu koristi snimljeni klip iz [kataloga](../catalog.html#drugi-svetski-rat-3d/radnik-3d/cev), prilagođen tako da se cev vidi pri pogledu pravo i da se logoraš na kraju vrati u početni stav. Stražar prvi put uzvikne „Halt!“ kad primeti logoraša. Povratak u stav i trenutak uzvika pokriva [test nivoa](../tests/unit/fpsCamp.test.js).

Preostaje:

1. Dodati šunjanje kao ravnopravan način bekstva. Dogovor obuhvata sporije i tiše kretanje, pune zaklone i opažanje stražara prema vidljivosti i buci. Razraditi ulogu reflektora i proveriti da se do izlaza može stići šunjanjem, bez borbe i preuzimanja oružja.
2. Doterati gažene pravce i oslonce objekata na tlu prema [ART-u](ART.md#crveni-krst-priprema-3d-ambijenta) i uklopiti osvetljenje u kadar igre. Vlasnik u pregledaču proverava čitljivost prolaza, slepe puteve, pogled kroz žicu i zaklone.

Prerada menja betonski ambijent u logor; sneg, noć i straže ostaju. Početni predlog baraka i kula u uglovima korigovati prema [istraženom stanju](ISTORIJA.md#crveni-krst-12-februar-1942), a ne predstaviti kao potvrđen tlocrt. Teksture i modele izrađuje Codex, bez privremenog crteža u nivou.

Priprema je urađena: [reference sa poreklom](references/ww2-yu/crveni-krst/README.md) i [smernice za modele i teksture](ART.md#crveni-krst-priprema-3d-ambijenta). Preradu voditi prema [dogovorenom rasporedu i pravilima prepreka](KONTEKST.md#escape-enemy-base): lavirint ostaje, a prolazi dobijaju prostornu namenu.

Prvi [paket arta](../assets/models/building/crveni-krst/README.md) povezan je u [katalogu](../catalog.html#scenografija-3d/sklop) i [igri](../index.html#fps-base). [Lokalni raspored](../scenes/fps-base/campLayout.js) čuva grananje i slepe prolaze oko ograđene zidane zgrade, sa jednim otvorenim dvorištem. [Sklop](../scenes/fps-base/CampEnvironment.js) povezuje žicu, pune zaklone, dvostruki obod, otvorenu izlaznu kapiju i dve kule sa reflektorima. Uslov pobede ostaje izlazak iz lavirinta, bez dodatnih obaveznih ciljeva.

Tehničke granice: zajednički `Maze` nije menjan. Mreža ima 8×8 polja razmaka 10 m, od kojih je osam rezervisano za objekat sa dvorištem; 56 prohodnih polja ostaje povezano. Početak (−35, −35), izlaz (35, 40) i prag pobede manji od 5 m su očuvani, kao i deset protivnika, dve prve pomoći i deset rekvizita. Žica blokira hod, a propušta pogled i metke za obe strane; zgrada, puni zakloni i rekviziti blokiraju i pogled i pogotke. Nitima i stubovima se dele instancirani sklopovi, dok puni zakloni ostaju obični mesh-evi zbog tragova pogodaka. [Ciljane provere](TESTING.md#crveni-krst--priprema-i-art) obuhvataju prohodnost, sudare, ponovni ulazak, pobedu bez ubijanja i oslobađanje novih resursa.

<a id="ig-30"></a>
### IG-30 · Saborci u opsadi Kraljeva

Kraljevo su 1941. opsedali partizani i četnici zajedno ([okvir](KONTEKST.md#demolish-barricades)), pa uz igračev tenk idu i pucaju na Nemce. Partizani postoje u 3D; četnika u 3D naručiti od Codexa, bez sklapanja od drugih likova.

<a id="ig-31"></a>
### IG-31 · Avioni za Ratweek

Warplane je operacija Ratweek 1944 ([okvir](KONTEKST.md#warplane)). Igrač leti samo bombarderom ([izbor](../scenes/warplane/Main.js)); dvokrilac je ostao samo u katalogu. Bombarder sa četiri motora i duplim repom odgovara, jer su američki teški bombarderi B-17 i B-24 dejstvovali na Balkanu 1944, i u Ratweeku; po obliku može da prođe kao B-24.

Urađeno (2026-11-25): Bf 109 ([lovac](../core/gameplay/bodies/aircraft/Interceptor.js)) dolazi iz izmaglice i pravi prelet za preletom na bombarder, pucajući kad ga ima na nišanu. [Mitraljezi bombardera](../core/gameplay/bodies/aircraft/GunTurrets.js) sami prate lovca nišanom, sa predujmom, a pucaju dok igrač drži drugi taster za napad (C); Space ispaljuje rakete na zemlju. Oboren lovac donosi poen, a sledeći dolazi posle predaha. Priča je u [katalogu](../catalog.html#letelice-3d/lovac-bf-109-3d).

Preostaje:

1. Igrač bombarduje sve nemačko; sada su u igri samo fabrike. Dodati pruge i mostove, koje je Ratweek najviše gađao i koje navodi izveštaj nivoa; modele crta Codex. Inspiracija za art tla iz vazduha: [gusti grad sa starog plana](../assets/images/background/grad.png), ulice i blokovi kuća viđeni odozgo. Kontekst iz rata: [saveznička bombardovanja Kraljeva i Beograda 1944](references/ww2-yu/bombardovanje-1944/README.md).
2. Codex pravi saveznički lovac-bombarder, P-51 Mustang ili P-38, koji su leteli u Ratweeku, kao drugi izbor igrača.
3. [ ] Vlasnik u pregledaču testira lovca: da li se preleti vide i prate, da li mitraljezi na C obaraju lovca i da li je težina dobra (lovac počinje posle 12 s, sledeći dolazi 18 s posle obaranja).

<a id="ig-32"></a>
### IG-32 · Igra Raid on Drvar

[Raid on Drvar](../scenes/drvar/Main.js) je igra odbrane iz prvog lica (vlasnik, 2026-11-24): igrač puca u nemačke padobrance koji se spuštaju na Drvar 25. maja 1944. Kartica je u War Games, posle Visa. Istorijski okvir desanta je u [ISTORIJA](ISTORIJA.md).

Atmosfera: šačica partizana iza improvizovanih zaklona gleda kako elitne nemačke padobranske trupe niotkuda padaju s neba, u ogromnom broju. Scena rekreira fotografije desanta ([drugi talas](https://commons.wikimedia.org/wiki/File:Drugi_talas_padobranaca_spustio_se_izme%C4%91u_groblja_na_Sobi%C4%87a_glavici_i_Grahovske_ceste.jpg), [prašina i dim](https://commons.wikimedia.org/wiki/File:Drvar_je_bio_u_pra%C5%A1ini_i_dimu_od_bombi,_kada_su_se_nad_njim_pojavili_mnogobrojni_padobrani.jpg), [desant](https://commons.wikimedia.org/wiki/File:Desant_nema%C4%8Dkih_padobranaca_na_Drvar.jpg), [pogled iz rova](https://commons.wikimedia.org/wiki/File:Nema%C4%8Dki_vazdu%C5%A1ni_desant_na_Drvar,_25._maja_1944.jpg), [podne](https://commons.wikimedia.org/wiki/File:Oko_12_sati_padobranci_su_ponovo_prekrili_nebo,_Drvar_25._maj_1944.jpg)): nisko prelaze formacije Ju 52, a nebo je posuto padobranima. Na fotografiji iz rova su ranjeni Nemci, ne partizani.

Mesto radnje: uporište „Moskva” kod pravoslavne crkve, gde su se branili opkoljeni partizani. Jedini izvor je potpis fotografije na [sh.wikipedia](https://sh.wikipedia.org/wiki/Desant_na_Drvar): „Napadi esesovaca na »Moskvu«, uporište opkoljenih partizana kod pravoslavne crkve.” Ko je branio, kada i kakav je bio teren, izvori ne kažu; groblje na Šobića glavici bilo je nemačko uporište. Uporište je crkveno dvorište 24 × 20 m, ograđeno starim zidanim kamenim zidom od 1,1 m ([zid](../core3d/geometry/stoneWall.js)), sa ulazom na zapadu, na ravnom terenu grada; okolo su ruševine od bombardovanja ([kamene gomile](../core3d/geometry/rocks.js), improvizovane po vlasnikovom nalogu).

Pravila: igrač drži mesto uz istočni zid i menja samo pravac pogleda i nišana, na sve strane, jer je uporište opkoljeno. Miš nišani, levi klik puca; puška ([oružje](../core/gameplay/Firearm.js)) ispaljuje metak pa repetira, a puškomitraljez puca dok se drži klik i posle okvira od 20 metaka puni. Četiri saborca uz zidove, različito obučena kao u Jablanici, sami pucaju i ginu ([upravljač](../core/gameplay/controllers/Defender.js)); igrač preuzima puškomitraljez prvog kad on padne, a najkasnije pred drugi talas. Dva talasa formacija Ju 52 ([avion](../core/gameplay/bodies/aircraft/Transport.js)) prelaze ispred igrača; [padobranci](../core/gameplay/bodies/characters/Parachutist.js) se pogađaju u vazduhu, a posle sletanja postaju [vojnici iz Neretve](../core/gameplay/bodies/soldiers/CoverSoldier.js), okrenuti licem ka nama, koji trče do najbliže ruševine i iza nje se povremeno dižu, nišane i pucaju ([upravljač](../core/gameplay/controllers/CoverFighter.js)); bez zaklona u blizini pucaju stojeći. Pobeda je posle drugog talasa, poraz kad igrač padne. Nemci i padobranci su ravne slike, saborci i ambijent 3D. Čučanja i ležanja s pucanjem nema; nove animacije dodaju se po potrebi.

Preostaje:

1. 📋 Modeli koje traži vlasnik: drveće u dvorištu i džakovi sa peskom kao improvizovani bunker kod ulaza. Crkva ([model](../assets/models/building/drvar-church/README.md)) i 3D Ju 52 ([prikaz](../core3d/actor/aircraft/Ju52.js)) su u igri.
2. 📋 Izgled grada: tlo je jednolično, a kuća nema.
3. 📋 Igranje nivoa i podešavanje broja padobranaca i težine: bez otpora igrač pada za oko 40 sekundi. Otvoreno je i da li se igra nastavlja kad igrač padne, a saborci su živi.
4. 📋 Snimak kartice na naslovnoj je još iz stare animacije.

Ideja (vlasnik, 2026-11-24): zanimljiva kombinacija 2D i 3D na sceni, npr. padobranci posle sletanja postaju 3D modeli vojnika; još nije odlučeno.

<a id="ig-33"></a>
### IG-33 · German Advance kao promo animacija sajta

Animacija [German Advance](../scenes/bitka/Main.js) produžena je na 24 s: scena traje 18 s, zatim prelazi na logo **Partisan Games**, drži ga 4 s i zatamnjuje pre ponavljanja. Logo koristi piksel font i zvezdu sajta. Ostaje na postojećoj kartici u meniju; [provere](TESTING.md#art-verification-record) su izvršene bez pregledača.

Kolona ima tri grupe sa po tri pešadinca i jednim tenkom, sa razmaknutim koracima, pucanjem i znacima za napredovanje. Strelac sa rancem i podoficir imaju nove crteže u izvornom stilu i zajedničke animacije u katalogu i sceni. [Pregled rasporeda](../assets/images/sources/germans-advance/formation-preview.png) sastavljen je iz runtime atlasa i koreografije bez pregledača; preostaje vlasnikov pregled pokreta, putanje kamere i čitljivosti loga u pregledaču. Promo tok pripada sceni.

Dogovor vlasnika (2026-11-25): sadašnje stanje sačuvati; kasnije precrtati aktere u nešto većem kvalitetu, sa dovoljno detalja za krupne kadrove. Sadašnji stil je izričito prihvaćen i ne menja se; merilo je u [pravilima arta](ART.md#pravila-pripreme-i-ponovne-upotrebe). Dorada kvaliteta ostaje otvorena.

<a id="katalog"></a>
## Katalog

<a id="kt-01"></a>
### KT-01 · Objekti kao osnova kataloga i igara

Dogovor vlasnika: objekti su samostalni atomi, upotrebljivi u bilo kojoj igri. Izgled, ponašanje i zavisnosti pripadaju zajedničkom objektu; igra i katalog koriste isti objekat, bez kopiranja njegove logike.

Preurediti [priče kataloga](../catalog/stories/) po vrstama objekata, kao što su vojnici, avioni, vozila, oružje i ambijent, umesto po igrama. Obuhvatiti sve postojeće priče organizovane po igrama, uključujući [Drvar](../catalog/stories/drvar.js). Priča samo napravi objekat na pozornici i ponudi njegove relevantne radnje. Sastav konkretne scene, protivnici, tok i pravila nivoa ostaju u igrama; katalog ne zavisi od njihovih scena ni naziva. Nezavisnost proveriti i u zajedničkom kodu, ne samo preimenovanjem fajlova. Postojeći obim kataloga ne širiti ovom reorganizacijom.

Gotovo kada svaki postojeći objekat može sam da se napravi i isproba na pozornici, a igre koriste istu implementaciju; sačuvani su postojeći akteri, radnje, mere i javne adrese kataloga. Proveriti registraciju, učitavanje, radnje i ponovno otvaranje objekata, kao i pogođene igre ciljanim testovima; pregledač pokreće vlasnik. Ažurirati [pravila kataloga](KATALOG.md) i [arhitekturu](ARHITEKTURA.md#katalog-za-isprobavanje) prema ovoj podeli odgovornosti.

## Notes

Waiting: čeka navedeni zavisni posao.

1. <a id="note-1"></a>**IG-14:** dosadašnji izbori su povezani; [art](ART.md#dopune-iz-plana-ideja--predaja-arta) i [provere](TESTING.md#predaja-arta-iz-plana-ideja). Čeka se izbor novih kandidata.
