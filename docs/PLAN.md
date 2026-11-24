# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Art](#art)** | | | |
| 1 | [AR-P06](#ar-p06) | Precrtati krupnije slike manje od prikaza i vratiti stvarne veličine avionima u Visu | Codex, Claude | 📋 TODO |
| 2 | [AR-P07](#ar-p07) | Napraviti pravu teksturu za 3D Renault FT | Codex, Claude | 📋 TODO |
| 3 | [AR-P08](#ar-p08) | Napraviti animirane spriteove za sve aktere u animaciji The Germans Advance | — | 📋 TODO |
| | **[Igre i ideje](#igre)** | | | |
| 4 | [IG-14](#ig-14) | Izabrati sledeće aktere od postojećeg arta | Vlasnik, Claude, Codex | 📋 TODO<br>Waiting: izbor kandidata [1](#note-1) |
| 5 | [IG-18](#ig-18) | Razmotriti pomeranje prizora i iskakanje protivnika u Otpisanima ili Neretvi | Vlasnik | 📋 TODO |
| 6 | [IG-21](#ig-21) | Razmotriti kampanju Jablanice i kolonu kamiona | Vlasnik | 📋 TODO |
| 7 | [IG-22](#ig-22) | Razraditi dodatne etape Neretve | Vlasnik | 📋 TODO |
| 8 | [IG-24](#ig-24) | Odlučiti o anahronim parolama u Liberated City | Vlasnik | 📋 TODO |
| 9 | [IG-29](#ig-29) | Dovršiti logor Crveni krst u Escape Enemy Base | Codex, Claude | 🔄 In progress |
| 10 | [IG-30](#ig-30) | Dodati partizane i četnike kao saborce u opsadi Kraljeva | Codex, Claude | 📋 TODO |
| 11 | [IG-31](#ig-31) | Dodati Messerschmitt kao neprijateljskog lovca i saveznički lovac u Warplane | Codex, Claude | 📋 TODO |
| 12 | [IG-32](#ig-32) | Dovršiti Raid on Drvar: modeli, izgled grada i težina | Claude, Codex | 🔄 In progress |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze; sekcija koja ostane bez stavki briše se sa poslednjom, a veze ka njoj se preusmeravaju.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Vlasnikovi pregledi su odvojeni od završenog povezivanja; ne uvode novu blokadu bez njegovog izričitog uslova. Ranije završene provere ne ponavljati zbog reorganizacije plana.

## Art

<a id="ar-p06"></a>
### AR-P06 · Slike manje od prikaza

Po [pravilu razmere](ART.md#razmera) slika nikad nije manja od prikaza u igri; sitnija se precrtava, ne uvećava. Prema merenju u katalogu manje od svoje osnove su: Sd.Kfz. 251 (1,8 puta), brodovi u Čamcu (oko 1,6 puta), Nemac i Četnik spreda (1,45 puta, u Otpisanima), He 111 i Storch iz Kluza (oko 1,2 puta) i M15/42, StuG III i Hotchkiss (oko 1,1 puta). Avionima u Visu vratiti stvarne veličine tela (sada su 1,3 do 2,5 puta veći) i podesiti razmeru igre tako da se igranje ne promeni. Krupnije slike se ne umanjuju.

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Dodatni desanti na Brač, Mljet i Korčulu ostaju ideje za igru uz istorijsku proveru, a ne zadaci izrade arta. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

<a id="ar-p07"></a>
### AR-P07 · Tekstura Renaulta FT

3D Renault FT ([model](../assets/models/tank/renault-ft.fbx)) nema svoju teksturu, nego opštu metalnu sliku, pa izgleda kao beton i nije za produkciju. Codex pravi teksturu u boji jugoslovenske vojske 1941, kako su ga partizani zaplenili kod Kraljeva ([okvir](KONTEKST.md#demolish-barricades)); ista važi za igračev tenk i neprijateljski Renault u ostalim igrama ([telo](../core3d/actor/derived/Tank.js)).

<a id="ar-p08"></a>
### AR-P08 · Animirani spriteovi za The Germans Advance

Napraviti animirane spriteove za svakog aktera u animaciji [The Germans Advance](../index.html#bitka). Pokriti pokrete strelaca i mitraljezaca pri kretanju, pucanju i čučanju gde se koristi, kao i kretanje tenka i pokrete vojnika na kupoli. Klipove povezati sa postojećim radnjama aktera u sceni.

<a id="igre"></a>
## Igre i ideje

<a id="ig-14"></a>
### IG-14 · Kandidati za vlasnikov izbor

Kandidati nisu nalog za izradu. Posle izbora dopuniti art, telo, zajednički prikaz i priču u katalogu, povezati aktera sa igrom i odigrati nivo.

- **Frontalni neprijatelji:** [strelac](../catalog.html#vojnici/otpisani-strelac) i [stražar](../catalog.html#vojnici/otpisani-strazar) čekaju vlasnikov izbor za nivo. Stražar u šinjelu dozvoljen je samo zimi.

- **Vis:** partizanski [Hurricane, Spitfire i Il-2](../assets/images/armies/partizani/avioni/) odozgo.
- **Do Trsta (izbor vlasnika, 2026-11-23, samo nemačka vozila):** [motor Zündapp K600 sa dvojicom](../assets/images/armies/nemci/motori/zundapp-k600.png), [trokolica BMW R12 sa dvojicom](../assets/images/armies/nemci/motori/bmw-r12-03.png), [oklopni automobil Sd.Kfz. 231](../assets/images/armies/nemci/vozila/sdkfz-231-02.png), [oklopni automobil Pz.Kpfw. 612 (37 mm)](../assets/images/armies/nemci/vozila/pzkpf612-37mm.png), [oficirski automobil Mercedes 830 BL](../assets/images/armies/nemci/vozila/830bl-02.png), [lovac tenkova Marder II (76 mm)](../assets/images/armies/nemci/tenkovi/panzer2d-76mm.png), [lovac tenkova Elefant](../assets/images/armies/nemci/tenkovi/elefant-01.png). Biraju se po raznovrsnosti, ne po istorijskoj vernosti.
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

Zamah u prvom licu koristi snimljeni klip iz [kataloga](../catalog.html#drugi-svetski-rat-3d/radnik-3d/cev), prilagođen tako da se cev vidi pri pogledu pravo i da se logoraš na kraju vrati u početni stav. Povratak u stav pokriva i [test nivoa](../tests/unit/fpsCamp.test.js).

Preostaje:

1. Dodati šunjanje kao ravnopravan način bekstva. Dogovor obuhvata sporije i tiše kretanje, pune zaklone i opažanje stražara prema vidljivosti i buci. Razraditi ulogu reflektora i proveriti da se do izlaza može stići šunjanjem, bez borbe i preuzimanja oružja.
2. Doterati gažene pravce i oslonce objekata na tlu prema [ART-u](ART.md#crveni-krst-priprema-3d-ambijenta) i uklopiti osvetljenje u kadar igre. Vlasnik u pregledaču proverava čitljivost prolaza, slepe puteve, pogled kroz žicu i zaklone.

Prerada menja betonski ambijent u logor; sneg, noć i straže ostaju. Početni predlog baraka i kula u uglovima korigovati prema [istraženom stanju](ISTORIJA.md#crveni-krst-12-februar-1942), a ne predstaviti kao potvrđen tlocrt. Teksture i modele izrađuje Codex, bez privremenog crteža u nivou.

Priprema je urađena: [reference sa poreklom](references/ww2-yu/crveni-krst/README.md) i [smernice za modele i teksture](ART.md#crveni-krst-priprema-3d-ambijenta). Preradu voditi prema [dogovorenom rasporedu i pravilima prepreka](KONTEKST.md#escape-enemy-base): lavirint ostaje, a prolazi dobijaju prostornu namenu.

Prvi [paket arta](../assets/models/building/crveni-krst/README.md) povezan je u [katalogu](../catalog.html#ambijent-3d/sklop) i [igri](../index.html#fps-base). [Lokalni raspored](../scenes/fps-base/campLayout.js) čuva grananje i slepe prolaze oko ograđene zidane zgrade, sa jednim otvorenim dvorištem. [Sklop](../scenes/fps-base/CampEnvironment.js) povezuje žicu, pune zaklone, dvostruki obod, otvorenu izlaznu kapiju i dve kule sa reflektorima. Uslov pobede ostaje izlazak iz lavirinta, bez dodatnih obaveznih ciljeva.

Tehničke granice: zajednički `Maze` nije menjan. Mreža ima 8×8 polja razmaka 10 m, od kojih je osam rezervisano za objekat sa dvorištem; 56 prohodnih polja ostaje povezano. Početak (−35, −35), izlaz (35, 40) i prag pobede manji od 5 m su očuvani, kao i deset protivnika, dve prve pomoći i deset rekvizita. Žica blokira hod, a propušta pogled i metke za obe strane; zgrada, puni zakloni i rekviziti blokiraju i pogled i pogotke. Nitima i stubovima se dele instancirani sklopovi, dok puni zakloni ostaju obični mesh-evi zbog tragova pogodaka. [Ciljane provere](TESTING.md#crveni-krst--priprema-i-art) obuhvataju prohodnost, sudare, ponovni ulazak, pobedu bez ubijanja i oslobađanje novih resursa.

<a id="ig-30"></a>
### IG-30 · Saborci u opsadi Kraljeva

Kraljevo su 1941. opsedali partizani i četnici zajedno ([okvir](KONTEKST.md#demolish-barricades)), pa uz igračev tenk idu i pucaju na Nemce. Partizani postoje u 3D; četnika u 3D naručiti od Codexa, bez sklapanja od drugih likova.

<a id="ig-31"></a>
### IG-31 · Avioni za Ratweek

Warplane je operacija Ratweek 1944 ([okvir](KONTEKST.md#warplane)). Dvokrilac, trokrilac i F-18 su izbačeni i ostali samo u katalogu; igrač sada leti samo bombarderom ([izbor](../scenes/warplane/Main.js)). Messerschmitt postaje neprijateljski lovac (vlasnik, 2026-11-24): Bf 109 napada bombarder, a mitraljesci bombardera sami gađaju lovca, kao zadnji strelac Poteza u Franji Kluzu, dok igrač i dalje bombarduje fabrike, glavni cilj za uništenje nemačke ratne industrije. Kao dodatne ciljeve dodati pruge i mostove, koje je Ratweek najviše gađao; modele crta Codex. Inspiracija za art tla iz vazduha: [gusti grad sa starog plana](../assets/images/background/grad.png), ulice i blokovi kuća viđeni odozgo. Kontekst i inspiracija iz rata: [saveznička bombardovanja Kraljeva i Beograda 1944](references/ww2-yu/bombardovanje-1944/README.md). Codex pravi saveznički lovac-bombarder, P-51 Mustang ili P-38, koji su leteli u Ratweeku, kao drugi izbor igrača. Bombarder sa četiri motora i duplim repom odgovara, jer su američki teški bombarderi B-17 i B-24 dejstvovali na Balkanu 1944, i u Ratweeku; po obliku može da prođe kao B-24.

<a id="ig-32"></a>
### IG-32 · Igra Raid on Drvar

[Raid on Drvar](../scenes/drvar/Main.js) je igra odbrane iz prvog lica (vlasnik, 2026-11-24): igrač puca u nemačke padobrance koji se spuštaju na Drvar 25. maja 1944. Kartica je u War Games, posle Visa. Istorijski okvir desanta je u [ISTORIJA](ISTORIJA.md).

Atmosfera: šačica partizana iza improvizovanih zaklona gleda kako elitne nemačke padobranske trupe niotkuda padaju s neba, u ogromnom broju. Scena rekreira fotografije desanta ([drugi talas](https://commons.wikimedia.org/wiki/File:Drugi_talas_padobranaca_spustio_se_izme%C4%91u_groblja_na_Sobi%C4%87a_glavici_i_Grahovske_ceste.jpg), [prašina i dim](https://commons.wikimedia.org/wiki/File:Drvar_je_bio_u_pra%C5%A1ini_i_dimu_od_bombi,_kada_su_se_nad_njim_pojavili_mnogobrojni_padobrani.jpg), [desant](https://commons.wikimedia.org/wiki/File:Desant_nema%C4%8Dkih_padobranaca_na_Drvar.jpg), [pogled iz rova](https://commons.wikimedia.org/wiki/File:Nema%C4%8Dki_vazdu%C5%A1ni_desant_na_Drvar,_25._maja_1944.jpg), [podne](https://commons.wikimedia.org/wiki/File:Oko_12_sati_padobranci_su_ponovo_prekrili_nebo,_Drvar_25._maj_1944.jpg)): nisko prelaze formacije Ju 52, a nebo je posuto padobranima. Na fotografiji iz rova su ranjeni Nemci, ne partizani.

Mesto radnje: uporište „Moskva” kod pravoslavne crkve, gde su se branili opkoljeni partizani. Jedini izvor je potpis fotografije na [sh.wikipedia](https://sh.wikipedia.org/wiki/Desant_na_Drvar): „Napadi esesovaca na »Moskvu«, uporište opkoljenih partizana kod pravoslavne crkve.” Ko je branio, kada i kakav je bio teren, izvori ne kažu; groblje na Šobića glavici bilo je nemačko uporište. Uporište je crkveno dvorište 24 × 20 m, ograđeno starim zidanim kamenim zidom od 1,1 m ([zid](../core3d/geometry/stoneWall.js)), sa ulazom na zapadu, na ravnom terenu grada; okolo su ruševine od bombardovanja ([kamene gomile](../core3d/geometry/rocks.js), improvizovane po vlasnikovom nalogu).

Pravila: igrač drži mesto uz istočni zid i menja samo pravac pogleda i nišana, na sve strane, jer je uporište opkoljeno. Miš nišani, levi klik puca; puška ([oružje](../core/gameplay/Firearm.js)) ispaljuje metak pa repetira, a puškomitraljez puca dok se drži klik i posle okvira od 20 metaka puni. Četiri saborca uz zidove, različito obučena kao u Jablanici, sami pucaju i ginu ([upravljač](../core/gameplay/controllers/Defender.js)); igrač preuzima puškomitraljez prvog kad on padne, a najkasnije pred drugi talas. Dva talasa formacija Ju 52 ([avion](../core/gameplay/bodies/aircraft/Transport.js)) prelaze ispred igrača; [padobranci](../core/gameplay/bodies/characters/Parachutist.js) se pogađaju u vazduhu, a posle sletanja postaju [vojnici iz Neretve](../core/gameplay/bodies/soldiers/CoverSoldier.js), okrenuti licem ka nama, koji trče do najbliže ruševine i iza nje se povremeno dižu, nišane i pucaju ([upravljač](../core/gameplay/controllers/CoverFighter.js)); bez zaklona u blizini pucaju stojeći. Pobeda je posle drugog talasa, poraz kad igrač padne. Nemci i padobranci su ravne slike, saborci i ambijent 3D. Čučanja i ležanja s pucanjem nema; nove animacije dodaju se po potrebi.

Preostaje:

1. 📋 Modeli koje traži vlasnik: crkva po uzoru na drvarsku crkvu Svetog Save (1932–1939), drveće u dvorištu i džakovi sa peskom kao improvizovani bunker kod ulaza.
2. 📋 Ju 52: ravna slika loše izgleda čim se kamera okrene. Vlasniku se sviđa izgled ravnih slika u 3D sceni, kao oživeli strip, pa se prvo razmatraju rešenja za 2D avione; 3D model (u projektu su samo He 111, Ju 87, Do 217 i Bf 109) je druga mogućnost.
3. 📋 Izgled grada: tlo je jednolično, a kuća nema.
4. 📋 Igranje nivoa i podešavanje broja padobranaca i težine: bez otpora igrač pada za oko 40 sekundi. Otvoreno je i da li se igra nastavlja kad igrač padne, a saborci su živi.
5. 📋 Snimak kartice na naslovnoj je još iz stare animacije.

Ideja (vlasnik, 2026-11-24): zanimljiva kombinacija 2D i 3D na sceni, npr. padobranci posle sletanja postaju 3D modeli vojnika; još nije odlučeno.

## Notes

Waiting: čeka navedeni zavisni posao.

1. <a id="note-1"></a>**IG-14:** pet prethodno izabranih aktera je povezano; [art](ART.md#dopune-iz-plana-ideja--predaja-arta) i [provere](TESTING.md#predaja-arta-iz-plana-ideja). Čeka se izbor novih kandidata.
